import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const PRODUCTS = [
  { id: 1, title: 'Механическая клавиатура', price: 4500, image: '/images/keyboard.jpg' },
  { id: 2, title: 'Беспроводная мышь', price: 2300, image: '/images/mouse.png' },
  { id: 3, title: 'Игровой монитор 144Hz', price: 18900, image: '/images/monitor.jpg' },
  { id: 4, title: 'Гарнитура с микрофоном', price: 5400, image: '/images/yshi.jpg' },
  { id: 5, title: 'Коврик для мыши XXL', price: 1200, image: '/images/kover.jpg' },
  { id: 6, title: 'USB-хаб Type-C', price: 1900, image: '/images/hub.jpg' },
];

export default function Catalog() {
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const handleAddAndRedirect = (product) => {
    addToCart(product);
    navigate('/cart');
  };

  return (
    <div>
      <h1>Каталог товаров</h1>
      <div className="card-list">
        {PRODUCTS.map(product => (
          <div key={product.id} className="card">
            <img
              src={product.image}
              className="logo react"
              alt="Товар"
            />
            <h3>{product.title}</h3>
            <p className="price">{product.price.toLocaleString()} ₽</p>
            <div className="card-actions">
              <button onClick={() => addToCart(product)}>В корзину</button>
              <button className="btn-secondary" onClick={() => handleAddAndRedirect(product)}>
                Купить и перейти
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}