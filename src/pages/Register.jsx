import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useData, API_URL } from '../context/DataContext';

export default function Register() {
  const { user, setUser } = useData();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [defaultAddress, setDefaultAddress] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const validateForm = () => {
    const fullNameRegex = /^[А-ЯЁA-Z][а-яёa-z]+(?:[- ][А-ЯЁA-Z][а-яёa-z]+){1,2}$/u;
    if (!fullNameRegex.test(fullName.trim().replace(/\s+/g, ' '))) {
      return 'Введите ФИО: от 2 до 3 слов, только буквы, пробел и дефис';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return 'Введите корректный адрес электронной почты (например, user@mail.ru)';
    }
    const phoneRegex = /^\+?[0-9\s\-()]{10,18}$/;
    if (!phoneRegex.test(phone.trim())) {
      return 'Введите корректный номер телефона (минимум 10 цифр)';
    }
    if (defaultAddress.trim() && defaultAddress.trim().length < 5) {
      return 'Адрес доставки должен содержать минимум 5 символов';
    }
    if (!password || password.length < 6) {
      return 'Пароль должен содержать минимум 6 символов';
    }
    return null;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          default_address: defaultAddress.trim(),
          password
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка при регистрации');

      setUser(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h1>Регистрация</h1>
      {error && <div className="status-box error-box">{error}</div>}

      <form onSubmit={handleRegister} className="login-form" noValidate>
        <div className="form-group">
          <label>Полное имя (ФИО) *</label>
          <input
            type="text"
            placeholder="Иванов Иван Иванович"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Email *</label>
          <input
            type="email"
            placeholder="ivanov@mail.ru"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Телефон (нужен для восстановления пароля) *</label>
          <input
            type="tel"
            placeholder="+79991234567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Адрес доставки по умолчанию</label>
          <input
            type="text"
            placeholder="г. Москва, ул. Озерная, д. 5"
            value={defaultAddress}
            onChange={(e) => setDefaultAddress(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Пароль (минимум 6 символов) *</label>
          <input
            type="password"
            placeholder="Придумайте пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Регистрация...' : 'Зарегистрироваться'}
        </button>
      </form>

      <div className="demo-credentials">
        Уже есть аккаунт? <Link to="/login">Войти</Link>
      </div>
    </div>
  );
}
