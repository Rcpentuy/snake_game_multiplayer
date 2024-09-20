const sqlite3 = require("sqlite3").verbose();

class SQL {
  constructor() {
    this.db = new sqlite3.Database("./game.db");
    this.init();
  }

  init() {
    this.db.serialize(() => {
      this.db.run(`CREATE TABLE IF NOT EXISTS players (
        uuid TEXT PRIMARY KEY,
        name TEXT,
        color TEXT,
        max_length INTEGER DEFAULT 2
      )`);

      // 检查 max_length 列是否存在，如果不存在则添加
      this.db.all("PRAGMA table_info(players)", (err, rows) => {
        if (err) {
          console.error("Error checking table structure:", err);
          return;
        }
        if (
          Array.isArray(rows) &&
          !rows.some((row) => row.name === "max_length")
        ) {
          this.db.run(
            "ALTER TABLE players ADD COLUMN max_length INTEGER DEFAULT 2"
          );
        }
      });
    });
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
        "INSERT OR REPLACE INTO players (uuid, name, color, max_length) VALUES (?, ?, ?, 2)",
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

  updatePlayerMaxLength(uuid, maxLength) {
    return new Promise((resolve, reject) => {
      this.db.run(
        "UPDATE players SET max_length = MAX(max_length, ?) WHERE uuid = ?",
        [maxLength, uuid],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  getTopPlayers(limit = 10) {
    return new Promise((resolve, reject) => {
      this.db.all(
        "SELECT name, max_length FROM players ORDER BY max_length DESC LIMIT ?",
        [limit],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }
}

module.exports = new SQL();
