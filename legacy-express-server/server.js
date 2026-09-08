require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const port = process.env.PORT || 4000;

// Middleware de seguridad
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Conexión a Supabase PostgreSQL
const pool = new Pool({
  connectionString: process.env.SUPABASE_URL + '/postgres?anon=true',
});

// Test de conexión al iniciar
pool.query('SELECT NOW() as current_time', (err, res) => {
  if (err) {
    console.error('❌ Error conectando a Supabase PostgreSQL:', err.message);
    process.exit(1);
  }
  console.log('✅ Conectado a Supabase PostgreSQL');
  console.log('📅 Servidor:', res.rows[0].current_time);
});

// ==========================================
// RUTAS DE AUTENTICACIÓN (JWT + bcrypt)
// ==========================================

// REGISTRO de nuevo usuario
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@^\s@+.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Formato de email inválido' });
    }

    // 1. Hash de contraseña usando bcryptjs
    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 2. Insertar usuario en la base de datos
    const userQuery = `
      INSERT INTO users (email, password, name, role)
      VALUES ($1, $2, $3, 'supervisor')
      RETURNING id, email, name, role, created_at
    `;
    
    const userResult = await pool.query(userQuery, [email, hashedPassword, name]);

    // 3. Generar JWT token
    const token = jwt.sign(
      { userId: userResult.rows[0].id, role: userResult.rows[0].role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      token,
      user: {
        id: userResult.rows[0].id,
        email: userResult.rows[0].email,
        name: userResult.rows[0].name,
        role: userResult.rows[0].role
      }
    });
  } catch (error) {
    console.error('❌ Error en registro:', error.message);
    
    // Manejo de errores de duplicados
    if (error.code === '23505') {
      return res.status(409).json({ error: 'El correo electrónico ya está registrado' });
    }
    
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// LOGIN de usuario existente
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    }

    // 1. Buscar usuario en la base de datos
    const userQuery = 'SELECT * FROM users WHERE email = $1';
    const userResult = await pool.query(userQuery, [email]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = userResult.rows[0];

    // 2. Comparar contraseña con hash usando bcryptjs
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // 3. Generar JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('❌ Error en login:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// VALIDAR JWT (middleware de protección)
app.use('/api/protected', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];

    // Verificar y decodificar JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Adjuntar información del usuario a la petición
    req.user = {
      id: decoded.userId,
      role: decoded.role
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' });
    }
    res.status(500).json({ error: 'Error al validar token' });
  }
});

// Ruta de ejemplo protegida
app.get('/api/protected/hello', (req, res) => {
  res.json({
    message: `Hola, usuario ${req.user.id}!`,
    role: req.user.role
  });
});

// Ruta de salud
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Servidor OBRA360 funcionando',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('❌ Error global:', err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor
const server = app.listen(port, () => {
  console.log('========================================');
  console.log('🚀  OBRA360 Backend Iniciado');
  console.log('========================================');
  console.log(`📍 Puerto: ${port}`);
  console.log(`🌐 Entorno: ${process.env.NODE_ENV}`);
  console.log(`🔗 URL Base: http://localhost:${port}`);
  console.log('========================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 Recibiendo señal de terminación...');
  server.close(() => {
    console.log('✅ Servidor cerrado');
    process.exit(0);
  });
});

module.exports = app;