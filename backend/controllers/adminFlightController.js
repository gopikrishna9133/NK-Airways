const pool = require('../config/db');
const flightController = require('./flightController');

async function getAdminIdForUser(user_id) {
  const [rows] = await pool.query('SELECT admin_id FROM admin WHERE user_id = ? LIMIT 1', [user_id]);
  return rows.length ? rows[0].admin_id : null;
}

const listFlights = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT flight_id, flight_no, flight_name, aircraft_type, total_seats, created_at FROM flight ORDER BY flight_no ASC');
    return res.json(rows);
  } catch (err) {
    console.error('admin.listFlights', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const getFlight = async (req, res) => {
  try {
    const id = req.params.id;
    const [rows] = await pool.query('SELECT * FROM flight WHERE flight_id = ? LIMIT 1', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Flight not found' });
    return res.json(rows[0]);
  } catch (err) {
    console.error('admin.getFlight', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const createFlight = async (req, res) => {
  try {
    const { flight_no, flight_name, aircraft_type } = req.body;
    let seat_count = req.body.seat_count ?? req.body.total_seats ?? 0;
    seat_count = Number(seat_count || 0);

    if (!flight_no) return res.status(400).json({ message: 'flight_no required' });

    let admin_id = null;
    if (req.user && req.user.user_id) {
      admin_id = await getAdminIdForUser(req.user.user_id);
    }

    const [result] = await pool.query(
      'INSERT INTO flight (admin_id, flight_no, flight_name, total_seats, aircraft_type, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [admin_id, flight_no, flight_name || null, seat_count || 0, aircraft_type || null]
    );
    const flightId = result.insertId;

    if (seat_count > 0) {
      try {
        await flightController.generateSeatTemplates(flightId, seat_count, { force: false });
      } catch (gerr) {
        console.error('generateSeatTemplates error (adminFlightController):', gerr);
        return res.status(201).json({ message: 'Flight created (seat generation issue)', flight_id: flightId, seat_gen_warning: gerr.message });
      }
    }

    return res.status(201).json({ message: 'Flight created', flight_id: flightId });
  } catch (err) {
    console.error('createFlight error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const updateFlight = async (req, res) => {
  try {
    const id = req.params.id;
    const { flight_no, flight_name, aircraft_type } = req.body;
    let seat_count = req.body.seat_count ?? req.body.total_seats;
    if (!flight_no) return res.status(400).json({ message: 'flight_no required' });

    await pool.query('UPDATE flight SET flight_no = ?, flight_name = ?, aircraft_type = ?, updated_at = NOW() WHERE flight_id = ?', [flight_no, flight_name || null, aircraft_type || null, id]);

    if (typeof seat_count !== 'undefined') {
      seat_count = Number(seat_count);
      await pool.query('UPDATE flight SET total_seats = ? WHERE flight_id = ?', [seat_count, id]);

      const force = req.query.force === '1' || req.body.force === true;
      try {
        await flightController.generateSeatTemplates(id, seat_count, { force });
      } catch (gerr) {
        console.error('generateSeatTemplates error (update):', gerr);
        return res.json({ message: 'Flight updated (seat generation failed)', seat_gen_warning: gerr.message });
      }
    }

    return res.json({ message: 'Flight updated' });
  } catch (err) {
    console.error('admin.updateFlight', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const deleteFlight = async (req, res) => {
  try {
    const id = req.params.id;
    await pool.query('DELETE FROM flight WHERE flight_id = ?', [id]);
    return res.json({ message: 'Flight deleted' });
  } catch (err) {
    console.error('admin.deleteFlight', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { listFlights, getFlight, createFlight, updateFlight, deleteFlight };
