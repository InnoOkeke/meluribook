import * as functions from 'firebase-functions';
import { db } from '../index';

interface CreateTransactionData {
    businessId: string;
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
    amount: number;
    currency: string;
    date: string;
    payee?: string;
    category?: string;
    description?: string;
    receiptUrl?: string;
    isTaxDeductible?: boolean;
    accountId?: string;
}

interface UpdateTransactionData {
    businessId: string;
    transactionId: string;
    updates: Partial<CreateTransactionData>;
}

/**
 * Verify user is a member of the business
 */
async function verifyBusinessMember(businessId: string, userId: string): Promise<boolean> {
    const memberDoc = await db.collection('businesses').doc(businessId)
        .collection('members').doc(userId).get();
    return memberDoc.exists;
}

/**
 * Create a new transaction
 */
export const createTransaction = functions.https.onCall(async (data: CreateTransactionData, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { businessId, type, amount, currency, date, payee, category, description, receiptUrl, isTaxDeductible, accountId } = data;

    // Validate required fields
    if (!businessId || !type || !amount || !currency || !date) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }

    // Verify membership
    const isMember = await verifyBusinessMember(businessId, context.auth.uid);
    if (!isMember) {
        throw new functions.https.HttpsError('permission-denied', 'User is not a member of this business');
    }

    try {
        const transactionRef = db.collection('businesses').doc(businessId)
            .collection('transactions').doc();

        await transactionRef.set({
            type,
            amount,
            currency,
            date: new Date(date),
            payee: payee || null,
            category: category || null,
            description: description || null,
            receiptUrl: receiptUrl || null,
            isTaxDeductible: isTaxDeductible || false,
            accountId: accountId || null,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        return { transactionId: transactionRef.id };
    } catch (error) {
        functions.logger.error('Error creating transaction:', error);
        throw new functions.https.HttpsError('internal', 'Failed to create transaction');
    }
});

/**
 * Update a transaction
 */
export const updateTransaction = functions.https.onCall(async (data: UpdateTransactionData, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { businessId, transactionId, updates } = data;

    // Verify membership
    const isMember = await verifyBusinessMember(businessId, context.auth.uid);
    if (!isMember) {
        throw new functions.https.HttpsError('permission-denied', 'User is not a member of this business');
    }

    try {
        // Convert date string to Date if present
        const processedUpdates: any = { ...updates };
        if (updates.date) {
            processedUpdates.date = new Date(updates.date);
        }
        processedUpdates.updatedAt = new Date();

        await db.collection('businesses').doc(businessId)
            .collection('transactions').doc(transactionId).update(processedUpdates);

        return { success: true };
    } catch (error) {
        functions.logger.error('Error updating transaction:', error);
        throw new functions.https.HttpsError('internal', 'Failed to update transaction');
    }
});

/**
 * Delete a transaction
 */
export const deleteTransaction = functions.https.onCall(async (data: { businessId: string; transactionId: string }, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { businessId, transactionId } = data;

    // Verify membership and role (OWNER or EDITOR)
    const memberDoc = await db.collection('businesses').doc(businessId)
        .collection('members').doc(context.auth.uid).get();

    if (!memberDoc.exists) {
        throw new functions.https.HttpsError('permission-denied', 'User is not a member of this business');
    }

    const role = memberDoc.data()?.role;
    if (role !== 'OWNER' && role !== 'EDITOR') {
        throw new functions.https.HttpsError('permission-denied', 'Only owners and editors can delete transactions');
    }

    try {
        await db.collection('businesses').doc(businessId)
            .collection('transactions').doc(transactionId).delete();

        return { success: true };
    } catch (error) {
        functions.logger.error('Error deleting transaction:', error);
        throw new functions.https.HttpsError('internal', 'Failed to delete transaction');
    }
});

/**
 * Get transactions with pagination
 */
export const getTransactions = functions.https.onCall(async (data: { businessId: string; limit?: number; startAfter?: string }, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { businessId, limit = 50, startAfter } = data;

    // Verify membership
    const isMember = await verifyBusinessMember(businessId, context.auth.uid);
    if (!isMember) {
        throw new functions.https.HttpsError('permission-denied', 'User is not a member of this business');
    }

    try {
        let query = db.collection('businesses').doc(businessId)
            .collection('transactions')
            .orderBy('date', 'desc')
            .limit(limit);

        if (startAfter) {
            const startDoc = await db.collection('businesses').doc(businessId)
                .collection('transactions').doc(startAfter).get();
            query = query.startAfter(startDoc);
        }

        const snapshot = await query.get();
        const transactions = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

        return { transactions };
    } catch (error) {
        functions.logger.error('Error getting transactions:', error);
        throw new functions.https.HttpsError('internal', 'Failed to get transactions');
    }
});
