// database.js
const Database = require('better-sqlite3');
const db = new Database('./user_management.db');

// Create users table
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    mob_num TEXT NOT NULL,
    pan_num TEXT NOT NULL,
    manager_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1
  )
`).run();

// Create managers table
db.prepare(`
  CREATE TABLE IF NOT EXISTS managers (
    manager_id TEXT PRIMARY KEY,
    is_active BOOLEAN DEFAULT 1
  )
`).run();

// Prefill manager table with sample data if empty
const count = db.prepare('SELECT COUNT(*) as count FROM managers').get();
if (count.count === 0) {
  const insert = db.prepare('INSERT INTO managers (manager_id, is_active) VALUES (?, ?)');
  insert.run('test-manager-123', 1);
  insert.run('test-manager-456', 1);
  insert.run('inactive-manager', 0);
  console.log('Sample managers added');
}

module.exports = db;
