import React, { useEffect, useState } from "react";

export default function ProductModal({ open, mode, initialProduct, onClose, onSubmit }) {
    const [form, setForm] = useState({ id: undefined, title: "", category: "", description: "", price: "" });

    useEffect(() => {
        if (open) {
            setForm(
                initialProduct || { id: undefined, title: "", category: "", description: "", price: "" }
            );
        }
    }, [open, initialProduct]);

    if (!open) return null;

    return (
        <div className="backdrop" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <h3>{mode === "edit" ? "Правка" : "Новый товар"}</h3>
                <form className="form" onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}>
                    <input className="input" placeholder="Название" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
                    <input className="input" placeholder="Категория" value={form.category} onChange={e => setForm({...form, category: e.target.value})} required />
                    <textarea className="input" placeholder="Описание" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                    <input className="input" type="number" placeholder="Цена" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required />
                    <div className="modal__footer">
                        <button type="button" className="btn" onClick={onClose}>Отмена</button>
                        <button type="submit" className="btn btn--primary">Сохранить</button>
                    </div>
                </form>
            </div>
        </div>
    );
}