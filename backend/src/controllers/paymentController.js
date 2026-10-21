const TelegramBot = require('node-telegram-bot-api');
// Inicializa tu bot con tu token de BotFather
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });

// Endpoint para crear la factura de Telegram Stars
exports.createInvoice = async (req, res) => {
  try {
    const { chatId, title, description, payload, amountInStars } = req.body;

    const prices = [{ label: title, amount: amountInStars }]; // 1 Star = unidad mínima

    const invoiceOptions = {
      provider_token: '', // IMPORTANTE: Dejar vacío para Telegram Stars
      start_parameter: 'get-premium',
      currency: 'XTR', // Código oficial para Telegram Stars
      prices: JSON.stringify(prices)
    };

    // Enviar la factura directamente al chat de Telegram del usuario
    const invoiceLink = await bot.createInvoiceLink(
      title,
      description,
      payload,
      '', // provider_token vacío para Stars
      'XTR',
      prices
    );

// Aceptar siempre el pre-checkout
bot.on('pre_checkout_query', async (query) => {
  await bot.answerPreCheckoutQuery(query.id, true);
});

// Cuando el pago se completa con éxito
bot.on('successful_payment', async (msg) => {
  const telegramId = msg.from.id.toString();
  const paymentInfo = msg.successful_payment;
  
  // Aquí actualizas en MongoDB: subes la cuenta a 'premium' o sumas 'smsCredits'
  console.log(`✅ ¡Pago exitoso de ${paymentInfo.total_amount} Stars por el usuario ${telegramId}!`);
  // await User.findOneAndUpdate({ telegramId }, { "subscription.type": "premium" });
});
    res.status(200).json({ success: true, invoiceLink });
  } catch (error) {
    console.error('Error creando factura de Telegram Stars:', error);
    res.status(500).json({ success: false, error: 'No se pudo generar el pago' });
  }
};

