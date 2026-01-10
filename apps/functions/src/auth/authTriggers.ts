import * as functions from 'firebase-functions';
import { db } from '../index';

/**
 * Trigger: When a new user signs up
 * Creates a user profile document in Firestore
 */
export const onUserCreated = functions.auth.user().onCreate(async (user) => {
    try {
        const userProfile = {
            email: user.email || '',
            fullName: user.displayName || '',
            googleId: user.providerData.find(p => p.providerId === 'google.com')?.uid || null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await db.collection('users').doc(user.uid).set(userProfile);

        functions.logger.info(`User profile created for ${user.uid}`);
    } catch (error) {
        functions.logger.error('Error creating user profile:', error);
        throw new functions.https.HttpsError('internal', 'Failed to create user profile');
    }
});

/**
 * Trigger: When a user is deleted
 * Cleans up user data from Firestore
 */
export const onUserDeleted = functions.auth.user().onDelete(async (user) => {
    try {
        // Delete user profile
        await db.collection('users').doc(user.uid).delete();

        // Find and cleanup business memberships
        const membershipSnapshot = await db.collectionGroup('members')
            .where('userId', '==', user.uid)
            .get();

        const batch = db.batch();
        membershipSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();

        functions.logger.info(`User data cleaned up for ${user.uid}`);
    } catch (error) {
        functions.logger.error('Error deleting user data:', error);
    }
});
