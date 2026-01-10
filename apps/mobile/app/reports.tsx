import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { useBusiness } from '../src/context/BusinessContext';
import { useSubscription } from '../src/context/SubscriptionContext';
import { transactionsAPI } from '../src/services/api';
import { Paywall } from '../src/components/Paywall';
import { Colors } from '../src/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ReportsScreen() {
    const { currentBusiness } = useBusiness();
    const { canUseFeature, upgradeRequired } = useSubscription();
    const [loading, setLoading] = useState(true);
    const [showPaywall, setShowPaywall] = useState(false);
    const [stats, setStats] = useState({
        totalIncome: 0,
        totalExpenses: 0,
        netProfit: 0,
        taxEstimate: 0,
    });
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

    useEffect(() => {
        if (!canUseFeature('reports')) {
            setShowPaywall(true);
            setLoading(false);
            return;
        }
        loadReports();
    }, [currentBusiness]);

    const loadReports = async () => {
        if (!currentBusiness) return;

        try {
            setLoading(true);
            const response = await transactionsAPI.getAll({
                businessId: currentBusiness.id,
                limit: 1000,
            });

            const transactions = response.transactions || [];

            const income = transactions
                .filter(t => t.type === 'INCOME')
                .reduce((sum, t) => sum + Number(t.amount), 0);

            const expenses = transactions
                .filter(t => t.type === 'EXPENSE')
                .reduce((sum, t) => sum + Number(t.amount), 0);

            const taxDeductible = transactions
                .filter(t => t.type === 'EXPENSE' && t.isTaxDeductible)
                .reduce((sum, t) => sum + Number(t.amount), 0);

            const taxableIncome = income - taxDeductible;
            const taxEstimate = taxableIncome * 0.2;

            setStats({
                totalIncome: income,
                totalExpenses: expenses,
                netProfit: income - expenses,
                taxEstimate,
            });
        } catch (error) {
            console.error('Error loading reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        const currency = currentBusiness?.currency || 'USD';
        const symbols: Record<string, string> = { USD: '$', NGN: '₦', EUR: '€', GBP: '£', CAD: 'CA$', AUD: 'A$', GHS: '₵', KES: 'KSh', ZAR: 'R' };
        const symbol = symbols[currency] || '$';
        return `${symbol}${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    if (upgradeRequired('reports')) {
        return (
            <>
                <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
                    <View style={[styles.lockIcon, { backgroundColor: theme.primary + '15' }]}>
                        <Ionicons name="lock-closed" size={40} color={theme.primary} />
                    </View>
                    <Text style={[styles.lockTitle, { color: theme.text }]}>Premium Feature</Text>
                    <Text style={[styles.lockSubtitle, { color: theme.textSecondary }]}>
                        Unlock detailed financial reports, tax calculations, and export options.
                    </Text>
                    <TouchableOpacity
                        style={[styles.upgradeButton, { backgroundColor: theme.primary }]}
                        onPress={() => setShowPaywall(true)}
                    >
                        <Ionicons name="rocket" size={20} color="#FFFFFF" />
                        <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
                    </TouchableOpacity>
                </View>
                <Paywall visible={showPaywall} onClose={() => setShowPaywall(false)} feature="reports" />
            </>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Reports</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Generating reports...</Text>
                </View>
            ) : (
                <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Hero Stats */}
                    <View style={[styles.heroCard, { backgroundColor: theme.primary }]}>
                        <Text style={styles.heroLabel}>Net Profit</Text>
                        <Text style={[styles.heroAmount, { color: stats.netProfit >= 0 ? '#FFFFFF' : '#FCA5A5' }]}>
                            {formatCurrency(stats.netProfit)}
                        </Text>
                        <Text style={styles.heroPeriod}>This period</Text>
                    </View>

                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                        <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <View style={[styles.statIcon, { backgroundColor: theme.success + '15' }]}>
                                <Ionicons name="arrow-down" size={18} color={theme.success} />
                            </View>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Income</Text>
                            <Text style={[styles.statAmount, { color: theme.success }]}>{formatCurrency(stats.totalIncome)}</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <View style={[styles.statIcon, { backgroundColor: theme.error + '15' }]}>
                                <Ionicons name="arrow-up" size={18} color={theme.error} />
                            </View>
                            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Expenses</Text>
                            <Text style={[styles.statAmount, { color: theme.error }]}>{formatCurrency(stats.totalExpenses)}</Text>
                        </View>
                    </View>

                    {/* Tax Estimate Card */}
                    <View style={[styles.taxCard, { backgroundColor: theme.warning + '12', borderColor: theme.warning + '30' }]}>
                        <View style={styles.taxHeader}>
                            <View style={[styles.taxIcon, { backgroundColor: theme.warning + '20' }]}>
                                <Ionicons name="calculator" size={22} color={theme.warning} />
                            </View>
                            <View>
                                <Text style={[styles.taxTitle, { color: theme.text }]}>Estimated Tax</Text>
                                <Text style={[styles.taxSubtitle, { color: theme.textSecondary }]}>Based on 20% rate</Text>
                            </View>
                        </View>
                        <Text style={[styles.taxAmount, { color: theme.warning }]}>{formatCurrency(stats.taxEstimate)}</Text>
                        <Text style={[styles.taxNote, { color: theme.textMuted }]}>
                            This is a simplified estimate. Consult a tax professional for accurate calculations.
                        </Text>
                    </View>

                    {/* Export Options */}
                    <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>EXPORT</Text>

                    <TouchableOpacity style={[styles.exportCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <View style={styles.exportLeft}>
                            <View style={[styles.exportIcon, { backgroundColor: '#EF4444' + '15' }]}>
                                <Ionicons name="document" size={20} color="#EF4444" />
                            </View>
                            <View>
                                <Text style={[styles.exportTitle, { color: theme.text }]}>Export to PDF</Text>
                                <Text style={[styles.exportDesc, { color: theme.textSecondary }]}>Download detailed report</Text>
                            </View>
                        </View>
                        <View style={[styles.comingSoonBadge, { backgroundColor: theme.primary + '15' }]}>
                            <Text style={[styles.comingSoonText, { color: theme.primary }]}>Soon</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.exportCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <View style={styles.exportLeft}>
                            <View style={[styles.exportIcon, { backgroundColor: '#22C55E' + '15' }]}>
                                <Ionicons name="grid" size={20} color="#22C55E" />
                            </View>
                            <View>
                                <Text style={[styles.exportTitle, { color: theme.text }]}>Export to CSV</Text>
                                <Text style={[styles.exportDesc, { color: theme.textSecondary }]}>Download transaction data</Text>
                            </View>
                        </View>
                        <View style={[styles.comingSoonBadge, { backgroundColor: theme.primary + '15' }]}>
                            <Text style={[styles.comingSoonText, { color: theme.primary }]}>Soon</Text>
                        </View>
                    </TouchableOpacity>

                    <View style={{ height: 40 }} />
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    lockIcon: {
        width: 88,
        height: 88,
        borderRadius: 44,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    lockTitle: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 12,
    },
    lockSubtitle: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
    },
    upgradeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 28,
        paddingVertical: 16,
        borderRadius: 14,
    },
    upgradeButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 15,
    },
    scrollContent: {
        flex: 1,
        paddingHorizontal: 20,
    },
    heroCard: {
        borderRadius: 20,
        padding: 24,
        marginTop: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 6,
    },
    heroLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        fontWeight: '600',
    },
    heroAmount: {
        fontSize: 38,
        fontWeight: '800',
        marginTop: 8,
        letterSpacing: -1,
    },
    heroPeriod: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
        marginTop: 8,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        padding: 18,
        borderRadius: 16,
        borderWidth: 1,
    },
    statIcon: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    statLabel: {
        fontSize: 13,
        fontWeight: '500',
    },
    statAmount: {
        fontSize: 20,
        fontWeight: '700',
        marginTop: 4,
    },
    taxCard: {
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 28,
    },
    taxHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginBottom: 16,
    },
    taxIcon: {
        width: 46,
        height: 46,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    taxTitle: {
        fontSize: 17,
        fontWeight: '600',
    },
    taxSubtitle: {
        fontSize: 13,
        marginTop: 2,
    },
    taxAmount: {
        fontSize: 32,
        fontWeight: '800',
        marginBottom: 12,
    },
    taxNote: {
        fontSize: 12,
        lineHeight: 18,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 1,
        marginBottom: 14,
        marginLeft: 4,
    },
    exportCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 18,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
    },
    exportLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    exportIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    exportTitle: {
        fontWeight: '600',
        fontSize: 15,
    },
    exportDesc: {
        fontSize: 13,
        marginTop: 2,
    },
    comingSoonBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    comingSoonText: {
        fontSize: 12,
        fontWeight: '600',
    },
});
