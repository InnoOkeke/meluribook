import * as functions from 'firebase-functions';
import { db } from '../index';

interface TaxSettings {
    countryCode: string;
    config: any;
}

/**
 * Calculate taxes for a business
 * This is a placeholder - actual tax calculation logic would be country-specific
 */
export const calculateTaxes = functions.https.onCall(async (data: { businessId: string; period: { start: string; end: string } }, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { businessId, period } = data;

    try {
        // Get business tax settings
        const taxSettingsSnapshot = await db.collection('businesses').doc(businessId)
            .collection('taxSettings').limit(1).get();

        if (taxSettingsSnapshot.empty) {
            throw new functions.https.HttpsError('not-found', 'Tax settings not configured');
        }

        const taxSettings = taxSettingsSnapshot.docs[0].data();

        // Get all transactions in the period
        const transactionsSnapshot = await db.collection('businesses').doc(businessId)
            .collection('transactions')
            .where('date', '>=', new Date(period.start))
            .where('date', '<=', new Date(period.end))
            .get();

        let totalIncome = 0;
        let totalExpenses = 0;
        let taxDeductibleExpenses = 0;

        transactionsSnapshot.forEach(doc => {
            const transaction = doc.data();
            if (transaction.type === 'INCOME') {
                totalIncome += Number(transaction.amount);
            } else if (transaction.type === 'EXPENSE') {
                totalExpenses += Number(transaction.amount);
                if (transaction.isTaxDeductible) {
                    taxDeductibleExpenses += Number(transaction.amount);
                }
            }
        });

        // Simplified tax calculation (varies by country)
        const taxableIncome = totalIncome - taxDeductibleExpenses;
        const taxRate = 0.2; // 20% - would be country-specific
        const taxOwed = taxableIncome * taxRate;

        return {
            period,
            totalIncome,
            totalExpenses,
            taxDeductibleExpenses,
            taxableIncome,
            taxRate,
            taxOwed,
            currency: taxSettings.config?.currency || 'USD',
        };
    } catch (error) {
        functions.logger.error('Error calculating taxes:', error);
        throw new functions.https.HttpsError('internal', 'Failed to calculate taxes');
    }
});

/**
 * Update tax settings for a business
 */
export const updateTaxSettings = functions.https.onCall(async (data: { businessId: string; settings: TaxSettings }, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { businessId, settings } = data;

    try {
        // Check if user is OWNER or ACCOUNTANT
        const memberDoc = await db.collection('businesses').doc(businessId)
            .collection('members').doc(context.auth.uid).get();

        if (!memberDoc.exists) {
            throw new functions.https.HttpsError('permission-denied', 'User is not a member of this business');
        }

        const role = memberDoc.data()?.role;
        if (role !== 'OWNER' && role !== 'ACCOUNTANT') {
            throw new functions.https.HttpsError('permission-denied', 'Only owners and accountants can update tax settings');
        }

        // Get or create tax settings
        const taxSettingsSnapshot = await db.collection('businesses').doc(businessId)
            .collection('taxSettings').limit(1).get();

        if (taxSettingsSnapshot.empty) {
            // Create new
            await db.collection('businesses').doc(businessId)
                .collection('taxSettings').add({
                    countryCode: settings.countryCode,
                    config: settings.config,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
        } else {
            // Update existing
            await taxSettingsSnapshot.docs[0].ref.update({
                countryCode: settings.countryCode,
                config: settings.config,
                updatedAt: new Date(),
            });
        }

        return { success: true };
    } catch (error) {
        functions.logger.error('Error updating tax settings:', error);
        throw new functions.https.HttpsError('internal', 'Failed to update tax settings');
    }
});
