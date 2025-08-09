// middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    // 1. Obtener el token de la cabecera 'x-auth-token'
    const token = req.header('x-auth-token');

    // 2. Verificar si no hay token
    if (!token) {
        return res.status(401).json({ msg: 'No hay token, permiso denegado.' });
    }

    // 3. Si hay token, verificarlo
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Adjuntar el usuario decodificado (con su ID) a la petición
        req.user = decoded.user; 
        
        console.log('[Middleware Auth] Token válido. Pasando al siguiente middleware.');
        next();
    } catch (err) {
        console.error('[Middleware Auth] Token inválido. Petición rechazada.', err.message);
        res.status(401).json({ msg: 'El token no es válido.' });
    }
};
        