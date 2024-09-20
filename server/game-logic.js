const Map = require("./map/map");
const Player = require("./map/player");
const Food = require("./map/food");
const { GAME_WIDTH, GAME_HEIGHT, CELL_SIZE } = require("./lib/util");
const SQL = require("./sql");

class GameLogic {
  constructor(io) {
    this.io = io;
    this.map = new Map(GAME_WIDTH / CELL_SIZE, GAME_HEIGHT / CELL_SIZE);
    this.players = {};
    this.playersByUUID = {};
    this.food = new Food(this.map);
    this.gameState = "waiting"; // 可以是 'waiting', 'playing', 或 'ending'
    this.gameLoop();
  }

  async addPlayer(socket, uuid, name, color) {
    let playerData = await SQL.getPlayer(uuid);
    if (!playerData) {
      playerData = { uuid, name, color: color || this.generateRandomColor() };
      await SQL.savePlayer(playerData.uuid, playerData.name, playerData.color);
    }
    const player = new Player(
      socket.id,
      playerData.uuid,
      playerData.name,
      this.map,
      playerData.color
    );
    this.players[socket.id] = player;
    this.playersByUUID[uuid] = player;

    // 立即更新记分板
    await this.updateScoreboard();

    // 如果有足够玩家，开始游戏
    if (Object.keys(this.players).length >= 2 && this.gameState === "waiting") {
      this.gameState = "playing";
      this.io.emit("gameStart");
    }

    return player;
  }

  removePlayer(socketId) {
    const player = this.players[socketId];
    if (player) {
      delete this.players[socketId];
      delete this.playersByUUID[player.uuid];
    }

    // 如果玩家数量不足，结束游戏
    if (Object.keys(this.players).length < 2 && this.gameState === "playing") {
      this.gameState = "waiting";
      this.io.emit("gamePaused", "等待更多玩家加入...");
    }
  }

  getPlayerByUUID(uuid) {
    return this.playersByUUID[uuid];
  }

  getPlayerBySocketId(socketId) {
    return this.players[socketId];
  }

  changePlayerDirection(socketId, direction) {
    const player = this.players[socketId];
    if (player) {
      player.setDirection(direction);
    }
  }

  async updatePlayerName(socketId, newName) {
    const player = this.players[socketId];
    if (player) {
      player.updateName(newName);
      await SQL.updatePlayerName(player.uuid, newName);
      return player.getState();
    }
    return null;
  }

  async updatePlayerColor(socketId) {
    const player = this.players[socketId];
    if (player) {
      const newColor = player.generateRandomColor();
      player.updateColor(newColor);
      await SQL.updatePlayerColor(player.uuid, newColor);
      return player.getState();
    }
    return null;
  }

  generateRandomColor() {
    return "#" + Math.floor(Math.random() * 16777215).toString(16);
  }

  async updateGame() {
    for (const player of Object.values(this.players)) {
      player.move();
      if (player.body.length > player.maxLength) {
        player.maxLength = player.body.length;
        await SQL.updatePlayerMaxLength(player.uuid, player.maxLength);
      }
    }
    await this.checkCollisions();
    this.food.update(this.map);
    this.checkGameEnd();
    await this.updateScoreboard();
  }

  async checkCollisions() {
    for (const player of Object.values(this.players)) {
      if (player.alive) {
        // 检查与其他玩家的碰撞
        for (const otherPlayer of Object.values(this.players)) {
          if (player !== otherPlayer && player.checkCollision(otherPlayer)) {
            player.die();
            this.io.emit("playerDied", player.getState());
          }
        }

        if (player.checkFoodCollision(this.food)) {
          player.grow();
          if (player.body.length > player.maxLength) {
            player.maxLength = player.body.length;
            await SQL.updatePlayerMaxLength(player.uuid, player.maxLength);
          }
          this.food.respawn(this.map);
        }
      }
    }
  }

  checkGameEnd() {
    if (this.gameState !== "playing") return;

    const alivePlayers = Object.values(this.players).filter(
      (player) => player.alive
    );

    if (alivePlayers.length === 0) {
      // 所有玩家同时死亡
      this.gameState = "ending";
      this.io.emit("gameEnd", { noSurvivors: true });
      setTimeout(() => this.restartGame(), 3000);
    } else if (
      alivePlayers.length === 1 &&
      Object.keys(this.players).length > 1
    ) {
      // 只有一名玩家存活
      this.gameState = "ending";
      const winner = alivePlayers[0];
      this.io.emit("gameEnd", { winner: winner.getState() });
      setTimeout(() => this.restartGame(), 3000);
    }
  }

  restartGame() {
    this.gameState = "waiting";
    Object.values(this.players).forEach((player) => player.reset());
    this.food.respawn(this.map);
    this.io.emit("gameRestart");
    this.io.emit("gameState", this.getGameState());

    // 给玩家一些时间准备，然后开始新的游戏
    setTimeout(() => {
      if (Object.keys(this.players).length >= 2) {
        this.gameState = "playing";
        this.io.emit("gameStart");
      } else {
        this.io.emit("gamePaused", "等待更多玩家加入...");
      }
    }, 3000);
  }

  getGameState() {
    return {
      players: Object.fromEntries(
        Object.entries(this.players).map(([id, player]) => [
          id,
          player.getState(),
        ])
      ),
      food: this.food.getState(),
    };
  }

  async gameLoop() {
    try {
      if (this.gameState === "playing") {
        await this.updateGame();
      }
      this.io.emit("gameState", this.getGameState());
    } catch (error) {
      console.error("Error in game loop:", error);
    }
    setTimeout(() => this.gameLoop(), 100);
  }

  async updateScoreboard() {
    const topPlayers = await SQL.getTopPlayers();
    this.io.emit("updateScoreboard", topPlayers);
  }
}

module.exports = GameLogic;
