import { io } from "socket.io-client";
import { Canvas } from "./canvas.js";
import { Renderer } from "./render.js";
import { ChatClient } from "./chat-client.js";
import { gameState } from "./global.js";

class Game {
  constructor() {
    this.socket = io("/", {
      transports: ["websocket", "polling"],
    });
    this.canvas = new Canvas();
    this.renderer = new Renderer(this.canvas);
    this.chatClient = new ChatClient(this.socket);

    this.setupSocketEvents();
    this.setupInputHandlers();
    this.setupOptionsButton();
    this.joinGame();
  }

  setupSocketEvents() {
    this.socket.on("gameState", (state) => {
      gameState.players = state.players;
      gameState.food = state.food;
    });

    this.socket.on("playerJoined", (player) => {
      this.displayPlayerJoinedMessage(player);
    });

    this.socket.on("playerUpdated", (updatedPlayer) => {
      if (updatedPlayer.uuid === localStorage.getItem("playerUUID")) {
        localStorage.setItem("playerName", updatedPlayer.name);
        localStorage.setItem("playerColor", updatedPlayer.color);
      }
    });

    this.socket.on("playerDied", (player) => {
      this.chatClient.displayMessage(`玩家 ${player.name} 已死亡！`);
    });

    this.socket.on("gameEnd", (data) => {
      this.gameState = "ending";
      if (data.noSurvivors) {
        this.chatClient.displayMessage("场上没有存活玩家！");
      } else if (data.winner) {
        this.chatClient.displayMessage(
          `游戏结束！胜者是 ${data.winner.name}！`
        );
      }
      this.chatClient.displayMessage("3秒后游戏将重新开始...");
    });

    this.socket.on("gameRestart", () => {
      this.gameState = "waiting";
      this.chatClient.displayMessage("游戏重新开始！等待玩家准备...");
    });

    this.socket.on("gameStart", () => {
      this.gameState = "playing";
      this.chatClient.displayMessage("游戏开始！");
    });

    this.socket.on("gamePaused", (message) => {
      this.gameState = "waiting";
      this.chatClient.displayMessage(message);
    });
  }

  setupInputHandlers() {
    document.addEventListener("keydown", (event) => {
      const direction = this.getDirectionFromKey(event.key);
      if (direction) {
        this.socket.emit("changeDirection", direction);
      }
    });
  }

  getDirectionFromKey(key) {
    const directions = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
    };
    return directions[key];
  }

  setupOptionsButton() {
    const optionsButton = document.getElementById("optionsButton");
    const optionsMenu = document.getElementById("optionsMenu");
    const changeNameButton = document.getElementById("changeNameButton");
    const changeColorButton = document.getElementById("changeColorButton");
    const toggleChatButton = document.getElementById("toggleChatButton");

    optionsButton.addEventListener("click", () => {
      optionsMenu.style.display =
        optionsMenu.style.display === "none" ? "block" : "none";
    });

    changeNameButton.addEventListener("click", () => {
      const newName = prompt("请输入新的名字：");
      if (newName) {
        this.socket.emit("updateName", newName);
        localStorage.setItem("playerName", newName);
      }
    });

    changeColorButton.addEventListener("click", () => {
      this.socket.emit("updateColor");
    });

    toggleChatButton.addEventListener("click", () => {
      this.chatClient.toggleChat();
    });
  }

  joinGame() {
    const uuid = localStorage.getItem("playerUUID");
    const storedName = localStorage.getItem("playerName");

    if (uuid && storedName) {
      this.socket.emit("joinGame", { uuid, name: storedName });
    } else {
      const playerName = prompt("请输入您的名字：");
      if (playerName) {
        const newUUID = this.generateUUID();
        localStorage.setItem("playerUUID", newUUID);
        localStorage.setItem("playerName", playerName);
        this.socket.emit("joinGame", { uuid: newUUID, name: playerName });
      } else {
        alert("名字不能为空！");
        this.joinGame(); // 重新尝试
      }
    }

    this.gameLoop();
  }

  generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        var r = (Math.random() * 16) | 0,
          v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }

  generateRandomColor() {
    return "#" + Math.floor(Math.random() * 16777215).toString(16);
  }

  gameLoop() {
    this.renderer.render();
    requestAnimationFrame(() => this.gameLoop());
  }

  displayPlayerJoinedMessage(player) {
    const message = `玩家 ${player.name} 加入了游戏，颜色: ${player.color}`;
    console.log(message);
    // 如果你想在聊天框中显示这条消息，可以使用下面的代码
    // this.chatClient.displayMessage(message);
  }
}

new Game();
