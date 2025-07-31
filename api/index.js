const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// In-memory user storage
const users = [
  {
    id: 1,
    email: 'admin@vertex.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    role: 'admin',
    name: 'Admin User'
  },
  {
    id: 2,
    email: 'user@vertex.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    role: 'user',
    name: 'Regular User'
  }
];

// Handler principale per Vercel
export default async function handler(req, res) {
  // Configura CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { url, method } = req;
  
  try {
    // Route per login
    if (url === '/api/auth/login' && method === 'POST') {
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
      
      return res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    }
    
    // Route per registrazione
    if (url === '/api/auth/register' && method === 'POST') {
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
      
      return res.json({
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role
        }
      });
    }
    
    // Route per health check
    if (url === '/api/health' && method === 'GET') {
      return res.json({ status: 'OK', timestamp: new Date().toISOString() });
    }
    
    // Route non trovata
    res.status(404).json({ error: 'Route not found' });
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Errore del server' });
  }
}