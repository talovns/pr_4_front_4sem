// Подключаем Swagger
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

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

// Swagger definition
// Описание основного API
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API управления пользователями',
            version: '1.0.0',
            description: 'Простое API для управления пользователями',
        },
        servers: [
            {
                url: `http://localhost:${port}`,
                description: 'Локальный сервер',
            },
        ],
    },
    // Путь к файлам, в которых мы будем писать JSDoc-комментарии (наш текущий файл)
    apis: ['./app.js'],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
// Подключаем Swagger UI по адресу /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - category
 *         - price
 *         - stock
 *       properties:
 *         id:
 *           type: string
 *           description: Уникальный идентификатор товара (генерируется автоматически)
 *         name:
 *           type: string
 *           description: Название товара
 *         category:
 *           type: string
 *           description: Категория товара
 *         description:
 *           type: string
 *           description: Описание товара
 *         price:
 *           type: number
 *           description: Цена товара
 *         stock:
 *           type: integer
 *           description: Количество на складе
 *         rating:
 *           type: number
 *           description: Рейтинг товара
 *       example:
 *         id: "a1b2c3"
 *         name: "iPhone 15"
 *         category: "Смартфоны"
 *         description: "Новейший смартфон"
 *         price: 85000
 *         stock: 10
 *         rating: 4.9
 */


// Роуты CRUD
app.get("/api/products", (req, res) => res.json(products));
/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получить список всех товаров
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Список товаров успешно получен
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */


app.post("/api/products", (req, res) => {
    const newProduct = { id: nanoid(6), ...req.body, price: Number(req.body.price), stock: Number(req.body.stock) };
    products.push(newProduct);
    res.status(201).json(newProduct);
});
/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Добавить новый товар
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Товар успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 */

app.patch("/api/products/:id", (req, res) => {
    const index = products.findIndex(p => p.id === req.params.id);
    if (index !== -1) {
        products[index] = { ...products[index], ...req.body };
        res.json(products[index]);
    } else res.status(404).json({ error: "Not found" });
});
/**
 * @swagger
 * /api/products/{id}:
 *   patch:
 *     summary: Частично обновить данные товара
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID товара
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: Товар успешно обновлен
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Товар не найден
 */

app.delete("/api/products/:id", (req, res) => {
    products = products.filter(p => p.id !== req.params.id);
    res.status(204).send();
});
/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удалить товар по ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID товара
 *     responses:
 *       204:
 *         description: Товар успешно удален
 *       404:
 *         description: Товар не найден
 */

app.listen(port, () => console.log(`Сервер: http://localhost:${port}`));