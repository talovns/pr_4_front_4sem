import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { clearTokens } from '../auth/storage';
import UserModal from '../components/UserModal';
import './ProductsPage.css';

export default function UsersPage() {
  const navigate = useNavigate();

  const [me, setMe] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, data: null });

  const load = async () => {
    try {
      setLoading(true);
      const current = await api.me();
      setMe(current);

      if (current.role !== 'admin') {
        setUsers([]);
        return;
      }

      const list = await api.getUsers();
      setUsers(list);
    } catch (err) {
      console.error(err);
      // If token invalid, interceptor will clear tokens
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    clearTokens();
    navigate('/login');
  };

  const handleBlock = async (id) => {
    if (!window.confirm('Заблокировать пользователя?')) return;
    try {
      await api.blockUser(id);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, blocked: true } : u)));
    } catch (err) {
      console.error(err);
      alert('Ошибка блокировки');
    }
  };

  const handleSubmitModal = async (payload) => {
    try {
      const updated = await api.updateUser(payload.id, {
        email: payload.email,
        first_name: payload.first_name,
        last_name: payload.last_name,
        role: payload.role,
        blocked: payload.blocked,
      });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setModal({ open: false, data: null });
    } catch (err) {
      console.error(err);
      alert('Ошибка сохранения');
    }
  };

  const isAdmin = me?.role === 'admin';

  return (
    <div className="page">
      <header className="header">
        <div className="header__inner">
          <div className="brand">My Shop API</div>
          <div className="header__right">
            {me ? `${me.email} (${me.role})` : 'Users'}
            {me ? (
              <button className="btn" style={{ marginLeft: 10 }} onClick={handleLogout}>
                Выйти
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <main className="main">
        <div className="container">
          <div className="toolbar">
            <h1 className="title">Пользователи</h1>
            <div className="userActions">
              <Link className="btn" to="/products">
                Назад
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="empty">Загрузка...</div>
          ) : !me ? (
            <div className="empty">Не авторизован</div>
          ) : !isAdmin ? (
            <div className="empty">Доступ запрещён (нужна роль admin)</div>
          ) : users.length === 0 ? (
            <div className="empty">Пользователей нет</div>
          ) : (
            <div className="list">
              {users.map((u) => (
                <div key={u.id} className="userRow">
                  <div className="userMain">
                    <div className="userName">{u.email}</div>
                    <div className="userId">{u.first_name} {u.last_name}</div>
                    <div className="userDescription">role: {u.role}</div>
                    <div className="userAge">{u.blocked ? 'blocked' : 'active'}</div>
                    <div className="userId">id: {u.id}</div>
                  </div>
                  <div className="userActions">
                    <button className="btn" onClick={() => setModal({ open: true, data: u })}>
                      Редактировать
                    </button>
                    <button className="btn btn--danger" onClick={() => handleBlock(u.id)} disabled={u.blocked}>
                      Заблокировать
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <UserModal
        open={modal.open}
        initialUser={modal.data}
        onClose={() => setModal({ open: false, data: null })}
        onSubmit={handleSubmitModal}
      />
    </div>
  );
}
