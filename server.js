require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
app.use(cors());
app.use(express.json()); // <-- ADD THIS LINE BACK IN

// Configure Multer to store uploaded files in memory temporarily
const upload = multer({ storage: multer.memoryStorage() });

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// upload.array('documents', 6) intercepts up to 6 files attached by the frontend
app.post('/api/sendMessage', upload.array('documents', 6), async (req, res) => {
    const { message } = req.body;
    const files = req.files;

    if (!BOT_TOKEN || !CHAT_ID) {
        return res.status(500).json({ error: 'Server misconfiguration.' });
    }

    try {
        // 1. Send the Main Text Message first
        await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            chat_id: CHAT_ID,
            text: message,
            parse_mode: 'HTML'
        });

        // 2. Loop through uploaded files and send them as documents to Telegram
        if (files && files.length > 0) {
            for (const file of files) {
                const form = new FormData();
                form.append('chat_id', CHAT_ID);
                form.append('document', file.buffer, { filename: file.originalname });

                await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, form, {
                    headers: form.getHeaders()
                });
            }
        }

        res.status(200).json({ success: true, message: 'Message and files sent.' });
    } catch (error) {
        console.error('Telegram API Error:', error.message);
        res.status(500).json({ error: 'Failed to process request.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
