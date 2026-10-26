const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'ReactShop',
  password: '441234',
  port: 5432,
});

app.get('/api/services', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, c.name AS category_name 
      FROM Services s
      LEFT JOIN Categories c ON s.category_id = c.id
      ORDER BY s.id ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка загрузки каталога с сервера' });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Categories ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка загрузки категорий' });
  }
});

app.post('/api/categories', async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Введите название категории' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO Categories (name) VALUES ($1) RETURNING *',
      [name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: 'Такая категория уже существует' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Заполните email и пароль' });
  }
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.coupon_code, u.personal_discount, r.name AS role
       FROM Users u
       LEFT JOIN Roles r ON u.role_id = r.id
       WHERE u.email = $1 AND u.password = $2`,
      [email, password]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера при авторизации' });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.email, u.full_name, u.coupon_code, u.personal_discount, r.name AS role
      FROM Users u
      LEFT JOIN Roles r ON u.role_id = r.id
      ORDER BY u.id ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения пользователей' });
  }
});

app.put('/api/users/:id/discount', async (req, res) => {
  const { id } = req.params;
  const { coupon_code, personal_discount } = req.body;
  try {
    const result = await pool.query(
      `UPDATE Users 
       SET coupon_code = $1, personal_discount = $2 
       WHERE id = $3 
       RETURNING id, email, full_name, coupon_code, personal_discount`,
      [coupon_code, Number(personal_discount), id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Не удалось обновить скидку пользователя' });
  }
});

app.put('/api/services/:id/discount', async (req, res) => {
  const { id } = req.params;
  const { discount_percent } = req.body;
  try {
    const result = await pool.query(
      'UPDATE Services SET discount_percent = $1 WHERE id = $2 RETURNING *',
      [Number(discount_percent), id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Не удалось обновить скидку на товар' });
  }
});

app.post('/api/checkout', async (req, res) => {
  const { user_id, items, total_amount } = req.body;
  try {
    let lastAppointmentId = null;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const appRes = await pool.query(
        'INSERT INTO Appointments (user_id, service_id, quantity, status) VALUES ($1, $2, $3, $4) RETURNING id',
        [user_id || null, item.id, item.count, 'Оформлено']
      );
      lastAppointmentId = appRes.rows[0].id;
    }

    const payRes = await pool.query(
      'INSERT INTO Payments (user_id, appointment_id, amount, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [user_id || null, lastAppointmentId, total_amount, 'Оплачено']
    );

    res.status(201).json({ message: 'Заказ и оплата успешно оформлены!', payment: payRes.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при оформлении заказа' });
  }
});

app.listen(5000, () => console.log('Server started on port 5000'));