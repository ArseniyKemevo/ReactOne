import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';

export default function Register() {
  const { registerUser } = useData();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setServerError('');

    let valid = true;
    if (!fullName.trim()) {
      setNameError('Введите ваше имя');
      valid = false;
    }

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
    } else if (password.length < 4) {
      setPasswordError('Пароль должен быть не менее 4 символов');
      valid = false;
    }

    if (!valid) return;

    setLoading(true);
    try {
      await registerUser(email.trim(), password, fullName.trim());
      navigate('/dashboard');
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h1>Регистрация</h1>

      {serverError && (
        <div className="status-box error-box">
          <span>{serverError}</span>
        </div>
      )}

      <form className="login-form" onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label>Имя и фамилия</label>
          <input
            type="text"
            placeholder="Иван Иванов"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          {nameError && <p className="field-error">{nameError}</p>}
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            placeholder="user@techstore.ru"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {emailError && <p className="field-error">{emailError}</p>}
        </div>

        <div className="form-group">
          <label>Пароль</label>
          <input
            type="password"
            placeholder="Придумайте пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {passwordError && <p className="field-error">{passwordError}</p>}
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Регистрация...' : 'Зарегистрироваться'}
        </button>
      </form>

      <div style={{ marginTop: '1.2rem', textAlign: 'center' }}>
        <span>Уже есть аккаунт? </span>
        <Link to="/login" style={{ color: 'var(--accent-color)' }}>
          Войти
        </Link>
      </div>
    </div>
  );
}