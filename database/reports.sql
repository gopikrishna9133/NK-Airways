-- REeport 1
SELECT
  s.schedule_id,
  s.flight_id,
  s.route_id,
  COUNT(b.booking_id) AS bookings_count,
  COALESCE(SUM(b.total_amount),0) AS total_revenue
FROM schedule s
LEFT JOIN booking b ON b.schedule_id = s.schedule_id
GROUP BY s.schedule_id, s.flight_id, s.route_id
ORDER BY total_revenue DESC;

-- Report 2
SELECT
  r.route_id,
  CONCAT(r.origin_location, ' -> ', r.destination_location) AS route,
  COUNT(b.booking_id) AS bookings_count,
  COALESCE(SUM(b.total_amount),0) AS total_revenue
FROM route r
LEFT JOIN schedule s ON s.route_id = r.route_id
LEFT JOIN booking b ON b.schedule_id = s.schedule_id
GROUP BY r.route_id, route
ORDER BY total_revenue DESC;


-- Report 3
SELECT
  s.schedule_id,
  s.flight_id,
  f.total_seats,
  COUNT(b.booking_id) AS booked_seats,
  ROUND( (COUNT(b.booking_id) / NULLIF(f.total_seats,0)) * 100, 2) AS occupancy_percent
FROM schedule s
JOIN flight f ON f.flight_id = s.flight_id
LEFT JOIN booking b ON b.schedule_id = s.schedule_id
GROUP BY s.schedule_id, s.flight_id, f.total_seats
ORDER BY s.schedule_id;


-- Report 4
SELECT
  p.passenger_id,
  u.name AS passenger_name,
  u.email,
  COUNT(b.booking_id) AS bookings_count
FROM passenger p
JOIN `user` u ON u.user_id = p.user_id
LEFT JOIN booking b ON b.passenger_id = p.passenger_id
GROUP BY p.passenger_id, u.name, u.email
ORDER BY bookings_count DESC, p.passenger_id
LIMIT 20;

-- Report 5
SELECT 
    f.flight_id,
    f.flight_no,
    r.origin_location,
    r.destination_location,
    r.distance
FROM flight f
JOIN schedule s ON s.flight_id = f.flight_id
JOIN route r ON r.route_id = s.route_id
GROUP BY f.flight_id, f.flight_no, r.origin_location, r.destination_location, r.distance;

-- Report 6
SELECT
    r.route_id,
    CONCAT(r.origin_location, ' -> ', r.destination_location) AS route_name,
    COUNT(s.schedule_id) AS schedules_count
FROM route r
LEFT JOIN schedule s ON s.route_id = r.route_id
GROUP BY r.route_id, route_name
ORDER BY schedules_count DESC;

-- Report 7
SELECT
    s.schedule_id,
    f.flight_no,
    f.total_seats,
    s.available_seats,
    (f.total_seats - s.available_seats) AS booked_count
FROM schedule s
JOIN flight f ON f.flight_id = s.flight_id
ORDER BY s.schedule_id;


-- Report 8
SELECT
    CASE 
        WHEN s.is_window = 1 THEN 'Window'
        WHEN s.is_aisle = 1 THEN 'Aisle'
        ELSE 'Middle'
    END AS seat_type,
    COUNT(b.booking_id) AS total_booked
FROM seat s
JOIN schedule_seat ss ON ss.seat_id = s.seat_id
JOIN booking b ON b.schedule_seat_id = ss.schedule_seat_id
GROUP BY seat_type
ORDER BY total_booked DESC;
