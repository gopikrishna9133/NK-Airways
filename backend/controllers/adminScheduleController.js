const pool = require('../config/db');

function toMySQLDateTime(value) {
  if (!value) throw new Error('Missing datetime value');

  const d = (value instanceof Date) ? value : new Date(value);
  if (isNaN(d.getTime())) {
    throw new Error('Invalid datetime value: ' + value);
  }
  const pad = (n) => String(n).padStart(2, '0');
  const YYYY = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const DD = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `${YYYY}-${MM}-${DD} ${hh}:${mm}:${ss}`;
}

const listSchedules = async (req, res) => {
  try {
    const { flight_id, route_id, date } = req.query;
    let sql = `
      SELECT s.*, f.flight_no, f.flight_name,
             r.origin_location, r.destination_location,
             IFNULL(r.distance, NULL) AS distance
      FROM schedule s
      JOIN flight f ON s.flight_id = f.flight_id
      JOIN route r ON s.route_id = r.route_id
    `;
    const params = [];
    const where = [];
    if (flight_id) { where.push('s.flight_id = ?'); params.push(flight_id); }
    if (route_id) { where.push('s.route_id = ?'); params.push(route_id); }
    if (date) {
      where.push("DATE(s.departure_datetime) = ?");
      params.push(date);
    }
    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += ' ORDER BY s.departure_datetime ASC';
    const [rows] = await pool.query(sql, params);
    return res.json(Array.isArray(rows) ? rows : []);
  } catch (err) {
    console.error('admin.listSchedules error', err);
    return res.status(500).json({ message: 'Server error', error: err && err.sqlMessage ? err.sqlMessage : String(err) });
  }
};

const getSchedule = async (req, res) => {
  try {
    const id = req.params.id;
    const [rows] = await pool.query(
      `SELECT s.*, f.flight_no, f.flight_name, r.origin_location, r.destination_location
       FROM schedule s
       JOIN flight f ON s.flight_id = f.flight_id
       JOIN route r ON s.route_id = r.route_id
       WHERE s.schedule_id = ?`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Schedule not found' });
    return res.json(rows[0]);
  } catch (err) {
    console.error('admin.getSchedule error', err);
    return res.status(500).json({ message: 'Server error', error: err && err.sqlMessage ? err.sqlMessage : String(err) });
  }
};

const createSchedule = async (req, res) => {
  try {
    const { flight_id, route_id, departure_datetime, arrival_datetime } = req.body;
    if (!flight_id || !route_id || !departure_datetime || !arrival_datetime) {
      return res.status(400).json({ message: 'flight_id, route_id, departure_datetime and arrival_datetime are required' });
    }

    let dep, arr;
    try {
      dep = toMySQLDateTime(departure_datetime);
      arr = toMySQLDateTime(arrival_datetime);
    } catch (e) {
      return res.status(400).json({ message: 'Invalid datetime format: ' + e.message });
    }

    const [result] = await pool.query(
      `INSERT INTO schedule (flight_id, route_id, departure_datetime, arrival_datetime, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [flight_id, route_id, dep, arr]
    );
    return res.status(201).json({ message: 'Schedule created', schedule_id: result.insertId });
  } catch (err) {
    console.error('admin.createSchedule error', err);
    return res.status(500).json({ message: 'Server error', error: err && err.sqlMessage ? err.sqlMessage : String(err) });
  }
};

const updateSchedule = async (req, res) => {
  try {
    const id = req.params.id;
    const { flight_id, route_id, departure_datetime, arrival_datetime } = req.body;
    if (!flight_id || !route_id || !departure_datetime || !arrival_datetime) {
      return res.status(400).json({ message: 'flight_id, route_id, departure_datetime and arrival_datetime are required' });
    }

    // Normalize datetimes
    let dep, arr;
    try {
      dep = toMySQLDateTime(departure_datetime);
      arr = toMySQLDateTime(arrival_datetime);
    } catch (e) {
      return res.status(400).json({ message: 'Invalid datetime format: ' + e.message });
    }

    const sql = `UPDATE schedule
                 SET flight_id = ?, route_id = ?, departure_datetime = ?, arrival_datetime = ?
                 WHERE schedule_id = ?`;
    const [result] = await pool.query(sql, [flight_id, route_id, dep, arr, id]);

    if (result && result.affectedRows === 0) {
      return res.status(404).json({ message: 'Schedule not found or no changes applied' });
    }

    return res.json({ message: 'Schedule updated' });
  } catch (err) {
    console.error('admin.updateSchedule error', err);
    return res.status(500).json({ message: 'Server error', error: err && err.sqlMessage ? err.sqlMessage : String(err) });
  }
};

const deleteSchedule = async (req, res) => {
  try {
    const id = req.params.id;
    const [result] = await pool.query('DELETE FROM schedule WHERE schedule_id = ?', [id]);
    if (result && result.affectedRows === 0) return res.status(404).json({ message: 'Schedule not found' });
    return res.json({ message: 'Schedule deleted' });
  } catch (err) {
    console.error('admin.deleteSchedule error', err);
    return res.status(500).json({ message: 'Server error', error: err && err.sqlMessage ? err.sqlMessage : String(err) });
  }
};

module.exports = {
  listSchedules,
  getSchedule,
  createSchedule,
  updateSchedule,
  deleteSchedule
};
