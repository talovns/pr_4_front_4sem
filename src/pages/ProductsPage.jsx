import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { api } from "../api";
import ProductModal from "../components/ProductModal"; // Подключаем модалку из папки components
import { clearGuestMode, clearTokens, getAccessToken } from '../auth/storage';
import "./ProductsPage.css"; // Импортируем стили

function canCreateOrEdit(role) {
    return role === 'seller' || role === 'admin';
}

function canDelete(role) {
    return role === 'admin';
}

export default function ProductsPage() {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState({ open: false, mode: "create", data: null });
    const [me, setMe] = useState(null);

    useEffect(() => {
        loadProducts();
        if (getAccessToken()) {
            loadMe();
        }
    }, []);

    const loadMe = async () => {
        try {
            const user = await api.me();
            setMe(user);
        } catch (err) {
            const status = err?.response?.status;
            const apiError = err?.response?.data?.error;
            if (status === 403 && String(apiError || '').toLowerCase().includes('blocked')) {
                clearTokens();
                alert('Пользователь заблокирован');
                navigate('/login', { replace: true });
            }
        }
    };

    const loadProducts = async () => {
        try {
            setLoading(true);
            const data = await api.getProducts();
            setProducts(data);
        } catch (err) {
            console.error(err);
            const apiError = err?.response?.data?.error;
            alert(apiError ? String(apiError) : 'Ошибка загрузки');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Удалить товар?")) return;
        try {
            await api.deleteProduct(id);
            setProducts(prev => prev.filter(p => p.id !== id));
        } catch (err) {
            const status = err?.response?.status;
            const apiError = err?.response?.data?.error;
            if (status === 403 && String(apiError || '').toLowerCase().includes('blocked')) {
                clearTokens();
                alert('Пользователь заблокирован');
                navigate('/login', { replace: true });
                return;
            }
            alert(apiError ? String(apiError) : 'Ошибка удаления');
        }
    };

    const handleSubmitModal = async (payload) => {
        try {
            if (modal.mode === "create") {
                const newItem = await api.createProduct({
                    title: payload.title,
                    category: payload.category,
                    description: payload.description,
                    price: Number(payload.price)
                });
                setProducts([...products, newItem]);
            } else {
                const updated = await api.updateProduct(payload.id, {
                    title: payload.title,
                    category: payload.category,
                    description: payload.description,
                    price: Number(payload.price)
                });
                setProducts(products.map(p => p.id === payload.id ? updated : p));
            }
            setModal({ ...modal, open: false });
        } catch (err) {
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

    const handleLogout = () => {
        clearTokens();
        clearGuestMode();
        navigate('/login');
    };

    const role = me?.role;
    const isSellerOrAdmin = canCreateOrEdit(role);
    const isAdmin = canDelete(role);

    return (
        <div className="page">
            <header className="header">
                <div className="header__inner">
                    <div className="brand">My Shop API</div>
                    <div className="header__right">
                        {me ? `${me.email} (${me.role})` : 'React + Express'}
                        {isAdmin ? (
                            <button className="btn" style={{ marginLeft: 10 }} onClick={() => navigate('/users')}>Пользователи</button>
                        ) : null}
                        {me ? (
                            <button className="btn" style={{ marginLeft: 10 }} onClick={handleLogout}>Выйти</button>
                        ) : null}
                    </div>
                </div>
            </header>
            <main className="main">
                <div className="container">
                    <div className="toolbar">
                        <h1 className="title">Товары ({products.length})</h1>
                        {isSellerOrAdmin ? (
                            <button className="btn btn--primary" onClick={() => setModal({ open: true, mode: "create", data: null })}>
                                + Добавить товар
                            </button>
                        ) : null}
                    </div>
                    
                    {loading ? (
                        <div className="empty">Загрузка...</div>
                    ) : products.length === 0 ? (
                        <div className="empty">Товаров пока нет</div>
                    ) : (
                        <div className="list">
                            {products.map(p => (
                                <div key={p.id} className="userRow">
                                    <div className="userMain">
                                        <div className="userName">{p.title}</div>
                                        <div className="userId">{p.category}</div>
                                        <div className="userDescription">{p.description}</div>
                                        <div className="userAge">{p.price} ₽</div>
                                    </div>
                                    <div className="userActions">
                                        <button className="btn" onClick={() => navigate(`/products/${p.id}`)}>Подробнее</button>
                                        {isSellerOrAdmin ? (
                                            <button className="btn" onClick={() => setModal({ open: true, mode: "edit", data: p })}>Редактировать</button>
                                        ) : null}
                                        {isAdmin ? (
                                            <button className="btn btn--danger" onClick={() => handleDelete(p.id)}>Удалить</button>
                                        ) : null}
                                    </div>
                                </div>
                            ))}
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