import { useState } from 'react'
import './App.css';

function ProductCard(props) {
  const [count, setCount] = useState(0);

  const handleAdd = () => setCount(prev => prev + 1);
  const handleRemove = () => setCount(prev => (prev > 0 ? prev - 1 : 0));
  const handleReset = () => setCount(0);

  return (
    <div className="card">
      <img
        src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg"
        className="logo react"
        alt="React logo"
      />
      <h3>{props.title}</h3>
      <p>{props.price} ₽</p>

      <div className="counter-row">
        <button onClick={handleRemove}>-</button>
        <span>{count}</span>
        <button onClick={handleAdd}>+</button>
      </div>

      <button className="reset-btn" onClick={handleReset}>
        Удалить
      </button>
    </div>
  );
}

export default function App() {
  return (
      <div className="app">
        <h1>Каталог товаров</h1>
        <div className="card-list">
          <ProductCard title="Товар 1" price={1200} />
          <ProductCard title="Товар 2" price={3400} />
          <ProductCard title="Товар 3" price={5600} />
        </div>
      </div>
    );
}