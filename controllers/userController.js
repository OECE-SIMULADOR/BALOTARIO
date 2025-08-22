// controllers/userController.js

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

// Modelos requeridos
const User = require('../models/User');
const Result = require('../models/Result');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// --- FUNCIÓN PARA REGISTRAR UN USUARIO ---
exports.registerUser = async (req, res) => {
    console.log('--- [API] Petición a /registro recibida ---');
    console.log('Datos recibidos:', req.body);
    
    const { name, email, password } = req.body;

    try {
        let user = await User.findOne({ email }).select('+password');
        if (user) {
            console.log(`[Registro Fallido] Email ya en uso: ${email}`);
            return res.status(400).json({ msg: 'Un usuario ya existe con ese correo electrónico.' });
        }

        user = new User({ name, email, password });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();
        
        console.log(`[Registro Exitoso] Nuevo usuario creado: ${email} con ID: ${user.id}`);
        
        const payload = { user: { id: user.id, role: user.role } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
            if (err) throw err;
            res.status(201).json({ token });
        });
    } catch (err) {
        console.error("--- ERROR EN EL PROCESO DE REGISTRO ---", err);
        res.status(500).send('Error en el servidor');
    }
};

// --- FUNCIÓN PARA LOGIN TRADICIONAL ---
exports.loginUser = async (req, res) => {
    console.log('--- [API] Petición a /login recibida ---');
    
    const { email, password } = req.body;

    try {
        // Al buscar, SÍ necesitamos la contraseña. Usamos .select('+password') para traerla
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(400).json({ msg: 'Credenciales inválidas.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Credenciales inválidas.' });
        }
        
        console.log(`[Login Exitoso] Usuario autenticado: ${email}`);
        
        const payload = { user: { id: user.id, role: user.role } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) {
        console.error("--- ERROR EN EL PROCESO DE LOGIN ---", err);
        res.status(500).send('Error en el servidor');
    }
};

// en controllers/userController.js

// --- FUNCIÓN PARA LOGIN CON GOOGLE (CORREGIDA Y FINAL) ---
exports.googleLogin = async (req, res) => {
    console.log('\n--- [Google Login] Petición recibida ---');
    const { token } = req.body;

    try {
        // 1. Verificamos el token con Google
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const { name, email } = ticket.getPayload();
        
        // 2. Buscamos al usuario en nuestra base de datos
        let user = await User.findOne({ email });
        
        // 3. Si el usuario no existe, lo creamos
        if (!user) {
            console.log(`Creando nuevo usuario vía Google: ${email}`);
            
            // Creamos una contraseña dummy segura y la encriptamos
            const password = email + process.env.JWT_SECRET;
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            
            user = new User({ 
                name: name, 
                email: email, 
                password: hashedPassword
            });
            await user.save();
        } else {
            console.log(`Usuario existente inició sesión vía Google: ${email}`);
        }

        // 4. ¡NO HAY COMPARACIÓN DE CONTRASEÑA!
        // Si llegamos aquí, el usuario es válido (verificado por Google).
        // Directamente generamos nuestro propio token de sesión.
        
        const payload = { user: { id: user.id, role: user.role } };
        
        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '5h' },
            (err, appToken) => {
                if (err) throw err;
                res.json({ token: appToken });
            }
        );
        
    } catch (err) {
        console.error("--- ERROR EN EL PROCESO DE LOGIN CON GOOGLE ---", err);
        res.status(500).send('Error en el servidor');
    }
};

// --- FUNCIÓN PARA OBTENER EL PERFIL DEL USUARIO ---
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password').lean();
        if (!user) {
            return res.status(404).json({ msg: 'Usuario no encontrado.' });
        }
        
        const resultsCount = await Result.countDocuments({ user: req.user.id });
        
        // --- LA LÓGICA QUE FALTABA ---
        // Construimos el objeto final
        const userProfileData = {
            user: user,
            resultsCount: resultsCount
        };

        res.json(userProfileData);
    } catch (error) {
        res.status(500).send('Error en el servidor');
    }
};