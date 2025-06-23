// scripts/insertManager.js
const db = require('../db/sqlite'); // adjust path if needed

const managerId = 'test-manager-123';

try {
  db.prepare(`
    INSERT OR IGNORE INTO managers (manager_id, is_active)
    VALUES (?, 1)
  `).run(managerId);

  console.log(`Manager inserted: ${managerId}`);
} catch (err) {
  console.error('Error inserting manager:', err);
}
