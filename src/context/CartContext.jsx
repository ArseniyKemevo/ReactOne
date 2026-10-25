import { createContext, useContext, useState } from 'react';
import { useData } from './DataContext';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const { currentUser, services } = useData();

  const addToCart = (service) => {
    setCart((prev) => {
      const exists = prev.find((item) => item.id === service.id);
      if (exists) {
        return prev.map((item) =>
          item.id === service.id ? { ...item, count: item.count + 1 } : item
        );
      }
      return [...prev, { ...service, count: 1 }];
    });
  };

  const increaseCount = (id) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, count: item.count + 1 } : item
      )
    );
  };

  const decreaseCount = (id) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, count: item.count - 1 } : item
        )
        .filter((item) => item.count > 0)
    );
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => setCart([]);

  // Синхронизируем актуальные скидки на услуги из каталога
  const detailedCart = cart.map((cartItem) => {
    const freshService = services.find((s) => s.id === cartItem.id) || cartItem;
    const discountPercent = freshService.discount_percent || 0;
    const finalUnitPrice = Math.round(freshService.price * (1 - discountPercent / 100));
    return {
      ...cartItem,
      price: freshService.price,
      discount_percent: discountPercent,
      finalUnitPrice,
    };
  });

  // Сумма с учетом скидок на сами услуги
  const subtotalPrice = detailedCart.reduce(
    (sum, item) => sum + item.finalUnitPrice * item.count,
    0
  );

  // Персональная скидка / купон авторизованного пользователя
  const userDiscountPercent = currentUser?.personal_discount || 0;
  const userDiscountAmount = Math.round(subtotalPrice * (userDiscountPercent / 100));
  const totalPrice = subtotalPrice - userDiscountAmount;

  return (
    <CartContext.Provider
      value={{
        cart: detailedCart,
        addToCart,
        removeFromCart,
        increaseCount,
        decreaseCount,
        clearCart,
        subtotalPrice,
        userDiscountPercent,
        userDiscountAmount,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);