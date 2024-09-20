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
    return player;
  }

  removePlayer(socketId) {
    const player = this.players[socketId];
    if (player) {
      delete this.players[socketId];
      delete this.playersByUUID[player.uuid];
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

  gameLoop() {
    try {
      this.updateGame();
      // 只在游戏循环中发送游戏状态，而不是在其他地方
      this.io.emit("gameState", this.getGameState());
    } catch (error) {
      console.error("Error in game loop:", error);
    }
    setTimeout(() => this.gameLoop(), 100);
  }

  updateGame() {
    Object.values(this.players).forEach((player) => player.move());
    this.checkCollisions();
    this.food.update(this.map);
    this.checkGameEnd();
  }

  checkCollisions() {
    Object.values(this.players).forEach((player) => {
      if (player.alive) {
        // 检查与其他玩家的碰撞
        Object.values(this.players).forEach((otherPlayer) => {
          if (player !== otherPlayer && player.checkCollision(otherPlayer)) {
            player.die();
            this.io.emit("playerDied", player.getState());
          }
        });

        if (player.checkFoodCollision(this.food)) {
          player.grow();
          this.food.respawn(this.map);
          this.sendGameState();
        }
      }
    });
  }

  checkGameEnd() {
    const alivePlayers = Object.values(this.players).filter(
      (player) => player.alive
    );
    if (alivePlayers.length === 1 && Object.keys(this.players).length > 1) {
      const winner = alivePlayers[0];
      this.io.emit("gameEnd", { winner: winner.getState() });
      setTimeout(() => this.restartGame(), 3000);
    }
  }

  restartGame() {
    Object.values(this.players).forEach((player) => player.reset());
    this.food.respawn(this.map);
    this.io.emit("gameRestart");
    // 在这里直接发送新的游戏状态，而不是调用 sendGameState
    this.io.emit("gameState", this.getGameState());
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
}

module.exports = GameLogic;
