import { Navigate } from 'react-router-dom';
import { useData } from '../context/DataContext';

export default function Dashboard() {
  const { user, logoutUser } = useData();

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="dashboard-card">
      <div className="dashboard-avatar">{user.full_name[0]}</div>
      <h1>Личный кабинет</h1>
      <p>ФИО: <strong>{user.full_name}</strong></p>
      <p>Email: <strong>{user.email}</strong></p>
      <p>Роль: <strong>{user.role === 'admin' ? 'Администратор' : 'Клиент'}</strong></p>
      <p>Купон: <strong>{user.coupon_code}</strong></p>
      <p>Скидка: <strong>{user.personal_discount}%</strong></p>
      <button className="reset-btn" onClick={logoutUser}>
        Выйти из аккаунта
      </button>
    </div>
  );
}