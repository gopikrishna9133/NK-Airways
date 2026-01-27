const pool = require('../config/db');

async function listBookings(req, res) {
  try {
    const [rows] = await pool.query(
      "SELECT b.booking_id, b.PNR, b.booking_status, b.total_amount, b.booking_date, " +
      "s.schedule_id, s.flight_id, f.flight_no, " +
      "r.origin_location, r.destination_location, " +
      "st.seat_number, u.name as passenger_name, u.email as passenger_email " +
      "FROM booking b " +
      "LEFT JOIN schedule s ON s.schedule_id = b.schedule_id " +
      "LEFT JOIN flight f ON f.flight_id = s.flight_id " +
      "LEFT JOIN route r ON r.route_id = s.route_id " +
      "LEFT JOIN schedule_seat ss ON ss.schedule_seat_id = b.schedule_seat_id " +
      "LEFT JOIN seat st ON st.seat_id = ss.seat_id " +
      "LEFT JOIN passenger p ON p.passenger_id = b.passenger_id " +
      "LEFT JOIN `user` u ON u.user_id = p.user_id " +
      "ORDER BY b.booking_date DESC " +
      "LIMIT 1000"
    );
    return res.json(rows);
  } catch (err) {
    console.error('adminReports.listBookings', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function revenueBySchedule(req, res) {
  try {
    const [rows] = await pool.query(
      "SELECT s.schedule_id, f.flight_no, r.origin_location, r.destination_location, " +
      "DATE(s.departure_datetime) as date, " +
      "COUNT(b.booking_id) AS bookings, " +
      "IFNULL(SUM(b.total_amount),0) AS revenue " +
      "FROM schedule s " +
      "LEFT JOIN flight f ON f.flight_id = s.flight_id " +
      "LEFT JOIN route r ON r.route_id = s.route_id " +
      "LEFT JOIN booking b ON b.schedule_id = s.schedule_id AND b.booking_status = 'Confirmed' " +
      "GROUP BY s.schedule_id, f.flight_no, r.origin_location, r.destination_location, DATE(s.departure_datetime) " +
      "ORDER BY DATE(s.departure_datetime) DESC " +
      "LIMIT 1000"
    );
    return res.json(rows);
  } catch (err) {
    console.error('adminReports.revenueBySchedule', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function manifestBySchedule(req, res) {
  try {
    const scheduleId = req.params.scheduleId;
    const [srows] = await pool.query(
      "SELECT s.schedule_id, f.flight_no, r.origin_location, r.destination_location, s.departure_datetime " +
      "FROM schedule s " +
      "LEFT JOIN flight f ON f.flight_id = s.flight_id " +
      "LEFT JOIN route r ON r.route_id = s.route_id " +
      "WHERE s.schedule_id = ? LIMIT 1",
      [scheduleId]
    );
    if (!srows.length) return res.status(404).json({ message: 'Schedule not found' });

    const [rows] = await pool.query(
      "SELECT b.booking_id, b.PNR, b.booking_status, b.total_amount, b.booking_date, " +
      "st.seat_number, u.name as passenger_name, u.email as passenger_email, p.phone as passenger_phone, p.dob as passenger_dob " +
      "FROM booking b " +
      "LEFT JOIN schedule_seat ss ON ss.schedule_seat_id = b.schedule_seat_id " +
      "LEFT JOIN seat st ON st.seat_id = ss.seat_id " +
      "LEFT JOIN passenger p ON p.passenger_id = b.passenger_id " +
      "LEFT JOIN `user` u ON u.user_id = p.user_id " +
      "WHERE b.schedule_id = ? " +
      "ORDER BY st.row_no ASC, st.seat_number ASC",
      [scheduleId]
    );

    const accept = (req.headers.accept || '').toString();
    if (accept.includes('application/json')) {
      return res.json({ schedule: srows[0], passengers: rows });
    }

    const header = ['Booking ID','PNR','Status','Seat','Name','Email','Phone','DOB','Amount','Booking Date'];
    const csvRows = rows.map(r => ([
      r.booking_id ?? '',
      r.PNR ?? '',
      r.booking_status ?? '',
      r.seat_number ?? '',
      r.passenger_name ?? '',
      r.passenger_email ?? '',
      r.passenger_phone ?? '',
      r.passenger_dob ? new Date(r.passenger_dob).toISOString().slice(0,10) : '',
      r.total_amount != null ? Number(r.total_amount).toFixed(2) : '',
      r.booking_date ? new Date(r.booking_date).toISOString() : ''
    ]));

    function quote(v) {
      if (v == null) return '';
      const s = String(v);
      if (s.includes('"') || s.includes(',') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    }

    const csvLines = [];
    csvLines.push(header.map(quote).join(','));
    for (const row of csvRows) {
      csvLines.push(row.map(quote).join(','));
    }
    const csvContent = csvLines.join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="manifest_schedule_${scheduleId}.csv"`);
    return res.send(csvContent);
  } catch (err) {
    console.error('adminReports.manifestBySchedule', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { listBookings, revenueBySchedule, manifestBySchedule };
