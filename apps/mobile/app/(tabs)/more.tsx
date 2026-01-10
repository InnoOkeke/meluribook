import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useAuth } from '../../src/context/AuthContext';
import { useSubscription } from '../../src/context/SubscriptionContext';
import { useBusiness } from '../../src/context/BusinessContext';
import { Paywall } from '../../src/components/Paywall';
import { Colors } from '../../src/constants/Colors';

type MenuItem = {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    subtitle?: string;
    action?: () => void;
    rightElement?: React.ReactNode;
    color?: string;
};

export default function MoreScreen() {
    const router = useRouter();
    const { user, logout } = useAuth();
    const { tier, limits } = useSubscription();
    const { currentBusiness, businesses } = useBusiness();
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

    const [notifications, setNotifications] = useState(true);
    const [showPaywall, setShowPaywall] = useState(false);

    const handleLogout = async () => {
        await logout();
    };

    const tierDisplay = {
        FREE: { label: 'Free Plan', bg: theme.surfaceSecondary, text: theme.textSecondary },
        PREMIUM: { label: 'Premium', bg: theme.secondary + '20', text: theme.secondary },
        PRO: { label: 'Pro', bg: theme.primary + '20', text: theme.primary },
    };

    const currentTier = tierDisplay[tier] || tierDisplay.FREE;

    const renderMenuItem = (item: MenuItem, isLast: boolean = false) => (
        <TouchableOpacity
            key={item.label}
            activeOpacity={0.7}
            onPress={item.action}
            style={[
                styles.menuItem,
                {
                    backgroundColor: theme.surface,
                    borderBottomColor: isLast ? 'transparent' : theme.border,
                }
            ]}
        >
            <View style={styles.menuItemLeft}>
                <View style={[
                    styles.menuIconContainer,
                    { backgroundColor: item.color ? item.color + '15' : theme.primary + '15' }
                ]}>
                    <Ionicons
                        name={item.icon}
                        size={20}
                        color={item.color || theme.primary}
                    />
                </View>
                <View style={styles.menuTextContainer}>
                    <Text style={[styles.menuLabel, { color: theme.text }]}>{item.label}</Text>
                    {item.subtitle && (
                        <Text style={[styles.menuSubtitle, { color: theme.textMuted }]}>{item.subtitle}</Text>
                    )}
                </View>
            </View>
            {item.rightElement || (
                <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >

                {/* Profile Card */}
                <View style={[styles.profileCard, { backgroundColor: theme.primary }]}>
                    <View style={styles.profileHeader}>
                        <View style={styles.avatarContainer}>
                            <Text style={styles.avatarText}>
                                {user?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                            </Text>
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.profileName}>
                                {user?.displayName || 'User'}
                            </Text>
                            <Text style={styles.profileEmail}>{user?.email}</Text>
                        </View>
                    </View>
                    <View style={[styles.tierBadge, { backgroundColor: currentTier.bg }]}>
                        <Text style={[styles.tierText, { color: currentTier.text }]}>{currentTier.label}</Text>
                    </View>
                </View>

                {/* Upgrade Card (for free users) */}
                {tier === 'FREE' && (
                    <TouchableOpacity
                        style={[styles.upgradeCard, { backgroundColor: theme.secondary }]}
                        onPress={() => setShowPaywall(true)}
                    >
                        <View style={styles.upgradeContent}>
                            <Ionicons name="rocket" size={24} color="#FFFFFF" />
                            <View style={styles.upgradeText}>
                                <Text style={styles.upgradeTitle}>Upgrade to Premium</Text>
                                <Text style={styles.upgradeSubtitle}>Unlock unlimited features</Text>
                            </View>
                        </View>
                        <View style={styles.upgradePriceBadge}>
                            <Text style={styles.upgradePrice}>$9.99/mo</Text>
                        </View>
                    </TouchableOpacity>
                )}

                {/* Business Info Card */}
                <View style={[styles.businessCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={styles.businessCardHeader}>
                        <View style={[styles.businessIconContainer, { backgroundColor: theme.primary + '15' }]}>
                            <Ionicons name="business" size={20} color={theme.primary} />
                        </View>
                        <View style={styles.businessInfo}>
                            <Text style={[styles.businessCardTitle, { color: theme.textSecondary }]}>Current Business</Text>
                            <Text style={[styles.businessCardName, { color: theme.text }]}>{currentBusiness?.name || 'No business'}</Text>
                        </View>
                    </View>
                    <Text style={[styles.businessCount, { color: theme.textMuted }]}>
                        {businesses.length} business{businesses.length !== 1 ? 'es' : ''}
                        {tier === 'FREE' && ` • ${limits.maxBusinesses - businesses.length} remaining`}
                    </Text>
                </View>

                {/* Settings Button - Primary */}
                <TouchableOpacity
                    style={[styles.settingsButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    onPress={() => router.push('/settings')}
                >
                    <View style={styles.settingsButtonContent}>
                        <View style={[styles.settingsIconContainer, { backgroundColor: theme.primary + '15' }]}>
                            <Ionicons name="settings" size={22} color={theme.primary} />
                        </View>
                        <View>
                            <Text style={[styles.settingsButtonTitle, { color: theme.text }]}>Settings</Text>
                            <Text style={[styles.settingsButtonSubtitle, { color: theme.textMuted }]}>Account, Company & Invoice settings</Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={22} color={theme.textMuted} />
                </TouchableOpacity>

                {/* Financial Tools Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Financial Tools</Text>
                    <View style={[styles.menuCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        {renderMenuItem({
                            icon: 'bar-chart',
                            label: 'Reports & Analytics',
                            subtitle: 'Income, expenses & P&L',
                            action: () => router.push('/reports'),
                            color: '#A855F7'
                        })}
                        {renderMenuItem({
                            icon: 'calculator',
                            label: 'Tax Outlook',
                            subtitle: 'Estimates & deductions',
                            action: () => router.push('/tax/summary'),
                            color: Colors.light.warning
                        }, true)}
                    </View>
                </View>

                {/* Preferences Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Preferences</Text>
                    <View style={[styles.menuCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        {renderMenuItem({
                            icon: 'notifications',
                            label: 'Push Notifications',
                            rightElement: (
                                <Switch
                                    value={notifications}
                                    onValueChange={setNotifications}
                                    trackColor={{ false: theme.border, true: theme.primary }}
                                    thumbColor={'#FFFFFF'}
                                />
                            )
                        }, true)}
                    </View>
                </View>

                {/* Support Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Support</Text>
                    <View style={[styles.menuCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        {renderMenuItem({
                            icon: 'help-circle',
                            label: 'Help Center',
                            color: theme.secondary
                        })}
                        {renderMenuItem({
                            icon: 'chatbubbles',
                            label: 'Contact Support',
                            color: theme.secondary
                        })}
                        {renderMenuItem({
                            icon: 'shield-checkmark',
                            label: 'Privacy & Security',
                            color: theme.success
                        }, true)}
                    </View>
                </View>

                {/* Logout Button */}
                <TouchableOpacity
                    style={[styles.logoutButton, { backgroundColor: theme.error + '10', borderColor: theme.error + '30' }]}
                    onPress={handleLogout}
                >
                    <Ionicons name="log-out-outline" size={20} color={theme.error} />
                    <Text style={[styles.logoutText, { color: theme.error }]}>Log Out</Text>
                </TouchableOpacity>

                <Text style={[styles.versionText, { color: theme.textMuted }]}>
                    Meluribook v1.0.0
                </Text>

            </ScrollView>

            <Paywall visible={showPaywall} onClose={() => setShowPaywall(false)} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    profileCard: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.25)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    profileInfo: {
        marginLeft: 16,
        flex: 1,
    },
    profileName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    profileEmail: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 2,
    },
    tierBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    tierText: {
        fontSize: 13,
        fontWeight: '600',
    },
    upgradeCard: {
        borderRadius: 16,
        padding: 18,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    upgradeContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    upgradeText: {},
    upgradeTitle: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 16,
    },
    upgradeSubtitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 13,
        marginTop: 2,
    },
    upgradePriceBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
    },
    upgradePrice: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
    },
    businessCard: {
        borderRadius: 16,
        padding: 18,
        marginBottom: 16,
        borderWidth: 1,
    },
    businessCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    businessIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    businessInfo: {
        marginLeft: 14,
    },
    businessCardTitle: {
        fontSize: 13,
        fontWeight: '500',
    },
    businessCardName: {
        fontSize: 17,
        fontWeight: '600',
        marginTop: 2,
    },
    businessCount: {
        fontSize: 13,
        marginTop: 8,
    },
    settingsButton: {
        borderRadius: 16,
        padding: 18,
        marginBottom: 24,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    settingsButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    settingsIconContainer: {
        width: 46,
        height: 46,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    settingsButtonTitle: {
        fontSize: 17,
        fontWeight: '600',
    },
    settingsButtonSubtitle: {
        fontSize: 13,
        marginTop: 2,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 12,
        marginLeft: 4,
    },
    menuCard: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    menuIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuTextContainer: {
        marginLeft: 14,
        flex: 1,
    },
    menuLabel: {
        fontSize: 15,
        fontWeight: '500',
    },
    menuSubtitle: {
        fontSize: 13,
        marginTop: 2,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
        marginBottom: 24,
        gap: 8,
    },
    logoutText: {
        fontWeight: '600',
        fontSize: 15,
    },
    versionText: {
        textAlign: 'center',
        fontSize: 13,
    },
});
