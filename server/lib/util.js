const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const CELL_SIZE = 20;

function randomPosition(max) {
  return Math.floor(Math.random() * max);
}

module.exports = {
  GAME_WIDTH,
  GAME_HEIGHT,
  CELL_SIZE,
  randomPosition,
};
