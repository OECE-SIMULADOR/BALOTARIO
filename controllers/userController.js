// controllers/userController.js

// 1. IMPORTACIONES
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { OAuth2Client } = require('google-auth-library');

// 2. CREACIÓN DEL CLIENTE DE GOOGLE
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// 3. FUNCIÓN PARA REGISTRAR UN USUARIO TRADICIONAL
exports.registerUser = async (req, res) => {
    // --- Log de Depuración: Ver los datos que llegan ---
    console.log('--- [API] Petición a /registro recibida ---');
    console.log('Datos recibidos:', req.body);
    
    const { name, email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) {
            console.log(`[Registro Fallido] Email ya en uso: ${email}`);
            return res.status(400).json({ msg: 'Un usuario ya existe con ese correo electrónico.' });
        }

        user = new User({ name, email, password });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();
        
        console.log(`[Registro Exitoso] Nuevo usuario creado: ${email} con ID: ${user.id}`);
        
        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
            if (err) throw err;
            res.status(201).json({ token });
        });

    } catch (err) {
        console.error("--- ERROR EN EL PROCESO DE REGISTRO ---");
        console.error("Mensaje:", err.message);
        console.error("Pila de llamadas (Stack):", err.stack);
        res.status(500).send('Error en el servidor');
    }
};

// 4. FUNCIÓN PARA LOGIN TRADICIONAL
exports.loginUser = async (req, res) => {
    console.log('--- [API] Petición a /login recibida ---');
    console.log('Credenciales recibidas para:', req.body.email);
    
    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (!user) {
            console.log(`[Login Fallido] Usuario no encontrado: ${email}`);
            return res.status(400).json({ msg: 'Credenciales inválidas.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log(`[Login Fallido] Contraseña incorrecta para: ${email}`);
            return res.status(400).json({ msg: 'Credenciales inválidas.' });
        }
        
        console.log(`[Login Exitoso] Usuario autenticado: ${email}`);

        const payload = { user: { id: user.id, role: user.role } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
        
    } catch (err) {
        console.error("--- ERROR EN EL PROCESO DE LOGIN ---");
        console.error("Mensaje:", err.message);
        res.status(500).send('Error en el servidor');
    }
};

// 5. FUNCIÓN PARA LOGIN CON GOOGLE
exports.googleLogin = async (req, res) => {
    // --- >>> LOGS DE DEPURACIÓN CRÍTICOS <<< ---
    // Este es el primer punto de entrada de la función.
    console.log('\n--- [Google Login] Petición recibida en el controlador ---');
    console.log('1. TIPO de req.body:', typeof req.body);
    console.log('2. Contenido COMPLETO de req.body:', JSON.stringify(req.body, null, 2));
    
    // Desestructuramos el token del cuerpo de la petición.
    const { token } = req.body;
    
    console.log('3. Valor de la variable "token" después de desestructurar:', token ? token.substring(0, 30) + '...' : token);
    
    try {
        // La librería de Google necesita el idToken que enviamos desde el frontend.
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        // Si la verificación es exitosa, obtenemos los datos.
        const { name, email } = ticket.getPayload();
        console.log(`[Google Login] Token de Google verificado exitosamente para: ${email}`);

        // Buscamos si el usuario ya existe en nuestra base de datos.
        let user = await User.findOne({ email });

        if (!user) {
            console.log(`[Google Login] Usuario nuevo. Creando entrada en la BD para: ${email}`);
            // Si no existe, lo creamos con una contraseña dummy.
            const password = email + process.env.JWT_SECRET;
            user = new User({ 
                name, 
                email, 
                password,
                // El rol por defecto 'user' será asignado automáticamente por el modelo.
            });
            await user.save();
        } else {
            console.log(`[Google Login] Usuario existente encontrado en la BD: ${email}`);
        }

        // Creamos nuestro propio token JWT para nuestra aplicación.
        const payload = {
            user: {
                id: user.id,
                role: user.role,
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '5h' },
            (err, appToken) => {
                if (err) throw err;
                console.log(`[Google Login] Token de la App generado y enviado al frontend.`);
                res.json({ token: appToken });
            }
        );

    } catch (error) {
        // Si CUALQUIER paso en el bloque 'try' falla, se ejecutará esto.
        console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        console.error("!!!  ERROR DURANTE EL FLUJO DE GOOGLE LOGIN  !!!");
        console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        // Imprimimos el objeto de error completo para obtener todos los detalles.
        console.error(error);
        console.error("--------------------------------------------");

        return res.status(400).json({ msg: 'Verificación de token de Google fallida.' });
    }
};

exports.getUserProfile = async (req, res) => {
    try {
        console.log(`[Perfil] Buscando perfil para el usuario ID: ${req.user.id}`);
        
        // 1. Buscamos al usuario en la base de datos por su ID.
        //    Usamos .select('-password') para excluir explícitamente el campo de la contraseña
        //    de la respuesta, aunque ya tengamos 'select: false' en el modelo. Es una buena práctica de seguridad.
        const user = await User.findById(req.user.id).select('-password');

        if (!user) {
            console.error(`[Perfil] Error: Usuario no encontrado en la BD con ID: ${req.user.id}`);
            return res.status(404).json({ msg: 'Usuario no encontrado.' });
        }

        // 2. Si se encuentra el usuario, lo devolvemos como respuesta.
        console.log(`[Perfil] Perfil encontrado para: ${user.email}`);
        res.json(user);

    } catch (error) {
        console.error('--- ERROR EN getUserProfile ---:', error.message);
        res.status(500).send('Error en el servidor');
    }
};