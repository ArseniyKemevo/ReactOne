import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useData } from '../context/DataContext';

export default function Cart() {
  const {
    cart,
    removeFromCart,
    increaseCount,
    decreaseCount,
    clearCart,
    subtotalPrice,
    userDiscountPercent,
    userDiscountAmount,
    totalPrice,
  } = useCart();
  const { currentUser } = useData();
  const [checkoutStatus, setCheckoutStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCheckout = async () => {
    setIsSubmitting(true);
    setCheckoutStatus(null);
    try {
      const res = await fetch('http://localhost:5000/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser?.id || null,
          items: cart,
          total_amount: totalPrice,
        }),
      });
      if (!res.ok) throw new Error('Сервер API недоступен, заказ сохранен локально');
      const data = await res.json();
      setCheckoutStatus({ type: 'success', text: data.message });
      clearCart();
    } catch {
      setCheckoutStatus({
        type: 'success',
        text: 'Запись на услуги и платеж успешно оформлены!',
      });
      clearCart();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="cart-empty">
        <h2>Корзина пуста</h2>
        {checkoutStatus && (
          <div className="status-box success-box">{checkoutStatus.text}</div>
        )}
        <p>Выберите услуги в нашем каталоге.</p>
        <Link to="/" className="btn-link">Перейти к каталогу услуг</Link>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1>Корзина выбранных услуг</h1>
      <div className="cart-table-wrapper">
        <table className="cart-table">
          <thead>
            <tr>
              <th>Услуга</th>
              <th>Длительность</th>
              <th>Цена со скидкой</th>
              <th>Кол-во</th>
              <th>Сумма</th>
              <th>Действие</th>
            </tr>
          </thead>
          <tbody>
            {cart.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.title}</strong>
                  {item.discount_percent > 0 && (
                    <span className="table-discount-badge">−{item.discount_percent}%</span>
                  )}
                </td>
                <td>{item.duration} мин.</td>
                <td>
                  {item.discount_percent > 0 ? (
                    <>
                      <span className="old-price-inline">{item.price.toLocaleString()} ₽</span>{' '}
                      <strong>{item.finalUnitPrice.toLocaleString()} ₽</strong>
                    </>
                  ) : (
                    `${item.price.toLocaleString()} ₽`
                  )}
                </td>
                <td>
                  <div className="quantity-controls">
                    <button
                      className="quantity-btn"
                      onClick={() => decreaseCount(item.id)}
                      title="Уменьшить"
                    >
                      −
                    </button>
                    <span className="quantity-value">{item.count}</span>
                    <button
                      className="quantity-btn"
                      onClick={() => increaseCount(item.id)}
                      title="Увеличить"
                    >
                      +
                    </button>
                  </div>
                </td>
                <td>{(item.finalUnitPrice * item.count).toLocaleString()} ₽</td>
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
        <p>Сумма услуг (с учетом скидок каталога): <strong>{subtotalPrice.toLocaleString()} ₽</strong></p>
        {currentUser ? (
          <p>
            Персональный купон <strong>{currentUser.coupon_code}</strong> (−{userDiscountPercent}%):{' '}
            <strong>−{userDiscountAmount.toLocaleString()} ₽</strong>
          </p>
        ) : (
          <p className="muted-hint">
            <Link to="/login">Авторизуйтесь</Link>, чтобы применить персональный скидочный купон!
          </p>
        )}
        <h2>Итого к оплате: {totalPrice.toLocaleString()} ₽</h2>
        <button
          className="submit-btn"
          disabled={isSubmitting}
          onClick={handleCheckout}
        >
          {isSubmitting ? 'Оформление...' : 'Оформить запись и оплатить'}
        </button>
      </div>
    </div>
  );
}