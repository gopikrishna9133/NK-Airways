const pool = require('../config/db');

// Create price
async function createPrice(req, res) {
  try {
    const { tier_id, price } = req.body;
    if (!tier_id) return res.status(400).json({ message: 'tier_id is required' });
    if (price === undefined || price === null || isNaN(Number(price))) return res.status(400).json({ message: 'price must be a number' });

    // validate tier exists
    const [tier] = await pool.query('SELECT tier_id FROM seattier WHERE tier_id = ? LIMIT 1', [tier_id]);
    if (!tier.length) return res.status(400).json({ message: 'Invalid tier_id' });

    const adminId = await resolveAdminId(req);

    const [result] = await pool.query('INSERT INTO price (admin_id, tier_id, price, created_at) VALUES (?, ?, ?, NOW())', [adminId, tier_id, Number(price)]);
    return res.status(201).json({ message: 'Price created', price_id: result.insertId });
  } catch (err) {
    console.error('createPrice', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function getAllPrices(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT p.price_id, p.tier_id, p.price, p.created_at, t.seat_class, t.seat_type
      FROM price p
      LEFT JOIN seattier t ON t.tier_id = p.tier_id
      ORDER BY p.price_id DESC
    `);
    return res.json(rows);
  } catch (err) {
    console.error('getAllPrices', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function getPriceById(req, res) {
  try {
    const id = req.params.id;
    const [rows] = await pool.query('SELECT price_id, tier_id, price, created_at FROM price WHERE price_id = ? LIMIT 1', [id]);
    if (!rows.length) return res.status(404).json({ message: 'Price not found' });
    return res.json(rows[0]);
  } catch (err) {
    console.error('getPriceById', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function updatePrice(req, res) {
  try {
    const id = req.params.id;
    const { tier_id, price } = req.body;
    if (!tier_id) return res.status(400).json({ message: 'tier_id is required' });
    if (price === undefined || price === null || isNaN(Number(price))) return res.status(400).json({ message: 'price must be a number' });

    // validate tier exists
    const [tier] = await pool.query('SELECT tier_id FROM seattier WHERE tier_id = ? LIMIT 1', [tier_id]);
    if (!tier.length) return res.status(400).json({ message: 'Invalid tier_id' });

    await pool.query('UPDATE price SET tier_id = ?, price = ?, updated_at = NOW() WHERE price_id = ?', [tier_id, Number(price), id]);
    return res.json({ message: 'Price updated' });
  } catch (err) {
    console.error('updatePrice', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function deletePrice(req, res) {
  try {
    const id = req.params.id;
    await pool.query('DELETE FROM price WHERE price_id = ?', [id]);
    return res.json({ message: 'Price deleted' });
  } catch (err) {
    console.error('deletePrice', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

async function resolveAdminId(req) {
  try {
    const userId = req.user?.user_id;
    if (!userId) return null;
    const [r] = await pool.query('SELECT admin_id FROM admin WHERE user_id = ? LIMIT 1', [userId]);
    return r && r[0] ? r[0].admin_id : null;
  } catch (err) {
    return null;
  }
}

module.exports = { createPrice, getAllPrices, getPriceById, updatePrice, deletePrice };
