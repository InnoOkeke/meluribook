import * as functions from 'firebase-functions';
import { db } from '../index';

interface InvoiceItem {
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
}

interface CreateInvoiceData {
    businessId: string;
    number: string;
    status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
    issueDate: string;
    dueDate: string;
    customerName: string;
    customerEmail?: string;
    currency: string;
    totalAmount: number;
    taxAmount: number;
    items: InvoiceItem[];
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
 * Create a new invoice
 */
export const createInvoice = functions.https.onCall(async (data: CreateInvoiceData, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { businessId, number, status, issueDate, dueDate, customerName, customerEmail, currency, totalAmount, taxAmount, items } = data;

    // Validate required fields
    if (!businessId || !number || !customerName || !items || items.length === 0) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }

    // Verify membership
    const isMember = await verifyBusinessMember(businessId, context.auth.uid);
    if (!isMember) {
        throw new functions.https.HttpsError('permission-denied', 'User is not a member of this business');
    }

    try {
        const invoiceRef = db.collection('businesses').doc(businessId)
            .collection('invoices').doc();

        // Create invoice
        await invoiceRef.set({
            number,
            status: status || 'DRAFT',
            issueDate: new Date(issueDate),
            dueDate: new Date(dueDate),
            customerName,
            customerEmail: customerEmail || null,
            currency,
            totalAmount,
            taxAmount,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // Add invoice items as subcollection
        const batch = db.batch();
        items.forEach(item => {
            const itemRef = invoiceRef.collection('items').doc();
            batch.set(itemRef, item);
        });
        await batch.commit();

        return { invoiceId: invoiceRef.id };
    } catch (error) {
        functions.logger.error('Error creating invoice:', error);
        throw new functions.https.HttpsError('internal', 'Failed to create invoice');
    }
});

/**
 * Update invoice
 */
export const updateInvoice = functions.https.onCall(async (data: { businessId: string; invoiceId: string; updates: Partial<CreateInvoiceData> }, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { businessId, invoiceId, updates } = data;

    // Verify membership
    const isMember = await verifyBusinessMember(businessId, context.auth.uid);
    if (!isMember) {
        throw new functions.https.HttpsError('permission-denied', 'User is not a member of this business');
    }

    try {
        const processedUpdates: any = { ...updates };

        // Convert date strings to Date objects
        if (updates.issueDate) processedUpdates.issueDate = new Date(updates.issueDate);
        if (updates.dueDate) processedUpdates.dueDate = new Date(updates.dueDate);

        processedUpdates.updatedAt = new Date();

        // Remove items from updates as they should be handled separately
        delete processedUpdates.items;

        await db.collection('businesses').doc(businessId)
            .collection('invoices').doc(invoiceId).update(processedUpdates);

        return { success: true };
    } catch (error) {
        functions.logger.error('Error updating invoice:', error);
        throw new functions.https.HttpsError('internal', 'Failed to update invoice');
    }
});

/**
 * Mark invoice as paid
 */
export const markInvoicePaid = functions.https.onCall(async (data: { businessId: string; invoiceId: string }, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { businessId, invoiceId } = data;

    // Verify membership
    const isMember = await verifyBusinessMember(businessId, context.auth.uid);
    if (!isMember) {
        throw new functions.https.HttpsError('permission-denied', 'User is not a member of this business');
    }

    try {
        await db.collection('businesses').doc(businessId)
            .collection('invoices').doc(invoiceId).update({
                status: 'PAID',
                updatedAt: new Date(),
            });

        return { success: true };
    } catch (error) {
        functions.logger.error('Error marking invoice as paid:', error);
        throw new functions.https.HttpsError('internal', 'Failed to mark invoice as paid');
    }
});

/**
 * Send invoice (placeholder - integrate with email service)
 */
export const sendInvoice = functions.https.onCall(async (data: { businessId: string; invoiceId: string }, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { businessId, invoiceId } = data;

    // Verify membership
    const isMember = await verifyBusinessMember(businessId, context.auth.uid);
    if (!isMember) {
        throw new functions.https.HttpsError('permission-denied', 'User is not a member of this business');
    }

    try {
        // TODO: Integrate with email service (SendGrid, Mailgun, etc.)
        // For now, just update the status
        await db.collection('businesses').doc(businessId)
            .collection('invoices').doc(invoiceId).update({
                status: 'SENT',
                updatedAt: new Date(),
            });

        return { success: true, message: 'Invoice sent successfully' };
    } catch (error) {
        functions.logger.error('Error sending invoice:', error);
        throw new functions.https.HttpsError('internal', 'Failed to send invoice');
    }
});

/**
 * Get invoices with pagination
 */
export const getInvoices = functions.https.onCall(async (data: { businessId: string; limit?: number; status?: string }, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { businessId, limit = 50, status } = data;

    // Verify membership
    const isMember = await verifyBusinessMember(businessId, context.auth.uid);
    if (!isMember) {
        throw new functions.https.HttpsError('permission-denied', 'User is not a member of this business');
    }

    try {
        let query: any = db.collection('businesses').doc(businessId)
            .collection('invoices')
            .orderBy('dueDate', 'desc')
            .limit(limit);

        if (status) {
            query = query.where('status', '==', status);
        }

        const snapshot = await query.get();

        // Fetch items for each invoice
        const invoices = await Promise.all(snapshot.docs.map(async (doc: any) => {
            const itemsSnapshot = await doc.ref.collection('items').get();
            const items = itemsSnapshot.docs.map((itemDoc: any) => ({
                id: itemDoc.id,
                ...itemDoc.data(),
            }));

            return {
                id: doc.id,
                ...doc.data(),
                items,
            };
        }));

        return { invoices };
    } catch (error) {
        functions.logger.error('Error getting invoices:', error);
        throw new functions.https.HttpsError('internal', 'Failed to get invoices');
    }
});
