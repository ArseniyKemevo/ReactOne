import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useData } from '../context/DataContext';

export default function Cart() {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user } = useData();
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (user && user.role === 'admin') {
    return <Navigate to="/admin" />;
  }

  const getServiceImage = (service) => {
    if (service.image && service.image !== '/images/hardware.jpg') {
      return service.image;
    }
    const title = (service.title || '').toLowerCase();
    if (title.includes('мышь')) return '/images/mouse.png';
    if (title.includes('клавиатур')) return '/images/keyboard.jpg';
    if (title.includes('монитор')) return '/images/monitor.jpg';
    if (title.includes('коврик')) return '/images/kover.jpg';
    if (title.includes('хаб') || title.includes('ssd') || title.includes('память') || title.includes('сборка')) return '/images/hub.jpg';
    if (title.includes('наушник') || title.includes('гарнитур')) return '/images/yshi.jpg';
    return '/images/hardware.jpg';
  };

  const getDiscountedPrice = (item) => {
    const basePrice = Number(item.price);
    const itemDiscount = Number(item.discount_percent) || 0;
    const userDiscount = user ? Number(user.personal_discount) || 0 : 0;
    const totalDiscount = Math.min(itemDiscount + userDiscount, 90);
    return Math.round(basePrice * (1 - totalDiscount / 100));
  };

  const totalAmount = cart.reduce(
    (sum, item) => sum + getDiscountedPrice(item) * item.count,
    0
  );

  const handleCheckout = async () => {
    setLoading(true);
    setStatusMsg('');
    setErrorMsg('');
    try {
      const res = await fetch('http://localhost:5000/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user ? user.id : null,
          items: cart,
          total_amount: totalAmount,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка оформления заказа');
      }
      setStatusMsg(data.message);
      clearCart();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Корзина</h1>

      {statusMsg && (
        <div className="status-box success-box">
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="status-box error-box">
          <span>{errorMsg}</span>
        </div>
      )}

      {cart.length === 0 ? (
        <div>
          <p>Ваша корзина пуста.</p>
          <Link to="/" className="btn-link">
            Перейти в каталог
          </Link>
        </div>
      ) : (
        <>
          <div className="cart-table-wrapper">
            <table className="cart-table">
              <thead>
                <tr>
                  <th>Наименование</th>
                  <th>Цена</th>
                  <th>Количество</th>
                  <th>Сумма</th>
                  <th>Действие</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item) => {
                  const finalPrice = getDiscountedPrice(item);
                  const basePrice = Number(item.price);

                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="cart-item-cell">
                          <img
                            className="cart-item-img"
                            src={getServiceImage(item)}
                            alt={item.title}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/images/hub.jpg';
                            }}
                          />
                          <div>
                            <div>
                              <strong>{item.title}</strong>
                              {finalPrice < basePrice && (
                                <span className="table-discount-badge">Скидка</span>
                              )}
                            </div>
                            <small style={{ color: 'var(--text-muted)' }}>
                              {item.category_name}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        {finalPrice < basePrice ? (
                          <>
                            <span className="old-price-inline">{basePrice} ₽</span>{' '}
                            <strong>{finalPrice} ₽</strong>
                          </>
                        ) : (
                          <span>{basePrice} ₽</span>
                        )}
                      </td>
                      <td>
                        <div className="quantity-controls">
                          <button
                            className="quantity-btn"
                            onClick={() => updateQuantity(item.id, -1)}
                          >
                            -
                          </button>
                          <span className="quantity-value">{item.count}</span>
                          <button
                            className="quantity-btn"
                            onClick={() => updateQuantity(item.id, 1)}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td>{finalPrice * item.count} ₽</td>
                      <td>
                        <button
                          className="delete-btn"
                          onClick={() => removeFromCart(item.id)}
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="cart-summary">
            <h2>Итого к оплате: {totalAmount} ₽</h2>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="reset-btn" onClick={clearCart}>
                Очистить корзину
              </button>
              <button
                className="submit-btn"
                onClick={handleCheckout}
                disabled={loading}
              >
                {loading ? 'Оформление...' : 'Оформить заказ'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}