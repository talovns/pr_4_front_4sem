import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import ProductModal from '../components/ProductModal';
import './ProductsPage.css';
import { getAccessToken } from '../auth/storage';
import { clearGuestMode, clearTokens } from '../auth/storage';

function canCreateOrEdit(role) {
  return role === 'seller' || role === 'admin';
}

function canDelete(role) {
  return role === 'admin';
}

export default function ProductDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, mode: 'edit', data: null });
  const [me, setMe] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        if (getAccessToken()) {
          try {
            const user = await api.me();
            setMe(user);
          } catch (e) {
            // ignore
          }
        }

        const data = await api.getProductById(id);
        setProduct(data);
        setModal({ open: false, mode: 'edit', data });
      } catch (err) {
        console.error(err);
        alert('Ошибка загрузки товара');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const role = me?.role;
  const isSellerOrAdmin = canCreateOrEdit(role);
  const isAdmin = canDelete(role);

  const handleDelete = async () => {
    if (!window.confirm('Удалить товар?')) return;
    try {
      await api.deleteProduct(id);
      navigate('/products');
    } catch (err) {
      console.error(err);
      const status = err?.response?.status;
      const apiError = err?.response?.data?.error;
      if (status === 403 && String(apiError || '').toLowerCase().includes('blocked')) {
        clearTokens();
        clearGuestMode();
        alert('Пользователь заблокирован');
        navigate('/login', { replace: true });
        return;
      }
      alert(apiError ? String(apiError) : 'Ошибка удаления');
    }
  };

  const handleSubmitModal = async (payload) => {
    try {
      const updated = await api.updateProduct(id, payload);
      setProduct(updated);
      setModal({ open: false, mode: 'edit', data: updated });
    } catch (err) {
      console.error(err);
      const status = err?.response?.status;
      const apiError = err?.response?.data?.error;
      if (status === 403 && String(apiError || '').toLowerCase().includes('blocked')) {
        clearTokens();
        alert('Пользователь заблокирован');
        navigate('/login', { replace: true });
        return;
      }
      alert(apiError ? String(apiError) : 'Ошибка сохранения');
    }
  };

  return (
    <div className="page">
      <header className="header">
        <div className="header__inner">
          <div className="brand">My Shop API</div>
          <div className="header__right">{me ? `${me.email} (${me.role})` : 'Product details'}</div>
        </div>
      </header>
      <main className="main">
        <div className="container">
          <div className="toolbar">
            <h1 className="title">Товар</h1>
            <div className="userActions">
              <Link className="btn" to="/products">Назад</Link>
              {isSellerOrAdmin ? (
                <button className="btn" onClick={() => setModal({ open: true, mode: 'edit', data: product })} disabled={!product}>
                  Редактировать
                </button>
              ) : null}
              {isAdmin ? (
                <button className="btn btn--danger" onClick={handleDelete}>
                  Удалить
                </button>
              ) : null}
            </div>
          </div>

          {loading ? (
            <div className="empty">Загрузка...</div>
          ) : !product ? (
            <div className="empty">Товар не найден</div>
          ) : (
            <div className="userRow">
              <div className="userMain">
                <div className="userName">{product.title}</div>
                <div className="userId">{product.category}</div>
                <div className="userDescription">{product.description}</div>
                <div className="userAge">{product.price} ₽</div>
                <div className="userId">id: {product.id}</div>
              </div>
            </div>
          )}
        </div>
      </main>

      <ProductModal
        open={modal.open}
        mode={modal.mode}
        initialProduct={modal.data}
        onClose={() => setModal({ ...modal, open: false })}
        onSubmit={handleSubmitModal}
      />
    </div>
  );
}
