import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const PRODUCTS = [
  { id: 1, title: 'Механическая клавиатура', price: 4500 },
  { id: 2, title: 'Беспроводная мышь', price: 2300 },
  { id: 3, title: 'Игровой монитор 144Hz', price: 18900},
  { id: 4, title: 'Гарнитура с микрофоном', price: 5400 },
  { id: 5, title: 'Коврик для мыши XXL', price: 1200 },
  { id: 6, title: 'USB-хаб Type-C', price: 1900 },
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
              src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg"
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