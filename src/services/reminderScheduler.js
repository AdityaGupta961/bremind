import { db } from '../config/firebase.js';
import { sendWhatsAppMessage } from '../config/whatsapp.js';
import { generatePersonalizedReminder } from '../config/openai.js';
import cron from 'node-cron';

async function checkAndSendReminders() {
    const now = new Date();
    const invoicesRef = db.collection('invoices');
    
    // Fetch invoices with upcoming due dates
    const snapshot = await invoicesRef.where('reminderSent', '==', false).get();
    
    if (!snapshot.empty) {
        for (const doc of snapshot.docs) {
            const invoice = doc.data();
            const dueDate = new Date(invoice.dueDate);
            const timeDiff = (dueDate - now) / (1000 * 60 * 60 * 24); // Days until due

            let reminderType = null;
            if (timeDiff <= 0) {
                reminderType = 'OVERDUE';
            } else if (timeDiff <= 3) {
                reminderType = '3_DAY';
            } else if (timeDiff <= 7) {
                reminderType = '7_DAY';
            }

            if (reminderType) {
                const reminderMessage = await generatePersonalizedReminder(invoice.service, invoice.amount, invoice.dueDate, reminderType);
                await sendWhatsAppMessage(invoice.phone, reminderMessage);
                await doc.ref.update({ reminderSent: true });
                console.log(`Reminder sent for ${invoice.phone} - ${reminderType}`);
            }
        }
    }
}

// Schedule to run every day at 9 AM
cron.schedule('0 9 * * *', checkAndSendReminders);

export default checkAndSendReminders;

