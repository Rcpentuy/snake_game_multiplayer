// 全局变量和常量
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;
export const CELL_SIZE = 20;

export const COLORS = {
  BACKGROUND: "#f0f0f0",
  SNAKE: "#4CAF50",
  FOOD: "#FF5722",
};

export let gameState = {
  players: {},
  food: null, // 将 food 初始化为 null，而不是空数组
};
