import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useData, API_URL } from '../context/DataContext';

export default function Dashboard() {
  const { user, setUser, logout } = useData();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [defaultAddress, setDefaultAddress] = useState('');
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [passErr, setPassErr] = useState('');

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setDefaultAddress(user.default_address || '');
      fetchUserOrders();
    }
  }, [user]);

  const fetchUserOrders = async () => {
    if (!user) return;
    setOrdersLoading(true);
    try {
      const res = await fetch(`${API_URL}/orders/user/${user.id}`);
      if (res.ok) {
        setOrders(await res.json());
      }
    } finally {
      setOrdersLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="dashboard-card">
        <h1>Личный кабинет</h1>
        <p>Пожалуйста, войдите в систему для просмотра личного кабинета.</p>
        <Link to="/login" className="btn-link">
          Войти
        </Link>
      </div>
    );
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    setProfileErr('');

    if (!fullName.trim() || fullName.trim().length < 3) {
      setProfileErr('ФИО должно содержать минимум 3 символа');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setProfileErr('Введите корректный адрес электронной почты');
      return;
    }
    const phoneRegex = /^\+?[0-9\s\-()]{10,18}$/;
    if (!phoneRegex.test(phone.trim())) {
      setProfileErr('Введите корректный номер телефона (минимум 10 цифр)');
      return;
    }
    if (defaultAddress.trim() && defaultAddress.trim().length < 5) {
      setProfileErr('Адрес доставки должен содержать минимум 5 символов');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/users/${user.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          default_address: defaultAddress.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка обновления профиля');

      setUser(data);
      setProfileMsg('Личные данные успешно сохранены на сервере!');
    } catch (err) {
      setProfileErr(err.message);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassMsg('');
    setPassErr('');

    if (!oldPassword || !newPassword) {
      setPassErr('Заполните оба поля пароля');
      return;
    }
    if (newPassword.length < 6) {
      setPassErr('Новый пароль должен содержать минимум 6 символов');
      return;
    }
    if (oldPassword === newPassword) {
      setPassErr('Новый пароль должен отличаться от текущего');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/users/${user.id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка смены пароля');

      setPassMsg(data.message);
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      setPassErr(err.message);
    }
  };

  return (
    <div>
      <h1>Личный кабинет</h1>

      <div className="admin-grid">
        <div className="admin-box">
          <div className="dashboard-avatar">{user.full_name[0]}</div>
          <p style={{ textAlign: 'center' }}>
            Роль: <strong>{user.role === 'admin' ? 'Администратор' : 'Покупатель'}</strong> | Промокод:{' '}
            <strong>{user.coupon_code} (-{user.personal_discount}%)</strong>
          </p>

          <h3>Личная информация</h3>
          {profileMsg && <div className="status-box success-box">{profileMsg}</div>}
          {profileErr && <div className="status-box error-box">{profileErr}</div>}

          <form onSubmit={handleSaveProfile} className="login-form" noValidate>
            <div className="form-group">
              <label>ФИО</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Телефон</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Адрес доставки по умолчанию</label>
              <input
                type="text"
                value={defaultAddress}
                onChange={(e) => setDefaultAddress(e.target.value)}
              />
            </div>
            <button type="submit" className="submit-btn">
              Сохранить изменения
            </button>
          </form>
        </div>

        <div className="admin-box">
          <h3>Изменение пароля</h3>
          {passMsg && <div className="status-box success-box">{passMsg}</div>}
          {passErr && <div className="status-box error-box">{passErr}</div>}

          <form onSubmit={handleChangePassword} className="login-form" noValidate>
            <div className="form-group">
              <label>Текущий пароль</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Новый пароль (мин. 6 символов)</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="submit-btn">
              Обновить пароль
            </button>
          </form>

          <button className="reset-btn" style={{ marginTop: '2rem', width: '100%' }} onClick={logout}>
            Выйти из аккаунта
          </button>
        </div>
      </div>

      <div className="admin-box" style={{ marginTop: '2rem' }}>
        <h3>История ваших заказов</h3>
        {ordersLoading ? (
          <p>Загрузка заказов...</p>
        ) : orders.length === 0 ? (
          <p>У вас пока нет оформленных заказов.</p>
        ) : (
          <div className="cart-table-wrapper">
            <table className="cart-table">
              <thead>
                <tr>
                  <th>Товар / Услуга</th>
                  <th>Категория</th>
                  <th>Кол-во</th>
                  <th>Адрес доставки</th>
                  <th>Дата доставки</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((ord, idx) => (
                  <tr key={idx}>
                    <td><strong>{ord.service_title}</strong></td>
                    <td>{ord.category_name}</td>
                    <td>{ord.quantity} шт.</td>
                    <td>{ord.delivery_address || 'Не указан'}</td>
                    <td>{ord.delivery_date ? new Date(ord.delivery_date).toLocaleDateString('ru-RU') : '-'}</td>
                    <td>
                      <span className="cart-badge" style={{ backgroundColor: '#10b981' }}>
                        {ord.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}