const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const Message = require('./models/Message');
const Match = require('./models/Match');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// Configurar Socket.io con CORS abierto para la Mini App
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.json());
app.use(cors());

// Rutas anteriores
app.use('/api/matches', require('./routes/matchRoutes'));

// --- LÓGICA DE SOCKET.IO PARA EL CHAT ---
io.on('connection', (socket) => {
  console.log(`⚡ Usuario conectado al socket: ${socket.id}`);

  // El usuario se une a una sala específica de su Match
  socket.on('join_match', (matchId) => {
    socket.join(matchId);
    console.log(`User se unió a la sala de chat: ${matchId}`);
  });

  // Escuchar cuando se envía un mensaje
  socket.on('send_message', async (data) => {
    try {
      const { matchId, senderId, text } = data;

      // 1. Guardar el mensaje en MongoDB
      const newMessage = await Message.create({
        matchId,
        sender: senderId,
        text
      });

      // 2. Actualizar el último mensaje en el documento de Match
      await Match.findByIdAndUpdate(matchId, {
        lastMessage: text,
        lastActivity: Date.now()
      });

      // 3. Emitir el mensaje a todos los usuarios en la sala del Match en tiempo real
      io.to(matchId).emit('receive_message', newMessage);

    } catch (error) {
      console.error('Error al enviar mensaje por socket:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Usuario desconectado: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor y WebSockets corriendo en el puerto ${PORT}`);
});