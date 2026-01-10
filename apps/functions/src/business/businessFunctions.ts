import * as functions from 'firebase-functions';
import { db } from '../index';

interface CreateBusinessData {
    name: string;
    country: string;
    currency: string;
    reportingPeriod: string;
}

interface AddMemberData {
    businessId: string;
    userId: string;
    role: 'OWNER' | 'EDITOR' | 'VIEWER' | 'ACCOUNTANT';
}

/**
 * Create a new business
 */
export const createBusiness = functions.https.onCall(async (data: CreateBusinessData, context) => {
    // Verify authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { name, country, currency, reportingPeriod } = data;

    // Validate input
    if (!name || !country || !currency || !reportingPeriod) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }

    try {
        const businessRef = db.collection('businesses').doc();
        const userId = context.auth.uid;

        // Create business
        await businessRef.set({
            name,
            country,
            currency,
            reportingPeriod,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // Add creator as OWNER
        await businessRef.collection('members').doc(userId).set({
            userId,
            role: 'OWNER',
            createdAt: new Date(),
        });

        return { businessId: businessRef.id };
    } catch (error) {
        functions.logger.error('Error creating business:', error);
        throw new functions.https.HttpsError('internal', 'Failed to create business');
    }
});

/**
 * Update business details
 */
export const updateBusiness = functions.https.onCall(async (data: { businessId: string; updates: Partial<CreateBusinessData> }, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { businessId, updates } = data;

    try {
        // Check if user is an OWNER
        const memberDoc = await db.collection('businesses').doc(businessId)
            .collection('members').doc(context.auth.uid).get();

        if (!memberDoc.exists || memberDoc.data()?.role !== 'OWNER') {
            throw new functions.https.HttpsError('permission-denied', 'Only business owners can update business details');
        }

        await db.collection('businesses').doc(businessId).update({
            ...updates,
            updatedAt: new Date(),
        });

        return { success: true };
    } catch (error) {
        functions.logger.error('Error updating business:', error);
        throw new functions.https.HttpsError('internal', 'Failed to update business');
    }
});

/**
 * Add a member to a business
 */
export const addBusinessMember = functions.https.onCall(async (data: AddMemberData, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { businessId, userId, role } = data;

    try {
        // Check if requester is an OWNER
        const requesterDoc = await db.collection('businesses').doc(businessId)
            .collection('members').doc(context.auth.uid).get();

        if (!requesterDoc.exists || requesterDoc.data()?.role !== 'OWNER') {
            throw new functions.https.HttpsError('permission-denied', 'Only business owners can add members');
        }

        // Add the new member
        await db.collection('businesses').doc(businessId)
            .collection('members').doc(userId).set({
                userId,
                role,
                createdAt: new Date(),
            });

        return { success: true };
    } catch (error) {
        functions.logger.error('Error adding member:', error);
        throw new functions.https.HttpsError('internal', 'Failed to add member');
    }
});

/**
 * Remove a member from a business
 */
export const removeBusinessMember = functions.https.onCall(async (data: { businessId: string; userId: string }, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { businessId, userId } = data;

    try {
        // Check if requester is an OWNER
        const requesterDoc = await db.collection('businesses').doc(businessId)
            .collection('members').doc(context.auth.uid).get();

        if (!requesterDoc.exists || requesterDoc.data()?.role !== 'OWNER') {
            throw new functions.https.HttpsError('permission-denied', 'Only business owners can remove members');
        }

        await db.collection('businesses').doc(businessId)
            .collection('members').doc(userId).delete();

        return { success: true };
    } catch (error) {
        functions.logger.error('Error removing member:', error);
        throw new functions.https.HttpsError('internal', 'Failed to remove member');
    }
});

/**
 * Get all businesses for the authenticated user
 */
export const getBusinesses = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    try {
        const userId = context.auth.uid;

        // Find all business memberships
        const membershipsSnapshot = await db.collectionGroup('members')
            .where('userId', '==', userId)
            .get();

        const businesses = [];
        for (const memberDoc of membershipsSnapshot.docs) {
            const businessId = memberDoc.ref.parent.parent!.id;
            const businessDoc = await db.collection('businesses').doc(businessId).get();

            if (businessDoc.exists) {
                businesses.push({
                    id: businessId,
                    ...businessDoc.data(),
                    role: memberDoc.data().role,
                });
            }
        }

        return { businesses };
    } catch (error) {
        functions.logger.error('Error getting businesses:', error);
        throw new functions.https.HttpsError('internal', 'Failed to get businesses');
    }
});
