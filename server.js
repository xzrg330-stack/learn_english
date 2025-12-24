const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3000;

// ==================== 重要修改：数据库配置 ====================
// 请替换为你的 RDS 外网地址（必须先在阿里云控制台申请外网地址！）
const dbConfig = {
  host: 'rm-2ze847t044szft812no.mysql.rds.aliyuncs.com',  // 注意：加上 .public
  port: 3306,
  user: 'learn',
  password: 'NNyymsy123!',           // 强烈建议后续用环境变量代替
  database: 'learn_english',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // 建议本地开发时关闭 SSL 严格校验（生产环境再开启）
  ssl: false
  // 如果强制要求 SSL，可改为：ssl: { rejectUnauthorized: false }
};

// 中间件
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); // 支持大 Base64 音频

// 创建连接池（全局）
const pool = mysql.createPool(dbConfig);

// 添加连接池错误监听（防止未捕获错误崩溃）
pool.on('error', (err) => {
  console.error('❌ 数据库连接池错误:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('数据库连接断开，正在尝试重连...');
  }
});

// ==================== 初始化数据库表 ====================
async function initDB() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 成功连接到阿里云 RDS');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS articles (
        id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        author VARCHAR(100),
        tags TEXT,
        viewCount INT DEFAULT 0,
        isPublished BOOLEAN DEFAULT TRUE,
        coverImage LONGTEXT,
        createdAt BIGINT
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS article_segments (
        id VARCHAR(36) PRIMARY KEY,
        article_id VARCHAR(36),
        text TEXT,
        translation TEXT,
        audioData LONGTEXT,
        sort_order INT,
        FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS article_vocabulary (
        id VARCHAR(36) PRIMARY KEY,
        article_id VARCHAR(36),
        word VARCHAR(100),
        definition TEXT,
        audioData LONGTEXT,
        FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
      )
    `);

    console.log("✅ 数据库表初始化成功");
  } catch (err) {
    console.error("❌ 数据库初始化失败:", err.message);
    if (err.code === 'ECONNREFUSED') {
      console.error("   → 连接被拒绝，请检查：");
      console.error("     1. 是否已申请外网地址（控制台 → 数据库连接 → 申请外网地址）");
      console.error("     2. 白名单是否包含你的本地 IP（数据安全性 → 白名单）");
      console.error("     3. 用户名/密码/数据库名是否正确");
    } else if (err.code === 'ETIMEDOUT') {
      console.error("   → 连接超时，通常是 host 用了内网地址");
    }
  } finally {
    if (connection) await connection.end();
  }
}

// ==================== API 路由 ====================

// 获取文章列表
app.get('/api/articles', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM articles ORDER BY createdAt DESC');

    const articles = await Promise.all(rows.map(async (article) => {
      const [segments] = await pool.query('SELECT * FROM article_segments WHERE article_id = ? ORDER BY sort_order', [article.id]);
      const [vocab] = await pool.query('SELECT * FROM article_vocabulary WHERE article_id = ?', [article.id]);

      return {
        ...article,
        tags: article.tags ? JSON.parse(article.tags) : [],
        segments,
        keyVocabulary: vocab,
        isPublished: !!article.isPublished
      };
    }));

    res.json(articles);
  } catch (err) {
    console.error('获取文章失败:', err);
    res.status(500).json({ error: '服务器错误' });
  }
});

// 保存文章（创建或更新）
app.post('/api/articles', async (req, res) => {
  const article = req.body;
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const [existing] = await connection.query('SELECT id FROM articles WHERE id = ?', [article.id]);

    if (existing.length > 0) {
      // 更新
      await connection.query(
        'UPDATE articles SET title=?, author=?, tags=?, coverImage=? WHERE id=?',
        [article.title, article.author, JSON.stringify(article.tags), article.coverImage, article.id]
      );
      await connection.query('DELETE FROM article_segments WHERE article_id = ?', [article.id]);
      await connection.query('DELETE FROM article_vocabulary WHERE article_id = ?', [article.id]);
    } else {
      // 新增
      await connection.query(
        'INSERT INTO articles (id, title, author, tags, coverImage, createdAt, viewCount, isPublished) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [article.id, article.title, article.author, JSON.stringify(article.tags), article.coverImage, Date.now(), 0, true]
      );
    }

    // 插入片段
    for (let i = 0; i < article.segments.length; i++) {
      const s = article.segments[i];
      await connection.query(
        'INSERT INTO article_segments (id, article_id, text, translation, audioData, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
        [s.id, article.id, s.text, s.translation, s.audioData, i]
      );
    }

    // 插入词汇
    for (const v of article.keyVocabulary) {
      await connection.query(
        'INSERT INTO article_vocabulary (id, article_id, word, definition, audioData) VALUES (?, ?, ?, ?, ?)',
        [v.id, article.id, v.word, v.definition, v.audioData]
      );
    }

    await connection.commit();
    res.json({ success: true });
  } catch (err) {
    await connection.rollback();
    console.error('保存文章失败:', err);
    res.status(500).json({ error: '保存失败' });
  } finally {
    connection.release();
  }
});

// 增加阅读量
app.post('/api/articles/:id/view', async (req, res) => {
  try {
    await pool.query('UPDATE articles SET viewCount = viewCount + 1 WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 删除文章
app.delete('/api/articles/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM articles WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== 启动服务器 ====================
app.listen(port, '0.0.0.0', async () => {
  console.log(`🚀 后端服务器已启动: http://localhost:${port}`);
  console.log(`   访问文章列表: http://localhost:${port}/api/articles`);
  await initDB();  // 启动后初始化表
});