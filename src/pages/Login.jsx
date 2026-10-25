import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const { loginUser, loading } = useData();
  const navigate = useNavigate();

  const validateForm = () => {
    if (!email.trim() || !password.trim()) {
      setFormError('Пожалуйста, заполните поля Email и Пароль.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setFormError('Введите корректный адрес электронной почты (например, client@salon.ru).');
      return false;
    }
    if (password.length < 4) {
      setFormError('Пароль должен содержать не менее 4 символов.');
      return false;
    }
    return true;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!validateForm()) return;

    const result = await loginUser(email, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setFormError(result.message || 'Ошибка авторизации. Проверьте введённые данные.');
    }
  };

  return (
    <div className="form-container">
      <h1>Вход в систему</h1>

      {formError && <div className="status-box error-box">{formError}</div>}

      <form onSubmit={handleLogin} className="login-form" noValidate>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@salon.ru или client@salon.ru"
          />
        </div>
        <div className="form-group">
          <label htmlFor="pwd">Пароль:</label>
          <input
            id="pwd"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Введите пароль (например, admin123)"
          />
        </div>
        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Проверка данных...' : 'Войти'}
        </button>
      </form>

      <div className="demo-credentials">
        <p><strong>Тестовые аккаунты:</strong></p>
        <p>Админ: <code>admin@salon.ru</code> / <code>admin123</code></p>
        <p>Клиент: <code>client@salon.ru</code> / <code>client123</code></p>
      </div>
    </div>
  );
}