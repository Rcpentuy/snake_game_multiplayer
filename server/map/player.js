const { randomPosition } = require("../lib/util");

class Player {
  constructor(socketId, uuid, name, map, color) {
    this.socketId = socketId;
    this.uuid = uuid;
    this.name = name;
    this.map = map;
    this.color = color || this.generateRandomColor();
    this.reset();
  }

  reset() {
    this.body = [
      { x: randomPosition(this.map.width), y: randomPosition(this.map.height) },
    ];
    this.direction = "right";
    this.growing = 0;
    this.alive = true;
    // 重置时不改变颜色，保持原有颜色
    // this.color = this.generateRandomColor();
  }

  setDirection(newDirection) {
    if (this.alive) {
      const opposites = {
        up: "down",
        down: "up",
        left: "right",
        right: "left",
      };
      if (newDirection !== opposites[this.direction]) {
        this.direction = newDirection;
      }
    }
  }

  move() {
    if (this.alive) {
      const head = { ...this.body[0] };
      switch (this.direction) {
        case "up":
          head.y = (head.y - 1 + this.map.height) % this.map.height;
          break;
        case "down":
          head.y = (head.y + 1) % this.map.height;
          break;
        case "left":
          head.x = (head.x - 1 + this.map.width) % this.map.width;
          break;
        case "right":
          head.x = (head.x + 1) % this.map.width;
          break;
      }
      this.body.unshift(head);
      if (this.growing > 0) {
        this.growing--;
      } else {
        this.body.pop();
      }
    }
  }

  grow() {
    this.growing += 1;
  }

  die() {
    this.alive = false;
    this.color = "#808080"; // 灰色
  }

  checkCollision(otherPlayer) {
    const head = this.body[0];
    return otherPlayer.body.some(
      (segment) => segment.x === head.x && segment.y === head.y
    );
  }

  checkFoodCollision(food) {
    const head = this.body[0];
    return food.position.x === head.x && food.position.y === head.y;
  }

  generateRandomColor() {
    return "#" + Math.floor(Math.random() * 16777215).toString(16);
  }

  updateName(newName) {
    this.name = newName;
  }

  updateColor(newColor) {
    this.color = newColor || this.generateRandomColor();
  }

  getState() {
    return {
      id: this.socketId,
      uuid: this.uuid,
      name: this.name,
      body: this.body,
      color: this.color,
      alive: this.alive,
    };
  }
}

module.exports = Player;
