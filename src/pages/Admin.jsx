import { useState, useEffect } from 'react';
import { useData, API_URL } from '../context/DataContext';

export default function Admin() {
  const { user, services, categories, reviews, fetchAllData } = useData();

  const [usersList, setUsersList] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [editingServiceId, setEditingServiceId] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(12);
  const [price, setPrice] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [categoryName, setCategoryName] = useState('');
  const [image, setImage] = useState('');

  const [newCatName, setNewCatName] = useState('');
  const [editCatId, setEditCatId] = useState(null);
  const [editCatName, setEditCatName] = useState('');

  const loadAdminExtras = async () => {
    try {
      const [uRes, oRes] = await Promise.all([
        fetch(`${API_URL}/users`),
        fetch(`${API_URL}/orders`)
      ]);
      if (uRes.ok) setUsersList(await uRes.json());
      if (oRes.ok) setOrdersList(await oRes.json());
    } catch (e) {
      setErrorMsg('Ошибка загрузки данных админ-панели');
    }
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadAdminExtras();
    }
  }, [user]);

  useEffect(() => {
    if (categories.length > 0 && !categoryName) {
      setCategoryName(categories[0].name);
    }
  }, [categories]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="status-box error-box">
        Доступ запрещен. Страница доступна только администраторам.
      </div>
    );
  }

  const handleSaveService = async (e) => {
    e.preventDefault();
    setStatusMsg('');
    setErrorMsg('');

    if (!title.trim() || title.trim().length < 3) {
      setErrorMsg('Название товара должно содержать минимум 3 символа');
      return;
    }
    if (!description.trim() || description.trim().length < 5) {
      setErrorMsg('Описание товара должно содержать минимум 5 символов');
      return;
    }
    if (!categoryName) {
      setErrorMsg('Выберите категорию');
      return;
    }
    if (Number(price) <= 0 || isNaN(Number(price))) {
      setErrorMsg('Цена должна быть положительным числом больше 0');
      return;
    }
    if (Number(duration) <= 0 || isNaN(Number(duration))) {
      setErrorMsg('Срок гарантии должен быть больше 0 месяцев');
      return;
    }
    if (Number(discountPercent) < 0 || Number(discountPercent) > 90 || isNaN(Number(discountPercent))) {
      setErrorMsg('Скидка должна быть в диапазоне от 0 до 90%');
      return;
    }

    const url = editingServiceId
      ? `${API_URL}/services/${editingServiceId}`
      : `${API_URL}/services`;
    const method = editingServiceId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          duration: Number(duration),
          price: Number(price),
          discount_percent: Number(discountPercent),
          category_name: categoryName,
          image: image.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка сохранения товара');

      setStatusMsg(editingServiceId ? 'Товар обновлен!' : 'Новый товар добавлен!');
      setEditingServiceId(null);
      setTitle('');
      setDescription('');
      setPrice('');
      setDiscountPercent(0);
      setImage('');
      await fetchAllData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const startEditService = (srv) => {
    setEditingServiceId(srv.id);
    setTitle(srv.title);
    setDescription(srv.description);
    setDuration(srv.duration);
    setPrice(srv.price);
    setDiscountPercent(srv.discount_percent || 0);
    setCategoryName(srv.category_name || (categories[0] && categories[0].name) || '');
    setImage(srv.image || '');
  };

  const handleDeleteService = async (id) => {
    await fetch(`${API_URL}/services/${id}`, { method: 'DELETE' });
    await fetchAllData();
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setStatusMsg('');

    if (!newCatName.trim() || newCatName.trim().length < 2) {
      setErrorMsg('Название категории должно содержать минимум 2 символа');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNewCatName('');
      await fetchAllData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleUpdateCategory = async (id) => {
    setErrorMsg('');
    if (!editCatName.trim() || editCatName.trim().length < 2) {
      setErrorMsg('Название категории должно содержать минимум 2 символа');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editCatName.trim() })
      });
      if (!res.ok) throw new Error('Ошибка переименования категории');
      setEditCatId(null);
      await fetchAllData();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteCategory = async (id) => {
    await fetch(`${API_URL}/categories/${id}`, { method: 'DELETE' });
    await fetchAllData();
  };

  const handleOrderStatusChange = async (order, newStatus) => {
    await fetch(`${API_URL}/orders/${order.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, delivery_address: order.delivery_address })
    });
    await loadAdminExtras();
  };

  const handleDeleteOrder = async (id) => {
    await fetch(`${API_URL}/orders/${id}`, { method: 'DELETE' });
    await loadAdminExtras();
  };

  const handleDeleteReview = async (id) => {
    await fetch(`${API_URL}/reviews/${id}`, { method: 'DELETE' });
    await fetchAllData();
  };

  const handleUpdateUserDiscount = async (u, newDiscount, newCoupon) => {
    setErrorMsg('');
    if (!newCoupon.trim()) {
      setErrorMsg('Промокод не может быть пустым');
      return;
    }
    if (isNaN(newDiscount) || newDiscount < 0 || newDiscount > 90) {
      setErrorMsg('Скидка пользователя должна быть числом от 0 до 90%');
      return;
    }

    const res = await fetch(`${API_URL}/users/${u.id}/discount`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coupon_code: newCoupon.trim(), personal_discount: newDiscount })
    });
    if (res.ok) await loadAdminExtras();
  };

  const handleDeleteUser = async (id) => {
    if (id === user.id) {
      alert('Вы не можете удалить свой собственный аккаунт администратора!');
      return;
    }
    await fetch(`${API_URL}/users/${id}`, { method: 'DELETE' });
    await loadAdminExtras();
  };

  return (
    <div className="admin-panel">
      <h1>Панель управления администратора</h1>
      {statusMsg && <div className="status-box success-box">{statusMsg}</div>}
      {errorMsg && <div className="status-box error-box">{errorMsg}</div>}

      <div className="admin-grid">
        <div className="admin-box">
          <h3>{editingServiceId ? 'Редактировать товар' : 'Добавить товар / услугу'}</h3>
          <form onSubmit={handleSaveService} className="login-form" noValidate>
            <input
              type="text"
              placeholder="Название (напр. Эхолот зимний)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Описание товара"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
            <select value={categoryName} onChange={(e) => setCategoryName(e.target.value)}>
              {categories.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="number"
                min="1"
                placeholder="Цена (₽)"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
              <input
                type="number"
                min="1"
                placeholder="Гарантия (мес.)"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required
              />
              <input
                type="number"
                placeholder="Скидка %"
                min="0"
                max="90"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
              />
            </div>
            <input
              type="text"
              placeholder="URL изображения"
              value={image}
              onChange={(e) => setImage(e.target.value)}
            />
            <button type="submit" className="submit-btn">
              {editingServiceId ? 'Сохранить изменения' : 'Добавить в каталог'}
            </button>
            {editingServiceId && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setEditingServiceId(null)}
              >
                Отмена
              </button>
            )}
          </form>
        </div>

        <div className="admin-box">
          <h3>Категории каталога</h3>
          <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '0.5rem' }} noValidate>
            <input
              type="text"
              placeholder="Новая категория..."
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="admin-cat-edit-input"
              required
            />
            <button type="submit" className="submit-btn" style={{ marginTop: 0 }}>
              +
            </button>
          </form>

          <div className="admin-cat-list">
            {categories.map((cat) => (
              <div key={cat.name} className="admin-cat-row">
                {editCatId === cat.id ? (
                  <>
                    <input
                      className="admin-cat-edit-input"
                      value={editCatName}
                      onChange={(e) => setEditCatName(e.target.value)}
                    />
                    <div className="admin-cat-actions">
                      <button onClick={() => handleUpdateCategory(cat.id)}>ОК</button>
                      <button onClick={() => setEditCatId(null)}>Отмена</button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="admin-cat-name">{cat.name}</span>
                    <div className="admin-cat-actions">
                      <button
                        onClick={() => {
                          setEditCatId(cat.id);
                          setEditCatName(cat.name);
                        }}
                      >
                        Изм.
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteCategory(cat.id)}
                      >
                        Удалить
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="admin-box" style={{ marginTop: '1.5rem' }}>
        <h3>Все товары и услуги ({services.length})</h3>
        <div className="admin-services-list">
          {services.map((srv) => (
            <div key={srv.title} className="admin-service-row">
              <span>
                <strong>{srv.title}</strong> ({srv.category_name}) — {srv.price} ₽ (скидка{' '}
                {srv.discount_percent}%)
              </span>
              <div className="admin-cat-actions">
                <button onClick={() => startEditService(srv)}>Редактировать</button>
                <button className="delete-btn" onClick={() => handleDeleteService(srv.id)}>
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-box" style={{ marginTop: '1.5rem' }}>
        <h3>Все заказы покупателей ({ordersList.length})</h3>
        <div className="admin-services-list">
          {ordersList.map((ord, i) => (
            <div key={i} className="admin-service-row">
              <span>
                <strong>{ord.service_title}</strong> ({ord.quantity} шт.) — Клиент:{' '}
                {ord.user_name} | Адрес: {ord.delivery_address}
              </span>
              <div className="admin-discount-input">
                <select
                  value={ord.status}
                  onChange={(e) => handleOrderStatusChange(ord, e.target.value)}
                >
                  <option value="Оформлен">Оформлен</option>
                  <option value="В доставке">В доставке</option>
                  <option value="Выполнен">Выполнен</option>
                  <option value="Отменен">Отменен</option>
                </select>
                <button className="delete-btn" onClick={() => handleDeleteOrder(ord.id)}>
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-grid">
        <div className="admin-box">
          <h3>Модерация отзывов ({reviews.length})</h3>
          <div className="admin-services-list">
            {reviews.map((rev, i) => (
              <div key={i} className="admin-service-row">
                <span>
                  <strong>{rev.user_name}</strong> о «{rev.service_title}» ({rev.rating}★):{' '}
                  {rev.comment}
                </span>
                <button className="delete-btn" onClick={() => handleDeleteReview(rev.id)}>
                  Удалить
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-box">
          <h3>Пользователи и промокоды ({usersList.length})</h3>
          <div className="admin-services-list">
            {usersList.map((u) => (
              <div key={u.email} className="admin-service-row">
                <span>
                  <strong>{u.full_name}</strong> ({u.email}) — Промокод: {u.coupon_code} (
                  {u.personal_discount}%)
                </span>
                <div className="admin-cat-actions">
                  <button
                    onClick={() => {
                      const code = prompt('Введите промокод:', u.coupon_code);
                      const disc = prompt('Введите скидку % (0-90):', u.personal_discount);
                      if (code !== null && disc !== null) {
                        handleUpdateUserDiscount(u, Number(disc), code);
                      }
                    }}
                  >
                    Скидка
                  </button>
                  <button className="delete-btn" onClick={() => handleDeleteUser(u.id)}>
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}