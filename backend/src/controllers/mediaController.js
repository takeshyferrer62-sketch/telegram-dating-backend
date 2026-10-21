const User = require('../models/User');
const multer = require('multer');

// Configuración de almacenamiento temporal en memoria o disco
const storage = multer.memoryStorage(); // O diskStorage si prefieres guardarlos localmente en una carpeta /uploads
const upload = multer({ 
  limits: { fileSize: 15 * 1024 * 1024 }, // Límite de 15MB (ideal para videos cortos)
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Formato no válido. Solo se permiten imágenes y videos cortos.'));
    }
  }
});

// Middleware exportado para la ruta
exports.uploadMiddleware = upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'gallery', maxCount: 4 },
  { name: 'shortVideo', maxCount: 1 }
]);

// Controlador para procesar y actualizar los archivos en el perfil del usuario
exports.updateMediaProfile = async (req, res) => {
  try {
    const { userId } = req.body;
    const files = req.files;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    // Nota: Aquí procesarías la subida a tu servicio de nube (Cloudinary/S3)
    // Simularemos que obtenemos las URLs de los archivos subidos:
    if (files.avatar) {
      // user.media.avatar = url_en_nube_del_avatar;
    }
    if (files.shortVideo) {
      // user.media.shortVideo = url_en_nube_del_video;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Multimedia actualizada correctamente',
      media: user.media
    });

  } catch (error) {
    console.error('Error al actualizar multimedia:', error);
    res.status(500).json({ success: false, error: 'Error al procesar archivos' });
  }
};
