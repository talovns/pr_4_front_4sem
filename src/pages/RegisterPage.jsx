import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { clearGuestMode, clearTokens, setGuestMode } from '../auth/storage';
import './ProductsPage.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    role: 'user',
  });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (form.role === 'guest') {
      // Гость — не аутентифицированный пользователь, регистрация не требуется
      clearTokens();
      setGuestMode();
      navigate('/products', { replace: true });
      return;
    }
    try {
      setLoading(true);
      clearGuestMode();
      await api.register(form);
      navigate('/login', { replace: true });
    } catch (err) {
      const apiError = err?.response?.data?.error;
      alert(apiError ? String(apiError) : 'Ошибка регистрации');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <header className="header">
        <div className="header__inner">
          <div className="brand">My Shop API</div>
          <div className="header__right">Register</div>
        </div>
      </header>
      <main className="main">
        <div className="container">
          <div className="toolbar">
            <h1 className="title">Регистрация</h1>
          </div>
          <form className="form" onSubmit={onSubmit}>
            <div className="userActions" style={{ justifyContent: 'flex-start', flexWrap: 'wrap' }}>
              <button
                type="button"
                className={form.role === 'guest' ? 'btn btn--primary' : 'btn'}
                onClick={() => setForm({ ...form, role: 'guest' })}
              >
                Гость
              </button>
              <button
                type="button"
                className={form.role === 'user' ? 'btn btn--primary' : 'btn'}
                onClick={() => setForm({ ...form, role: 'user' })}
              >
                Пользователь
              </button>
              <button
                type="button"
                className={form.role === 'seller' ? 'btn btn--primary' : 'btn'}
                onClick={() => setForm({ ...form, role: 'seller' })}
              >
                Продавец
              </button>
              <button
                type="button"
                className={form.role === 'admin' ? 'btn btn--primary' : 'btn'}
                onClick={() => setForm({ ...form, role: 'admin' })}
              >
                Администратор
              </button>
            </div>

            <input
              className="input"
              type='email'
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required={form.role !== 'guest'}
              disabled={form.role === 'guest'}
            />
            <input
              className="input"
              placeholder="Имя"
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              required={form.role !== 'guest'}
              disabled={form.role === 'guest'}
            />
            <input
              className="input"
              placeholder="Фамилия"
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              required={form.role !== 'guest'}
              disabled={form.role === 'guest'}
            />
            <input
              className="input"
              placeholder="Пароль"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required={form.role !== 'guest'}
              disabled={form.role === 'guest'}
            />
            <div className="modal__footer">
              <button className="btn btn--primary" type="submit" disabled={loading}>
                {loading ? 'Создаём...' : (form.role === 'guest' ? 'Продолжить' : 'Зарегистрироваться')}
              </button>
            </div>
            <div style={{ opacity: 0.85, fontSize: 13 }}>
              Уже есть аккаунт? <Link to="/login">Войти</Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
