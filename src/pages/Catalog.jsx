import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useData } from '../context/DataContext';

export default function Catalog() {
  const { addToCart } = useCart();
  const { services, categories, currentUser, loading, error, addCategory, fetchInitialData } = useData();
  const navigate = useNavigate();

  // Выбранные чекбоксы категорий
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState('');

  const handleCheckboxChange = (categoryId) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    setCategoryError('');
    if (!newCategoryName.trim()) {
      setCategoryError('Введите название категории');
      return;
    }
    const res = await addCategory(newCategoryName);
    if (res.success) {
      setNewCategoryName('');
    } else {
      setCategoryError(res.message);
    }
  };

  const handleAddAndRedirect = (service) => {
    addToCart(service);
    navigate('/cart');
  };

  const filteredServices =
    selectedCategories.length === 0
      ? services
      : services.filter((service) => selectedCategories.includes(service.category_id));

  return (
    <div className="catalog-page">
      <div className="catalog-header">
        <h1>Каталог услуг салона</h1>
        {currentUser && (
          <div className="user-coupon-banner">
            Ваш активный купон: <strong>{currentUser.coupon_code || 'Нет'}</strong> (персональная скидка <strong>{currentUser.personal_discount || 0}%</strong> в корзине)
          </div>
        )}
      </div>

      {/* Состояние загрузки */}
      {loading && <div className="status-box loading-box">Загрузка каталога услуг с сервера API...</div>}

      {/* Сообщение об ошибке / предупреждение API */}
      {error && (
        <div className="status-box error-box">
          <span>{error}</span>
          <button className="btn-secondary" onClick={fetchInitialData}>Повторить запрос</button>
        </div>
      )}

      {!loading && (
        <div className="catalog-layout">
          {/* Боковая панель фильтрации категорий (aside с checkbox по ТЗ) */}
          <aside className="categories-aside">
            <h3>Категории услуг</h3>
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
                className="reset-btn full-width-btn"
                onClick={() => setSelectedCategories([])}
              >
                Сбросить фильтры
              </button>
            )}

            {/* Добавление категории администратором прямо в aside */}
            {currentUser?.role === 'admin' && (
              <form onSubmit={handleAddCategory} className="aside-admin-form">
                <h4>+ Добавить категорию (Админ)</h4>
                <input
                  type="text"
                  placeholder="Название категории"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
                {categoryError && <p className="field-error">{categoryError}</p>}
                <button type="submit" className="submit-btn">Добавить</button>
              </form>
            )}
          </aside>

          {/* Основной список услуг */}
          <section className="catalog-main">
            {filteredServices.length === 0 ? (
              <p>По выбранным категориям услуг не найдено.</p>
            ) : (
              <div className="card-list">
                {filteredServices.map((service) => {
                  const hasDiscount = service.discount_percent > 0;
                  const finalPrice = Math.round(
                    service.price * (1 - (service.discount_percent || 0) / 100)
                  );
                  const categoryObj = categories.find((c) => c.id === service.category_id);

                  return (
                    <div key={service.id} className="card service-card">
                      {hasDiscount && (
                        <span className="discount-badge">Скидка −{service.discount_percent}%</span>
                      )}
                      <span className="category-tag">{categoryObj?.name || 'Услуга'}</span>
                      <h3>{service.title}</h3>
                      <p className="service-desc">{service.description}</p>
                      <p className="service-duration">⏱ Длительность: {service.duration} мин.</p>

                      <div className="price-block">
                        {hasDiscount ? (
                          <>
                            <span className="old-price">{service.price.toLocaleString()} ₽</span>
                            <span className="price discount-price">{finalPrice.toLocaleString()} ₽</span>
                          </>
                        ) : (
                          <span className="price">{service.price.toLocaleString()} ₽</span>
                        )}
                      </div>

                      <div className="card-actions">
                        <button onClick={() => addToCart(service)}>В корзину</button>
                        <button
                          className="btn-secondary"
                          onClick={() => handleAddAndRedirect(service)}
                        >
                          Записаться сейчас
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}