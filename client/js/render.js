import { GAME_WIDTH, GAME_HEIGHT, CELL_SIZE, gameState } from "./global.js";

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
  }

  render() {
    this.canvas.clear();
    this.drawBorder();
    this.drawFood();
    this.drawPlayers();
  }

  drawBorder() {
    // 绘制黑色边框
    this.canvas.ctx.strokeStyle = "black";
    this.canvas.ctx.lineWidth = 2;
    this.canvas.ctx.strokeRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  drawFood() {
    if (gameState.food) {
      this.canvas.drawRect(
        gameState.food.x * CELL_SIZE,
        gameState.food.y * CELL_SIZE,
        CELL_SIZE,
        CELL_SIZE,
        "#FF5722" // 食物颜色
      );
    }
  }

  drawPlayers() {
    Object.values(gameState.players).forEach((player) => {
      player.body.forEach((segment) => {
        this.canvas.drawRect(
          segment.x * CELL_SIZE,
          segment.y * CELL_SIZE,
          CELL_SIZE,
          CELL_SIZE,
          player.alive ? player.color : "#808080" // 如果玩家死亡，使用灰色
        );
      });
    });
  }
}
