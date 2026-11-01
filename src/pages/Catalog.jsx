import { useState } from 'react';
import { useData, API_URL } from '../context/DataContext';
import { useCart } from '../context/CartContext';

const containsProfanity = (text) => /бляд|блят|бля|сука|хуй|пизд|еба|ёба|мудак|гандон|нахуй|нахер/iu.test(text);

export default function Catalog() {
  const { services, categories, reviews, setReviews, user, loading, error } = useData();
  const { addToCart } = useCart();

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [maxPrice, setMaxPrice] = useState('');

  const [openReviewServiceId, setOpenReviewServiceId] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const handleCategoryChange = (categoryName) => {
    if (selectedCategories.includes(categoryName)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== categoryName));
    } else {
      setSelectedCategories([...selectedCategories, categoryName]);
    }
  };

  const filteredServices = services.filter((service) => {
    const matchCategory =
      selectedCategories.length === 0 || selectedCategories.includes(service.category_name);
    const finalPrice = Math.round(service.price * (1 - (service.discount_percent || 0) / 100));
    const matchPrice = !maxPrice || finalPrice <= Number(maxPrice);
    return matchCategory && matchPrice;
  });

  const handleAddReview = async (e, serviceId) => {
    e.preventDefault();
    setReviewError('');

    if (!comment.trim() || comment.trim().length < 5) {
      setReviewError('Комментарий должен содержать минимум 5 символов');
      return;
    }
    if (containsProfanity(comment.trim())) {
      setReviewError('Отзыв содержит недопустимые выражения');
      return;
    }

    setReviewSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          service_id: serviceId,
          rating: Number(rating),
          comment: comment.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка отправки отзыва');

      setReviews([data, ...reviews]);
      setComment('');
      setRating(5);
    } catch (err) {
      setReviewError(err.message);
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) return <div className="status-box loading-box">Загрузка снаряжения и услуг...</div>;
  if (error) return <div className="status-box error-box">{error}</div>;

  return (
    <div>
      <div className="catalog-header">
        <h1>Каталог снаряжения для рыбалки и охоты</h1>
        {user && user.personal_discount > 0 && (
          <div className="user-coupon-banner">
            Ваш промокод: <strong>{user.coupon_code}</strong> (персональная скидка {user.personal_discount}%)
          </div>
        )}
      </div>

      <div className="catalog-layout">
        <aside className="categories-aside">
          <h3>Категории</h3>
          <div className="checkbox-list">
            {categories.map((cat) => (
              <label key={cat.name} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(cat.name)}
                  onChange={() => handleCategoryChange(cat.name)}
                />
                <span>{cat.name}</span>
              </label>
            ))}
          </div>

          <h3>Цена до (₽)</h3>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <input
              type="number"
              min="0"
              placeholder="Например: 5000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              style={{
                padding: '0.5rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-color)',
                color: 'var(--text-color)'
              }}
            />
          </div>

          {(selectedCategories.length > 0 || maxPrice) && (
            <button
              className="reset-btn btn-secondary"
              onClick={() => {
                setSelectedCategories([]);
                setMaxPrice('');
              }}
            >
              Сбросить фильтры
            </button>
          )}
        </aside>

        <div className="card-list">
          {filteredServices.length === 0 ? (
            <p>По выбранным фильтрам товары не найдены.</p>
          ) : (
            filteredServices.map((service) => {
              const hasDiscount = service.discount_percent > 0;
              const finalPrice = Math.round(
                service.price * (1 - (service.discount_percent || 0) / 100)
              );
              const serviceReviews = reviews.filter((r) => r.service_title === service.title);
              const isReviewsOpen = openReviewServiceId === service.id;

              return (
                <div key={service.title} className="card">
                  <div>
                    {hasDiscount && (
                      <span className="discount-badge">-{service.discount_percent}%</span>
                    )}
                    <img
                      src={service.image}
                      alt={service.title}
                      className="service-img"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600';
                      }}
                    />
                    <span className="category-tag">{service.category_name || 'Без категории'}</span>
                    <h3 style={{ margin: '0.4rem 0' }}>{service.title}</h3>
                    <p className="service-desc">{service.description}</p>
                    <p className="service-duration">
                      Гарантия / срок: <strong>{service.duration} мес.</strong>
                    </p>
                  </div>

                  <div>
                    <div className="price-block">
                      {hasDiscount ? (
                        <>
                          <span className="old-price">{service.price} ₽</span>
                          <span className="price discount-price">{finalPrice} ₽</span>
                        </>
                      ) : (
                        <span className="price">{service.price} ₽</span>
                      )}
                    </div>

                    <div className="card-actions">
                      <button className="submit-btn" onClick={() => addToCart(service)}>
                        В корзину
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={() =>
                          setOpenReviewServiceId(isReviewsOpen ? null : service.id)
                        }
                      >
                        Отзывы ({serviceReviews.length})
                      </button>
                    </div>

                    {isReviewsOpen && (
                      <div
                        style={{
                          marginTop: '1rem',
                          paddingTop: '0.8rem',
                          borderTop: '1px solid var(--border-color)',
                          fontSize: '0.88rem'
                        }}
                      >
                        <strong>Отзывы покупателей:</strong>
                        {serviceReviews.length === 0 ? (
                          <p className="service-desc">Пока нет отзывов. Будьте первым!</p>
                        ) : (
                          serviceReviews.map((rev, idx) => (
                            <div
                              key={idx}
                              style={{
                                margin: '0.5rem 0',
                                padding: '0.5rem',
                                background: 'var(--bg-color)',
                                borderRadius: '6px'
                              }}
                            >
                              <div>
                                <strong>{rev.user_name}</strong> — {'⭐'.repeat(rev.rating)}
                              </div>
                              <div style={{ marginTop: '4px' }}>{rev.comment}</div>
                            </div>
                          ))
                        )}

                        {user ? (
                          <form
                            onSubmit={(e) => handleAddReview(e, service.id)}
                            className="login-form"
                            style={{ marginTop: '0.8rem', gap: '0.6rem' }}
                          >
                            <label>Ваша оценка:</label>
                            <select
                              value={rating}
                              onChange={(e) => setRating(e.target.value)}
                            >
                              <option value="5">5 — Отлично</option>
                              <option value="4">4 — Хорошо</option>
                              <option value="3">3 — Нормально</option>
                              <option value="2">2 — Плохо</option>
                              <option value="1">1 — Ужасно</option>
                            </select>
                            <input
                              type="text"
                              placeholder="Ваш отзыв о снасти или костюме..."
                              value={comment}
                              onChange={(e) => setComment(e.target.value)}
                            />
                            {reviewError && <p className="field-error">{reviewError}</p>}
                            <button
                              type="submit"
                              className="submit-btn btn-secondary"
                              disabled={reviewSubmitting}
                            >
                              {reviewSubmitting ? 'Отправка...' : 'Оставить отзыв'}
                            </button>
                          </form>
                        ) : (
                          <p className="service-desc" style={{ marginTop: '0.5rem' }}>
                            Войдите в аккаунт, чтобы оставить отзыв.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
