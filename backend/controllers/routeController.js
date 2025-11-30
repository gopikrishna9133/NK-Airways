const pool = require('../config/db');

async function getAdminIdForUser(user_id) {
  const [rows] = await pool.query('SELECT admin_id FROM admin WHERE user_id = ? LIMIT 1', [user_id]);
  return rows.length ? rows[0].admin_id : null;
}

async function ensureDistanceColumnExists() {
  try {

    await pool.query(`ALTER TABLE \`route\` ADD COLUMN IF NOT EXISTS distance DECIMAL(10,2) NULL`);
  } catch (err) {
    console.warn('ensureDistanceColumnExists warning (ignored):', err.message || err);
  }
}

const createRoute = async (req, res) => {
  try {
    const { origin_location, destination_location, distance, travel_time } = req.body;
    if (!origin_location || !destination_location) {
      return res.status(400).json({ message: 'origin_location and destination_location are required' });
    }

    let admin_id = null;
    if (req.user && req.user.user_id) {
      admin_id = await getAdminIdForUser(req.user.user_id);
    }

    if (distance !== undefined && distance !== null && distance !== '') {
      await ensureDistanceColumnExists();
      const [result] = await pool.query(
        'INSERT INTO `route` (admin_id, origin_location, destination_location, distance, created_at) VALUES (?, ?, ?, ?, NOW())',
        [admin_id, origin_location, destination_location, distance]
      );
      return res.status(201).json({ message: 'Route created', route_id: result.insertId });
    }

    const tv = travel_time || null;
    const [result] = await pool.query(
      'INSERT INTO `route` (admin_id, origin_location, destination_location, travel_time, created_at) VALUES (?, ?, ?, ?, NOW())',
      [admin_id, origin_location, destination_location, tv]
    );

    return res.status(201).json({ message: 'Route created', route_id: result.insertId });
  } catch (err) {
    console.error('createRoute error', err);
    return res.status(500).json({ message: 'Server error', details: err?.message ?? String(err) });
  }
};

const getAllRoutes = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT route_id, origin_location, destination_location, travel_time, IFNULL(distance, NULL) AS distance, created_at FROM `route` ORDER BY route_id DESC');
    return res.json(rows);
  } catch (err) {
    console.error('getAllRoutes error', err);
    return res.status(500).json({ message: 'Server error', details: err?.message ?? String(err) });
  }
};

const getRouteById = async (req, res) => {
  try {
    const routeId = req.params.id;
    const [rows] = await pool.query('SELECT route_id, origin_location, destination_location, travel_time, IFNULL(distance, NULL) AS distance, created_at FROM route WHERE route_id = ? LIMIT 1', [routeId]);
    if (!rows.length) return res.status(404).json({ message: 'Route not found' });
    return res.json(rows[0]);
  } catch (err) {
    console.error('getRouteById error', err);
    return res.status(500).json({ message: 'Server error', details: err?.message ?? String(err) });
  }
};

const updateRoute = async (req, res) => {
  try {
    const routeId = req.params.id;
    const { origin_location, destination_location, distance, travel_time } = req.body;
    if (!origin_location || !destination_location) {
      return res.status(400).json({ message: 'origin_location and destination_location are required' });
    }

    if (distance !== undefined && distance !== null && distance !== '') {

      await ensureDistanceColumnExists();
      await pool.query('UPDATE `route` SET origin_location = ?, destination_location = ?, distance = ?, updated_at = NOW() WHERE route_id = ?', [origin_location, destination_location, distance, routeId]);
      return res.json({ message: 'Route updated (distance)' });
    }

    await pool.query('UPDATE `route` SET origin_location = ?, destination_location = ?, travel_time = ?, updated_at = NOW() WHERE route_id = ?', [origin_location, destination_location, travel_time || null, routeId]);
    return res.json({ message: 'Route updated (travel_time)' });
  } catch (err) {
    console.error('updateRoute error', err);
    return res.status(500).json({ message: 'Server error', details: err?.message ?? String(err) });
  }
};

const deleteRoute = async (req, res) => {
  try {
    const routeId = req.params.id;
    await pool.query('DELETE FROM `route` WHERE route_id = ?', [routeId]);
    return res.json({ message: 'Route deleted' });
  } catch (err) {
    console.error('deleteRoute error', err);
    return res.status(500).json({ message: 'Server error', details: err?.message ?? String(err) });
  }
};

module.exports = {
  createRoute,
  getAllRoutes,
  getRouteById,
  updateRoute,
  deleteRoute
};
