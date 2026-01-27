const pool = require('../config/db');


async function generateScheduleSeats(req, res) {
  try {
    const scheduleId = parseInt(req.params.scheduleId, 10);
    if (!scheduleId) return res.status(400).json({ message: 'scheduleId required' });

    const [srows] = await pool.query('SELECT flight_id FROM `schedule` WHERE schedule_id = ? LIMIT 1', [scheduleId]);
    if (!srows.length) return res.status(404).json({ message: 'Schedule not found' });
    const flightId = srows[0].flight_id;

    const [seats] = await pool.query('SELECT seat_id, tier_id FROM `seat` WHERE flight_id = ? ORDER BY row_no, seat_number', [flightId]);
    if (!seats.length) {
      return res.status(400).json({ message: 'No seats defined for this flight' });
    }

    const [existing] = await pool.query('SELECT seat_id FROM `schedule_seat` WHERE schedule_id = ?', [scheduleId]);
    const existingSet = new Set((existing || []).map(r => Number(r.seat_id)));

    let inserted = 0;
    let skipped = 0;
    if (seats.length === 0) {
      return res.status(400).json({ message: 'No seat templates found for flight' });
    }

    const toInsert = [];
    for (const seat of seats) {
      if (!existingSet.has(Number(seat.seat_id))) {
        toInsert.push([scheduleId, seat.seat_id, seat.tier_id, 'Available', new Date()]);
      } else {
        skipped++;
      }
    }

    if (toInsert.length === 0) {
      return res.status(200).json({ inserted: 0, skipped, message: 'No new schedule seats to insert' });
    }

    const placeholders = toInsert.map(() => '(?, ?, ?, ?, ?)').join(', ');
    const flat = toInsert.flat();
    const sql = `INSERT INTO schedule_seat (schedule_id, seat_id, tier_id, seat_status, created_at) VALUES ${placeholders}`;

    const [ins] = await pool.query(sql, flat);
    inserted = ins.affectedRows ?? toInsert.length;

    return res.status(201).json({ inserted, skipped, message: 'Schedule seats generated' });
  } catch (err) {
    console.error('scheduleseatController.generateScheduleSeats error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function getBySchedule(req, res) {
  try {
    const scheduleId = parseInt(req.params.scheduleId, 10);
    if (!scheduleId) return res.status(400).json({ message: 'scheduleId required' });

    const [rows] = await pool.query(
      'SELECT ss.schedule_seat_id, ss.schedule_id, ss.seat_id, ss.tier_id, ss.seat_status, ' +
      's.seat_number, s.row_no, s.is_window, s.is_aisle, t.seat_class, t.seat_type, p.price AS tier_price ' +
      'FROM schedule_seat ss ' +
      'LEFT JOIN seat s ON s.seat_id = ss.seat_id ' +
      'LEFT JOIN seattier t ON t.tier_id = ss.tier_id ' +
      'LEFT JOIN ( ' +
      '  SELECT p1.tier_id, p1.price FROM price p1 ' +
      '  JOIN (SELECT tier_id, MAX(price_id) AS max_price_id FROM price GROUP BY tier_id) px ON p1.tier_id = px.tier_id AND p1.price_id = px.max_price_id ' +
      ') p ON p.tier_id = ss.tier_id ' +
      'WHERE ss.schedule_id = ? ' +
      'ORDER BY s.row_no, s.seat_number',
      [scheduleId]
    );

    return res.json(rows);
  } catch (err) {
    console.error('scheduleseatController.getBySchedule error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function getById(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ message: 'id required' });

    const [rows] = await pool.query(
      'SELECT ss.schedule_seat_id, ss.schedule_id, ss.seat_id, ss.tier_id, ss.seat_status, s.seat_number, s.row_no, t.seat_class ' +
      'FROM schedule_seat ss ' +
      'LEFT JOIN seat s ON s.seat_id = ss.seat_id ' +
      'LEFT JOIN seattier t ON t.tier_id = ss.tier_id ' +
      'WHERE ss.schedule_seat_id = ? LIMIT 1',
      [id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Schedule seat not found' });
    return res.json(rows[0]);
  } catch (err) {
    console.error('scheduleseatController.getById error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function updateSeatStatus(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const seat_status = req.body.seat_status;
    if (!id) return res.status(400).json({ message: 'id required' });
    if (!seat_status) return res.status(400).json({ message: 'seat_status required' });

    await pool.query('UPDATE schedule_seat SET seat_status = ?, updated_at = NOW() WHERE schedule_seat_id = ?', [seat_status, id]);
    return res.json({ message: 'Schedule seat status updated' });
  } catch (err) {
    console.error('scheduleseatController.updateSeatStatus error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function deleteScheduleSeat(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ message: 'id required' });

    await pool.query('DELETE FROM schedule_seat WHERE schedule_seat_id = ?', [id]);
    return res.json({ message: 'Schedule seat deleted' });
  } catch (err) {
    console.error('scheduleseatController.deleteScheduleSeat error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  generateScheduleSeats,
  getBySchedule,
  getById,
  updateSeatStatus,
  deleteScheduleSeat
};
