import { useState } from 'react';
import { useData } from '../context/DataContext';
import { useCart } from '../context/CartContext';

export default function Catalog() {
  const { services, categories, user, loading, error, fetchData } = useData();
  const { addToCart } = useCart();
  const [selectedCategories, setSelectedCategories] = useState([]);

  const handleCheckboxChange = (categoryId) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter((id) => id !== categoryId));
    } else {
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };

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

  const filteredServices =
    selectedCategories.length === 0
      ? services
      : services.filter((s) => selectedCategories.includes(s.category_id));

  return (
    <div>
      <div className="catalog-header">
        <h1>Каталог товаров и услуг</h1>
        {user && user.personal_discount > 0 && user.role !== 'admin' && (
          <div className="user-coupon-banner">
            Ваш купон: <strong>{user.coupon_code}</strong> (Персональная скидка {user.personal_discount}%)
          </div>
        )}
      </div>

      {loading && (
        <div className="status-box loading-box">
          <span>Загрузка данных с сервера...</span>
        </div>
      )}

      {error && (
        <div className="status-box error-box">
          <span>{error}</span>
          <button onClick={fetchData}>Повторить</button>
        </div>
      )}

      {!loading && !error && (
        <div className="catalog-layout">
          <aside className="categories-aside">
            <h3>Категории</h3>
            <div className="checkbox-list">
              {categories.map((cat) => (
                <label key={cat.id} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat.id)}
                    onChange={() => handleCheckboxChange(cat.id)}
                  />
                  <span>{cat.name}</span>
                </label>
              ))}
            </div>

            {selectedCategories.length > 0 && (
              <button
                className="btn-secondary reset-btn"
                style={{ width: '100%', marginTop: '0.5rem' }}
                onClick={() => setSelectedCategories([])}
              >
                Сбросить фильтры
              </button>
            )}
          </aside>

          <div className="card-list">
            {filteredServices.map((service) => {
              const basePrice = Number(service.price);
              const itemDiscount = Number(service.discount_percent) || 0;
              const userDiscount = user && user.role !== 'admin' ? Number(user.personal_discount) || 0 : 0;
              const totalDiscount = Math.min(itemDiscount + userDiscount, 90);
              const finalPrice = Math.round(basePrice * (1 - totalDiscount / 100));

              return (
                <div key={service.id} className="card">
                  {totalDiscount > 0 && (
                    <span className="discount-badge">-{totalDiscount}%</span>
                  )}

                  <div>
                    <img
                      className="service-img"
                      src={getServiceImage(service)}
                      alt={service.title}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/images/hub.jpg';
                      }}
                    />
                    <span className="category-tag">{service.category_name}</span>
                    <h3>{service.title}</h3>
                    <p className="service-desc">{service.description}</p>
                    <p className="service-duration">
                      Срок / гарантия: <strong>{service.duration} мес.</strong>
                    </p>
                  </div>

                  <div>
                    <div className="price-block">
                      {totalDiscount > 0 ? (
                        <>
                          <span className="old-price">{basePrice} ₽</span>
                          <span className="price discount-price">{finalPrice} ₽</span>
                        </>
                      ) : (
                        <span className="price">{basePrice} ₽</span>
                      )}
                    </div>

                    {(!user || user.role !== 'admin') && (
                      <div className="card-actions">
                        <button
                          className="submit-btn"
                          onClick={() => addToCart(service)}
                        >
                          В корзину
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}