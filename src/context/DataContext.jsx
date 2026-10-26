import { createContext, useState, useEffect, useContext } from 'react';

const DataContext = createContext();

export function DataProvider({ children }) {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('techstore_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const resServices = await fetch('http://localhost:5000/api/services');
      const resCategories = await fetch('http://localhost:5000/api/categories');

      if (!resServices.ok || !resCategories.ok) {
        throw new Error('Ошибка получения данных с сервера');
      }

      const servicesData = await resServices.json();
      const categoriesData = await resCategories.json();

      setServices(servicesData);
      setCategories(categoriesData);
    } catch (err) {
      setError(err.message || 'Не удалось подключиться к серверу API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addCategory = async (name) => {
    const res = await fetch('http://localhost:5000/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Ошибка добавления категории');
    }
    setCategories([...categories, data]);
  };

  const registerUser = async (email, password, full_name) => {
    const res = await fetch('http://localhost:5000/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Ошибка регистрации');
    }
    setUser(data);
    localStorage.setItem('techstore_user', JSON.stringify(data));
    return data;
  };

  const loginUser = async (email, password) => {
    const res = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Ошибка входа');
    }
    setUser(data);
    localStorage.setItem('techstore_user', JSON.stringify(data));
    return data;
  };

  const logoutUser = () => {
    setUser(null);
    localStorage.removeItem('techstore_user');
  };

  return (
    <DataContext.Provider
      value={{
        services,
        categories,
        user,
        loading,
        error,
        fetchData,
        addCategory,
        registerUser,
        loginUser,
        logoutUser,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}