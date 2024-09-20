const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors"); // 新添加的导入
const GameLogic = require("./game-logic");
const ChatRepository = require("./repositories/chat-repository");
const LoggingRepository = require("./repositories/logging-repository");

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // 应用程序特定的日志记录，错误处理等
});

const app = express();

// 配置 CORS
app.use(
  cors({
    origin: "*", // 允许所有来源，您也可以设置为特定的域名
    methods: ["GET", "POST"],
  })
);

// 提供静态文件
app.use(express.static(path.join(__dirname, "../client/dist")));

// ... 其他服务器代码 ...

// 对于所有其他路由，返回 index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // 允许所有来源，您也可以设置为特定的域名
    methods: ["GET", "POST"],
  },
});

const gameLogic = new GameLogic(io);
const chatRepository = new ChatRepository();
const loggingRepository = new LoggingRepository();

io.on("connection", (socket) => {
  console.log("新连接建立");

  try {
    // 所有的 socket.on 事件处理器
    socket.on("joinGame", async ({ uuid, name }) => {
      try {
        let player = gameLogic.getPlayerByUUID(uuid);
        if (player) {
          player.socket = socket;
          socket.emit("gameState", gameLogic.getGameState());
        } else {
          player = await gameLogic.addPlayer(socket, uuid, name);
          io.emit("playerJoined", player.getState());
        }
        console.log(
          `玩家 ${player.name} (${player.uuid}) 加入游戏，颜色: ${player.color}`
        );
        loggingRepository.log("玩家加入", {
          uuid: player.uuid,
          name: player.name,
          color: player.color,
        });
      } catch (error) {
        console.error("加入游戏时出错:", error);
      }
    });

    socket.on("updateName", async (newName) => {
      try {
        const updatedPlayer = await gameLogic.updatePlayerName(
          socket.id,
          newName
        );
        if (updatedPlayer) {
          io.emit("playerUpdated", updatedPlayer);
        }
      } catch (error) {
        console.error("更新名字时出错:", error);
      }
    });

    socket.on("updateColor", async () => {
      try {
        const updatedPlayer = await gameLogic.updatePlayerColor(socket.id);
        if (updatedPlayer) {
          io.emit("playerUpdated", updatedPlayer);
        }
      } catch (error) {
        console.error("更新颜色时出错:", error);
      }
    });

    socket.on("changeDirection", (direction) => {
      gameLogic.changePlayerDirection(socket.id, direction);
    });

    socket.on("chatMessage", (message) => {
      const player = gameLogic.getPlayerBySocketId(socket.id);
      if (player) {
        const formattedMessage = chatRepository.formatMessage(
          player.name,
          message
        );
        io.emit("chatMessage", formattedMessage);
        loggingRepository.log("聊天消息", formattedMessage);
      }
    });

    socket.on("disconnect", () => {
      const player = gameLogic.getPlayerBySocketId(socket.id);
      if (player) {
        console.log(`玩家 ${player.name} 断开连接`);
        loggingRepository.log("玩家断开连接", {
          uuid: player.uuid,
          name: player.name,
        });
        gameLogic.removePlayer(socket.id);
      }
    });
  } catch (error) {
    console.error("Error in socket connection:", error);
  }
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});
