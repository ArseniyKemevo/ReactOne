import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useData } from '../context/DataContext';

export default function Admin() {
  const { user, services, categories, addCategory, updateCategory, deleteCategory, fetchData } = useData();
  const [usersList, setUsersList] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [couponCode, setCouponCode] = useState('WELCOME10');
  const [personalDiscount, setPersonalDiscount] = useState(10);
  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState(null);
  const [editCatName, setEditCatName] = useState('');
  const [catMsg, setCatMsg] = useState('');
  const [adminMsg, setAdminMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetch('http://localhost:5000/api/users')
        .then((res) => res.json())
        .then((data) => {
          setUsersList(data);
          if (data.length > 0) {
            setSelectedUserId(data[0].id);
          }
        });
    }
  }, [user]);

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" />;
  }

  const handleAddCategory = async (e) => {
    e.preventDefault();
    setCatMsg('');
    setErrorMsg('');

    const trimmed = newCatName.trim();
    if (!trimmed) {
      setCatMsg('Введите название категории');
      return;
    }

    const alreadyExists = categories.some(
      (c) => c.name.trim().toLowerCase() === trimmed.toLowerCase()
    );

    if (alreadyExists) {
      setCatMsg('Такая категория уже есть (без учета регистра)');
      return;
    }

    try {
      await addCategory(trimmed);
      setNewCatName('');
      setCatMsg('Категория успешно добавлена!');
    } catch (err) {
      setCatMsg(err.message);
    }
  };

  const startEditCategory = (cat) => {
    setEditingCatId(cat.id);
    setEditCatName(cat.name);
    setCatMsg('');
  };

  const cancelEditCategory = () => {
    setEditingCatId(null);
    setEditCatName('');
  };

  const handleSaveCategory = async (id) => {
    setCatMsg('');
    const trimmed = editCatName.trim();
    if (!trimmed) {
      setCatMsg('Название категории не может быть пустым');
      return;
    }

    const alreadyExists = categories.some(
      (c) => c.id !== id && c.name.trim().toLowerCase() === trimmed.toLowerCase()
    );

    if (alreadyExists) {
      setCatMsg('Категория с таким названием уже существует');
      return;
    }

    try {
      await updateCategory(id, trimmed);
      setEditingCatId(null);
      setEditCatName('');
      setCatMsg('Категория успешно обновлена!');
    } catch (err) {
      setCatMsg(err.message);
    }
  };

  const handleDeleteCategory = async (id) => {
    setCatMsg('');
    try {
      await deleteCategory(id);
      setCatMsg('Категория удалена!');
    } catch (err) {
      setCatMsg(err.message);
    }
  };

  const handleUserDiscountUpdate = async (e) => {
    e.preventDefault();
    setAdminMsg('');
    setErrorMsg('');

    const discountNum = Number(personalDiscount);
    if (isNaN(discountNum) || discountNum < 10 || discountNum > 90) {
      setErrorMsg('Персональная скидка должна быть от 10% до 90%');
      return;
    }

    const res = await fetch(`http://localhost:5000/api/users/${selectedUserId}/discount`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coupon_code: couponCode,
        personal_discount: discountNum,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      setUsersList(usersList.map((u) => (u.id === data.id ? { ...u, ...data } : u)));
      setAdminMsg('Скидка пользователя обновлена!');
    } else {
      setErrorMsg(data.error || 'Ошибка при обновлении скидки');
    }
  };

  const handleServiceDiscountChange = async (serviceId, discountValue) => {
    setAdminMsg('');
    setErrorMsg('');

    const discountNum = Number(discountValue);
    if (isNaN(discountNum) || discountNum < 10 || discountNum > 90) {
      setErrorMsg('Скидка на товар должна быть от 10% до 90%');
      return;
    }

    const res = await fetch(`http://localhost:5000/api/services/${serviceId}/discount`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ discount_percent: discountNum }),
    });

    const data = await res.json();
    if (res.ok) {
      fetchData();
      setAdminMsg('Скидка на товар обновлена!');
    } else {
      setErrorMsg(data.error || 'Ошибка при обновлении скидки');
    }
  };

  return (
    <div className="admin-panel">
      <h1>Панель администратора</h1>

      {adminMsg && (
        <div className="status-box success-box">
          <span>{adminMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="status-box error-box">
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="admin-grid">
        <div className="admin-box">
          <h3>Управление категориями</h3>
          {catMsg && <p className="field-error">{catMsg}</p>}
          
          <form className="login-form" onSubmit={handleAddCategory} style={{ marginBottom: '1.2rem' }}>
            <div className="form-group">
              <label>Новая категория</label>
              <input
                type="text"
                placeholder="Сетевое оборудование"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
              />
            </div>
            <button type="submit" className="submit-btn">
              Добавить категорию
            </button>
          </form>

          <span className="filter-row-title">Список категорий:</span>
          <div className="admin-cat-list">
            {categories.map((c) => (
              <div key={c.id} className="admin-cat-row">
                {editingCatId === c.id ? (
                  <input
                    type="text"
                    value={editCatName}
                    onChange={(e) => setEditCatName(e.target.value)}
                    className="admin-cat-edit-input"
                  />
                ) : (
                  <span className="admin-cat-name">{c.name}</span>
                )}

                <div className="admin-cat-actions">
                  {editingCatId === c.id ? (
                    <>
                      <button
                        className="submit-btn"
                        style={{ margin: 0 }}
                        onClick={() => handleSaveCategory(c.id)}
                      >
                        Ок
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={cancelEditCategory}
                      >
                        Отмена
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="btn-secondary"
                        onClick={() => startEditCategory(c)}
                      >
                        Изменить
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteCategory(c.id)}
                      >
                        Удалить
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-box">
          <h3>Персональный купон пользователю</h3>
          <form className="login-form" onSubmit={handleUserDiscountUpdate}>
            <div className="form-group">
              <label>Пользователь</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
              >
                {usersList.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Купон</label>
              <select
                value={couponCode}
                onChange={(e) => {
                  const val = e.target.value;
                  setCouponCode(val);
                  if (val === 'WELCOME10') setPersonalDiscount(10);
                  if (val === 'SALE15') setPersonalDiscount(15);
                  if (val === 'VIP20') setPersonalDiscount(20);
                  if (val === 'MEGA30') setPersonalDiscount(30);
                  if (val === 'MAX90') setPersonalDiscount(90);
                }}
              >
                <option value="WELCOME10">WELCOME10 (10%)</option>
                <option value="SALE15">SALE15 (15%)</option>
                <option value="VIP20">VIP20 (20%)</option>
                <option value="MEGA30">MEGA30 (30%)</option>
                <option value="MAX90">MAX90 (90%)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Размер скидки (%) от 10 до 90</label>
              <input
                type="number"
                min="10"
                max="90"
                value={personalDiscount}
                onChange={(e) => setPersonalDiscount(e.target.value)}
              />
            </div>

            <button type="submit" className="submit-btn">
              Сохранить купон
            </button>
          </form>
        </div>

        <div className="admin-box" style={{ gridColumn: '1 / -1' }}>
          <h3>Скидки на позиции каталога (от 10% до 90%)</h3>
          <div className="admin-services-list">
            {services.map((s) => (
              <div key={s.id} className="admin-service-row">
                <span>{s.title}</span>
                <div className="admin-discount-input">
                  <input
                    type="number"
                    min="10"
                    max="90"
                    defaultValue={s.discount_percent >= 10 ? s.discount_percent : 10}
                    onBlur={(e) => handleServiceDiscountChange(s.id, e.target.value)}
                  />
                  <span>%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}