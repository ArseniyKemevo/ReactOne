import { createContext, useContext, useState, useEffect } from 'react';

const DataContext = createContext();
const API_URL = 'http://localhost:5000/api';

const FALLBACK_CATEGORIES = [
  { id: 1, name: 'Парикмахерские услуги' },
  { id: 2, name: 'Ногтевой сервис' },
  { id: 3, name: 'Косметология' },
  { id: 4, name: 'Массаж и SPA' },
];

// 10 услуг, из которых 3 (30%) имеют скидку
const FALLBACK_SERVICES = [
  { id: 1, title: 'Женская стрижка и укладка', description: 'Мытье головы, модельная стрижка и профессиональная укладка феном.', duration: 60, price: 2500, discount_percent: 20, category_id: 1 },
  { id: 2, title: 'Окрашивание AirTouch', description: 'Сложное окрашивание волос щадящими составами премиум-класса.', duration: 180, price: 7500, discount_percent: 0, category_id: 1 },
  { id: 3, title: 'Мужская стрижка', description: 'Классическая или креативная стрижка машинкой и ножницами.', duration: 45, price: 1500, discount_percent: 0, category_id: 1 },
  { id: 4, title: 'Маникюр с покрытием гель-лак', description: 'Аппаратный маникюр, выравнивание пластины и стойкое покрытие.', duration: 90, price: 2200, discount_percent: 15, category_id: 2 },
  { id: 5, title: 'SMART-педикюр', description: 'Полная обработка стоп дисками и уходовый спа-комплекс.', duration: 90, price: 2800, discount_percent: 0, category_id: 2 },
  { id: 6, title: 'Укрепление ногтей гелем', description: 'Восстановление архитектуры и укрепление натуральных ногтей.', duration: 60, price: 1800, discount_percent: 0, category_id: 2 },
  { id: 7, title: 'Ультразвуковая чистка лица', description: 'Глубокое очищение пор, тонизация и успокаивающая альгинатная маска.', duration: 75, price: 3200, discount_percent: 25, category_id: 3 },
  { id: 8, title: 'Пилинг лица сезонный', description: 'Обновление кожи и выравнивание тона мягкими фруктовыми кислотами.', duration: 45, price: 2900, discount_percent: 0, category_id: 3 },
  { id: 9, title: 'Классический массаж спины', description: 'Снятие мышечного напряжения и проработка шейно-воротниковой зоны.', duration: 45, price: 2400, discount_percent: 0, category_id: 4 },
  { id: 10, title: 'SPA-ритуал «Антистресс»', description: 'Общий расслабляющий массаж тела с аромамаслами и обертыванием.', duration: 120, price: 5200, discount_percent: 0, category_id: 4 },
];

const FALLBACK_USERS = [
  { id: 1, email: 'admin@salon.ru', password: 'admin123', full_name: 'Администратор Салона', role: 'admin', coupon_code: 'VIP20', personal_discount: 20 },
  { id: 2, email: 'client@salon.ru', password: 'client123', full_name: 'Анна Иванова', role: 'client', coupon_code: 'WELCOME10', personal_discount: 10 },
  { id: 3, email: 'oleg@salon.ru', password: 'oleg123', full_name: 'Олег Смирнов', role: 'client', coupon_code: 'PROMO5', personal_discount: 5 },
];

export const COUPON_TYPES = [
  { code: 'NONE', label: 'Без купона (0%)', discount: 0 },
  { code: 'PROMO5', label: 'Купон PROMO5 (5%)', discount: 5 },
  { code: 'WELCOME10', label: 'Купон WELCOME10 (10%)', discount: 10 },
  { code: 'GOLD15', label: 'Купон GOLD15 (15%)', discount: 15 },
  { code: 'VIP20', label: 'Купон VIP20 (20%)', discount: 20 },
];

export function DataProvider({ children }) {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState(FALLBACK_USERS);
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [srvRes, catRes, usrRes] = await Promise.all([
        fetch(`${API_URL}/services`),
        fetch(`${API_URL}/categories`),
        fetch(`${API_URL}/users`),
      ]);
      if (!srvRes.ok || !catRes.ok) {
        throw new Error('Ошибка ответа серверного API');
      }
      const srvData = await srvRes.json();
      const catData = await catRes.json();
      const usrData = usrRes.ok ? await usrRes.json() : FALLBACK_USERS;

      setServices(srvData.map(s => ({ ...s, price: Number(s.price) })));
      setCategories(catData);
      setUsers(usrData);
    } catch (err) {
      // Переход на локальные данные, если сервер PostgreSQL не запущен, с уведомлением
      setServices(FALLBACK_SERVICES);
      setCategories(FALLBACK_CATEGORIES);
      setError('Сервер API (localhost:5000) недоступен — загружены демонстрационные данные из резервного хранилища.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const loginUser = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка авторизации');
      }
      setCurrentUser(data);
      localStorage.setItem('currentUser', JSON.stringify(data));
      return { success: true };
    } catch (err) {
      // Проверка по локальному списку, если API выключен
      const found = users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && (!u.password || u.password === password)
      );
      if (found) {
        setCurrentUser(found);
        localStorage.setItem('currentUser', JSON.stringify(found));
        return { success: true };
      }
      return { success: false, message: err.message || 'Неверный email или пароль' };
    } finally {
      setLoading(false);
    }
  };

  const logoutUser = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  const addCategory = async (name) => {
    if (!name.trim()) return { success: false, message: 'Введите название категории' };
    try {
      const res = await fetch(`${API_URL}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        const newCat = await res.json();
        setCategories((prev) => [...prev, newCat]);
        return { success: true };
      }
    } catch {
      // Локальное добавление при отключенном сервере
    }
    const newCat = { id: Date.now(), name: name.trim() };
    setCategories((prev) => [...prev, newCat]);
    return { success: true };
  };

  const updateServiceDiscount = async (serviceId, discountPercent) => {
    const validDiscount = Math.min(100, Math.max(0, Number(discountPercent) || 0));
    try {
      await fetch(`${API_URL}/services/${serviceId}/discount`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discount_percent: validDiscount }),
      });
    } catch {
      // Локальное обновление
    }
    setServices((prev) =>
      prev.map((s) => (s.id === serviceId ? { ...s, discount_percent: validDiscount } : s))
    );
  };

  const assignUserDiscount = async (userId, couponCode, personalDiscount) => {
    const validDiscount = Math.min(100, Math.max(0, Number(personalDiscount) || 0));
    try {
      await fetch(`${API_URL}/users/${userId}/discount`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coupon_code: couponCode, personal_discount: validDiscount }),
      });
    } catch {
      // Локальное обновление
    }
    setUsers((prev) =>
      prev.map((u) =>
        u.id === Number(userId)
          ? { ...u, coupon_code: couponCode, personal_discount: validDiscount }
          : u
      )
    );
    if (currentUser && currentUser.id === Number(userId)) {
      const updated = { ...currentUser, coupon_code: couponCode, personal_discount: validDiscount };
      setCurrentUser(updated);
      localStorage.setItem('currentUser', JSON.stringify(updated));
    }
  };

  return (
    <DataContext.Provider
      value={{
        services,
        categories,
        users,
        currentUser,
        loading,
        error,
        setError,
        fetchInitialData,
        loginUser,
        logoutUser,
        addCategory,
        updateServiceDiscount,
        assignUserDiscount,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);