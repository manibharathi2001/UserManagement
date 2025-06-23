const db = require('../db/sqlite');
const { v4: uuidv4 } = require('uuid');

// --------------------- CREATE USER ---------------------
exports.createUser = (req, res) => {
  const { full_name, mob_num, pan_num, manager_id } = req.body;

  if (!full_name || !mob_num || !pan_num || !manager_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const cleanedMob = mob_num.replace(/^(\+91|0)/, '');
  if (!/^[6-9]\d{9}$/.test(cleanedMob)) {
    return res.status(400).json({ error: 'Invalid mobile number format' });
  }

  const upperPan = pan_num.toUpperCase();
  if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(upperPan)) {
    return res.status(400).json({ error: 'Invalid PAN number format' });
  }

  const manager = db.prepare('SELECT * FROM managers WHERE manager_id = ? AND is_active = 1').get(manager_id);
  if (!manager) {
    return res.status(400).json({ error: 'Manager ID not found or inactive' });
  }

  const user_id = uuidv4();
  const timestamp = new Date().toISOString();

  try {
    const insert = db.prepare(`
      INSERT INTO users (user_id, full_name, mob_num, pan_num, manager_id, created_at, updated_at, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `);

    insert.run(user_id, full_name, cleanedMob, upperPan, manager_id, timestamp, timestamp);

    return res.status(201).json({ message: 'User created successfully', user_id });
  } catch (error) {
    console.error('DB Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

// --------------------- GET USERS ---------------------
exports.getUsers = (req, res) => {
  const { user_id, mob_num, manager_id } = req.body;

  let query = 'SELECT * FROM users WHERE is_active = 1';
  const params = [];

  if (user_id) {
    query += ' AND user_id = ?';
    params.push(user_id);
  }

  if (mob_num) {
    query += ' AND mob_num = ?';
    params.push(mob_num);
  }

  if (manager_id) {
    query += ' AND manager_id = ?';
    params.push(manager_id);
  }

  try {
    const users = db.prepare(query).all(...params);
    res.status(200).json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// --------------------- DELETE USER ---------------------
exports.deleteUser = (req, res) => {
  const { user_id, mob_num } = req.body;

  if (!user_id && !mob_num) {
    return res.status(400).json({ error: 'user_id or mob_num is required' });
  }

  let query = 'UPDATE users SET is_active = 0 WHERE ';
  const params = [];

  if (user_id) {
    query += 'user_id = ?';
    params.push(user_id);
  } else if (mob_num) {
    query += 'mob_num = ?';
    params.push(mob_num);
  }

  try {
    const result = db.prepare(query).run(...params);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// --------------------- UPDATE USER ---------------------
exports.updateUser = (req, res) => {
  const { user_ids, update_data } = req.body;

  if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
    return res.status(400).json({ error: 'user_ids must be a non-empty array' });
  }

  const { full_name, mob_num, pan_num, manager_id } = update_data;

  if (manager_id) {
    const manager = db.prepare('SELECT * FROM managers WHERE manager_id = ? AND is_active = 1').get(manager_id);
    if (!manager) {
      return res.status(400).json({ error: 'Invalid or inactive manager_id' });
    }
  }

  try {
    user_ids.forEach((id) => {
      const existingUser = db.prepare('SELECT * FROM users WHERE user_id = ? AND is_active = 1').get(id);
      if (!existingUser) return;

      if (manager_id && !full_name && !mob_num && !pan_num) {
        db.prepare('UPDATE users SET manager_id = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?')
          .run(manager_id, id);
      } else {
        db.prepare('UPDATE users SET is_active = 0 WHERE user_id = ?').run(id);

        const newUserId = uuidv4();
        db.prepare(`
          INSERT INTO users (user_id, full_name, mob_num, pan_num, manager_id, created_at, updated_at, is_active)
          VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1)
        `).run(
          newUserId,
          full_name || existingUser.full_name,
          mob_num || existingUser.mob_num,
          pan_num || existingUser.pan_num,
          manager_id || existingUser.manager_id
        );
      }
    });

    return res.status(200).json({ message: 'User(s) updated successfully' });
  } catch (error) {
    console.error('Update error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// --------------------- EXPORTS ---------------------
module.exports = {
  createUser: exports.createUser,
  getUsers: exports.getUsers,
  deleteUser: exports.deleteUser,
  updateUser: exports.updateUser
};

