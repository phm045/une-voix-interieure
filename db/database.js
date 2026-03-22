// ========================================
// Base de données SQLite — Gestion des clients
// ========================================

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'clients.db');

let db;

// Initialisation asynchrone de la base de données
async function initDB() {
  const SQL = await initSqlJs();

  // Charger la base existante ou en créer une nouvelle
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Création de la table des clients
  db.run(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      prenom TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      mot_de_passe TEXT NOT NULL,
      telephone TEXT DEFAULT '',
      date_creation TEXT DEFAULT (datetime('now')),
      date_modification TEXT DEFAULT (datetime('now'))
    )
  `);

  // Index sur l'email
  db.run(`CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email)`);

  // Sauvegarder sur disque
  sauvegarder();

  return db;
}

// Sauvegarder la base sur disque
function sauvegarder() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

// Wrapper compatible avec l'API de better-sqlite3
// pour minimiser les changements dans routes/auth.js
const dbWrapper = {
  prepare(sql) {
    return {
      get(...params) {
        const stmt = db.prepare(sql);
        stmt.bind(params);
        if (stmt.step()) {
          const row = stmt.getAsObject();
          stmt.free();
          return row;
        }
        stmt.free();
        return undefined;
      },
      run(...params) {
        db.run(sql, params);
        const lastId = db.exec("SELECT last_insert_rowid() as id");
        const changes = db.getRowsModified();
        sauvegarder();
        return {
          lastInsertRowid: lastId[0]?.values[0]?.[0] || 0,
          changes: changes
        };
      },
      all(...params) {
        const results = [];
        const stmt = db.prepare(sql);
        stmt.bind(params);
        while (stmt.step()) {
          results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
      }
    };
  },
  exec(sql) {
    db.run(sql);
    sauvegarder();
  }
};

module.exports = { initDB, dbWrapper, sauvegarder };
