// routes/users.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
// Importamos nuestro controlador
const userController = require('../controllers/userController');

// ------ Definición de las rutas ------

// @ruta    POST api/usuarios/registro
// @desc    Registrar un nuevo usuario
// @acceso  Público
router.post('/registro', userController.registerUser);

// @ruta    POST api/usuarios/login
// @desc    Autenticar un usuario y obtener un token
// @acceso  Público
router.post('/login', userController.loginUser);

// @ruta    POST api/usuarios/google-login
// @desc    Autentica un usuario con un token de Google
// @acceso  Público
router.post('/google-login', userController.googleLogin);

router.get('/me', auth, userController.getUserProfile);
// Exportamos el router para que pueda ser usado en server.js
module.exports = router;