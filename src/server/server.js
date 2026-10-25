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

// Получить все услуги
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
    res.status(500).json({ error: 'Ошибка загрузки каталога услуг с сервера' });
  }
});

// Получить все категории
app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Categories ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка загрузки категорий' });
  }
});

// Добавить новую категорию
app.post('/api/categories', async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Название категории не может быть пустым' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO Categories (name) VALUES ($1) RETURNING *',
      [name.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: 'Такая категория уже существует или некорректна' });
  }
});

// Авторизация по email и паролю
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
      [email.trim(), password]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера при авторизации' });
  }
});

// Получить список пользователей
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
    res.status(500).json({ error: 'Ошибка получения списка пользователей' });
  }
});

// Назначить пользователю купон и персональную скидку
app.put('/api/users/:id/discount', async (req, res) => {
  const { id } = req.params;
  const { coupon_code, personal_discount } = req.body;
  try {
    const result = await pool.query(
      `UPDATE Users 
       SET coupon_code = $1, personal_discount = $2 
       WHERE id = $3 
       RETURNING id, email, full_name, coupon_code, personal_discount`,
      [coupon_code, Number(personal_discount) || 0, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Не удалось обновить скидку пользователя' });
  }
});

// Изменить общую скидку на услугу
app.put('/api/services/:id/discount', async (req, res) => {
  const { id } = req.params;
  const { discount_percent } = req.body;
  try {
    const result = await pool.query(
      'UPDATE Services SET discount_percent = $1 WHERE id = $2 RETURNING *',
      [Number(discount_percent) || 0, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Не удалось обновить скидку на услугу' });
  }
});

// Оформление заказа
app.post('/api/checkout', async (req, res) => {
  const { user_id, items, total_amount } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let lastAppointmentId = null;

    for (const item of items) {
      const appRes = await client.query(
        `INSERT INTO Appointments (user_id, service_id, quantity, status)
         VALUES ($1, $2, $3, 'Оформлено') RETURNING id`,
        [user_id || null, item.id, item.count]
      );
      lastAppointmentId = appRes.rows[0].id;
    }

    const payRes = await client.query(
      `INSERT INTO Payments (user_id, appointment_id, amount, status)
       VALUES ($1, $2, $3, 'Оплачено') RETURNING *`,
      [user_id || null, lastAppointmentId, total_amount]
    );

    await client.query('COMMIT');
    res.status(201).json({ message: 'Запись и оплата успешно сохранены!', payment: payRes.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Ошибка при оформлении записи и платежа' });
  } finally {
    client.release();
  }
});

app.listen(5000, () => console.log('API Server running on http://localhost:5000'));