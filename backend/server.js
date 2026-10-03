const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const citizenRoutes = require('./routes/citizenRoutes');
const requestRoutes = require('./routes/requestRoutes');
const employeeRoutes = require('./routes/employeeRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/citizen', citizenRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/employee', employeeRoutes);

app.get('/', (req, res) => res.json({ message: 'Gov Services API running' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));