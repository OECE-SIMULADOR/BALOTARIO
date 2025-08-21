// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors');
const corsOptions = {
    origin: [
    'https://oece-balotarios.netlify.app', 
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Métodos permitidos
  allowedHeaders: ['Content-Type', 'x-auth-token'], // Cabeceras permitidas
  credentials: true
};

app.use(cors(corsOptions));
dotenv.config();
const app = express();
connectDB();

// en server.js
app.use(cors());
app.use(express.json({ limit: '50mb' })); // <-- Descomenta o vuelve a añadir esta línea global
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api/usuarios', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/balotarios', require('./routes/balotarios'));
app.use('/api/resultados', require('./routes/results'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor iniciado en el puerto ${PORT}`));