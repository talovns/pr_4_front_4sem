const express = require('express');
const { nanoid } = require('nanoid');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors({ origin: "http://localhost:3001" }));
app.use(express.json());

// Данные: минимум 10 товаров
let products = [
    { id: nanoid(6), name: "iPhone 15", category: "Смартфоны", description: "Новейший смартфон", price: 85000, stock: 10, rating: 4.9 },
    { id: nanoid(6), name: "MacBook Air", category: "Ноутбуки", description: "Тонкий и мощный", price: 120000, stock: 5, rating: 4.8 },
    { id: nanoid(6), name: "AirPods Pro", category: "Аксессуары", description: "Шумоподавление", price: 20000, stock: 25, rating: 4.7 },
    { id: nanoid(6), name: "iPad Pro", category: "Планшеты", description: "Для работы и творчества", price: 95000, stock: 8, rating: 4.8 },
    { id: nanoid(6), name: "Apple Watch", category: "Часы", description: "Следите за здоровьем", price: 35000, stock: 15, rating: 4.6 },
    { id: nanoid(6), name: "Samsung S24", category: "Смартфоны", description: "Флагман на Android", price: 80000, stock: 12, rating: 4.7 },
    { id: nanoid(6), name: "Sony WH-1000XM5", category: "Аксессуары", description: "Лучшие наушники", price: 30000, stock: 7, rating: 4.9 },
    { id: nanoid(6), name: "Asus ROG", category: "Ноутбуки", description: "Игровой монстр", price: 150000, stock: 3, rating: 4.5 },
    { id: nanoid(6), name: "Kindle Paperwhite", category: "Электронные книги", description: "Для чтения", price: 15000, stock: 20, rating: 4.8 },
    { id: nanoid(6), name: "Logitech MX Master", category: "Аксессуары", description: "Лучшая мышь", price: 10000, stock: 30, rating: 4.9 }
];

// Роуты CRUD
app.get("/api/products", (req, res) => res.json(products));

app.post("/api/products", (req, res) => {
    const newProduct = { id: nanoid(6), ...req.body, price: Number(req.body.price), stock: Number(req.body.stock) };
    products.push(newProduct);
    res.status(201).json(newProduct);
});

app.patch("/api/products/:id", (req, res) => {
    const index = products.findIndex(p => p.id === req.params.id);
    if (index !== -1) {
        products[index] = { ...products[index], ...req.body };
        res.json(products[index]);
    } else res.status(404).json({ error: "Not found" });
});

app.delete("/api/products/:id", (req, res) => {
    products = products.filter(p => p.id !== req.params.id);
    res.status(204).send();
});

app.listen(port, () => console.log(`Сервер: http://localhost:${port}`));