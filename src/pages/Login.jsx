import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (username.trim()) {
      localStorage.setItem('user', username);
      navigate('/dashboard');
    }
  };

  return (
    <div className="form-container">
      <h1>Вход в систему</h1>
      <form onSubmit={handleLogin} className="login-form">
        <div className="form-group">
          <label htmlFor="user">Имя пользователя:</label>
          <input
            id="user"
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Введите логин"
          />
        </div>
        <div className="form-group">
          <label htmlFor="pwd">Пароль:</label>
          <input
            id="pwd"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Любой пароль"
          />
        </div>
        <button type="submit" className="submit-btn">Войти</button>
      </form>
    </div>
  );
}