// app.js
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 3000;


mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({ secret: 'simple-secret', resave: false, saveUninitialized: false }));

function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    next();
  } else {
    res.redirect('/login');
  }
}

app.get('/', (req, res) => {
  if (req.session.userId) return res.redirect('/store');
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  res.render('login', { message: '' });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user && await bcrypt.compare(password, user.password)) {
    req.session.userId = user._id;
    res.redirect('/store');
  } else {
    res.render('login', { message: 'Invalid credentials' });
  }
});

app.get('/register', (req, res) => {
  res.render('register', { message: '' });
});

app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  const existing = await User.findOne({ email });
  if (existing) {
    res.render('register', { message: 'User already exists' });
  } else {
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = new User({ email, password: hashedPassword, store: {} });
    await newUser.save();
    req.session.userId = newUser._id;
    res.redirect('/store');
  }
});

app.get('/store', isAuthenticated, async (req, res) => {
  const user = await User.findById(req.session.userId);
  const storeObj = Object.fromEntries(user.store);
  res.render('store', { email: user.email, store: storeObj });
});

app.post('/store', isAuthenticated, async (req, res) => {
  const { key, value } = req.body;
  const user = await User.findById(req.session.userId);
  user.store.set(key, value);
  await user.save();
  res.redirect('/store');
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

app.listen(PORT, () => {
  console.log(`App running on http://localhost:${PORT}`);
});



// ===== API: User Registration =====
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  console.dir(req.body)
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
});

// ===== API: User Login =====
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  console.dir(req.body)
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ message: 'Invalid email or password' });

    req.session.userId = user._id;
    res.status(200).json({ message: 'Login successful' });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
});

// ===== API: Store Key-Value Pair =====
app.post('/api/store', isAuthenticated, async (req, res) => {
  const { key, value } = req.body;
   console.dir(req.body)
  try {
    const user = await User.findById(req.session.userId);
    user.store.set(key, value);
    await user.save();
    res.status(200).json({ message: 'Key-Value stored successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Storing failed', error: err.message });
  }
});

// ===== API: Retrieve Key-Value =====
app.get('/api/retrieve/:key', isAuthenticated, async (req, res) => {
  const key = req.params.key;
  try {
    const user = await User.findById(req.session.userId);
    if (user.store.has(key)) {
      res.status(200).json({ key: key, value: user.store.get(key) });
    } else {
      res.status(404).json({ message: 'Key not found' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Retrieval failed', error: err.message });
  }
});
