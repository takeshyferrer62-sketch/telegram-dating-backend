const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true }, // ID único de Telegram
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, enum: ['male', 'female', 'other'], required: true },
  lookingFor: { type: String, enum: ['male', 'female', 'both'], required: true },
  bio: { type: String, maxlength: 300 },
  location: {
    city: String,
    country: String
  },
  media: {
    avatar: { type: String, required: true }, // Foto principal
    gallery: [String], // Fotos secundarias
    shortVideo: String // Videomensaje corto tipo historia
  },
  tags: [String], // Ej: ["Gaming", "Café", "Cine"]
  
  // Gestión de Suscripción
  subscription: {
    type: { type: String, enum: ['normal', 'premium'], default: 'normal' },
    expiresAt: { type: Date, default: null }
  },
  
  // Créditos o contadores de Likes con SMS para cuentas normales
  smsCredits: { type: Number, default: 0 }

}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
