import { useState } from 'react';
import { useData } from '../context/DataContext';
import { useCart } from '../context/CartContext';

export default function Catalog() {
  const { services, categories, user, loading, error, fetchData, addCategory } = useData();
  const { addToCart } = useCart();

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [catError, setCatError] = useState('');

  const handleCheckboxChange = (categoryId) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter((id) => id !== categoryId));
    } else {
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    setCatError('');
    if (!newCategoryName.trim()) {
      setCatError('Введите название');
      return;
    }
    try {
      await addCategory(newCategoryName.trim());
      setNewCategoryName('');
    } catch (err) {
      setCatError(err.message);
    }
  };

  const filteredServices =
    selectedCategories.length === 0
      ? services
      : services.filter((s) => selectedCategories.includes(s.category_id));

  return (
    <div>
      <div className="catalog-header">
        <h1>Каталог товаров и услуг</h1>
        {user && user.personal_discount > 0 && (
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
                className="btn-secondary"
                onClick={() => setSelectedCategories([])}
              >
                Сбросить фильтры
              </button>
            )}

            {user && user.role === 'admin' && (
              <form className="aside-admin-form" onSubmit={handleAddCategory}>
                <h4>Добавить категорию</h4>
                <input
                  type="text"
                  placeholder="Название категории"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
                {catError && <p className="field-error">{catError}</p>}
                <button type="submit" className="submit-btn">
                  Добавить
                </button>
              </form>
            )}
          </aside>

          <div className="card-list" style={{ marginTop: 0 }}>
            {filteredServices.map((service) => {
              const basePrice = Number(service.price);
              const itemDiscount = Number(service.discount_percent) || 0;
              const userDiscount = user ? Number(user.personal_discount) || 0 : 0;
              const totalDiscount = Math.min(itemDiscount + userDiscount, 90);
              const finalPrice = Math.round(basePrice * (1 - totalDiscount / 100));

              return (
                <div key={service.id} className="card service-card">
                  {totalDiscount > 0 && (
                    <span className="discount-badge">-{totalDiscount}%</span>
                  )}
                  <div>
                    <span className="category-tag">{service.category_name}</span>
                    <h3>{service.title}</h3>
                    <p className="service-desc">{service.description}</p>
                    <p className="service-duration">
                      Длительность / гарантия: <strong>{service.duration} мес./мин.</strong>
                    </p>
                  </div>

                  <div style={{ width: '100%' }}>
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
                    <div className="card-actions">
                      <button
                        className="submit-btn"
                        onClick={() => addToCart(service)}
                      >
                        В корзину
                      </button>
                    </div>
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