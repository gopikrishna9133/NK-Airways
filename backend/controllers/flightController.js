const pool = require('../config/db');

async function getAdminIdForUser(user_id) {
  if (!user_id) return null;
  const [rows] = await pool.query('SELECT admin_id FROM admin WHERE user_id = ? LIMIT 1', [user_id]);
  return rows.length ? rows[0].admin_id : null;
}

// Create flight
async function createFlight(req, res) {
  try {
    const { flight_no, flight_name, aircraft_type } = req.body;
    let seat_count = req.body.seat_count ?? req.body.total_seats ?? 0;
    seat_count = Number(seat_count || 0);

    if (!flight_no) return res.status(400).json({ message: 'flight_no required' });

    const admin_id = await getAdminIdForUser(req.user?.user_id);

    const [result] = await pool.query(
      'INSERT INTO flight (admin_id, flight_no, flight_name, total_seats, aircraft_type, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [admin_id, flight_no, flight_name || null, seat_count || 0, aircraft_type || null]
    );
    const flightId = result.insertId;

    // attempt to generate seat templates
    if (seat_count > 0) {
      try {
        await generateSeatTemplates(flightId, seat_count, { force: false });
      } catch (gerr) {
        console.error('generateSeatTemplates error (flightController.createFlight):', gerr);
        return res.status(201).json({ message: 'Flight created (seat generation failed)', flight_id: flightId, seat_gen_warning: gerr.message });
      }
    }

    return res.status(201).json({ message: 'Flight created', flight_id: flightId });
  } catch (err) {
    console.error('flightController.createFlight', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

// Generate seat templates for a flight
async function generateSeatTemplates(flightId, seatCount, options = {}) {
  const force = !!options.force;

  if (!flightId || !seatCount || seatCount <= 0) {
    throw new Error('Invalid flightId or seatCount');
  }

  if (force) {
    await pool.query('DELETE FROM seat WHERE flight_id = ?', [flightId]);
  } else {
    const [existing] = await pool.query('SELECT COUNT(*) AS cnt FROM seat WHERE flight_id = ?', [flightId]);
    if (existing && existing[0] && existing[0].cnt > 0) {
      return { skipped: true, reason: 'Seats already exist for this flight' };
    }
  }

  // Load seat tiers
  const [tierRows] = await pool.query('SELECT * FROM seattier ORDER BY tier_id ASC');

  let businessTier = tierRows.find(r => r.seat_class && r.seat_class.toString().toLowerCase().includes('business'));
  let economyTier = tierRows.find(r => r.seat_class && r.seat_class.toString().toLowerCase().includes('economy'));

  if (!businessTier || !economyTier) {
    if (tierRows.length >= 2) {
      businessTier = businessTier || tierRows[0];
      economyTier = economyTier || tierRows[1] || tierRows[0];
    } else if (tierRows.length === 1) {
      businessTier = businessTier || tierRows[0];
      economyTier = economyTier || tierRows[0];
    } else {

      const [resE] = await pool.query('INSERT INTO seattier (seat_class, seat_type, created_at) VALUES (?, ?, NOW())', ['Economy', 'Standard']);
      const [resB] = await pool.query('INSERT INTO seattier (seat_class, seat_type, created_at) VALUES (?, ?, NOW())', ['Business', 'Premium']);
      economyTier = { tier_id: resE.insertId, seat_class: 'Economy' };
      businessTier = { tier_id: resB.insertId, seat_class: 'Business' };
    }
  }

  const busTierId = businessTier.tier_id ?? businessTier.id;
  const econTierId = economyTier.tier_id ?? economyTier.id;

  // Layout: 6 seats per row A-F
  const seatLetters = ['A','B','C','D','E','F'];
  const perRow = seatLetters.length;
  const rowsCount = Math.ceil(seatCount / perRow);

  // Business seats: 20% (rounded)
  const businessCount = Math.round(seatCount * 0.2);
  let businessAssigned = 0;

  const seatsToInsert = [];

  outer: for (let row = 1; row <= rowsCount; row++) {
    for (let li = 0; li < perRow; li++) {
      const globalIndex = (row - 1) * perRow + li + 1;
      if (globalIndex > seatCount) break outer;

      const letter = seatLetters[li];
      const seatNumber = `${row}${letter}`;

      const is_window = (letter === 'A' || letter === 'F') ? 1 : 0;
      const is_aisle = (letter === 'C' || letter === 'D') ? 1 : 0;

      // Assign business first (front rows)
      let tier_id = econTierId;
      if (businessAssigned < businessCount) {
        tier_id = busTierId;
        businessAssigned++;
      }

      seatsToInsert.push([flightId, tier_id, seatNumber, row, is_window, is_aisle, new Date()]);
    }
  }

  if (seatsToInsert.length === 0) {
    throw new Error('No seats generated - check seatCount');
  }

  // Bulk insert
  const placeholders = seatsToInsert.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ');
  const flat = seatsToInsert.flat();
  const sql = `INSERT INTO seat (flight_id, tier_id, seat_number, row_no, is_window, is_aisle, created_at) VALUES ${placeholders}`;
  const [result] = await pool.query(sql, flat);

  return { inserted: result.affectedRows, createdSeatIds: result.insertId };
}

/* Basic flight CRUD operations */

async function getAllFlights(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM flight ORDER BY flight_no ASC');
    return res.json(rows);
  } catch (err) {
    console.error('getAllFlights', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function getFlightById(req, res) {
  try {
    const id = req.params.id;
    const [rows] = await pool.query('SELECT * FROM flight WHERE flight_id = ? LIMIT 1', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Flight not found' });
    return res.json(rows[0]);
  } catch (err) {
    console.error('getFlightById', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function updateFlight(req, res) {
  try {
    const id = req.params.id;
    const { flight_no, flight_name, aircraft_type, total_seats } = req.body;
    await pool.query('UPDATE flight SET flight_no = ?, flight_name = ?, aircraft_type = ?, total_seats = ?, updated_at = NOW() WHERE flight_id = ?', [flight_no, flight_name || null, aircraft_type || null, total_seats || 0, id]);
    return res.json({ message: 'Flight updated' });
  } catch (err) {
    console.error('updateFlight', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function deleteFlight(req, res) {
  try {
    const id = req.params.id;
    await pool.query('DELETE FROM flight WHERE flight_id = ?', [id]);
    return res.json({ message: 'Flight deleted' });
  } catch (err) {
    console.error('deleteFlight', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  createFlight,
  generateSeatTemplates,
  getAllFlights,
  getFlightById,
  updateFlight,
  deleteFlight
};
