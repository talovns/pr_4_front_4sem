// Подключаем Swagger
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const express = require('express');
const { nanoid } = require('nanoid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const app = express();
const port = 3000;

// Avoid 304 responses for API (axios treats 304 as error by default)
app.set('etag', false);

app.use(cors({ origin: "http://localhost:3001" }));
app.use(express.json());

// Disable caching for API responses
app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
});

// Logging middleware (logs method, status, path, and body for modifying requests)
app.use((req, res, next) => {
    res.on('finish', () => {
        const time = new Date().toISOString();
        // Use originalUrl to include mounted router prefixes (e.g. /api-docs)
        console.log(`[${time}] [${req.method}] ${res.statusCode} ${req.originalUrl}`);
        if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
            console.log('Body:', req.body);
        }
    });
    next();
});

// Данные: минимум 10 товаров
let products = [
    { id: nanoid(6), title: "iPhone 15", category: "Смартфоны", description: "Новейший смартфон", price: 85000 },
    { id: nanoid(6), title: "MacBook Air", category: "Ноутбуки", description: "Тонкий и мощный", price: 120000 },
    { id: nanoid(6), title: "AirPods Pro", category: "Аксессуары", description: "Шумоподавление", price: 20000 },
    { id: nanoid(6), title: "iPad Pro", category: "Планшеты", description: "Для работы и творчества", price: 95000 },
    { id: nanoid(6), title: "Apple Watch", category: "Часы", description: "Следите за здоровьем", price: 35000 },
    { id: nanoid(6), title: "Samsung S24", category: "Смартфоны", description: "Флагман на Android", price: 80000 },
    { id: nanoid(6), title: "Sony WH-1000XM5", category: "Аксессуары", description: "Лучшие наушники", price: 30000 },
    { id: nanoid(6), title: "Asus ROG", category: "Ноутбуки", description: "Игровой монстр", price: 150000 },
    { id: nanoid(6), title: "Kindle Paperwhite", category: "Электронные книги", description: "Для чтения", price: 15000 },
    { id: nanoid(6), title: "Logitech MX Master", category: "Аксессуары", description: "Лучшая мышь", price: 10000 }
];

let users = [];

const ROLES = {
    USER: 'user',
    SELLER: 'seller',
    ADMIN: 'admin',
};

async function hashPassword(password) {
    const rounds = 10;
    return bcrypt.hash(password, rounds);
}

async function verifyPassword(password, passwordHash) {
    return bcrypt.compare(password, passwordHash);
}

// Seed demo users for testing roles (in-memory)
if (users.length === 0) {
    users.push(
        {
            id: nanoid(6),
            email: 'admin@demo.local',
            first_name: 'Admin',
            last_name: 'User',
            role: ROLES.ADMIN,
            blocked: false,
            password: bcrypt.hashSync('admin123', 10),
        },
        {
            id: nanoid(6),
            email: 'seller@demo.local',
            first_name: 'Seller',
            last_name: 'User',
            role: ROLES.SELLER,
            blocked: false,
            password: bcrypt.hashSync('seller123', 10),
        },
        {
            id: nanoid(6),
            email: 'user@demo.local',
            first_name: 'Regular',
            last_name: 'User',
            role: ROLES.USER,
            blocked: false,
            password: bcrypt.hashSync('user123', 10),
        }
    );
}

// JWT settings
const JWT_SECRET = process.env.JWT_SECRET || 'access_secret';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'refresh_secret';
const ACCESS_EXPIRES_IN = '15m';
const REFRESH_EXPIRES_IN = '7d';

// In-memory refresh token store
const refreshTokens = new Set();

function generateAccessToken(user) {
    return jwt.sign({ sub: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
}

function generateRefreshToken(user) {
    return jwt.sign({ sub: user.id, email: user.email, role: user.role }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
}

function authMiddleware(req, res, next) {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        const user = users.find((u) => u.id === payload.sub);
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }
        if (user.blocked) {
            return res.status(403).json({ error: 'User is blocked' });
        }
        // Use current user state (role can change after token issued)
        req.user = { sub: user.id, email: user.email, role: user.role };
        return next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

function requireRoles(allowedRoles) {
    return (req, res, next) => {
        const role = req?.user?.role;
        if (!role) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        if (!allowedRoles.includes(role)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        return next();
    };
}

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
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
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
 *         - title
 *         - category
 *         - price
 *       properties:
 *         id:
 *           type: string
 *           description: Уникальный идентификатор товара (генерируется автоматически)
 *         title:
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
 *       example:
 *         id: "a1b2c3"
 *         title: "iPhone 15"
 *         category: "Смартфоны"
 *         description: "Новейший смартфон"
 *         price: 85000
 *
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - first_name
 *         - last_name
 *       properties:
 *         id:
 *           type: string
 *           description: Уникальный идентификатор пользователя
 *         email:
 *           type: string
 *           format: email
 *         first_name:
 *           type: string
 *         last_name:
 *           type: string
 *         role:
 *           type: string
 *           description: Роль пользователя
 *           enum: [user, seller, admin]
 *         blocked:
 *           type: boolean
 *           description: Заблокирован ли пользователь
 *       example:
 *         id: "u1v2w3"
 *         email: "ivan@example.com"
 *         first_name: "Ivan"
 *         last_name: "Ivanov"
 *         role: "user"
 *         blocked: false

 *     UserUpdateRequest:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         first_name:
 *           type: string
 *         last_name:
 *           type: string
 *         role:
 *           type: string
 *           enum: [user, seller, admin]
 *         blocked:
 *           type: boolean
 *       example:
 *         first_name: "Petr"
 *         last_name: "Petrov"
 *         role: "seller"
 *         blocked: false
 *
 *     AuthRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *       example:
 *         email: "ivan@example.com"
 *         password: "qwerty123"
 *
 *     AuthResponse:
 *       type: object
 *       required:
 *         - accessToken
 *         - refreshToken
 *       properties:
 *         accessToken:
 *           type: string
 *           description: "JWT access-токен (передавать в Authorization: Bearer <token>)"
 *         refreshToken:
 *           type: string
 *           description: "JWT refresh-токен (для обновления пары токенов)"
 *       example:
 *         accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - first_name
 *               - last_name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               role:
 *                 type: string
 *                 description: Роль пользователя (для учебного задания)
 *                 enum: [user, seller, admin]
 *             example:
 *               email: "ivan@example.com"
 *               password: "qwerty123"
 *               first_name: "Ivan"
 *               last_name: "Ivanov"
 *               role: "user"
 *     responses:
 *       201:
 *         description: Пользователь успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Некорректные данные
 *       409:
 *         description: Пользователь с таким email уже существует
 */


// Auth routes
app.post("/api/auth/register", async (req, res) => {
    const { email, first_name, last_name, password, role } = req.body;

    if (!email || !password || !first_name || !last_name) {
        return res.status(400).json({ error: "email, first_name, last_name and password are required" });
    }

    const isUserExists = users.some((user) => user.email === email);
    if (isUserExists) {
        return res.status(409).json({ error: "email already exists" });
    }

    const requestedRole = role !== undefined ? String(role) : ROLES.USER;
    if (requestedRole === 'guest') {
        return res.status(400).json({ error: 'guest is not a registrable role' });
    }
    const allowedRegisterRoles = [ROLES.USER, ROLES.SELLER, ROLES.ADMIN];
    if (!allowedRegisterRoles.includes(requestedRole)) {
        return res.status(400).json({ error: `role must be one of: ${allowedRegisterRoles.join(', ')}` });
    }

    const newUser = {
        id: nanoid(6),
        email: String(email),
        first_name: String(first_name),
        last_name: String(last_name),
        role: requestedRole,
        blocked: false,
        password: await hashPassword(password) // stored hashed
    };

    users.push(newUser);
    // Do not return password hash in response
    const { password: _p, ...publicUser } = newUser;
    res.status(201).json(publicUser);
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Авторизация пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AuthRequest'
 *     responses:
 *       200:
 *         description: Успешная авторизация
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Отсутствуют обязательные поля
 *       401:
 *         description: Неверные учетные данные
 *       404:
 *         description: Пользователь не найден
 */
app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "email and password are required" });
    }

    const user = users.find((u) => u.email === email);
    if (!user) {
        return res.status(404).json({ error: "user not found" });
    }

    if (user.blocked) {
        return res.status(403).json({ error: 'user is blocked' });
    }

    const isAuthenticated = await verifyPassword(password, user.password);
    if (!isAuthenticated) {
        return res.status(401).json({ error: "not authenticated" });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    refreshTokens.add(refreshToken);
    res.status(200).json({ accessToken, refreshToken });
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Получить информацию о текущем пользователе
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Информация о пользователе
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Missing/invalid/expired access token
 *       404:
 *         description: Пользователь не найден
 */
app.get('/api/auth/me', authMiddleware, (req, res) => {
    const userId = req.user.sub;
    const user = users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: 'user not found' });
    const { password: _p, ...publicUser } = user;
    res.json(publicUser);
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Обновить access/refresh токены
 *     description: Получает refresh-токен из заголовка и возвращает новую пару токенов (ротация refresh-токена)
 *     tags: [Auth]
 *     parameters:
 *       - in: header
 *         name: x-refresh-token
 *         schema:
 *           type: string
 *         required: true
 *         description: Refresh-токен
 *     responses:
 *       200:
 *         description: Новая пара токенов
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Refresh-токен не передан
 *       401:
 *         description: Refresh-токен невалиден/истёк или не найден
 */
app.post('/api/auth/refresh', (req, res) => {
    const refreshToken = req.headers['x-refresh-token'];
    if (!refreshToken) {
        return res.status(400).json({ error: 'refreshToken is required (x-refresh-token header)' });
    }

    if (!refreshTokens.has(String(refreshToken))) {
        return res.status(401).json({ error: 'Invalid refresh token' });
    }

    try {
        const payload = jwt.verify(String(refreshToken), REFRESH_SECRET);
        const user = users.find((u) => u.id === payload.sub);
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        if (user.blocked) {
            refreshTokens.delete(String(refreshToken));
            return res.status(403).json({ error: 'User is blocked' });
        }

        // Rotation: delete old refresh, issue a new pair
        refreshTokens.delete(String(refreshToken));
        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);
        refreshTokens.add(newRefreshToken);
        return res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
    } catch (err) {
        refreshTokens.delete(String(refreshToken));
        return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
});

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Получить список пользователей
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список пользователей
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Missing/invalid/expired access token
 *       403:
 *         description: Forbidden
 */
app.get('/api/users', authMiddleware, requireRoles([ROLES.ADMIN]), (req, res) => {
    const publicUsers = users.map(({ password: _p, ...rest }) => rest);
    res.json(publicUsers);
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Получить пользователя по id
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID пользователя
 *     responses:
 *       200:
 *         description: Пользователь
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Missing/invalid/expired access token
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Пользователь не найден
 */
app.get('/api/users/:id', authMiddleware, requireRoles([ROLES.ADMIN]), (req, res) => {
    const user = users.find((u) => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: 'user not found' });
    const { password: _p, ...publicUser } = user;
    res.json(publicUser);
});

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Обновить информацию о пользователе
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID пользователя
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserUpdateRequest'
 *     responses:
 *       200:
 *         description: Пользователь обновлён
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Некорректные данные
 *       401:
 *         description: Missing/invalid/expired access token
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Пользователь не найден
 */
app.put('/api/users/:id', authMiddleware, requireRoles([ROLES.ADMIN]), (req, res) => {
    const index = users.findIndex((u) => u.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'user not found' });

    const payload = req.body || {};
    const allowed = {};
    if (payload.email !== undefined) allowed.email = String(payload.email);
    if (payload.first_name !== undefined) allowed.first_name = String(payload.first_name);
    if (payload.last_name !== undefined) allowed.last_name = String(payload.last_name);
    if (payload.blocked !== undefined) allowed.blocked = Boolean(payload.blocked);
    if (payload.role !== undefined) {
        const role = String(payload.role);
        if (![ROLES.USER, ROLES.SELLER, ROLES.ADMIN].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }
        allowed.role = role;
    }

    users[index] = { ...users[index], ...allowed, id: req.params.id };
    const { password: _p, ...publicUser } = users[index];
    res.json(publicUser);
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Заблокировать пользователя
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID пользователя
 *     responses:
 *       204:
 *         description: Пользователь заблокирован
 *       401:
 *         description: Missing/invalid/expired access token
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Пользователь не найден
 */
app.delete('/api/users/:id', authMiddleware, requireRoles([ROLES.ADMIN]), (req, res) => {
    const index = users.findIndex((u) => u.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'user not found' });
    users[index] = { ...users[index], blocked: true };
    res.status(204).send();
});

// Роуты CRUD
// Public read access (guest browsing)
app.get("/api/products", (req, res) => res.json(products));
/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получить список всех товаров
 *     tags: [Products]
 *     description: Доступно без авторизации (гостевой просмотр)
 *     responses:
 *       200:
 *         description: Список товаров успешно получен
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *       401:
 *         description: Missing/invalid/expired access token
 *       403:
 *         description: Forbidden
 */

app.get("/api/products/:id", (req, res) => {
    const product = products.find((p) => p.id === req.params.id);
    if (!product) {
        return res.status(404).json({ error: "Not found" });
    }
    res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получить товар по ID
 *     tags: [Products]
 *     description: Доступно без авторизации (гостевой просмотр)
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID товара
 *     responses:
 *       200:
 *         description: Товар найден
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       401:
 *         description: Missing/invalid/expired access token
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Товар не найден
 */


/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Добавить новый товар
 *     description: Доступно ролям seller/admin
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
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

app.post("/api/products", authMiddleware, requireRoles([ROLES.SELLER, ROLES.ADMIN]), (req, res) => {
    const { title, category, description, price } = req.body;
    if (!title || !category || price === undefined) {
        return res.status(400).json({ error: 'title, category and price are required' });
    }
    const newProduct = { id: nanoid(6), title: String(title), category: String(category), description: description || '', price: Number(price) };
    products.push(newProduct);
    res.status(201).json(newProduct);
});

app.put("/api/products/:id", authMiddleware, requireRoles([ROLES.SELLER, ROLES.ADMIN]), (req, res) => {
    const index = products.findIndex((p) => p.id === req.params.id);
    if (index === -1) {
        return res.status(404).json({ error: "Not found" });
    }

    const updatedProduct = {
        ...products[index],
        title: req.body.title !== undefined ? String(req.body.title) : products[index].title,
        category: req.body.category !== undefined ? String(req.body.category) : products[index].category,
        description: req.body.description !== undefined ? req.body.description : products[index].description,
        price: req.body.price !== undefined ? Number(req.body.price) : products[index].price,
        id: req.params.id
    };
    products[index] = updatedProduct;
    res.json(updatedProduct);
});

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Обновить параметры товара
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
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

app.patch("/api/products/:id", authMiddleware, requireRoles([ROLES.SELLER, ROLES.ADMIN]), (req, res) => {
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
 *     description: Доступно ролям seller/admin
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
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

app.delete("/api/products/:id", authMiddleware, requireRoles([ROLES.ADMIN]), (req, res) => {
    products = products.filter(p => p.id !== req.params.id);
    res.status(204).send();
});
/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удалить товар по ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
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