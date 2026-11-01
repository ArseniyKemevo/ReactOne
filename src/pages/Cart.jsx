import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useData, API_URL } from '../context/DataContext';

export default function Cart() {
  const { cart, cartLoading, cartError, updateQuantity, removeFromCart, fetchCart } = useCart();
  const { user } = useData();

  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCouponDiscount, setAppliedCouponDiscount] = useState(0);

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutSuccess, setCheckoutSuccess] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (user && user.default_address && !deliveryAddress) {
      setDeliveryAddress(user.default_address);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="form-container">
        <h1>Корзина</h1>
        <p>Для работы с корзиной необходимо авторизоваться.</p>
        <Link to="/login" className="btn-link">
          Перейти ко входу
        </Link>
      </div>
    );
  }

  if (cartLoading) return <div className="status-box loading-box">Загрузка вашей корзины...</div>;
  if (cartError) return <div className="status-box error-box">{cartError}</div>;

  const handleApplyCoupon = () => {
    if (
      user.coupon_code &&
      couponInput.trim().toUpperCase() === user.coupon_code.toUpperCase()
    ) {
      setAppliedCouponDiscount(user.personal_discount || 0);
      setCheckoutError('');
    } else {
      setAppliedCouponDiscount(0);
      setCheckoutError('Неверный промокод');
    }
  };

  const subtotal = cart.reduce((acc, item) => {
    const unitPrice = Math.round(item.price * (1 - (item.discount_percent || 0) / 100));
    return acc + unitPrice * item.count;
  }, 0);

  const totalAmount = Math.round(subtotal * (1 - appliedCouponDiscount / 100));

  const handleCheckout = async (e) => {
    e.preventDefault();
    setCheckoutError('');
    setCheckoutSuccess('');

    if (!deliveryAddress.trim() || deliveryAddress.trim().length < 5) {
      setCheckoutError('Пожалуйста, введите полный адрес доставки (минимум 5 символов)');
      return;
    }
    if (!deliveryDate) {
      setCheckoutError('Пожалуйста, выберите дату доставки');
      return;
    }
    if (deliveryDate < todayStr) {
      setCheckoutError('Ошибка: дата доставки не может быть меньше текущей даты!');
      return;
    }

    setCheckoutLoading(true);
    try {
      const res = await fetch(`${API_URL}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          items: cart,
          total_amount: totalAmount,
          delivery_address: deliveryAddress.trim(),
          delivery_date: deliveryDate
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка оформления заказа');

      setCheckoutSuccess(
        `Заказ успешно оформлен на сумму ${totalAmount} ₽! Доставка запланирована на ${deliveryDate}.`
      );
      await fetchCart();
    } catch (err) {
      setCheckoutError(err.message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div>
      <h1>Ваша корзина</h1>

      {checkoutSuccess && <div className="status-box success-box">{checkoutSuccess}</div>}
      {checkoutError && <div className="status-box error-box">{checkoutError}</div>}

      {cart.length === 0 ? (
        <div>
          <p>В вашей корзине пока пусто.</p>
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
                  <th>Товар / Услуга</th>
                  <th>Категория</th>
                  <th>Цена за шт.</th>
                  <th>Количество</th>
                  <th>Сумма</th>
                  <th>Действие</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item) => {
                  const unitPrice = Math.round(
                    item.price * (1 - (item.discount_percent || 0) / 100)
                  );
                  return (
                    <tr key={item.title}>
                      <td>
                        <div className="cart-item-cell">
                          <img src={item.image} alt={item.title} className="cart-item-img" />
                          <div>
                            <strong>{item.title}</strong>
                            {item.discount_percent > 0 && (
                              <span className="table-discount-badge">
                                -{item.discount_percent}%
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>{item.category_name}</td>
                      <td>{unitPrice} ₽</td>
                      <td>
                        <div className="quantity-controls">
                          <button
                            className="quantity-btn"
                            onClick={() => updateQuantity(item.id, item.count - 1)}
                          >
                            -
                          </button>
                          <span className="quantity-value">{item.count}</span>
                          <button
                            className="quantity-btn"
                            onClick={() => updateQuantity(item.id, item.count + 1)}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td>
                        <strong>{unitPrice * item.count} ₽</strong>
                      </td>
                      <td>
                        <button
                          className="delete-btn btn-secondary"
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
            <div style={{ marginBottom: '1rem' }}>
              <input
                type="text"
                placeholder="Промокод (напр. WELCOME10)"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                style={{
                  padding: '0.5rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  marginRight: '0.5rem',
                  background: 'var(--surface-color)',
                  color: 'var(--text-color)'
                }}
              />
              <button className="btn-secondary" onClick={handleApplyCoupon}>
                Применить промокод
              </button>
            </div>
            <h3>Итого к оплате: {totalAmount} ₽</h3>
          </div>

          <div className="form-container" style={{ maxWidth: '520px', marginTop: '2rem' }}>
            <h2>Оформление доставки</h2>
            <form onSubmit={handleCheckout} className="login-form">
              <div className="form-group">
                <label>Адрес доставки *</label>
                <input
                  type="text"
                  placeholder="Город, улица, дом, квартира"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Дата доставки (не ранее сегодняшнего дня) *</label>
                <input
                  type="date"
                  min={todayStr}
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="submit-btn" disabled={checkoutLoading}>
                {checkoutLoading ? 'Оформляем заказ...' : 'Оформить заказ'}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}