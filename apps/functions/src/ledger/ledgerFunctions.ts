import * as functions from 'firebase-functions';
import { db } from '../index';

/**
 * Auto-generate journal entries from transactions
 * This is a placeholder for double-entry bookkeeping logic
 */
export const generateJournalEntries = functions.https.onCall(async (data: { businessId: string; transactionId: string }, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { businessId, transactionId } = data;

    try {
        // Get the transaction
        const transactionDoc = await db.collection('businesses').doc(businessId)
            .collection('transactions').doc(transactionId).get();

        if (!transactionDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Transaction not found');
        }

        const transaction = transactionDoc.data()!;

        // Create journal entry
        const journalRef = db.collection('businesses').doc(businessId)
            .collection('journalEntries').doc();

        await journalRef.set({
            date: transaction.date,
            description: `${transaction.type}: ${transaction.description || transaction.payee}`,
            reference: transactionId,
            createdAt: new Date(),
        });

        // Create journal lines (simplified double-entry)
        const batch = db.batch();

        if (transaction.type === 'INCOME') {
            // Debit: Cash/Bank, Credit: Revenue
            batch.set(journalRef.collection('lines').doc(), {
                description: 'Cash/Bank',
                debit: transaction.amount,
                credit: 0,
                accountCode: '1000',
            });
            batch.set(journalRef.collection('lines').doc(), {
                description: 'Sales Revenue',
                debit: 0,
                credit: transaction.amount,
                accountCode: '4000',
            });
        } else if (transaction.type === 'EXPENSE') {
            // Debit: Expense, Credit: Cash/Bank
            batch.set(journalRef.collection('lines').doc(), {
                description: transaction.category || 'Expense',
                debit: transaction.amount,
                credit: 0,
                accountCode: '5000',
            });
            batch.set(journalRef.collection('lines').doc(), {
                description: 'Cash/Bank',
                debit: 0,
                credit: transaction.amount,
                accountCode: '1000',
            });
        }

        await batch.commit();

        return { journalEntryId: journalRef.id };
    } catch (error) {
        functions.logger.error('Error generating journal entries:', error);
        throw new functions.https.HttpsError('internal', 'Failed to generate journal entries');
    }
});

/**
 * Get journal entries for a business
 */
export const getJournalEntries = functions.https.onCall(async (data: { businessId: string; limit?: number }, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { businessId, limit = 50 } = data;

    try {
        const snapshot = await db.collection('businesses').doc(businessId)
            .collection('journalEntries')
            .orderBy('date', 'desc')
            .limit(limit)
            .get();

        const entries = await Promise.all(snapshot.docs.map(async doc => {
            const linesSnapshot = await doc.ref.collection('lines').get();
            const lines = linesSnapshot.docs.map(lineDoc => ({
                id: lineDoc.id,
                ...lineDoc.data(),
            }));

            return {
                id: doc.id,
                ...doc.data(),
                lines,
            };
        }));

        return { entries };
    } catch (error) {
        functions.logger.error('Error getting journal entries:', error);
        throw new functions.https.HttpsError('internal', 'Failed to get journal entries');
    }
});
