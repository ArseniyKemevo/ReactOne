import { createContext, useContext, useState, useEffect } from 'react';

const DataContext = createContext();

export const API_URL = 'http://localhost:5000/api';

export function DataProvider({ children }) {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [users, setUsers] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [servRes, catRes] = await Promise.all([
        fetch(`${API_URL}/services`),
        fetch(`${API_URL}/categories`),
      ]);

      const servData = servRes.ok ? await servRes.json() : [];
      const catData = catRes.ok ? await catRes.json() : [];

      setServices(Array.isArray(servData) ? servData : []);
      setCategories(Array.isArray(catData) ? catData : []);

      try {
        const revRes = await fetch(`${API_URL}/reviews`);
        if (revRes.ok) {
          const revData = await revRes.json();
          setReviews(Array.isArray(revData) ? revData : []);
        }
      } catch (_) {
        setReviews([]);
      }

      try {
        const usrRes = await fetch(`${API_URL}/users`);
        if (usrRes.ok) {
          const usrData = await usrRes.json();
          setUsers(Array.isArray(usrData) ? usrData : []);
        }
      } catch (_) {
        setUsers([]);
      }
    } catch (err) {
      setError('Не удалось подключиться к серверу (проверьте, запущен ли node server.js на порту 5000)');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const logout = () => setUser(null);

  return (
    <DataContext.Provider
      value={{
        services,
        setServices,
        categories,
        setCategories,
        reviews,
        setReviews,
        users,
        setUsers,
        user,
        setUser,
        currentUser: user,
        setCurrentUser: setUser,
        logout,
        loading,
        error,
        fetchAllData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);