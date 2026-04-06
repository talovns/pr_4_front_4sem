import React, { useEffect, useState } from 'react';

export default function UserModal({ open, initialUser, onClose, onSubmit }) {
  const [form, setForm] = useState({
    id: undefined,
    email: '',
    first_name: '',
    last_name: '',
    role: 'user',
    blocked: false,
  });

  useEffect(() => {
    if (open) {
      setForm(
        initialUser || {
          id: undefined,
          email: '',
          first_name: '',
          last_name: '',
          role: 'user',
          blocked: false,
        }
      );
    }
  }, [open, initialUser]);

  if (!open) return null;

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Правка пользователя</h3>
        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(form);
          }}
        >
          <input
            className="input"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            className="input"
            placeholder="Имя"
            value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
            required
          />
          <input
            className="input"
            placeholder="Фамилия"
            value={form.last_name}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
            required
          />

          <select
            className="input"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="user">user</option>
            <option value="seller">seller</option>
            <option value="admin">admin</option>
          </select>

          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={Boolean(form.blocked)}
              onChange={(e) => setForm({ ...form, blocked: e.target.checked })}
            />
            Заблокирован
          </label>

          <div className="modal__footer">
            <button type="button" className="btn" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn btn--primary">
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
