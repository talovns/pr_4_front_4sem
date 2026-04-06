import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { setTokens } from '../auth/storage';
import './ProductsPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/products';

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const data = await api.login(form);
      setTokens(data);
      navigate(from, { replace: true });
    } catch (err) {
      const status = err?.response?.status;
      const apiError = err?.response?.data?.error;
      if (status === 403 && String(apiError || '').toLowerCase().includes('blocked')) {
        alert('Пользователь заблокирован');
      } else if (apiError) {
        alert(String(apiError));
      } else {
        alert('Ошибка входа');
      }
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
          <div className="header__right">Login</div>
        </div>
      </header>
      <main className="main">
        <div className="container">
          <div className="toolbar">
            <h1 className="title">Вход</h1>
          </div>
          <form className="form" onSubmit={onSubmit}>
            <input
              className="input"
              type='email'
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <input
              className="input"
              placeholder="Пароль"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <div className="modal__footer">
              <button className="btn btn--primary" type="submit" disabled={loading}>
                {loading ? 'Входим...' : 'Войти'}
              </button>
            </div>
            <div style={{ opacity: 0.85, fontSize: 13 }}>
              Нет аккаунта? <Link to="/register">Регистрация</Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
