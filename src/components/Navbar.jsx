import { NavLink, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useData();
  const { cart } = useCart();
  const navigate = useNavigate();

  const totalCount = cart.reduce((sum, item) => sum + Number(item.count || 1), 0);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>
        Трофей
      </div>

      <nav className="nav-links">
        <NavLink to="/">Каталог</NavLink>

        <NavLink to="/cart">
          Корзина
          {totalCount > 0 && <span className="cart-badge">{totalCount}</span>}
        </NavLink>

        {user ? (
          <>
            <NavLink to="/dashboard">Личный кабинет ({user.full_name})</NavLink>
            {user.role === 'admin' && <NavLink to="/admin">Админ-панель</NavLink>}
            <button className="delete-btn btn-secondary" onClick={handleLogout}>
              Выйти
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login">Вход</NavLink>
            <NavLink to="/register">Регистрация</NavLink>
          </>
        )}

        <button className="btn-secondary" onClick={toggleTheme}>
          {theme === 'dark' ? 'Светлая' : 'Темная'}
        </button>
      </nav>
    </header>
  );
}