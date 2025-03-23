import express from 'express';
import { db } from '../config/firebase.js';
import { parseInvoice } from '../config/openai.js';
import { sendWhatsAppMessage } from '../config/whatsapp.js';

const router = express.Router();

router.post('/', async (req, res) => {
    const { body } = req;
    
    if (body.entry) {
        for (let entry of body.entry) {
            for (let message of entry.changes) {
                const phone = message.value.messages?.[0]?.from;
                const text = message.value.messages?.[0]?.text?.body;
                
                if (phone && text) {
                    console.log(`Received message from ${phone}: ${text}`);
                    
                    // Store user if new
                    const userRef = db.collection('users').doc(phone);
                    const userDoc = await userRef.get();
                    if (!userDoc.exists) {
                        await userRef.set({ phone, name: `User-${phone}` });
                    }
                    
                    // Parse invoice
                    const invoiceData = await parseInvoice(text);
                    if (invoiceData) {
                        await db.collection('invoices').add({
                            phone,
                            ...invoiceData,
                            reminderSent: false
                        });
                        
                        await sendWhatsAppMessage(phone, `Invoice recorded: ${invoiceData.service}, Amount: ${invoiceData.amount}, Due: ${invoiceData.dueDate}`);
                    }
                }
            }
        }
    }
    res.sendStatus(200);
});

export default router;
