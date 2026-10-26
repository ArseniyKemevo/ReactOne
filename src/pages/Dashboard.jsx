import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useData } from '../context/DataContext';

export default function Dashboard() {
  const { user, logoutUser, services, fetchData } = useData();
  const [usersList, setUsersList] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [couponCode, setCouponCode] = useState('WELCOME10');
  const [personalDiscount, setPersonalDiscount] = useState(10);
  const [adminMsg, setAdminMsg] = useState('');

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetch('http://localhost:5000/api/users')
        .then((res) => res.json())
        .then((data) => {
          setUsersList(data);
          if (data.length > 0) {
            setSelectedUserId(data[0].id);
          }
        });
    }
  }, [user]);

  if (!user) {
    return <Navigate to="/login" />;
  }

  const handleUserDiscountUpdate = async (e) => {
    e.preventDefault();
    setAdminMsg('');
    const res = await fetch(`http://localhost:5000/api/users/${selectedUserId}/discount`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coupon_code: couponCode,
        personal_discount: personalDiscount,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setUsersList(usersList.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)));
      setAdminMsg('Персональная скидка пользователя обновлена');
    }
  };

  const handleServiceDiscountChange = async (serviceId, discountValue) => {
    setAdminMsg('');
    const res = await fetch(`http://localhost:5000/api/services/${serviceId}/discount`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ discount_percent: discountValue }),
    });
    if (res.ok) {
      fetchData();
      setAdminMsg('Скидка на позицию обновлена');
    }
  };

  return (
    <div>
      <div className="dashboard-card">
        <div className="dashboard-avatar">{user.full_name[0]}</div>
        <h1>Личный кабинет</h1>
        <p>Имя: <strong>{user.full_name}</strong></p>
        <p>Email: <strong>{user.email}</strong></p>
        <p>Роль: <strong>{user.role === 'admin' ? 'Администратор' : 'Клиент'}</strong></p>
        <p>Купон: <strong>{user.coupon_code}</strong></p>
        <p>Персональная скидка: <strong>{user.personal_discount}%</strong></p>
        <button className="reset-btn" onClick={logoutUser}>
          Выйти из аккаунта
        </button>
      </div>

      {user.role === 'admin' && (
        <div className="admin-panel">
          <h2>Панель управления скидками (Администратор)</h2>
          {adminMsg && (
            <div className="status-box success-box">
              <span>{adminMsg}</span>
            </div>
          )}

          <div className="admin-grid">
            <div>
              <h3>Назначить купон пользователю</h3>
              <form className="login-form" onSubmit={handleUserDiscountUpdate}>
                <div className="form-group">
                  <label>Пользователь</label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                  >
                    {usersList.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name} ({u.email}) — {u.coupon_code} ({u.personal_discount}%)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Вид купона</label>
                  <select
                    value={couponCode}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCouponCode(val);
                      if (val === 'NONE') setPersonalDiscount(0);
                      if (val === 'PROMO5') setPersonalDiscount(5);
                      if (val === 'WELCOME10') setPersonalDiscount(10);
                      if (val === 'VIP20') setPersonalDiscount(20);
                    }}
                  >
                    <option value="NONE">Без купона (0%)</option>
                    <option value="PROMO5">PROMO5 (5%)</option>
                    <option value="WELCOME10">WELCOME10 (10%)</option>
                    <option value="VIP20">VIP20 (20%)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Персональная скидка (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="90"
                    value={personalDiscount}
                    onChange={(e) => setPersonalDiscount(e.target.value)}
                  />
                </div>

                <button type="submit" className="submit-btn">
                  Сохранить скидку
                </button>
              </form>
            </div>

            <div>
              <h3>Скидки на товары и услуги</h3>
              <div className="admin-services-list">
                {services.map((s) => (
                  <div key={s.id} className="admin-service-row">
                    <span>{s.title}</span>
                    <div className="admin-discount-input">
                      <input
                        type="number"
                        min="0"
                        max="90"
                        defaultValue={s.discount_percent}
                        onBlur={(e) => handleServiceDiscountChange(s.id, e.target.value)}
                      />
                      <span>%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}