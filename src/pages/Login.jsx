import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';

export default function Login() {
  const { loginUser } = useData();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailError('');
    setPasswordError('');
    setServerError('');

    let valid = true;
    if (!email.trim()) {
      setEmailError('Введите email');
      valid = false;
    } else if (!email.includes('@')) {
      setEmailError('Некорректный формат email');
      valid = false;
    }

    if (!password.trim()) {
      setPasswordError('Введите пароль');
      valid = false;
    }

    if (!valid) return;

    setLoading(true);
    try {
      await loginUser(email.trim(), password);
      navigate('/dashboard');
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h1>Авторизация</h1>

      {serverError && (
        <div className="status-box error-box">
          <span>{serverError}</span>
        </div>
      )}

      <form className="login-form" onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            placeholder="admin@techstore.ru"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {emailError && <p className="field-error">{emailError}</p>}
        </div>

        <div className="form-group">
          <label>Пароль</label>
          <input
            type="password"
            placeholder="Введите пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {passwordError && <p className="field-error">{passwordError}</p>}
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Вход...' : 'Войти'}
        </button>
      </form>

      <div style={{ marginTop: '1.2rem', textAlign: 'center' }}>
        <span>Нет аккаунта? </span>
        <Link to="/register" style={{ color: 'var(--accent-color)' }}>
          Зарегистрироваться
        </Link>
      </div>

      <div className="demo-credentials">
        <p><strong>Тестовые аккаунты из БД:</strong></p>
        <p>Админ: admin@techstore.ru / admin123</p>
        <p>Клиент 1: client@techstore.ru / client123</p>
        <p>Клиент 2: oleg@techstore.ru / oleg123</p>
      </div>
    </div>
  );
}