require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: String(process.env.DB_PASSWORD),
  port: Number(process.env.DB_PORT),
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
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Введите название категории' });
  }

  const trimmedName = name.trim();

  try {
    const check = await pool.query(
      'SELECT id FROM Categories WHERE LOWER(TRIM(name)) = LOWER($1)',
      [trimmedName]
    );

    if (check.rows.length > 0) {
      return res.status(400).json({ error: 'Такая категория уже существует' });
    }

    const result = await pool.query(
      'INSERT INTO Categories (name) VALUES ($1) RETURNING *',
      [trimmedName]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: 'Такая категория уже существует' });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Введите название категории' });
  }

  const trimmedName = name.trim();

  try {
    const check = await pool.query(
      'SELECT id FROM Categories WHERE LOWER(TRIM(name)) = LOWER($1) AND id != $2',
      [trimmedName, id]
    );

    if (check.rows.length > 0) {
      return res.status(400).json({ error: 'Категория с таким названием уже существует' });
    }

    const result = await pool.query(
      'UPDATE Categories SET name = $1 WHERE id = $2 RETURNING *',
      [trimmedName, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Категория не найдена' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка обновления категории' });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM Categories WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка удаления категории' });
  }
});

app.post('/api/register', async (req, res) => {
  const { email, password, full_name } = req.body;
  if (!email || !password || !full_name) {
    return res.status(400).json({ error: 'Заполните все поля' });
  }
  try {
    const existing = await pool.query('SELECT id FROM Users WHERE email = $1', [email.trim()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }

    const roleRes = await pool.query("SELECT id FROM Roles WHERE name = 'client'");
    const roleId = roleRes.rows.length > 0 ? roleRes.rows[0].id : 2;

    const result = await pool.query(
      `INSERT INTO Users (email, password, full_name, role_id, coupon_code, personal_discount)
       VALUES ($1, $2, $3, $4, 'WELCOME10', 10)
       RETURNING id, email, full_name, coupon_code, personal_discount, 'client' AS role`,
      [email.trim(), password, full_name.trim(), roleId]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера при регистрации' });
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

app.get('/api/cart/:userId', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        a.id AS appointment_id,
        a.quantity AS count,
        s.id,
        s.title,
        s.description,
        s.duration,
        s.price,
        s.discount_percent,
        s.image,
        c.name AS category_name
      FROM Appointments a
      JOIN Services s ON a.service_id = s.id
      LEFT JOIN Categories c ON s.category_id = c.id
      WHERE a.user_id = $1 AND a.status = 'В корзине'
      ORDER BY a.id ASC
    `, [req.params.userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения корзины из БД' });
  }
});

app.post('/api/cart', async (req, res) => {
  const { user_id, service_id, count } = req.body;
  if (!user_id || !service_id) {
    return res.status(400).json({ error: 'Не указан пользователь или товар' });
  }
  try {
    const addCount = count || 1;
    const existing = await pool.query(
      "SELECT id, quantity FROM Appointments WHERE user_id = $1 AND service_id = $2 AND status = 'В корзине'",
      [user_id, service_id]
    );

    if (existing.rows.length > 0) {
      const newQuantity = existing.rows[0].quantity + addCount;
      await pool.query(
        "UPDATE Appointments SET quantity = $1 WHERE id = $2",
        [newQuantity, existing.rows[0].id]
      );
    } else {
      await pool.query(
        "INSERT INTO Appointments (user_id, service_id, quantity, status) VALUES ($1, $2, $3, 'В корзине')",
        [user_id, service_id, addCount]
      );
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка добавления в корзину БД' });
  }
});

app.put('/api/cart', async (req, res) => {
  const { user_id, service_id, count } = req.body;
  try {
    if (count <= 0) {
      await pool.query(
        "DELETE FROM Appointments WHERE user_id = $1 AND service_id = $2 AND status = 'В корзине'",
        [user_id, service_id]
      );
    } else {
      await pool.query(
        "UPDATE Appointments SET quantity = $1 WHERE user_id = $2 AND service_id = $3 AND status = 'В корзине'",
        [count, user_id, service_id]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка изменения количества' });
  }
});

app.delete('/api/cart/:userId/:serviceId', async (req, res) => {
  const { userId, serviceId } = req.params;
  try {
    await pool.query(
      "DELETE FROM Appointments WHERE user_id = $1 AND service_id = $2 AND status = 'В корзине'",
      [userId, serviceId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка удаления из корзины' });
  }
});

app.delete('/api/cart/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    await pool.query(
      "DELETE FROM Appointments WHERE user_id = $1 AND status = 'В корзине'",
      [userId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка очистки корзины' });
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
  const discount = Number(personal_discount);

  if (isNaN(discount) || discount < 10 || discount > 90) {
    return res.status(400).json({ error: 'Скидка должна быть от 10% до 90%' });
  }

  try {
    const result = await pool.query(
      `UPDATE Users 
       SET coupon_code = $1, personal_discount = $2 
       WHERE id = $3 
       RETURNING id, email, full_name, coupon_code, personal_discount`,
      [coupon_code, discount, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Не удалось обновить скидку пользователя' });
  }
});

app.put('/api/services/:id/discount', async (req, res) => {
  const { id } = req.params;
  const { discount_percent } = req.body;
  const discount = Number(discount_percent);

  if (isNaN(discount) || discount < 10 || discount > 90) {
    return res.status(400).json({ error: 'Скидка должна быть от 10% до 90%' });
  }

  try {
    const result = await pool.query(
      'UPDATE Services SET discount_percent = $1 WHERE id = $2 RETURNING *',
      [discount, id]
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

    if (user_id) {
      const cartRows = await pool.query(
        "SELECT id FROM Appointments WHERE user_id = $1 AND status = 'В корзине'",
        [user_id]
      );
      if (cartRows.rows.length > 0) {
        await pool.query(
          "UPDATE Appointments SET status = 'Оформлено' WHERE user_id = $1 AND status = 'В корзине'",
          [user_id]
        );
        lastAppointmentId = cartRows.rows[0].id;
      }
    }

    if (!lastAppointmentId && items && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        const appRes = await pool.query(
          "INSERT INTO Appointments (user_id, service_id, quantity, status) VALUES ($1, $2, $3, 'Оформлено') RETURNING id",
          [user_id || null, items[i].id, items[i].count]
        );
        lastAppointmentId = appRes.rows[0].id;
      }
    }

    const payRes = await pool.query(
      "INSERT INTO Payments (user_id, appointment_id, amount, status) VALUES ($1, $2, $3, 'Оплачено') RETURNING *",
      [user_id || null, lastAppointmentId, total_amount]
    );

    res.status(201).json({ message: 'Заказ успешно оформлен и оплачен!', payment: payRes.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при оформлении заказа' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));