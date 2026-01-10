import { getAI, getGenerativeModel } from '@react-native-firebase/ai';
import { getApp } from '@react-native-firebase/app';

// Define the response schema for receipt scanning
const RECEIPT_SCHEMA = {
    description: "Receipt data extracted from image",
    type: "object",
    properties: {
        vendor: { type: "string", description: "Name of the merchant or vendor" },
        date: { type: "string", description: "Date of transaction in YYYY-MM-DD format" },
        amount: { type: "number", description: "Total amount of the transaction" },
        category: {
            type: "string",
            description: "Category of expense",
            enum: ["Meals", "Transport", "Supplies", "Utilities", "Rent", "Other"]
        },
        items: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    description: { type: "string" },
                    amount: { type: "number" }
                }
            }
        }
    },
    required: ["vendor", "amount", "category"]
};

class AIService {
    private model: any = null;
    private chatModel: any = null;

    constructor() { }

    private getVertexInstance() {
        if (!this.model || !this.chatModel) {
            try {
                // Initialize Firebase AI (Gemini)
                const firebaseAI = getAI(getApp());

                if (!this.model) {
                    this.model = getGenerativeModel(firebaseAI, {
                        model: 'gemini-2.0-flash',
                        generationConfig: {
                            responseMimeType: 'application/json',
                        }
                    });
                }

                if (!this.chatModel) {
                    this.chatModel = getGenerativeModel(firebaseAI, {
                        model: 'gemini-2.0-flash',
                    });
                }
            } catch (error: any) {
                console.error("Failed to initialize Vertex AI:", error);
                throw new Error("AI Service unavailable: " + error.message);
            }
        }
        return { model: this.model, chatModel: this.chatModel };
    }

    /**
     * Scans a receipt image and returns structured data
     * @param base64Image Base64 encoded image string
     */
    async scanReceipt(base64Image: string) {
        try {
            const { model } = this.getVertexInstance();
            const prompt = `
        Analyze this receipt image and extract the following information:
        - Vendor Name
        - Date
        - Total Amount
        - Category (Suggest one based on the vendor: Meals, Transport, Supplies, Utilities, Rent, Other)
        - Line Items
        
        Return pure JSON.
      `;

            const result = await model.generateContent([
                prompt,
                { inlineData: { data: base64Image, mimeType: 'image/jpeg' } }
            ]);

            const response = result.response.text();
            return JSON.parse(response);
        } catch (error) {
            console.error('Error scanning receipt:', error);
            throw error;
        }
    }

    /**
     * Sends a message to the AI Accountant
     * @param message User's message
     * @param context Optional financial context to provide to the AI
     */
    async chatWithAccountant(message: string, context?: any) {
        try {
            const { chatModel } = this.getVertexInstance();
            let systemInstruction = "You are a helpful, knowledgeable accountant assistant for a small business. Answer questions about bookkeeping, taxes, and invoices clearly.";

            if (context) {
                systemInstruction += `\n\nHere is the current financial context for the user: ${JSON.stringify(context)}`;
            }

            // Re-initialize model with system instruction if context changes significantly or for each chat session
            // For simplicity, we just pass context in the prompt for single-turn or simple chat, 
            // but ideally we use systemInstruction in model config.

            const chat = chatModel.startChat({
                history: [
                    {
                        role: 'user',
                        parts: [{ text: systemInstruction }],
                    },
                    {
                        role: 'model',
                        parts: [{ text: "Understood. I am ready to help you with your accounting needs based on the provided data." }],
                    }
                ],
            });

            const result = await chat.sendMessage(message);
            return result.response.text();
        } catch (error) {
            console.error('Error in AI chat:', error);
            throw error;
        }
    }
}

export const aiService = new AIService();

