import React, { useEffect, useState } from "react";

export default function ProductModal({ open, mode, initialProduct, onClose, onSubmit }) {
    const [form, setForm] = useState({ name: "", category: "", description: "", price: "", stock: "" });

    useEffect(() => {
        if (open) setForm(initialProduct || { name: "", category: "", description: "", price: "", stock: "" });
    }, [open, initialProduct]);

    if (!open) return null;

    return (
        <div className="backdrop" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <h3>{mode === "edit" ? "Правка" : "Новый товар"}</h3>
                <form className="form" onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}>
                    <input className="input" placeholder="Название" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                    <input className="input" placeholder="Категория" value={form.category} onChange={e => setForm({...form, category: e.target.value})} required />
                    <textarea className="input" placeholder="Описание" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                    <input className="input" type="number" placeholder="Цена" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required />
                    <input className="input" type="number" placeholder="Склад" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} required />
                    <div className="modal__footer">
                        <button type="button" className="btn" onClick={onClose}>Отмена</button>
                        <button type="submit" className="btn btn--primary">Сохранить</button>
                    </div>
                </form>
            </div>
        </div>
    );
}