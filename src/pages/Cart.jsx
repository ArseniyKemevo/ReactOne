import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function Cart() {
  const { cart, removeFromCart, totalPrice } = useCart();

  if (cart.length === 0) {
    return (
      <div className="cart-empty">
        <h2>Корзина пуста</h2>
        <p>Выберите товары в нашем каталоге.</p>
        <Link to="/" className="btn-link">Перейти к покупкам</Link>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1>Корзина</h1>
      <div className="cart-table-wrapper">
        <table className="cart-table">
          <thead>
            <tr>
              <th>Название</th>
              <th>Цена за шт.</th>
              <th>Кол-во</th>
              <th>Сумма</th>
              <th>Действие</th>
            </tr>
          </thead>
          <tbody>
            {cart.map(item => (
              <tr key={item.id}>
                <td>{item.title}</td>
                <td>{item.price.toLocaleString()} ₽</td>
                <td>{item.count}</td>
                <td>{(item.price * item.count).toLocaleString()} ₽</td>
                <td>
                  <button className="delete-btn" onClick={() => removeFromCart(item.id)}>
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="cart-summary">
        <h2>Итого: {totalPrice.toLocaleString()} ₽</h2>
      </div>
    </div>
  );
}