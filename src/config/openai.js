import { OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generatePersonalizedReminder(service, amount, dueDate, reminderType) {
    try {
        const prompt = `Generate a quirky and engaging WhatsApp reminder. Details:
        - Service or Activity: ${service}
        - Amount (if applicable): $${amount || 'N/A'}
        - Due Date (if applicable): ${dueDate || 'N/A'}
        - Reminder Type: ${reminderType} (Options: 7_DAY, 3_DAY, OVERDUE, DAILY_ACTIVITY)
        - Context: If it's a bill, remind about payment. If it's an activity (e.g., gym, medication), encourage the user in a fun way.
        - Style: Friendly, smart, and engaging.`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4-turbo',
            messages: [
                { role: 'system', content: 'You are a witty assistant generating smart and engaging reminders for bills, activities, and health goals.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.7
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error('Error generating personalized reminder:', error.message);
        return `Reminder: Don't forget your ${service}. Stay on top of your goals!`;
    }
}

