const path = require('path');
// 显式指定 .env 文件路径为当前文件所在目录下的 .env
const result = require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// 增加请求日志中间件，方便调试
app.use((req, res, next) => {
    // 忽略 favicon 请求日志
    if (req.url !== '/favicon.ico') {
        console.log(`[Request] ${req.method} ${req.url}`);
    }
    next();
});

// --- 1. 图片存储配置 ---
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

app.use('/uploads', express.static(uploadDir));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); 
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- 2. 数据库连接 ---

// 修复：如果环境变量中有莫名其妙的 k8s 地址，强制使用 localhost
let dbHost = process.env.DB_HOST || 'localhost';
if (dbHost.includes('test-db-mysql.ns-a8otxcxh.svc')) {
    console.warn('⚠️ 检测到错误的云环境 Host 变量，已自动修正为 localhost');
    dbHost = '127.0.0.1';
}

const dbConfig = {
    host: dbHost,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD, // 必须从 .env 读取
    database: process.env.DB_NAME || 'cjdcxt',
    port: parseInt(process.env.DB_PORT || '3306'),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true,
    charset: 'utf8mb4'
};

console.log('-----------------------------------');
console.log('正在连接数据库...');
console.log(`Host: ${dbConfig.host}`);
console.log(`User: ${dbConfig.user}`);
console.log(`Database: ${dbConfig.database}`);
console.log('-----------------------------------');

const db = mysql.createPool(dbConfig);

// 健康检查路由
app.get('/', (req, res) => {
    res.send('Restaurant ERP Backend is Running! 🚀');
});

// 简单的保活检查
db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ 数据库连接失败:', err.message);
        if (err.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('👉 原因: 密码错误或用户权限不足。请检查 server/.env 文件。');
        } else if (err.code === 'ECONNREFUSED') {
            console.error('👉 原因: 数据库未启动，或者端口不对 (默认3306)。');
        } else if (err.code === 'ENOTFOUND') {
            console.error('👉 原因: 找不到主机地址。');
        }
    } else {
        console.log('✅ 成功连接到 MySQL 数据库!');
        connection.release();
    }
});

// --- 3. API 接口 ---

app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: '无文件' });
    res.json({ url: `/uploads/${req.file.filename}` });
});

app.get('/api/dishes', (req, res) => {
    db.query('SELECT * FROM dishes WHERE status = 1 ORDER BY name ASC', (err, results) => {
        if (err) {
            // 如果表不存在，返回空数组，不报错
            if (err.code === 'ER_NO_SUCH_TABLE') return res.json([]);
            console.error("查询菜品失败:", err.message);
            return res.status(500).json({ error: err.message });
        }
        const mapped = results.map(r => {
            let attrs = {};
            if (typeof r.attributes === 'object' && r.attributes !== null) {
                attrs = r.attributes;
            } else if (typeof r.attributes === 'string') {
                try { attrs = JSON.parse(r.attributes); } catch(e) {}
            }

            return {
                id: r.id,
                name: r.name,
                price: r.price,
                image: r.image_url,
                category: r.category,
                attributes: attrs,
                flavor: attrs.flavor || '',
                difficulty: attrs.difficulty || ''
            };
        });
        res.json(mapped);
    });
});

app.get('/api/ingredients', (req, res) => {
    db.query('SELECT * FROM ingredients ORDER BY category, name', (err, results) => {
        if (err) {
            if (err.code === 'ER_NO_SUCH_TABLE') return res.json([]);
            console.error("查询库存失败:", err.message);
            return res.status(500).json({ error: err.message });
        }
        const mapped = results.map(r => ({
            id: r.id,
            name: r.name,
            unit: r.unit,
            quantity: r.current_stock,
            cost: r.cost_per_unit,
            category: r.category,
            source: r.source,
            threshold: r.alert_threshold || 2,
            expiryDate: r.expiry_date
        }));
        res.json(mapped);
    });
});

app.post('/api/orders', (req, res) => {
    const { tableNo, guestCount, items, total, eventName } = req.body;
    const orderId = Date.now().toString();
    
    const sql = 'INSERT INTO orders (id, event_name, guest_count, total_amount, status, items, table_no) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.query(sql, [orderId, eventName || '日常用餐', guestCount, total, 'pending', JSON.stringify(items), tableNo], (err, result) => {
        if (err) {
            console.error("下单失败:", err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: '菜单已确认', orderId });
    });
});

app.get('/api/init-db', (req, res) => {
    console.log("正在执行数据库初始化...");
    const sqlStatements = [
        `CREATE TABLE IF NOT EXISTS dishes (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            price DECIMAL(10, 2) NOT NULL,
            image_url TEXT,
            category VARCHAR(100),
            attributes JSON,
            status TINYINT DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS ingredients (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            unit VARCHAR(50),
            current_stock DECIMAL(10, 2) DEFAULT 0,
            cost_per_unit DECIMAL(10, 2) DEFAULT 0,
            alert_threshold DECIMAL(10, 2) DEFAULT 2,
            category VARCHAR(100),
            source VARCHAR(255),
            expiry_date DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS orders (
            id VARCHAR(50) PRIMARY KEY,
            event_name VARCHAR(255),
            guest_count INT,
            total_amount DECIMAL(10, 2),
            status VARCHAR(50) DEFAULT 'pending',
            items JSON,
            table_no VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
    ];

    let completed = 0;
    let errors = [];

    const runNext = (index) => {
        if (index >= sqlStatements.length) {
            if (errors.length > 0) return res.status(500).send(`部分建表失败: ${errors.join('; ')}`);
            return res.send("✅ 数据库表结构初始化成功！");
        }
        db.query(sqlStatements[index], (err) => {
            if (err) errors.push(err.message);
            runNext(index + 1);
        });
    };

    runNext(0);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 后端服务已启动: http://localhost:${PORT}`);
});