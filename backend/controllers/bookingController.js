const pool = require('../config/db');

async function getPassengerIdForUser(user_id) {
  if (!user_id) return null;
  const [rows] = await pool.query('SELECT passenger_id FROM passenger WHERE user_id = ? LIMIT 1', [user_id]);
  return rows && rows[0] ? rows[0].passenger_id : null;
}

async function createBooking(req, res) {
  const conn = await pool.getConnection();
  try {
    const { schedule_id, schedule_seat_id } = req.body;
    let total_amount = req.body.total_amount ?? null;
    if (!schedule_id || !schedule_seat_id) {
      conn.release();
      return res.status(400).json({ message: 'schedule_id and schedule_seat_id are required' });
    }

    const passenger_id = await getPassengerIdForUser(req.user?.user_id);
    if (!passenger_id) {
      conn.release();
      return res.status(403).json({ message: 'Passenger profile not found for current user' });
    }

    await conn.beginTransaction();

    const [seatRows] = await conn.query('SELECT schedule_seat_id, seat_status FROM schedule_seat WHERE schedule_seat_id = ? LIMIT 1 FOR UPDATE', [schedule_seat_id]);
    if (!seatRows.length) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ message: 'Schedule seat not found' });
    }
    const seatRow = seatRows[0];
    if ((seatRow.seat_status ?? '').toString().toLowerCase() !== 'available') {
      await conn.rollback();
      conn.release();
      return res.status(409).json({ message: 'Seat is not available' });
    }


    const genPNR = `NK${new Date().toISOString().slice(2,10).replace(/-/g, '')}${String(Math.floor(Math.random() * 9000) + 1000)}`;

    const insertSql = `INSERT INTO booking (passenger_id, schedule_id, schedule_seat_id, booking_date, total_amount, PNR, booking_status, created_at)
      VALUES (?, ?, ?, NOW(), ?, ?, 'Pending', NOW())`;
    const [ins] = await conn.query(insertSql, [passenger_id, schedule_id, schedule_seat_id, total_amount, genPNR]);

    const bookingId = ins.insertId;

    const [brows] = await conn.query('SELECT * FROM booking WHERE booking_id = ? LIMIT 1', [bookingId]);
    const booking = brows && brows[0] ? brows[0] : null;

    if (!booking) {
      await conn.rollback();
      conn.release();
      return res.status(500).json({ message: 'Booking creation failed (no record)' });
    }

    if ((booking.booking_status ?? '').toString().toLowerCase() === 'confirmed') {
      await conn.commit();
      conn.release();
      return res.status(201).json({ message: 'Booking confirmed', booking });
    } else {
      await conn.rollback();
      conn.release();
      return res.status(409).json({ message: 'Booking failed: seat could not be reserved' });
    }
  } catch (err) {
    try { await conn.rollback(); } catch (e) {}
    conn.release();
    console.error('createBooking error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function getPassengerIdForUser(userId) {
  if (!userId) return null;
  try {
    const [rows] = await pool.query(
      "SELECT passenger_id FROM passenger WHERE user_id = ? LIMIT 1",
      [userId]
    );
    return rows?.[0]?.passenger_id ?? null;
  } catch (err) {
    console.error("getPassengerIdForUser error", err);
    return null;
  }
}

async function getMyBookings(req, res) {
  try {
    const passengerIdParam = req.query?.passenger_id ?? null;
    const userId = req.user?.user_id ?? req.user?.id ?? null;

    let passengerId = passengerIdParam;
    if (!passengerId && userId) passengerId = await getPassengerIdForUser(userId);
    if (!passengerId) return res.status(400).json({ message: "passenger_id required" });

    try {
      const [rows] = await pool.query(`
        SELECT
          b.booking_id,
          b.passenger_id,
          b.schedule_id,
          b.schedule_seat_id,
          b.total_amount,
          b.PNR,
          b.booking_status,
          b.booking_date,
          -- schedule datetimes
          s.departure_datetime,
          s.arrival_datetime,
          DATE_FORMAT(s.departure_datetime, '%Y-%m-%dT%H:%i:%sZ') AS departure_iso,
          DATE_FORMAT(s.arrival_datetime, '%Y-%m-%dT%H:%i:%sZ') AS arrival_iso,
          -- flight and route
          f.flight_no,
          f.flight_name,
          r.origin_location,
          r.destination_location,
          -- seat and tier
          st.seat_number,
          COALESCE(t.seat_class, ss_tier.seat_class, st_tier.seat_class) AS tier_name
        FROM booking b
        LEFT JOIN schedule s ON s.schedule_id = b.schedule_id
        LEFT JOIN flight f ON f.flight_id = s.flight_id
        LEFT JOIN route r ON r.route_id = s.route_id
        LEFT JOIN schedule_seat ss ON ss.schedule_seat_id = b.schedule_seat_id
        LEFT JOIN seat st ON st.seat_id = ss.seat_id
        LEFT JOIN seattier t ON t.tier_id = ss.tier_id          -- schedule_seat tier
        LEFT JOIN seattier ss_tier ON ss_tier.tier_id = ss.tier_id
        LEFT JOIN seattier st_tier ON st_tier.tier_id = st.tier_id
        WHERE b.passenger_id = ?
        ORDER BY b.booking_date DESC
      `, [passengerId]);

      return res.json(rows);
    } catch (richErr) {
      console.error('getMyBookings: rich join failed, falling back', richErr);
    }

    const [rows2] = await pool.query(
      'SELECT * FROM booking WHERE passenger_id = ? ORDER BY booking_date DESC',
      [passengerId]
    );
    return res.json(rows2);
  } catch (err) {
    console.error('getMyBookings error', err);
    return res.status(500).json({ message: 'Server error', details: err?.message ?? String(err) });
  }
}

async function getBookingById(req, res) {
  try {
    const id = req.params?.id;
    if (!id) return res.status(400).json({ message: 'booking id required' });

    try {
      const [rows] = await pool.query(`
        SELECT
          b.*,
          s.schedule_id,
          s.departure_datetime,
          s.arrival_datetime,
          DATE_FORMAT(s.departure_datetime, '%Y-%m-%dT%H:%i:%sZ') AS departure_iso,
          DATE_FORMAT(s.arrival_datetime, '%Y-%m-%dT%H:%i:%sZ') AS arrival_iso,
          f.flight_no,
          f.flight_name,
          r.origin_location,
          r.destination_location,
          ss.schedule_seat_id,
          st.seat_number,
          COALESCE(t.seat_class, ss_tier.seat_class, st_tier.seat_class) AS tier_name
        FROM booking b
        LEFT JOIN schedule s ON s.schedule_id = b.schedule_id
        LEFT JOIN flight f ON f.flight_id = s.flight_id
        LEFT JOIN route r ON r.route_id = s.route_id
        LEFT JOIN schedule_seat ss ON ss.schedule_seat_id = b.schedule_seat_id
        LEFT JOIN seat st ON st.seat_id = ss.seat_id
        LEFT JOIN seattier t ON t.tier_id = ss.tier_id
        LEFT JOIN seattier ss_tier ON ss_tier.tier_id = ss.tier_id
        LEFT JOIN seattier st_tier ON st_tier.tier_id = st.tier_id
        WHERE b.booking_id = ?
        LIMIT 1
      `, [id]);

      if (rows && rows.length > 0) {
        const booking = rows[0];
        return res.json({ booking });
      }
    } catch (richErr) {
      console.error('getBookingById: rich join failed, falling back', richErr);
    }

    const [rows2] = await pool.query('SELECT * FROM booking WHERE booking_id = ? LIMIT 1', [id]);
    if (!rows2 || rows2.length === 0) return res.status(404).json({ message: 'Booking not found' });
    return res.json({ booking: rows2[0] });
  } catch (err) {
    console.error('getBookingById error', err);
    return res.status(500).json({ message: 'Server error', details: err?.message ?? String(err) });
  }
}


async function cancelBooking(req, res) {
  const conn = await pool.getConnection();
  try {
    const bookingId = req.params.id;
    await conn.beginTransaction();

    const [brows] = await conn.query('SELECT * FROM booking WHERE booking_id = ? LIMIT 1 FOR UPDATE', [bookingId]);
    if (!brows.length) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ message: 'Booking not found' });
    }
    const booking = brows[0];

    const passenger_id = await getPassengerIdForUser(req.user?.user_id);
    if (req.user?.role !== 'Admin' && passenger_id && booking.passenger_id !== passenger_id) {
      await conn.rollback();
      conn.release();
      return res.status(403).json({ message: 'Unauthorized to cancel this booking' });
    }

    if ((booking.booking_status ?? '').toString().toLowerCase() === 'cancelled') {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ message: 'Booking already cancelled' });
    }

    const [ssrows] = await conn.query('SELECT * FROM schedule_seat WHERE schedule_seat_id = ? LIMIT 1 FOR UPDATE', [booking.schedule_seat_id]);
    if (!ssrows.length) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ message: 'Schedule seat not found' });
    }
    const scheduleSeat = ssrows[0];

    // Update booking and schedule_seat
    await conn.query('UPDATE booking SET booking_status = ?, updated_at = NOW() WHERE booking_id = ?', ['Cancelled', bookingId]);

    if ((scheduleSeat.seat_status ?? '').toString().toLowerCase() === 'booked') {
      await conn.query('UPDATE schedule_seat SET seat_status = ?, updated_at = NOW() WHERE schedule_seat_id = ?', ['Available', booking.schedule_seat_id]);
    }

    await conn.commit();
    conn.release();
    return res.json({ message: 'Booking cancelled' });
  } catch (err) {
    try { await conn.rollback(); } catch (e) {}
    conn.release();
    console.error('cancelBooking error', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  createBooking,
  getPassengerIdForUser,
  getMyBookings,
  getBookingById,
  cancelBooking
};
