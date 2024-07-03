const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

mongoose.connect('mongodb://localhost:27017/esp32data', { useNewUrlParser: true, useUnifiedTopology: true });

const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
});

const DataSchema = new mongoose.Schema({
  temperature: Number,
  humidity: Number,
  timestamp: { type: Date, default: Date.now },
});

const User = mongoose.model('User', UserSchema);
const Data = mongoose.model('Data', DataSchema);

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hashedPassword });
  await user.save();
  res.status(201).send('User registered');
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user || !await bcrypt.compare(password, user.password)) {
    return res.status(401).send('Invalid credentials');
  }
  const token = jwt.sign({ userId: user._id }, 'secret');
  res.send({ token });
});

app.post('/data', async (req, res) => {
  const { temperature, humidity } = req.body;
  const data = new Data({ temperature, humidity });
  await data.save();
  res.status(201).send('Data saved');
});

app.get('/data', async (req, res) => {
  const data = await Data.find().sort({ timestamp: -1 }).limit(10);
  res.send(data);
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});
