import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription, SubscriptionTier } from '../context/SubscriptionContext';
import { Colors } from '../constants/Colors';

interface PaywallProps {
    visible: boolean;
    onClose: () => void;
    feature?: string;
}

const PLANS = [
    {
        tier: 'PREMIUM' as SubscriptionTier,
        name: 'Premium',
        price: '$9.99',
        period: '/month',
        features: [
            { text: 'Unlimited transactions', icon: 'infinite' },
            { text: 'Up to 3 businesses', icon: 'business' },
            { text: 'Financial reports', icon: 'bar-chart' },
            { text: 'Receipt uploads', icon: 'camera' },
            { text: 'Email support', icon: 'mail' },
        ],
        color: '#8B5CF6',
    },
    {
        tier: 'PRO' as SubscriptionTier,
        name: 'Pro',
        price: '$19.99',
        period: '/month',
        features: [
            { text: 'Everything in Premium', icon: 'checkmark-done' },
            { text: 'Unlimited businesses', icon: 'globe' },
            { text: 'Team management', icon: 'people' },
            { text: 'Advanced analytics', icon: 'trending-up' },
            { text: 'Priority support', icon: 'flash' },
            { text: 'Export to CSV/PDF', icon: 'download' },
        ],
        color: '#0EA5A4',
        popular: true,
    },
];

export const Paywall: React.FC<PaywallProps> = ({ visible, onClose, feature }) => {
    const { getUpgradeMessage } = useSubscription();
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

    const handleSubscribe = (tier: SubscriptionTier) => {
        console.log('Subscribe to:', tier);
        alert(`Subscription to ${tier} coming soon!`);
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: theme.border }]}>
                    <View>
                        <Text style={[styles.headerTitle, { color: theme.text }]}>Upgrade Your Plan</Text>
                        {feature && (
                            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                                {getUpgradeMessage(feature)}
                            </Text>
                        )}
                    </View>
                    <TouchableOpacity
                        onPress={onClose}
                        style={[styles.closeButton, { backgroundColor: theme.surfaceSecondary }]}
                    >
                        <Ionicons name="close" size={20} color={theme.textMuted} />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Current Plan */}
                    <View style={[styles.currentPlan, { backgroundColor: theme.surfaceSecondary }]}>
                        <View style={[styles.freeBadge, { backgroundColor: theme.textMuted + '20' }]}>
                            <Text style={[styles.freeBadgeText, { color: theme.textMuted }]}>CURRENT</Text>
                        </View>
                        <Text style={[styles.currentPlanName, { color: theme.text }]}>Free Plan</Text>
                        <Text style={[styles.currentPlanLimits, { color: theme.textSecondary }]}>
                            50 transactions/month • 1 business
                        </Text>
                    </View>

                    {/* Pro Plan - Most Popular */}
                    {PLANS.filter(p => p.popular).map((plan) => (
                        <View
                            key={plan.tier}
                            style={[styles.planCard, styles.popularCard, { backgroundColor: plan.color }]}
                        >
                            <View style={styles.popularBadge}>
                                <Ionicons name="star" size={12} color="#FFFFFF" />
                                <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                            </View>

                            <Text style={styles.planName}>{plan.name}</Text>

                            <View style={styles.priceRow}>
                                <Text style={styles.planPrice}>{plan.price}</Text>
                                <Text style={styles.planPeriod}>{plan.period}</Text>
                            </View>

                            <View style={styles.featuresContainer}>
                                {plan.features.map((feature, idx) => (
                                    <View key={idx} style={styles.featureRow}>
                                        <View style={styles.featureIconBg}>
                                            <Ionicons name={feature.icon as any} size={14} color="#FFFFFF" />
                                        </View>
                                        <Text style={styles.featureText}>{feature.text}</Text>
                                    </View>
                                ))}
                            </View>

                            <TouchableOpacity
                                style={styles.subscribeButton}
                                onPress={() => handleSubscribe(plan.tier)}
                            >
                                <Text style={[styles.subscribeButtonText, { color: plan.color }]}>
                                    Get {plan.name}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ))}

                    {/* Premium Plan */}
                    {PLANS.filter(p => !p.popular).map((plan) => (
                        <View
                            key={plan.tier}
                            style={[styles.planCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                        >
                            <Text style={[styles.planNameAlt, { color: theme.text }]}>{plan.name}</Text>

                            <View style={styles.priceRow}>
                                <Text style={[styles.planPriceAlt, { color: theme.text }]}>{plan.price}</Text>
                                <Text style={[styles.planPeriodAlt, { color: theme.textSecondary }]}>{plan.period}</Text>
                            </View>

                            <View style={styles.featuresContainer}>
                                {plan.features.map((feature, idx) => (
                                    <View key={idx} style={styles.featureRow}>
                                        <View style={[styles.featureIconBgAlt, { backgroundColor: plan.color + '15' }]}>
                                            <Ionicons name={feature.icon as any} size={14} color={plan.color} />
                                        </View>
                                        <Text style={[styles.featureTextAlt, { color: theme.textSecondary }]}>
                                            {feature.text}
                                        </Text>
                                    </View>
                                ))}
                            </View>

                            <TouchableOpacity
                                style={[styles.subscribeButtonAlt, { borderColor: plan.color }]}
                                onPress={() => handleSubscribe(plan.tier)}
                            >
                                <Text style={[styles.subscribeButtonTextAlt, { color: plan.color }]}>
                                    Get {plan.name}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ))}

                    {/* Disclaimer */}
                    <View style={styles.disclaimerContainer}>
                        <Ionicons name="shield-checkmark" size={16} color={theme.textMuted} />
                        <Text style={[styles.disclaimer, { color: theme.textMuted }]}>
                            Cancel anytime. Secure payment.
                        </Text>
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
    },
    headerSubtitle: {
        fontSize: 14,
        marginTop: 4,
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollContent: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    currentPlan: {
        padding: 18,
        borderRadius: 16,
        marginBottom: 20,
    },
    freeBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        marginBottom: 10,
    },
    freeBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    currentPlanName: {
        fontSize: 18,
        fontWeight: '700',
    },
    currentPlanLimits: {
        fontSize: 13,
        marginTop: 4,
    },
    planCard: {
        borderRadius: 24,
        padding: 24,
        marginBottom: 16,
        borderWidth: 1,
    },
    popularCard: {
        borderWidth: 0,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 8,
    },
    popularBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
        marginBottom: 16,
    },
    popularBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    planName: {
        color: '#FFFFFF',
        fontSize: 26,
        fontWeight: '800',
    },
    planNameAlt: {
        fontSize: 22,
        fontWeight: '700',
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginTop: 8,
        marginBottom: 20,
    },
    planPrice: {
        color: '#FFFFFF',
        fontSize: 42,
        fontWeight: '800',
        letterSpacing: -1,
    },
    planPriceAlt: {
        fontSize: 36,
        fontWeight: '800',
    },
    planPeriod: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 16,
        marginBottom: 6,
        marginLeft: 4,
    },
    planPeriodAlt: {
        fontSize: 15,
        marginBottom: 5,
        marginLeft: 4,
    },
    featuresContainer: {
        gap: 12,
        marginBottom: 24,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    featureIconBg: {
        width: 26,
        height: 26,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    featureIconBgAlt: {
        width: 26,
        height: 26,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    featureText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '500',
    },
    featureTextAlt: {
        fontSize: 14,
    },
    subscribeButton: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
    },
    subscribeButtonText: {
        fontWeight: '700',
        fontSize: 16,
    },
    subscribeButtonAlt: {
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        borderWidth: 2,
    },
    subscribeButtonTextAlt: {
        fontWeight: '700',
        fontSize: 16,
    },
    disclaimerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 8,
    },
    disclaimer: {
        fontSize: 13,
    },
});
