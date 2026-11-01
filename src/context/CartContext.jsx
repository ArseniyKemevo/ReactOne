import { createContext, useContext, useState, useEffect } from 'react';
import { useData, API_URL } from './DataContext';

const CartContext = createContext();

export function CartProvider({ children }) {
  const { user } = useData();
  const [cart, setCart] = useState([]);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartError, setCartError] = useState(null);

  const fetchCart = async () => {
    if (!user || !user.id) {
      setCart([]);
      return;
    }
    setCartLoading(true);
    setCartError(null);
    try {
      const res = await fetch(`${API_URL}/cart/${user.id}`);
      const data = res.ok ? await res.json() : [];
      setCart(Array.isArray(data) ? data : []);
    } catch (err) {
      setCart([]);
      setCartError('Ошибка загрузки корзины');
    } finally {
      setCartLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user]);

  const addToCart = async (service) => {
    if (!user) {
      alert('Войдите в аккаунт, чтобы добавить товар в корзину!');
      return;
    }
    try {
      await fetch(`${API_URL}/cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, service_id: service.id, count: 1 }),
      });
      await fetchCart();
    } catch (err) {
      setCartError('Ошибка добавления в корзину');
    }
  };

  const updateQuantity = async (serviceId, newCount) => {
    if (!user) return;
    try {
      await fetch(`${API_URL}/cart`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, service_id: serviceId, count: newCount }),
      });
      await fetchCart();
    } catch (err) {
      setCartError('Ошибка обновления количества');
    }
  };

  const removeFromCart = async (serviceId) => {
    if (!user) return;
    try {
      await fetch(`${API_URL}/cart/${user.id}/${serviceId}`, { method: 'DELETE' });
      await fetchCart();
    } catch (err) {
      setCartError('Ошибка удаления из корзины');
    }
  };

  const clearCart = async () => {
    if (!user) {
      setCart([]);
      return;
    }
    try {
      await fetch(`${API_URL}/cart/${user.id}`, { method: 'DELETE' });
      setCart([]);
    } catch (err) {
      setCartError('Ошибка очистки корзины');
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        cartItems: cart,
        cartLoading,
        cartError,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);