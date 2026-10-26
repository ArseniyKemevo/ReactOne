import { NavLink } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';

export default function Navbar() {
  const { cart } = useCart();
  const { theme, toggleTheme } = useTheme();
  const { user } = useData();

  const totalCount = cart.reduce((sum, item) => sum + item.count, 0);

  return (
    <nav className="navbar">
      <h2>TechStore</h2>
      <div className="nav-links">
        <NavLink to="/">Каталог</NavLink>
        <NavLink to="/cart">
          Корзина
          {totalCount > 0 && <span className="cart-badge">{totalCount}</span>}
        </NavLink>
        {user ? (
          <NavLink to="/dashboard">Профиль ({user.full_name})</NavLink>
        ) : (
          <>
            <NavLink to="/login">Вход</NavLink>
            <NavLink to="/register">Регистрация</NavLink>
          </>
        )}
        <button onClick={toggleTheme}>
          {theme === 'light' ? 'Темная тема' : 'Светлая тема'}
        </button>
      </div>
    </nav>
  );
}