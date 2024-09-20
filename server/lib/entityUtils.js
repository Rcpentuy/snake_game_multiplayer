function checkCollision(entity1, entity2) {
  return entity1.x === entity2.x && entity1.y === entity2.y;
}

module.exports = {
  checkCollision,
};
