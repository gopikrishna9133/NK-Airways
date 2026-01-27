const pool = require('../config/db');

async function listTiers(req, res) {
  try {
    const [rows] = await pool.query('SELECT tier_id, seat_class, seat_type, created_at FROM seattier ORDER BY tier_id ASC');
    return res.json(rows);
  } catch (err) {
    console.error('adminSeatTier.listTiers', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function getTier(req, res) {
  try {
    const id = req.params.id;
    const [rows] = await pool.query('SELECT tier_id, seat_class, seat_type, created_at FROM seattier WHERE tier_id = ? LIMIT 1', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Tier not found' });
    return res.json(rows[0]);
  } catch (err) {
    console.error('adminSeatTier.getTier', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function createTier(req, res) {
  try {
    const { seat_class, seat_type } = req.body;
    if (!seat_class || typeof seat_class !== 'string' || seat_class.trim() === '') {
      return res.status(400).json({ message: 'seat_class is required' });
    }
    const [result] = await pool.query('INSERT INTO seattier (seat_class, seat_type, created_at) VALUES (?, ?, NOW())', [seat_class.trim(), seat_type ?? null]);
    return res.status(201).json({ message: 'Tier created', tier_id: result.insertId });
  } catch (err) {
    console.error('adminSeatTier.createTier', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function updateTier(req, res) {
  try {
    const id = req.params.id;
    const { seat_class, seat_type } = req.body;
    if (!seat_class || typeof seat_class !== 'string' || seat_class.trim() === '') {
      return res.status(400).json({ message: 'seat_class is required' });
    }
    await pool.query('UPDATE seattier SET seat_class = ?, seat_type = ?, updated_at = NOW() WHERE tier_id = ?', [seat_class.trim(), seat_type ?? null, id]);
    return res.json({ message: 'Tier updated' });
  } catch (err) {
    console.error('adminSeatTier.updateTier', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function deleteTier(req, res) {
  try {
    const id = req.params.id;
    const [seatRows] = await pool.query('SELECT COUNT(*) AS c FROM seat WHERE tier_id = ?', [id]);
    if (seatRows && seatRows[0] && seatRows[0].c > 0) {
      return res.status(400).json({ message: 'Cannot delete tier: seats exist using this tier' });
    }
    await pool.query('DELETE FROM seattier WHERE tier_id = ?', [id]);
    return res.json({ message: 'Tier deleted' });
  } catch (err) {
    console.error('adminSeatTier.deleteTier', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  listTiers,
  getTier,
  createTier,
  updateTier,
  deleteTier
};
