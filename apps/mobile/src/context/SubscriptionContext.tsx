import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { firebaseFirestore } from '../config/firebase';

export type SubscriptionTier = 'FREE' | 'PREMIUM' | 'PRO';

interface SubscriptionLimits {
    maxTransactionsPerMonth: number;
    maxBusinesses: number;
    hasReports: boolean;
    hasTeamMembers: boolean;
    hasAdvancedReports: boolean;
    hasPrioritySupport: boolean;
    hasReceiptUpload: boolean;
}

interface SubscriptionContextType {
    tier: SubscriptionTier;
    limits: SubscriptionLimits;
    loading: boolean;
    canUseFeature: (feature: string) => boolean;
    upgradeRequired: (feature: string) => boolean;
    getUpgradeMessage: (feature: string) => string;
}

const TIER_LIMITS: Record<SubscriptionTier, SubscriptionLimits> = {
    FREE: {
        maxTransactionsPerMonth: 50,
        maxBusinesses: 1,
        hasReports: false,
        hasTeamMembers: false,
        hasAdvancedReports: false,
        hasPrioritySupport: false,
        hasReceiptUpload: false,
    },
    PREMIUM: {
        maxTransactionsPerMonth: Infinity,
        maxBusinesses: 3,
        hasReports: true,
        hasTeamMembers: false,
        hasAdvancedReports: false,
        hasPrioritySupport: false,
        hasReceiptUpload: true,
    },
    PRO: {
        maxTransactionsPerMonth: Infinity,
        maxBusinesses: Infinity,
        hasReports: true,
        hasTeamMembers: true,
        hasAdvancedReports: true,
        hasPrioritySupport: true,
        hasReceiptUpload: true,
    },
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const [tier, setTier] = useState<SubscriptionTier>('FREE');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setTier('FREE');
            setLoading(false);
            return;
        }

        // Listen to user's subscription status from Firestore
        const unsubscribe = firebaseFirestore
            .collection('subscriptions')
            .doc(user.uid)
            .onSnapshot(
                (doc) => {
                    // console.log("Subscription Snapshot Update:", doc.exists, user.email);
                    if (user.email?.toLowerCase() === 'leprofcode@gmail.com') {
                        // console.log("Granting Hardcoded Premium");
                        setTier('PREMIUM');
                    } else if (doc.exists()) {
                        const data = doc.data();
                        setTier((data?.tier as SubscriptionTier) || 'FREE');
                    } else {
                        setTier('FREE');
                    }
                    setLoading(false);
                },
                (error) => {
                    // console.warn('Error loading subscription (defaulting to FREE):', error.message);
                    setTier('FREE');
                    setLoading(false);
                }
            );

        return unsubscribe;
    }, [user]);

    const limits = TIER_LIMITS[tier];

    const canUseFeature = (feature: string): boolean => {
        switch (feature) {
            case 'reports':
                return limits.hasReports;
            case 'teamMembers':
                return limits.hasTeamMembers;
            case 'advancedReports':
                return limits.hasAdvancedReports;
            case 'receiptUpload':
                return limits.hasReceiptUpload;
            default:
                return true;
        }
    };

    const upgradeRequired = (feature: string): boolean => {
        return !canUseFeature(feature);
    };

    const getUpgradeMessage = (feature: string): string => {
        const messages: Record<string, string> = {
            reports: 'Upgrade to Premium to access financial reports',
            teamMembers: 'Upgrade to Pro to add team members',
            advancedReports: 'Upgrade to Pro for advanced analytics',
            receiptUpload: 'Upgrade to Premium to upload receipts',
        };
        return messages[feature] || 'Upgrade to unlock this feature';
    };

    return (
        <SubscriptionContext.Provider
            value={{
                tier,
                limits,
                loading,
                canUseFeature,
                upgradeRequired,
                getUpgradeMessage,
            }}
        >
            {children}
        </SubscriptionContext.Provider>
    );
};

export const useSubscription = () => {
    const context = useContext(SubscriptionContext);
    if (!context) {
        throw new Error('useSubscription must be used within a SubscriptionProvider');
    }
    return context;
};
