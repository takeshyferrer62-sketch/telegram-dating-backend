const User = require('../models/User');
const Like = require('../models/Like');
const Match = require('../models/Match');

exports.sendInteraction = async (req, res) => {
  try {
    const { senderId, receiverId, type, messageText } = req.body; 
    // type: 'pass', 'like', 'sms_like'

    // Validar que los campos obligatorios existan
    if (!senderId || !receiverId || !type) {
      return res.status(400).json({ success: false, error: 'Faltan datos obligatorios (senderId, receiverId, type)' });
    }

    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (!sender || !receiver) {
      return res.status(404).json({ success: false, error: 'Usuario emisor o receptor no encontrado' });
    }

    // --- APLICACIÓN DE LA REGLA DE NEGOCIO ASIMÉTRICA PARA LIKES CON SMS ---
    if (type === 'sms_like') {
      // Regla: Si el receptor es Premium y el emisor es Normal -> Imposible enviar
      if (receiver.subscription.type === 'premium' && sender.subscription.type === 'normal') {
        return res.status(403).json({ 
          success: false, 
          error: 'Restricción de suscripción: Los perfiles Premium solo pueden recibir Likes con SMS de usuarios de su mismo nivel. ¡Actualiza tu cuenta a Premium para enviar este mensaje!' 
        });
      }

      // Si el emisor es normal, verificar si cuenta con créditos de SMS disponibles
      if (sender.subscription.type === 'normal' && sender.smsCredits <= 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'No tienes créditos suficientes de Like con SMS. Adquiere más créditos para continuar.' 
        });
      }

      // Descontar un crédito si es usuario normal
      if (sender.subscription.type === 'normal') {
        sender.smsCredits -= 1;
        await sender.save();
      }
    }

    // Registrar la interacción en la base de datos
    const newLike = await Like.create({
      sender: senderId,
      receiver: receiverId,
      type,
      messageText: type === 'sms_like' ? messageText : null,
      status: 'pending'
    });

    // Si la acción fue "Pass", terminamos aquí
    if (type === 'pass') {
      return res.status(200).json({ success: true, match: false, message: 'Perfil descartado' });
    }

    // Comprobar si el receptor ya le había dado Like o Like con SMS al emisor (Match Mutuo)
    const mutualLike = await Like.findOne({
      sender: receiverId,
      receiver: senderId,
      type: { $in: ['like', 'sms_like'] },
      status: 'pending'
    });

    if (mutualLike) {
      // Actualizar estados de ambas interacciones a 'matched'
      mutualLike.status = 'matched';
      newLike.status = 'matched';
      await mutualLike.save();
      await newLike.save();

      // Crear el documento de Match oficial entre ambos usuarios
      const newMatch = await Match.create({
        users: [senderId, receiverId]
      });

      return res.status(200).json({
        success: true,
        match: true,
        message: '¡Es un Match mutuo! Ya se ha abierto el canal de chat privado.',
        matchId: newMatch._id
      });
    }

    return res.status(200).json({
      success: true,
      match: false,
      message: type === 'sms_like' ? 'Like con SMS enviado exitosamente' : 'Like registrado correctamente'
    });

  } catch (error) {
    // Manejar error de índice único (si ya intentó interactuar con este usuario antes)
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'Ya has registrado una interacción con este usuario.' });
    }
    console.error('Error en sendInteraction:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
};
