CREATE DATABASE IF NOT EXISTS nk_airways CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE nk_airways;

--  create user if you want and you have privilege
CREATE USER IF NOT EXISTS 'nkuser'@'localhost' IDENTIFIED WITH mysql_native_password BY 'Nk1234';
GRANT ALL PRIVILEGES ON nk_airways.* TO 'nkuser'@'localhost';
FLUSH PRIVILEGES;

-- user
CREATE TABLE user (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  role VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


-- admin
CREATE TABLE admin (
  admin_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- passenger
CREATE TABLE passenger (
  passenger_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- flight
CREATE TABLE flight (
  flight_id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT,
  flight_no VARCHAR(50),
  flight_name VARCHAR(100),
  total_seats INT,
  aircraft_type VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- route
CREATE TABLE route (
  route_id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT,
  origin_location VARCHAR(100),
  destination_location VARCHAR(100),
  distance DECIMAL(10,2),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- schedule
CREATE TABLE schedule (
  schedule_id INT AUTO_INCREMENT PRIMARY KEY,
  flight_id INT NOT NULL,
  route_id INT NOT NULL,
  admin_id INT,
  departure_datetime DATETIME,
  arrival_datetime DATETIME,
  available_seats INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- seattier
CREATE TABLE seattier (
  tier_id INT AUTO_INCREMENT PRIMARY KEY,
  seat_class VARCHAR(50),
  seat_type VARCHAR(50),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- seat
CREATE TABLE seat (
  seat_id INT AUTO_INCREMENT PRIMARY KEY,
  flight_id INT,
  tier_id INT,
  seat_number VARCHAR(10),
  is_window TINYINT(1),
  is_aisle TINYINT(1),
  row_no INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- price
CREATE TABLE price (
  price_id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id INT,
  tier_id INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


-- schedule_seat
CREATE TABLE schedule_seat (
  schedule_seat_id INT AUTO_INCREMENT PRIMARY KEY,
  schedule_id INT,
  seat_id INT,
  tier_id INT,
  seat_status VARCHAR(50) DEFAULT 'Available',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- booking
CREATE TABLE booking (
  booking_id INT AUTO_INCREMENT PRIMARY KEY,
  passenger_id INT,
  schedule_id INT,
  schedule_seat_id INT,
  booking_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  total_amount DECIMAL(10,2),
  PNR VARCHAR(20),
  booking_status VARCHAR(50),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);




CREATE INDEX idx_admin_userid ON admin(user_id);
CREATE INDEX idx_passenger_userid ON passenger(user_id);
CREATE INDEX idx_flight_admin ON flight(admin_id);
CREATE INDEX idx_route_admin ON route(admin_id);
CREATE INDEX idx_schedule_flight ON schedule(flight_id);
CREATE INDEX idx_schedule_route ON schedule(route_id);
CREATE INDEX idx_schedule_admin ON schedule(admin_id);
CREATE INDEX idx_schedule_seat_schedule ON schedule_seat(schedule_id);
CREATE INDEX idx_schedule_seat_seat ON schedule_seat(seat_id);
CREATE INDEX idx_schedule_seat_tier ON schedule_seat(tier_id);
CREATE INDEX idx_seat_flight ON seat(flight_id);
CREATE INDEX idx_seat_tier ON seat(tier_id);
CREATE INDEX idx_price_tier ON price(tier_id);
CREATE INDEX idx_price_admin ON price(admin_id);
CREATE INDEX idx_booking_passenger ON booking(passenger_id);
CREATE INDEX idx_booking_schedule ON booking(schedule_id);
CREATE INDEX idx_booking_schedule_seat ON booking(schedule_seat_id);



SET FOREIGN_KEY_CHECKS = 0;

ALTER TABLE admin
  ADD CONSTRAINT fk_admin_user FOREIGN KEY (user_id) REFERENCES `user`(user_id) ON DELETE CASCADE;

ALTER TABLE passenger
  ADD CONSTRAINT fk_passenger_user FOREIGN KEY (user_id) REFERENCES `user`(user_id) ON DELETE CASCADE;

ALTER TABLE route
  ADD CONSTRAINT fk_route_admin FOREIGN KEY (admin_id) REFERENCES admin(admin_id) ON DELETE SET NULL;

ALTER TABLE flight
  ADD CONSTRAINT fk_flight_admin FOREIGN KEY (admin_id) REFERENCES admin(admin_id) ON DELETE SET NULL;

ALTER TABLE schedule
  ADD CONSTRAINT fk_schedule_flight FOREIGN KEY (flight_id) REFERENCES flight(flight_id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_schedule_route FOREIGN KEY (route_id) REFERENCES route(route_id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_schedule_admin FOREIGN KEY (admin_id) REFERENCES admin(admin_id) ON DELETE SET NULL;

ALTER TABLE seat
  ADD CONSTRAINT fk_seat_flight FOREIGN KEY (flight_id) REFERENCES flight(flight_id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_seat_tier FOREIGN KEY (tier_id) REFERENCES seattier(tier_id) ON DELETE RESTRICT;

ALTER TABLE price
  ADD CONSTRAINT fk_price_admin FOREIGN KEY (admin_id) REFERENCES admin(admin_id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_price_tier FOREIGN KEY (tier_id) REFERENCES seattier(tier_id) ON DELETE CASCADE;

ALTER TABLE schedule_seat
  ADD CONSTRAINT fk_schedseat_schedule FOREIGN KEY (schedule_id) REFERENCES schedule(schedule_id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_schedseat_seat FOREIGN KEY (seat_id) REFERENCES seat(seat_id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_schedseat_tier FOREIGN KEY (tier_id) REFERENCES seattier(tier_id) ON DELETE CASCADE;

ALTER TABLE booking
  ADD CONSTRAINT fk_booking_passenger FOREIGN KEY (passenger_id) REFERENCES passenger(passenger_id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_booking_schedule FOREIGN KEY (schedule_id) REFERENCES schedule(schedule_id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_booking_schedseat FOREIGN KEY (schedule_seat_id) REFERENCES schedule_seat(schedule_seat_id) ON DELETE RESTRICT;



SET FOREIGN_KEY_CHECKS = 1;

--  TRIGGERS 
DROP TRIGGER IF EXISTS trg_schedule_before_insert;
DROP TRIGGER IF EXISTS trg_schedule_seat_after_update;
DROP TRIGGER IF EXISTS trg_booking_before_insert;

DELIMITER $$

CREATE TRIGGER trg_schedule_before_insert
BEFORE INSERT ON schedule
FOR EACH ROW
BEGIN
  DECLARE v_total INT DEFAULT 0;
  SELECT total_seats INTO v_total FROM flight WHERE flight_id = NEW.flight_id LIMIT 1;
  IF v_total IS NULL THEN
    SET v_total = 0;
  END IF;
  SET NEW.available_seats = v_total;
END$$

CREATE TRIGGER trg_schedule_seat_after_update
AFTER UPDATE ON schedule_seat
FOR EACH ROW
BEGIN

  IF OLD.seat_status <> 'Booked' AND NEW.seat_status = 'Booked' THEN
    UPDATE schedule SET available_seats = GREATEST(available_seats - 1, 0) WHERE schedule_id = NEW.schedule_id;

  ELSEIF OLD.seat_status = 'Booked' AND NEW.seat_status <> 'Booked' THEN
    UPDATE schedule SET available_seats = available_seats + 1 WHERE schedule_id = NEW.schedule_id;
  END IF;
END$$

CREATE TRIGGER trg_booking_before_insert
BEFORE INSERT ON booking
FOR EACH ROW
BEGIN
  DECLARE v_seat_status VARCHAR(50);

  IF NEW.PNR IS NULL OR NEW.PNR = '' THEN
    SET NEW.PNR = CONCAT('NK', DATE_FORMAT(NOW(), '%y%m%d'), LPAD(FLOOR(RAND()*9999),4,'0'));
  END IF;

  SELECT seat_status INTO v_seat_status FROM schedule_seat WHERE schedule_seat_id = NEW.schedule_seat_id LIMIT 1;

  IF v_seat_status = 'Available' THEN

    UPDATE schedule_seat SET seat_status = 'Booked', updated_at = NOW() WHERE schedule_seat_id = NEW.schedule_seat_id;
    SET NEW.booking_status = 'Confirmed';
  ELSE
    SET NEW.booking_status = 'Cancelled';
  END IF;
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS admin_release_seat;
DELIMITER $$
CREATE PROCEDURE admin_release_seat(IN p_schedule_seat_id INT)
BEGIN
  DECLARE v_sched INT;
  SELECT schedule_id INTO v_sched FROM schedule_seat WHERE schedule_seat_id = p_schedule_seat_id;
  UPDATE schedule_seat SET seat_status = 'Available', updated_at = NOW() WHERE schedule_seat_id = p_schedule_seat_id;
  UPDATE schedule SET available_seats = available_seats + 1 WHERE schedule_id = v_sched;
END$$
DELIMITER ;
