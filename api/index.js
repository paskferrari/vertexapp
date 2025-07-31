const express = require('express');
const cors = require('cors');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Configurazione Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variabili d\'ambiente Supabase mancanti');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Middleware per autenticazione JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token di accesso richiesto' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token non valido' });
    }
    req.user = user;
    next();
  });
};

// Endpoint di registrazione
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e password sono richiesti' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La password deve essere di almeno 6 caratteri' });
    }

    // Controlla se l'utente esiste già
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'Utente già esistente' });
    }

    // Hash della password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Crea nuovo utente
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([
        {
          email,
          password: hashedPassword,
          role: 'user'
        }
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Errore inserimento utente:', insertError);
      return res.status(500).json({ error: 'Errore durante la registrazione' });
    }

    // Genera JWT token
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Utente creato con successo',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Errore registrazione:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Endpoint di login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e password sono richiesti' });
    }

    // Trova l'utente
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, password, role')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    // Verifica password
    const isValidPassword = await bcryptjs.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    // Genera JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login effettuato con successo',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Errore login:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Endpoint per ottenere le predizioni
app.get('/api/predictions', async (req, res) => {
  try {
    const { data: predictions, error } = await supabase
      .from('predictions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Errore recupero predizioni:', error);
      return res.status(500).json({ error: 'Errore recupero predizioni' });
    }

    res.json(predictions);
  } catch (error) {
    console.error('Errore:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Endpoint per creare una predizione (solo admin)
app.post('/api/predictions', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accesso negato' });
    }

    const { title, description, category, end_date } = req.body;

    if (!title || !end_date) {
      return res.status(400).json({ error: 'Titolo e data di fine sono richiesti' });
    }

    const { data: prediction, error } = await supabase
      .from('predictions')
      .insert([
        {
          title,
          description,
          category,
          end_date,
          created_by: req.user.userId
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Errore creazione predizione:', error);
      return res.status(500).json({ error: 'Errore creazione predizione' });
    }

    res.status(201).json(prediction);
  } catch (error) {
    console.error('Errore:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Avvia il server solo se non siamo in ambiente Vercel
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`✅ Server in ascolto sulla porta ${PORT}`);
    console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
  });
}

// Esporta l'app Express per Vercel
module.exports = app;