import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const username = localStorage.getItem('user') || 'Пользователь';

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="dashboard-card">
      <div className="dashboard-avatar">
        {username.charAt(0).toUpperCase()}
      </div>
      <h1>Личный кабинет</h1>
      <p>Добро пожаловать, <strong>{username}</strong>!</p>
      <p>Вы успешно авторизовались в системе.</p>
      <button className="reset-btn" onClick={handleLogout}>
        Выйти из аккаунта
      </button>
    </div>
  );
}