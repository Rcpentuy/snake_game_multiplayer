class Map {
  constructor(width, height) {
    this.width = width;
    this.height = height;
  }

  isValidPosition(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }
}

module.exports = Map;
