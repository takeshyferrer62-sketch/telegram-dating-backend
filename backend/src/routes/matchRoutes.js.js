const express = require('express');
const router = express.Router();
const { sendInteraction } = require('../controllers/matchController');

// Endpoint para procesar swipes (like, pass, sms_like)
router.post('/interaction', sendInteraction);

module.exports = router;