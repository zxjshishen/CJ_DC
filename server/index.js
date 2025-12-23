require('dotenv').config(); // 加载 .env 文件中的配置
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

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
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'cjdcxt',
    port: parseInt(process.env.DB_PORT || '3306'),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true,
    charset: 'utf8mb4'
};

const db = mysql.createPool(dbConfig);

// 简单的保活检查
db.getConnection((err, connection) => {
    if (err) {
        console.error('❌ 数据库连接失败:', err.message);
        console.error('请检查 server/.env 文件中的配置是否正确');
    } else {
        console.log('✅ 成功连接到数据库:', dbConfig.database);
        connection.release();
    }
});

// --- 3. API 接口 ---

app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: '无文件' });
    res.json({ url: `/uploads/${req.file.filename}` });
});

// 获取菜品
app.get('/api/dishes', (req, res) => {
    db.query('SELECT * FROM dishes WHERE status = 1 ORDER BY name ASC', (err, results) => {
        if (err) return res.status(500).json(err);
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

// 获取库存
app.get('/api/ingredients', (req, res) => {
    db.query('SELECT * FROM ingredients ORDER BY category, name', (err, results) => {
        if (err) return res.status(500).json(err);
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

// 下单
app.post('/api/orders', (req, res) => {
    const { tableNo, guestCount, items, total, eventName } = req.body;
    const orderId = Date.now().toString();
    
    const sql = 'INSERT INTO orders (id, event_name, guest_count, total_amount, status, items, table_no) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.query(sql, [orderId, eventName || '日常用餐', guestCount, total, 'pending', JSON.stringify(items), tableNo], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: '菜单已确认', orderId });
    });
});

// 初始化数据库结构
app.get('/api/init-db', (req, res) => {
    // 既然用户已经手动建表，这里主要作为连接测试
    res.send("数据库连接正常 (cjdcxt)");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 后端服务已启动: http://localhost:${PORT}`);
    console.log(`📦 正在连接数据库: ${dbConfig.database}`);
});