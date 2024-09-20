const sqlite3 = require("sqlite3").verbose();

class SQL {
  constructor() {
    this.db = new sqlite3.Database("./game.db");
    this.init();
  }

  init() {
    this.db.run(`CREATE TABLE IF NOT EXISTS players (
      uuid TEXT PRIMARY KEY,
      name TEXT,
      color TEXT
    )`);
  }

  getPlayer(uuid) {
    return new Promise((resolve, reject) => {
      this.db.get(
        "SELECT * FROM players WHERE uuid = ?",
        [uuid],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  savePlayer(uuid, name, color) {
    return new Promise((resolve, reject) => {
      this.db.run(
        "INSERT OR REPLACE INTO players (uuid, name, color) VALUES (?, ?, ?)",
        [uuid, name, color],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  updatePlayerName(uuid, name) {
    return new Promise((resolve, reject) => {
      this.db.run(
        "UPDATE players SET name = ? WHERE uuid = ?",
        [name, uuid],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  updatePlayerColor(uuid, color) {
    return new Promise((resolve, reject) => {
      this.db.run(
        "UPDATE players SET color = ? WHERE uuid = ?",
        [color, uuid],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }
}

module.exports = new SQL();
