const pool = require('../config/db');

async function getAdminIdForUser(user_id) {
  const [rows] = await pool.query('SELECT admin_id FROM admin WHERE user_id = ? LIMIT 1', [user_id]);
  return rows.length ? rows[0].admin_id : null;
}

const createSchedule = async (req, res) => {
  try {
    const { flight_id, route_id, departure_datetime, arrival_datetime, status } = req.body;
    if (!flight_id || !route_id || !departure_datetime || !arrival_datetime) {
      return res.status(400).json({ message: 'flight_id, route_id, departure_datetime and arrival_datetime are required' });
    }

    const [frows] = await pool.query('SELECT flight_id FROM flight WHERE flight_id = ? LIMIT 1', [flight_id]);
    if (!frows.length) return res.status(400).json({ message: 'Invalid flight_id' });

    const [rrows] = await pool.query('SELECT route_id FROM route WHERE route_id = ? LIMIT 1', [route_id]);
    if (!rrows.length) return res.status(400).json({ message: 'Invalid route_id' });

    let admin_id = null;
    if (req.user && req.user.user_id) {
      admin_id = await getAdminIdForUser(req.user.user_id);
    }

    const [result] = await pool.query(
      'INSERT INTO `schedule` (flight_id, route_id, admin_id, departure_datetime, arrival_datetime, status) VALUES (?, ?, ?, ?, ?, ?)',
      [flight_id, route_id, admin_id, departure_datetime, arrival_datetime, status || 'Scheduled']
    );

    return res.status(201).json({ message: 'Schedule created', schedule_id: result.insertId });
  } catch (err) {
    console.error('createSchedule error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const getAllSchedules = async (req, res) => {
  try {
    const { origin, destination, date } = req.query;

    
    let sql = `
      SELECT s.*,
             f.flight_no, f.flight_name, f.aircraft_type,
             r.origin_location, r.destination_location,
             sp.min_price
      FROM schedule s
      JOIN flight f ON s.flight_id = f.flight_id
      JOIN route r ON s.route_id = r.route_id
      LEFT JOIN (
        -- for each schedule, compute min price across tiers (if price rows exist)
        SELECT ss.schedule_id, MIN(p.price) AS min_price
        FROM schedule_seat ss
        LEFT JOIN (
          SELECT p1.* FROM price p1
          JOIN (
            SELECT tier_id, MAX(price_id) AS max_price_id FROM price GROUP BY tier_id
          ) px ON p1.tier_id = px.tier_id AND p1.price_id = px.max_price_id
        ) p ON p.tier_id = p.tier_id
        JOIN price p2 ON ss.tier_id = p2.tier_id
        GROUP BY ss.schedule_id
      ) sp ON sp.schedule_id = s.schedule_id
    `;

    const where = [];
    const params = [];

    const addLocationFilter = (columnName, value) => {
      if (!value) return;
      const v = value.toString().trim();
      if (/^[A-Za-z]{2,4}$/.test(v)) {
        where.push(`(LOWER(${columnName}) LIKE ? OR LOWER(${columnName}) LIKE ?)`);
        params.push(`%(${v.toLowerCase()})%`);
        params.push(`% ${v.toLowerCase()}%`);
      } else {
        where.push(`LOWER(${columnName}) LIKE ?`);
        params.push(`%${v.toLowerCase()}%`);
      }
    };

    addLocationFilter('r.origin_location', origin);
    addLocationFilter('r.destination_location', destination);

    if (date) {
      where.push('DATE(s.departure_datetime) = ?');
      params.push(date);
    }

    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += ' ORDER BY s.departure_datetime ASC';

    const [rows] = await pool.query(sql, params);
    const normalized = rows.map(r => ({
      ...r,
      min_price: r.min_price !== undefined ? (r.min_price === null ? null : Number(r.min_price)) : null
    }));
    return res.json(normalized);
  } catch (err) {
    console.error('getAllSchedules error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};


const getScheduleById = async (req, res) => {
  try {
    const id = req.params.id;
    const [rows] = await pool.query(
      `SELECT s.*, f.flight_no, f.flight_name, f.aircraft_type, r.origin_location, r.destination_location
       FROM schedule s
       JOIN flight f ON s.flight_id = f.flight_id
       JOIN route r ON s.route_id = r.route_id
       WHERE s.schedule_id = ? LIMIT 1`, [id]
    );

    if (!rows.length) return res.status(404).json({ message: 'Schedule not found' });
    return res.json(rows[0]);
  } catch (err) {
    console.error('getScheduleById error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const updateSchedule = async (req, res) => {
  try {
    const id = req.params.id;
    const { flight_id, route_id, departure_datetime, arrival_datetime, status } = req.body;
    if (!flight_id || !route_id || !departure_datetime || !arrival_datetime) {
      return res.status(400).json({ message: 'flight_id, route_id, departure_datetime and arrival_datetime are required' });
    }

    const [frows] = await pool.query('SELECT flight_id FROM flight WHERE flight_id = ? LIMIT 1', [flight_id]);
    if (!frows.length) return res.status(400).json({ message: 'Invalid flight_id' });

    const [rrows] = await pool.query('SELECT route_id FROM route WHERE route_id = ? LIMIT 1', [route_id]);
    if (!rrows.length) return res.status(400).json({ message: 'Invalid route_id' });

    await pool.query(
      `UPDATE schedule SET flight_id = ?, route_id = ?, departure_datetime = ?, arrival_datetime = ?, status = ? WHERE schedule_id = ?`,
      [flight_id, route_id, departure_datetime, arrival_datetime, status || 'Scheduled', id]
    );

    return res.json({ message: 'Schedule updated' });
  } catch (err) {
    console.error('updateSchedule error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const deleteSchedule = async (req, res) => {
  try {
    const id = req.params.id;
    await pool.query('DELETE FROM schedule WHERE schedule_id = ?', [id]);
    return res.json({ message: 'Schedule deleted' });
  } catch (err) {
    console.error('deleteSchedule error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createSchedule,
  getAllSchedules,
  getScheduleById,
  updateSchedule,
  deleteSchedule
};
