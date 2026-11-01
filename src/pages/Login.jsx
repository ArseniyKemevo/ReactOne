import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useData, API_URL } from '../context/DataContext';

export default function Login() {
  const { user, setUser } = useData();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [isResetMode, setIsResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetPhone, setResetPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetMessage, setResetMessage] = useState('');

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Введите корректный Email');
      return;
    }
    if (!password.trim()) {
      setError('Введите пароль');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка авторизации');

      setUser(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setResetMessage('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetEmail.trim())) {
      setError('Введите корректный Email');
      return;
    }
    const phoneRegex = /^\+?[0-9\s\-()]{10,18}$/;
    if (!phoneRegex.test(resetPhone.trim())) {
      setError('Введите корректный номер телефона (минимум 10 цифр)');
      return;
    }
    if (!newPassword.trim() || newPassword.length < 6) {
      setError('Новый пароль должен быть не короче 6 символов');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail.trim(),
          phone: resetPhone.trim(),
          new_password: newPassword
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Не удалось восстановить пароль');

      setResetMessage(data.message);
      setIsResetMode(false);
      setEmail(resetEmail);
      setPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h1>{isResetMode ? 'Восстановление пароля' : 'Вход в аккаунт'}</h1>

      {error && <div className="status-box error-box">{error}</div>}
      {resetMessage && <div className="status-box success-box">{resetMessage}</div>}

      {!isResetMode ? (
        <form onSubmit={handleLogin} className="login-form" noValidate>
          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              placeholder="client@trofey.ru"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Пароль *</label>
            <input
              type="password"
              placeholder="Введите пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setError('');
              setIsResetMode(true);
            }}
          >
            Забыли пароль? Восстановить
          </button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="login-form" noValidate>
          <p className="service-desc">
            Для сброса пароля укажите ваш Email и номер телефона, введенный при регистрации:
          </p>

          <div className="form-group">
            <label>Ваш Email *</label>
            <input
              type="email"
              placeholder="client@trofey.ru"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Телефон из профиля *</label>
            <input
              type="tel"
              placeholder="+79992223344"
              value={resetPhone}
              onChange={(e) => setResetPhone(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Новый пароль (мин. 6 символов) *</label>
            <input
              type="password"
              placeholder="Введите новый пароль"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Сохранение...' : 'Сохранить новый пароль'}
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setError('');
              setIsResetMode(false);
            }}
          >
            Назад ко входу
          </button>
        </form>
      )}

      <div className="demo-credentials">
        <p>
          Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
        </p>
        <p><strong>Тестовые доступы:</strong></p>
        <p>Админ: <code>admin@trofey.ru</code> / <code>admin123</code> (тел: +79991112233)</p>
        <p>Клиент: <code>client@trofey.ru</code> / <code>client123</code> (тел: +79992223344)</p>
      </div>
    </div>
  );
}