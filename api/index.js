const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// In-memory user storage (in produzione usare un database)
const users = [
  {
    id: 1,
    email: 'admin@vertex.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: admin123
    role: 'admin',
    name: 'Admin User'
  },
  {
    id: 2,
    email: 'user@vertex.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: user123
    role: 'user',
    name: 'Regular User'
  }
];

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email già registrata' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: users.length + 1,
      email,
      password: hashedPassword,
      role: 'user',
      name: email.split('@')[0]
    };
    
    users.push(newUser);
    
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Errore del server' });
  }
});

// Import and use betting routes
const betsRouter = require('./bets');
app.use('/api/bets', authenticateToken, betsRouter);

// Tips routes
app.get('/api/tips', (req, res) => {
  const tips = [
    {
      id: 1,
      match: 'Inter vs Juventus',
      prediction: 'Over 2.5 Goals',
      odds: 1.85,
      sport: 'football',
      confidence: 'high',
      author: 'Marco Betting',
      event_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending'
    },
    {
      id: 2,
      match: 'Lakers vs Warriors',
      prediction: 'Lakers -4.5',
      odds: 1.92,
      sport: 'basketball',
      confidence: 'medium',
      author: 'NBA Expert',
      event_date: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      status: 'pending'
    },
    {
      id: 3,
      match: 'Djokovic vs Nadal',
      prediction: 'Djokovic to Win',
      odds: 1.75,
      sport: 'tennis',
      confidence: 'high',
      author: 'Tennis Pro',
      event_date: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      status: 'pending'
    }
  ];
  
  res.json({ success: true, tips });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;