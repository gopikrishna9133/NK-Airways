const pool = require('../config/db');

const listRoutes = async (req, res) => {
  try {
    const sql = `
      SELECT route_id, origin_location, destination_location,
             IFNULL(distance, NULL) AS distance,
             created_at, updated_at
      FROM route
      ORDER BY route_id DESC
    `;
    const [rows] = await pool.query(sql);
    return res.json(rows);
  } catch (err) {
    console.error('admin.listRoutes error:', err && err.sqlMessage ? { sqlMessage: err.sqlMessage, code: err.code } : err);
    return res.status(500).json({ message: 'Server error loading routes', error: err && err.sqlMessage ? err.sqlMessage : String(err) });
  }
};

const getRoute = async (req, res) => {
  try {
    const id = req.params.id;
    const [rows] = await pool.query(
      'SELECT route_id, origin_location, destination_location, IFNULL(distance, NULL) AS distance, created_at, updated_at FROM route WHERE route_id = ? LIMIT 1',
      [id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Route not found' });
    return res.json(rows[0]);
  } catch (err) {
    console.error('admin.getRoute error:', err);
    return res.status(500).json({ message: 'Server error', error: err && err.sqlMessage ? err.sqlMessage : String(err) });
  }
};

const createRoute = async (req, res) => {
  try {
    const { origin_location, destination_location, distance } = req.body;
    if (!origin_location || !destination_location) return res.status(400).json({ message: 'origin_location and destination_location required' });

    if (distance !== undefined && distance !== null && distance !== '') {
      const [result] = await pool.query(
        'INSERT INTO route (origin_location, destination_location, distance, created_at) VALUES (?, ?, ?, NOW())',
        [origin_location, destination_location, distance]
      );
      return res.status(201).json({ message: 'Route created', route_id: result.insertId });
    }

    const [result] = await pool.query(
      'INSERT INTO route (origin_location, destination_location, created_at) VALUES (?, ?, NOW())',
      [origin_location, destination_location]
    );
    return res.status(201).json({ message: 'Route created', route_id: result.insertId });
  } catch (err) {
    console.error('admin.createRoute error:', err);
    return res.status(500).json({ message: 'Server error', error: err && err.sqlMessage ? err.sqlMessage : String(err) });
  }
};

const updateRoute = async (req, res) => {
  try {
    const id = req.params.id;
    const { origin_location, destination_location, distance } = req.body;
    if (!origin_location || !destination_location) return res.status(400).json({ message: 'origin_location and destination_location required' });

    if (distance !== undefined && distance !== null && distance !== '') {
      await pool.query('UPDATE route SET origin_location = ?, destination_location = ?, distance = ?, updated_at = NOW() WHERE route_id = ?', [origin_location, destination_location, distance, id]);
    } else {
      await pool.query('UPDATE route SET origin_location = ?, destination_location = ?, updated_at = NOW() WHERE route_id = ?', [origin_location, destination_location, id]);
    }
    return res.json({ message: 'Route updated' });
  } catch (err) {
    console.error('admin.updateRoute error:', err);
    return res.status(500).json({ message: 'Server error', error: err && err.sqlMessage ? err.sqlMessage : String(err) });
  }
};

const deleteRoute = async (req, res) => {
  try {
    const id = req.params.id;
    await pool.query('DELETE FROM route WHERE route_id = ?', [id]);
    return res.json({ message: 'Route deleted' });
  } catch (err) {
    console.error('admin.deleteRoute error:', err);
    return res.status(500).json({ message: 'Server error', error: err && err.sqlMessage ? err.sqlMessage : String(err) });
  }
};

module.exports = { listRoutes, getRoute, createRoute, updateRoute, deleteRoute };
