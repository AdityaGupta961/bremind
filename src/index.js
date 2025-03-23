import express from 'express';
import { db } from './config/firebase.js';
import { sendWhatsAppMessage } from './config/whatsapp.js';

const app = express();
app.use(express.json());

// Webhook to receive invoices or activities
app.post('/webhook', async (req, res) => {
    try {
        const { phone, invoiceDetails } = req.body;

        if (!phone || !invoiceDetails) {
            return res.status(400).json({ error: 'Missing phone number or invoice details' });
        }

        const { service, amount, dueDate, type } = invoiceDetails; // type: 'BILL' or 'ACTIVITY'

        await db.collection('invoices').add({
            phone,
            service,
            amount: amount || null,
            dueDate: dueDate || null,
            type,
            createdAt: new Date(),
        });

        const confirmationMessage = `✅ Got it! I'll remind you about your ${service} ${
            type === 'BILL' ? `payment of $${amount} due on ${dueDate}.` : `activity regularly.`
        }`;

        await sendWhatsAppMessage(phone, confirmationMessage);
        res.json({ success: true, message: confirmationMessage });
    } catch (error) {
        console.error('Error in webhook:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Start the server
app.listen(3000, () => console.log('🚀 Server running on port 3000'));
