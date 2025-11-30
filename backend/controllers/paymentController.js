const pool = require('../config/db');

async function getPassengerIdForUser(user_id) {
  const [rows] = await pool.query('SELECT passenger_id FROM passenger WHERE user_id = ? LIMIT 1', [user_id]);
  return rows.length ? rows[0].passenger_id : null;
}

const createPayment = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const userId = req.user && req.user.user_id;
    if (!userId) return res.status(401).json({ message: 'Not authenticated' });

    const passenger_id = await getPassengerIdForUser(userId);
    if (!passenger_id) return res.status(400).json({ message: 'Passenger profile not found for user' });

    const { booking_id, amount } = req.body;
    if (!booking_id || typeof amount === 'undefined') return res.status(400).json({ message: 'booking_id and amount are required' });

    const [brows] = await conn.query(
      `SELECT b.*, p.user_id
       FROM booking b
       JOIN passenger p ON b.passenger_id = p.passenger_id
       WHERE b.booking_id = ? LIMIT 1`, [booking_id]
    );
    if (!brows.length) { conn.release(); return res.status(404).json({ message: 'Booking not found' }); }
    const booking = brows[0];
    if (booking.user_id !== userId) { conn.release(); return res.status(403).json({ message: 'Cannot pay for this booking' }); }

    await conn.beginTransaction();
    const [ins] = await conn.query(
      'INSERT INTO payment (booking_id, amount, payment_status) VALUES (?, ?, ?)',
      [booking_id, amount, 'Completed']
    );

    await conn.query('UPDATE booking SET booking_status = ? WHERE booking_id = ?', ['Confirmed', booking_id]);

    await conn.commit();
    conn.release();

    return res.status(201).json({ message: 'Payment recorded', payment_id: ins.insertId });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    conn.release();
    console.error('createPayment', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const getPaymentsForBooking = async (req, res) => {
  try {
    const bookingId = req.params.bookingId;
    const [rows] = await pool.query('SELECT * FROM payment WHERE booking_id = ? ORDER BY payment_date DESC', [bookingId]);
    return res.json(rows);
  } catch (err) {
    console.error('getPaymentsForBooking', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createPayment, getPaymentsForBooking };
