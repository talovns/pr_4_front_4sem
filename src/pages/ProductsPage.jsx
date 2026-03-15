import React, { useEffect, useState } from "react";
import { api } from "../api";
import ProductModal from "../components/ProductModal"; // Подключаем модалку из папки components
import "./ProductsPage.css"; // Импортируем стили

export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState({ open: false, mode: "create", data: null });

    useEffect(() => { loadProducts(); }, []);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const data = await api.getProducts();
            setProducts(data);
        } catch (err) {
            console.error(err);
            alert("Ошибка загрузки");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Удалить товар?")) return;
        try {
            await api.deleteProduct(id);
            setProducts(prev => prev.filter(p => p.id !== id));
        } catch (err) { alert("Ошибка удаления"); }
    };

    const handleSubmitModal = async (payload) => {
        try {
            if (modal.mode === "create") {
                const newItem = await api.createProduct(payload);
                setProducts([...products, newItem]);
            } else {
                const updated = await api.updateProduct(payload.id, payload);
                setProducts(products.map(p => p.id === payload.id ? updated : p));
            }
            setModal({ ...modal, open: false });
        } catch (err) { alert("Ошибка сохранения"); }
    };

    return (
        <div className="page">
            <header className="header">
                <div className="header__inner">
                    <div className="brand">My Shop API</div>
                    <div className="header__right">React + Express</div>
                </div>
            </header>
            <main className="main">
                <div className="container">
                    <div className="toolbar">
                        <h1 className="title">Товары ({products.length})</h1>
                        <button className="btn btn--primary" onClick={() => setModal({ open: true, mode: "create", data: null })}>
                            + Добавить товар
                        </button>
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
                                        <div className="userName">{p.name}</div>
                                        <div className="userId">{p.category}</div>
                                        <div className="userAge">{p.price} ₽ (Склад: {p.stock})</div>
                                    </div>
                                    <div className="userActions">
                                        <button className="btn" onClick={() => setModal({ open: true, mode: "edit", data: p })}>Редактировать</button>
                                        <button className="btn btn--danger" onClick={() => handleDelete(p.id)}>Удалить</button>
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