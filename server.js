const express = require('express');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// ===== MongoDB Connection =====
const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_CLUSTER}/${process.env.MONGO_DB}?retryWrites=true&w=majority`;

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ===== SCHEMAS =====
const userSchema = new mongoose.Schema({
  name: String,
  age: Number,
  email: String,
  username: String,
  password: String,
  userType: String
});
const User = mongoose.model('User', userSchema);

const contactSchema = new mongoose.Schema({
  name: String,
  email: String,
  subject: String,
  message: String,
  date: { type: Date, default: Date.now }
});
const Contact = mongoose.model('Contact', contactSchema);

const subscriptionSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true },
  plan: String,
  date: { type: Date, default: Date.now }
});
const Subscription = mongoose.model('Subscription', subscriptionSchema);

// ===== MIDDLEWARE =====
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: 'streamflix_secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: uri }),
  cookie: { maxAge: 1000 * 60 * 60 } // 1 hour
}));

// ===== HTML ROUTES =====
const serveHTML = (filename, res) => {
  const filePath = path.join(__dirname, filename);
  fs.readFile(filePath, 'utf-8', (err, data) => {
    if (err) return res.status(500).send("❌ File read error");
    res.send(data);
  });
};

app.get('/', (req, res) => serveHTML('index.html', res));
app.get('/login', (req, res) => serveHTML('login.html', res));
app.get('/login.html', (req, res) => serveHTML('login.html', res));
app.get('/register', (req, res) => serveHTML('register.html', res));
app.get('/register.html', (req, res) => serveHTML('register.html', res));
app.get('/hello', (req, res) => serveHTML('hello.html', res));
app.get('/hello.html', (req, res) => serveHTML('hello.html', res));
app.get('/popup', (req, res) => serveHTML('popup.html', res));
app.get('/popup.html', (req, res) => serveHTML('popup.html', res));
app.get('/profile.html', (req, res) => serveHTML('profile.html', res));
app.get('/contact.html', (req, res) => serveHTML('contact.html', res));
app.get('/subscription.html', (req, res) => serveHTML('subscription.html', res));

// ===== USER AUTH =====
app.post('/register', async (req, res) => {
  const { name, age, email, username, password, userType } = req.body;

  if (!name || !age || !email || !username || !password || !userType) {
    return res.send('❌ All fields are required!');
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.send('❌ Email already registered!');
  }

  try {
    await User.create({ name, age, email, username, password, userType });
    res.send('✅ Registration successful!');
  } catch (err) {
    console.error(err);
    res.status(500).send('❌ Server error during registration.');
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, password });

  if (!user) {
    return res.send('❌ Invalid email or password.');
  }

  req.session.user = {
    name: user.name,
    email: user.email,
    username: user.username,
    userType: user.userType
  };

  res.send('success');
});

app.get('/api/profile', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.json(req.session.user);
});

app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.send('❌ Error logging out');
    res.redirect('/login.html');
  });
});

// ===== CONTACT FORM =====
app.post('/submit', async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).send("❌ All fields are required.");
  }

  try {
    const newContact = new Contact({ name, email, subject, message });
    await newContact.save();
    res.status(200).send("✅ Message sent successfully.");
  } catch (error) {
    console.error("❌ Error saving contact form:", error);
    res.status(500).send("❌ Server error while sending message.");
  }
});

// ===== SUBSCRIPTION ROUTES =====
app.post('/subscribe', async (req, res) => {
  const { name, email, plan } = req.body;

  if (!name || !email || !plan) {
    return res.status(400).json({ message: "❌ Missing subscription details." });
  }

  try {
    const newSub = new Subscription({ name, email, plan });
    await newSub.save();
    res.status(200).json({ message: "✅ Subscription saved successfully." });
  } catch (error) {
    console.error("❌ Subscription save error:", error);
    res.status(500).json({ message: "❌ Server error during subscription." });
  }
});

app.get('/api/my-subscription', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ hasSubscription: false });
  }

  try {
    const userEmail = req.session.user.email;

    // Find latest subscription (most recent one)
    const subscription = await Subscription.findOne({ email: userEmail }).sort({ date: -1 });

    if (!subscription) {
      return res.json({ hasSubscription: false });
    }

    // Check and parse date properly
    const startDate = subscription.date instanceof Date ? subscription.date : new Date(subscription.date);
    let endDate = new Date(startDate);

    // Normalize plan
    const plan = subscription.plan.toLowerCase();

    if (plan.includes("monthly")) {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (plan.includes("quarterly")) {
      endDate.setMonth(endDate.getMonth() + 3);
    } else if (plan.includes("yearly")) {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Format price
    function getPrice(planName) {
      const lower = planName.toLowerCase();
      if (lower.includes("year")) return "₹999";
      if (lower.includes("quarter")) return "₹499";
      return "₹199";
    }

    // Return readable format
    res.json({
      hasSubscription: true,
      name: subscription.name,
      email: subscription.email,
      plan: subscription.plan,
      startDate: startDate.toDateString(),  // ✅ formatted date
      endDate: endDate.toDateString(),      // ✅ formatted date
      price: getPrice(subscription.plan)
    });

  } catch (err) {
    console.error("❌ Error fetching subscription:", err);
    res.status(500).json({ error: "Server error fetching subscription." });
  }
});

// ===== FALLBACK FOR ANY OTHER FILES =====
app.get('/:filename', (req, res) => {
  const filePath = path.join(__dirname, req.params.filename);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send("❌ File not found");
  }
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
