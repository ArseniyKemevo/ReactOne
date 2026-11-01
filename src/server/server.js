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

async function initDatabase() {
  try {
    await pool.query(`
      ALTER TABLE Users ADD COLUMN IF NOT EXISTS phone VARCHAR(30) DEFAULT '+79991112233';
      ALTER TABLE Users ADD COLUMN IF NOT EXISTS default_address TEXT DEFAULT 'г. Москва, ул. Лесная, д. 10';
      ALTER TABLE Appointments ADD COLUMN IF NOT EXISTS delivery_address TEXT DEFAULT '';
      ALTER TABLE Appointments ADD COLUMN IF NOT EXISTS delivery_date DATE DEFAULT CURRENT_DATE;

      CREATE TABLE IF NOT EXISTS Reviews (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES Users(id) ON DELETE CASCADE,
        service_id INTEGER REFERENCES Services(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('База данных успешно проверена и готова к работе');
  } catch (err) {
    console.error('Ошибка проверки БД:', err.message);
  }
}
initDatabase();

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
    res.status(500).json({ error: 'Ошибка загрузки каталога' });
  }
});

app.post('/api/services', async (req, res) => {
  const { title, description, duration, price, discount_percent, category_name, image } = req.body;
  if (!title || !description || !duration || !price || !category_name) {
    return res.status(400).json({ error: 'Заполните все обязательные поля' });
  }
  try {
    const catRes = await pool.query('SELECT id FROM Categories WHERE name = $1', [category_name]);
    const categoryId = catRes.rows.length > 0 ? catRes.rows[0].id : null;
    const imgUrl = image && image.trim() ? image.trim() : 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600';

    const insertRes = await pool.query(
      `INSERT INTO Services (title, description, duration, price, discount_percent, category_id, image)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [title.trim(), description.trim(), Number(duration), Number(price), Number(discount_percent || 0), categoryId, imgUrl]
    );
    const fullService = await pool.query(
      `SELECT s.*, c.name AS category_name FROM Services s LEFT JOIN Categories c ON s.category_id = c.id WHERE s.id = $1`,
      [insertRes.rows[0].id]
    );
    res.status(201).json(fullService.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка добавления товара' });
  }
});

app.put('/api/services/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, duration, price, discount_percent, category_name, image } = req.body;
  try {
    const catRes = await pool.query('SELECT id FROM Categories WHERE name = $1', [category_name]);
    const categoryId = catRes.rows.length > 0 ? catRes.rows[0].id : null;

    await pool.query(
      `UPDATE Services 
       SET title = $1, description = $2, duration = $3, price = $4, discount_percent = $5, category_id = $6, image = $7
       WHERE id = $8`,
      [title.trim(), description.trim(), Number(duration), Number(price), Number(discount_percent || 0), categoryId, image, id]
    );
    const updated = await pool.query(
      `SELECT s.*, c.name AS category_name FROM Services s LEFT JOIN Categories c ON s.category_id = c.id WHERE s.id = $1`,
      [id]
    );
    res.json(updated.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка обновления товара' });
  }
});

app.put('/api/services/:id/discount', async (req, res) => {
  const { id } = req.params;
  const discount = Number(req.body.discount_percent);
  if (isNaN(discount) || discount < 0 || discount > 90) {
    return res.status(400).json({ error: 'Скидка должна быть от 0% до 90%' });
  }
  try {
    const result = await pool.query(
      'UPDATE Services SET discount_percent = $1 WHERE id = $2 RETURNING *',
      [discount, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка изменения скидки' });
  }
});

app.delete('/api/services/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM Services WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка удаления товара' });
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
  if (!name || !name.trim()) return res.status(400).json({ error: 'Введите название категории' });
  const trimmedName = name.trim();
  try {
    const check = await pool.query('SELECT id FROM Categories WHERE LOWER(TRIM(name)) = LOWER($1)', [trimmedName]);
    if (check.rows.length > 0) return res.status(400).json({ error: 'Такая категория уже есть' });
    const result = await pool.query('INSERT INTO Categories (name) VALUES ($1) RETURNING *', [trimmedName]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: 'Ошибка создания категории' });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Введите название' });
  const trimmedName = name.trim();
  try {
    const result = await pool.query('UPDATE Categories SET name = $1 WHERE id = $2 RETURNING *', [trimmedName, id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка обновления категории' });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM Categories WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка удаления категории' });
  }
});

app.post('/api/register', async (req, res) => {
  const { email, password, full_name, phone, default_address } = req.body;
  if (!email || !password || !full_name) {
    return res.status(400).json({ error: 'Заполните обязательные поля' });
  }
  try {
    const existing = await pool.query('SELECT id FROM Users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Этот Email уже занят' });
    }
    const roleRes = await pool.query("SELECT id FROM Roles WHERE name = 'client'");
    const roleId = roleRes.rows.length > 0 ? roleRes.rows[0].id : 2;

    const result = await pool.query(
      `INSERT INTO Users (email, password, full_name, phone, default_address, role_id, coupon_code, personal_discount)
       VALUES ($1, $2, $3, $4, $5, $6, 'WELCOME10', 10)
       RETURNING id, email, full_name, phone, default_address, coupon_code, personal_discount, 'client' AS role`,
      [email.trim(), password, full_name.trim(), (phone || '+79990000000').trim(), (default_address || '').trim(), roleId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера при регистрации' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Введите Email и пароль' });
  }
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.phone, u.default_address, u.coupon_code, u.personal_discount, r.name AS role
       FROM Users u
       LEFT JOIN Roles r ON u.role_id = r.id
       WHERE LOWER(u.email) = LOWER($1) AND u.password = $2`,
      [email.trim(), password]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Неверный Email или пароль' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера при входе' });
  }
});

app.post('/api/reset-password', async (req, res) => {
  const { email, phone, new_password } = req.body;
  if (!email || !new_password) {
    return res.status(400).json({ error: 'Заполните Email и новый пароль' });
  }
  if (new_password.length < 6) {
    return res.status(400).json({ error: 'Пароль должен быть не менее 6 символов' });
  }
  try {
    const userRes = await pool.query('SELECT id, phone FROM Users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь с таким Email не найден' });
    }
    if (phone && userRes.rows[0].phone) {
      const cleanInput = phone.replace(/[\s\-()]/g, '');
      const cleanDb = userRes.rows[0].phone.replace(/[\s\-()]/g, '');
      if (cleanDb && cleanInput !== cleanDb) {
        return res.status(400).json({ error: 'Номер телефона не совпадает' });
      }
    }
    await pool.query('UPDATE Users SET password = $1 WHERE id = $2', [new_password, userRes.rows[0].id]);
    res.json({ message: 'Пароль успешно изменен! Теперь вы можете войти.' });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка восстановления пароля' });
  }
});

app.put('/api/users/:id/profile', async (req, res) => {
  const { id } = req.params;
  const { full_name, email, phone, default_address } = req.body;
  try {
    await pool.query(
      'UPDATE Users SET full_name = $1, email = $2, phone = $3, default_address = $4 WHERE id = $5',
      [full_name.trim(), email.trim(), (phone || '').trim(), (default_address || '').trim(), id]
    );
    const updated = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.phone, u.default_address, u.coupon_code, u.personal_discount, r.name AS role
       FROM Users u LEFT JOIN Roles r ON u.role_id = r.id WHERE u.id = $1`,
      [id]
    );
    res.json(updated.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка обновления профиля' });
  }
});

app.put('/api/users/:id/password', async (req, res) => {
  const { id } = req.params;
  const { old_password, new_password } = req.body;
  try {
    const check = await pool.query('SELECT password FROM Users WHERE id = $1', [id]);
    if (check.rows.length === 0 || check.rows[0].password !== old_password) {
      return res.status(400).json({ error: 'Старый пароль введен неверно' });
    }
    await pool.query('UPDATE Users SET password = $1 WHERE id = $2', [new_password, id]);
    res.json({ message: 'Пароль успешно обновлен' });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка смены пароля' });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.email, u.full_name, u.phone, u.default_address, u.coupon_code, u.personal_discount, r.name AS role
      FROM Users u
      LEFT JOIN Roles r ON u.role_id = r.id
      ORDER BY u.id ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка загрузки пользователей' });
  }
});

app.put('/api/users/:id/discount', async (req, res) => {
  const { id } = req.params;
  const { coupon_code, personal_discount } = req.body;
  const discount = Number(personal_discount);
  try {
    const result = await pool.query(
      `UPDATE Users SET coupon_code = $1, personal_discount = $2 WHERE id = $3
       RETURNING id, email, full_name, phone, default_address, coupon_code, personal_discount`,
      [coupon_code, discount, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка обновления скидки' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM Users WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка удаления пользователя' });
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
    res.status(500).json({ error: 'Ошибка загрузки корзины' });
  }
});

app.post('/api/cart', async (req, res) => {
  const { user_id, service_id, count } = req.body;
  if (!user_id || !service_id) return res.status(400).json({ error: 'Некорректные данные' });
  try {
    const addCount = count || 1;
    const existing = await pool.query(
      "SELECT id, quantity FROM Appointments WHERE user_id = $1 AND service_id = $2 AND status = 'В корзине'",
      [user_id, service_id]
    );
    if (existing.rows.length > 0) {
      const newQuantity = existing.rows[0].quantity + addCount;
      await pool.query('UPDATE Appointments SET quantity = $1 WHERE id = $2', [newQuantity, existing.rows[0].id]);
    } else {
      await pool.query(
        "INSERT INTO Appointments (user_id, service_id, quantity, status) VALUES ($1, $2, $3, 'В корзине')",
        [user_id, service_id, addCount]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка добавления в корзину' });
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
    res.status(500).json({ error: 'Ошибка обновления корзины' });
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
  try {
    await pool.query("DELETE FROM Appointments WHERE user_id = $1 AND status = 'В корзине'", [req.params.userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка очистки корзины' });
  }
});

app.post('/api/checkout', async (req, res) => {
  const { user_id, items, total_amount, delivery_address, delivery_date } = req.body;
  const addr = (delivery_address || 'По умолчанию').trim();
  const dDate = delivery_date || new Date().toISOString().split('T')[0];

  try {
    let lastAppointmentId = null;
    if (user_id) {
      const cartRows = await pool.query(
        "SELECT id FROM Appointments WHERE user_id = $1 AND status = 'В корзине'",
        [user_id]
      );
      if (cartRows.rows.length > 0) {
        await pool.query(
          `UPDATE Appointments 
           SET status = 'Оформлен', delivery_address = $1, delivery_date = $2
           WHERE user_id = $3 AND status = 'В корзине'`,
          [addr, dDate, user_id]
        );
        lastAppointmentId = cartRows.rows[0].id;
      }
    }
    if (!lastAppointmentId && items && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        const appRes = await pool.query(
          `INSERT INTO Appointments (user_id, service_id, quantity, delivery_address, delivery_date, status)
           VALUES ($1, $2, $3, $4, $5, 'Оформлен') RETURNING id`,
          [user_id || null, items[i].id, items[i].count, addr, dDate]
        );
        lastAppointmentId = appRes.rows[0].id;
      }
    }
    const payRes = await pool.query(
      "INSERT INTO Payments (user_id, appointment_id, amount, status) VALUES ($1, $2, $3, 'Оплачено') RETURNING *",
      [user_id || null, lastAppointmentId, total_amount || 0]
    );
    res.status(201).json({ message: 'Заказ оформлен!', payment: payRes.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка оформления заказа' });
  }
});

app.get('/api/orders/user/:userId', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.id, a.quantity, a.delivery_address, a.delivery_date, a.appointment_date, a.status,
             s.title AS service_title, s.price, c.name AS category_name
      FROM Appointments a
      JOIN Services s ON a.service_id = s.id
      LEFT JOIN Categories c ON s.category_id = c.id
      WHERE a.user_id = $1 AND a.status != 'В корзине'
      ORDER BY a.appointment_date DESC
    `, [req.params.userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка загрузки заказов' });
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT a.id, a.quantity, a.delivery_address, a.delivery_date, a.appointment_date, a.status,
             u.full_name AS user_name, s.title AS service_title
      FROM Appointments a
      LEFT JOIN Users u ON a.user_id = u.id
      JOIN Services s ON a.service_id = s.id
      WHERE a.status != 'В корзине'
      ORDER BY a.appointment_date DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка загрузки заказов' });
  }
});

app.put('/api/orders/:id', async (req, res) => {
  const { status, delivery_address } = req.body;
  try {
    await pool.query('UPDATE Appointments SET status = $1, delivery_address = $2 WHERE id = $3', [status, delivery_address || '', req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка обновления заказа' });
  }
});

app.delete('/api/orders/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM Appointments WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка удаления заказа' });
  }
});

app.get('/api/reviews', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.id, r.service_id, r.rating, r.comment, r.created_at,
             u.full_name AS user_name, s.title AS service_title
      FROM Reviews r
      JOIN Users u ON r.user_id = u.id
      JOIN Services s ON r.service_id = s.id
      ORDER BY r.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.json([]);
  }
});

app.post('/api/reviews', async (req, res) => {
  const { user_id, service_id, rating, comment } = req.body;
  if (!user_id || !service_id || !comment) {
    return res.status(400).json({ error: 'Заполните отзыв' });
  }
  try {
    const insertRes = await pool.query(
      'INSERT INTO Reviews (user_id, service_id, rating, comment) VALUES ($1, $2, $3, $4) RETURNING id',
      [user_id, service_id, Number(rating || 5), comment.trim()]
    );
    const fullReview = await pool.query(`
      SELECT r.id, r.service_id, r.rating, r.comment, r.created_at,
             u.full_name AS user_name, s.title AS service_title
      FROM Reviews r
      JOIN Users u ON r.user_id = u.id
      JOIN Services s ON r.service_id = s.id
      WHERE r.id = $1
    `, [insertRes.rows[0].id]);
    res.status(201).json(fullReview.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сохранения отзыва' });
  }
});

app.delete('/api/reviews/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM Reviews WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка удаления отзыва' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));