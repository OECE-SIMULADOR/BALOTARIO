// config/upload.js
const multer = require('multer');
const path = require('path');

// --- NUEVA CONFIGURACIÓN: Guardar en el disco ---
const storage = multer.diskStorage({
    // 1. Destino: Le decimos a multer que guarde los archivos en una carpeta 'uploads'
    //    que estará en la raíz del proyecto.
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Asegúrate de crear una carpeta 'uploads'
    },
    // 2. Nombre del archivo: Para evitar colisiones de nombres,
    //    le añadimos un timestamp único al nombre original del archivo.
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

// La configuración de upload ahora usa el nuevo 'storage'
const upload = multer({
    storage: storage, // <-- Usamos la configuración de diskStorage
    fileFilter: (req, file, cb) => {
        // ... (El filtro para .csv se mantiene igual)
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Formato de archivo no válido. Solo se aceptan archivos CSV.'), false);
        }
    }
});

module.exports = upload;