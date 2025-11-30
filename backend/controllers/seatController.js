const pool = require('../config/db');

const createSeat = async (req, res) => {
  try {
    const { flight_id, tier_id, seat_number, is_window, is_aisle, row_no } = req.body;
    if (!flight_id || !tier_id || !seat_number) {
      return res.status(400).json({ message: 'flight_id, tier_id and seat_number are required' });
    }

    // ensure flight exists
    const [f] = await pool.query('SELECT flight_id FROM `flight` WHERE flight_id = ? LIMIT 1', [flight_id]);
    if (!f.length) return res.status(400).json({ message: 'Invalid flight_id' });

    // ensure tier exists
    const [t] = await pool.query('SELECT tier_id FROM `seattier` WHERE tier_id = ? LIMIT 1', [tier_id]);
    if (!t.length) return res.status(400).json({ message: 'Invalid tier_id' });

    const [result] = await pool.query(
      'INSERT INTO `seat` (flight_id, tier_id, seat_number, is_window, is_aisle, row_no) VALUES (?, ?, ?, ?, ?, ?)',
      [flight_id, tier_id, seat_number, !!is_window, !!is_aisle, row_no || null]
    );
    return res.status(201).json({ message: 'Seat created', seat_id: result.insertId });
  } catch (err) {
    console.error('createSeat', err);
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Seat number already exists for this flight' });
    return res.status(500).json({ message: 'Server error' });
  }
};

const getAllSeats = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM `seat` ORDER BY seat_id DESC');
    return res.json(rows);
  } catch (err) {
    console.error('getAllSeats', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const getSeatById = async (req, res) => {
  try {
    const id = req.params.id;
    const [rows] = await pool.query('SELECT * FROM `seat` WHERE seat_id = ?', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Seat not found' });
    return res.json(rows[0]);
  } catch (err) {
    console.error('getSeatById', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const updateSeat = async (req, res) => {
  try {
    const id = req.params.id;
    const { tier_id, seat_number, is_window, is_aisle, row_no } = req.body;
    if (!tier_id || !seat_number) return res.status(400).json({ message: 'tier_id and seat_number are required' });

    // ensure tier exists
    const [t] = await pool.query('SELECT tier_id FROM `seattier` WHERE tier_id = ? LIMIT 1', [tier_id]);
    if (!t.length) return res.status(400).json({ message: 'Invalid tier_id' });

    await pool.query(
      'UPDATE `seat` SET tier_id = ?, seat_number = ?, is_window = ?, is_aisle = ?, row_no = ? WHERE seat_id = ?',
      [tier_id, seat_number, !!is_window, !!is_aisle, row_no || null, id]
    );

    return res.json({ message: 'Seat updated' });
  } catch (err) {
    console.error('updateSeat', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const deleteSeat = async (req, res) => {
  try {
    const id = req.params.id;
    await pool.query('DELETE FROM `seat` WHERE seat_id = ?', [id]);
    return res.json({ message: 'Seat deleted' });
  } catch (err) {
    console.error('deleteSeat', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createSeat, getAllSeats, getSeatById, updateSeat, deleteSeat };
