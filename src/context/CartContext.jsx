import { createContext, useState, useEffect, useContext } from 'react';
import { useData } from './DataContext';

const CartContext = createContext();

export function CartProvider({ children }) {
  const { user } = useData();
  const [cart, setCart] = useState([]);

  const loadCartFromDb = async (userId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/cart/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setCart(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (user && user.id) {
      loadCartFromDb(user.id);
    } else {
      try {
        const saved = localStorage.getItem('techstore_guest_cart');
        setCart(saved ? JSON.parse(saved) : []);
      } catch (e) {
        setCart([]);
      }
    }
  }, [user]);

  const saveGuestCart = (newCart) => {
    setCart(newCart);
    localStorage.setItem('techstore_guest_cart', JSON.stringify(newCart));
  };

  const addToCart = async (service) => {
    if (user && user.id) {
      await fetch('http://localhost:5000/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, service_id: service.id, count: 1 }),
      });
      loadCartFromDb(user.id);
    } else {
      const existing = cart.find((item) => item.id === service.id);
      let updated;
      if (existing) {
        updated = cart.map((item) =>
          item.id === service.id ? { ...item, count: item.count + 1 } : item
        );
      } else {
        updated = [...cart, { ...service, count: 1 }];
      }
      saveGuestCart(updated);
    }
  };

  const updateQuantity = async (serviceId, amount) => {
    const existing = cart.find((item) => item.id === serviceId);
    if (!existing) return;

    const newCount = existing.count + amount;

    if (user && user.id) {
      await fetch('http://localhost:5000/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, service_id: serviceId, count: newCount }),
      });
      loadCartFromDb(user.id);
    } else {
      let updated;
      if (newCount <= 0) {
        updated = cart.filter((item) => item.id !== serviceId);
      } else {
        updated = cart.map((item) =>
          item.id === serviceId ? { ...item, count: newCount } : item
        );
      }
      saveGuestCart(updated);
    }
  };

  const removeFromCart = async (serviceId) => {
    if (user && user.id) {
      await fetch(`http://localhost:5000/api/cart/${user.id}/${serviceId}`, {
        method: 'DELETE',
      });
      loadCartFromDb(user.id);
    } else {
      const updated = cart.filter((item) => item.id !== serviceId);
      saveGuestCart(updated);
    }
  };

  const clearCart = async () => {
    if (user && user.id) {
      await fetch(`http://localhost:5000/api/cart/${user.id}`, {
        method: 'DELETE',
      });
      setCart([]);
    } else {
      saveGuestCart([]);
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addToCart, updateQuantity, removeFromCart, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}