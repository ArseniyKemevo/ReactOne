import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useData, COUPON_TYPES } from '../context/DataContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    currentUser,
    logoutUser,
    users,
    services,
    updateServiceDiscount,
    assignUserDiscount,
  } = useData();

  const [selectedUserId, setSelectedUserId] = useState(users[0]?.id || 1);
  const [selectedCoupon, setSelectedCoupon] = useState('WELCOME10');
  const [customDiscount, setCustomDiscount] = useState(10);
  const [adminMessage, setAdminMessage] = useState('');

  if (!currentUser) {
    return (
      <div className="dashboard-card">
        <h1>Личный кабинет</h1>
        <p>Вы не авторизованы. Пожалуйста, войдите в систему.</p>
        <Link to="/login" className="btn-link">Перейти ко входу</Link>
      </div>
    );
  }

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const handleCouponChange = (code) => {
    setSelectedCoupon(code);
    const found = COUPON_TYPES.find((c) => c.code === code);
    if (found) setCustomDiscount(found.discount);
  };

  const handleAssignUserDiscount = async (e) => {
    e.preventDefault();
    await assignUserDiscount(selectedUserId, selectedCoupon, customDiscount);
    setAdminMessage('Персональная скидка и купон успешно назначены пользователю!');
    setTimeout(() => setAdminMessage(''), 3000);
  };

  const discountedCount = services.filter((s) => s.discount_percent > 0).length;
  const discountedRatio = services.length
    ? Math.round((discountedCount / services.length) * 100)
    : 0;

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-card">
        <div className="dashboard-avatar">
          {currentUser.full_name.charAt(0).toUpperCase()}
        </div>
        <h1>Личный кабинет</h1>
        <p>Имя: <strong>{currentUser.full_name}</strong></p>
        <p>Email: <strong>{currentUser.email}</strong></p>
        <p>Роль: <strong>{currentUser.role === 'admin' ? 'Администратор' : 'Клиент'}</strong></p>
        <p>
          Присвоенный купон: <strong>{currentUser.coupon_code || 'NONE'}</strong> (скидка{' '}
          <strong>{currentUser.personal_discount || 0}%</strong>)
        </p>
        <button className="reset-btn" onClick={handleLogout}>
          Выйти из аккаунта
        </button>
      </div>

      {/* Панель управления скидками для Администратора (по п. 5 ТЗ) */}
      {currentUser.role === 'admin' && (
        <div className="admin-panel">
          <h2>Панель администратора: управление скидками</h2>
          {adminMessage && <div className="status-box success-box">{adminMessage}</div>}

          <div className="admin-grid">
            {/* Блок 1: Назначение персонального купона и скидки пользователю */}
            <div className="admin-section">
              <h3>1. Выдать персональную скидку / купон клиенту</h3>
              <form onSubmit={handleAssignUserDiscount} className="login-form">
                <div className="form-group">
                  <label>Пользователь:</label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(Number(e.target.value))}
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name} ({u.email}) — сейчас: {u.coupon_code} ({u.personal_discount}%)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Вид скидочного купона:</label>
                  <select
                    value={selectedCoupon}
                    onChange={(e) => handleCouponChange(e.target.value)}
                  >
                    {COUPON_TYPES.map((c) => (
                      <option key={c.code} value={c.code}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Персональная скидка (%):</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={customDiscount}
                    onChange={(e) => setCustomDiscount(e.target.value)}
                  />
                </div>

                <button type="submit" className="submit-btn">
                  Назначить купон и скидку
                </button>
              </form>
            </div>

            {/* Блок 2: Назначение общей скидки на услуги (контроль 30% товаров со скидкой) */}
            <div className="admin-section">
              <h3>
                2. Общие скидки на услуги (сейчас со скидкой: {discountedCount} из {services.length} — {discountedRatio}%)
              </h3>
              <div className="admin-services-list">
                {services.map((srv) => (
                  <div key={srv.id} className="admin-service-row">
                    <span>{srv.title} ({srv.price} ₽)</span>
                    <div className="admin-discount-input">
                      <input
                        type="number"
                        min="0"
                        max="90"
                        value={srv.discount_percent}
                        onChange={(e) => updateServiceDiscount(srv.id, e.target.value)}
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