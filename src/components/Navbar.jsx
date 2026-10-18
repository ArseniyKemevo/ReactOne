import { NavLink } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { cart } = useCart();

  const totalItemsCount = cart.reduce((acc, item) => acc + item.count, 0);

  return (
    <nav className="navbar">
      <div className="nav-links">
        <NavLink to="/" end>Каталог</NavLink>
        <NavLink to="/cart">
          Корзина {totalItemsCount > 0 && <span className="cart-badge">{totalItemsCount}</span>}
        </NavLink>
        <NavLink to="/login">Вход</NavLink>
        <NavLink to="/dashboard">Кабинет</NavLink>
      </div>
      <button className="theme-toggle-btn" onClick={toggleTheme}>
        {theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}
      </button>
    </nav>
  );
}