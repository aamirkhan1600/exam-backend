const express = require('express');
const cors = require('cors'); // Import cors
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const app = express();
const PORT = 3000;
const username = encodeURIComponent("aamirkhan");
const password = encodeURIComponent("Aamir@123");
// Middleware
app.use(express.json());
app.use(cors()); // Enable CORS

mongoose.connect(`mongodb+srv://${username}:${password}@clusterexam.38jlf.mongodb.net/?retryWrites=true&w=majority&appName=ClusterExam`)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));
 

// Register Route
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Check if the user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create a new user
        user = new User({ name, email, password });

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // Save the user
        await user.save();

        // Return JWT
        const payload = { user: { id: user.id } };
        const token = jwt.sign(payload, 'yourSecretKey', { expiresIn: '1h' });

        res.status(201).json({ token });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Login Route
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if the user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check the password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Return JWT and user info
        const payload = { user: { id: user.id } };
        const token = jwt.sign(payload, 'yourSecretKey', { expiresIn: '1h' });

        // Exclude password from the user object
        const userData = {
            id: user.id,
            name: user.name,
            email: user.email,
        };

        res.json({ token, user: userData });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

let users = [];

// Admin Signup Route
app.post('/api/admin/signup', (req, res) => {
    const { email, password, name } = req.body;

    // Check if user already exists
    const userExists = users.find(user => user.email === email);
    if (userExists) return res.status(400).send('User already exists.');

    // Hash password and save user
    const hashedPassword = bcrypt.hashSync(password, 8);
    const newUser = { email, password: hashedPassword, name };
    users.push(newUser);

    res.status(200).send('Signup successful!');
});

// Admin Login Route
app.post('/api/admin/login', (req, res) => {
    const { email, password } = req.body;

    // Check if user exists
    const user = users.find(user => user.email === email);
    if (!user) return res.status(400).send('User not found.');

    // Check password
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) return res.status(400).send('Invalid password.');

    // Generate token
    const token = jwt.sign({ email: user.email }, SECRET_KEY, { expiresIn: '1h' });

    res.status(200).json({ token });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
