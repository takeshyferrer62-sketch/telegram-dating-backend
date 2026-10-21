const mongoose = require('mongoose');

const LikeSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['pass', 'like', 'sms_like'], required: true },
  messageText: { type: String, default: null }, // Texto adjunto únicamente si es 'sms_like'
  status: { type: String, enum: ['pending', 'matched', 'rejected'], default: 'pending' }
}, { timestamps: true });

// Restricción: Un usuario no puede interactuar dos veces con el mismo destinatario
LikeSchema.index({ sender: 1, receiver: 1 }, { unique: true });

module.exports = mongoose.model('Like', LikeSchema);