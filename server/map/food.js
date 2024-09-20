const { randomPosition } = require("../lib/util");

class Food {
  constructor(map) {
    this.map = map;
    this.respawn();
  }

  respawn() {
    this.position = {
      x: randomPosition(this.map.width),
      y: randomPosition(this.map.height),
    };
  }

  update(map) {
    // 可以在这里添加食物的更新逻辑，比如定期移动或者消失
  }

  getState() {
    return this.position;
  }
}

module.exports = Food;
