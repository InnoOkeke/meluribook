import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet, useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Card } from '../../src/components/Card';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useBusiness } from '../../src/context/BusinessContext';
import { useEffect, useState, useCallback } from 'react';
import { transactionsAPI } from '../../src/services/api';
import { Transaction, DashboardStats } from '../../src/types/models';
import { Colors } from '../../src/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeScreen() {
    const { user } = useAuth();
    const { currentBusiness } = useBusiness();
    const [stats, setStats] = useState<DashboardStats>({ totalIncome: 0, totalExpenses: 0, netProfit: 0, pendingInvoices: 0 });
    const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

    const loadDashboardData = async () => {
        if (!currentBusiness) return;

        try {
            setLoading(true);

            // Load transactions (fetch enough for stats and recent list)
            const allTxResponse = await transactionsAPI.getAll({
                businessId: currentBusiness.id,
                limit: 100 // Optimization: increase limit if needed, but 100 covers most needs. 1000 might differ.
            });

            const rawTransactions = allTxResponse.transactions || [];

            // Client-side sort by date (descending)
            const sortedTransactions = rawTransactions.sort((a: any, b: any) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.date || 0);
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.date || 0);
                return dateB.getTime() - dateA.getTime();
            });

            // Set Recent Transactions (Top 5)
            setRecentTransactions(sortedTransactions.slice(0, 5));

            // Calculate stats from transactions
            // Note: If limit is 100, stats are based on last 100. For MVP this is acceptable or increase limit.
            // Reusing sortedTransactions since it's the same data.
            const transactions = sortedTransactions;


            const income = transactions
                .filter((t: Transaction) => t.type === 'INCOME')
                .reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0);

            const expenses = transactions
                .filter((t: Transaction) => t.type === 'EXPENSE')
                .reduce((sum: number, t: Transaction) => sum + Number(t.amount), 0);

            setStats({
                totalIncome: income,
                totalExpenses: expenses,
                netProfit: income - expenses,
                pendingInvoices: 0
            });

        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (currentBusiness) {
                loadDashboardData();
            }
        }, [currentBusiness])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadDashboardData();
    }, [currentBusiness]);

    const formatCurrency = (amount: number) => {
        const currency = currentBusiness?.currency || 'USD';
        const symbols: Record<string, string> = { USD: '$', NGN: '₦', EUR: '€', GBP: '£', CAD: 'CA$', AUD: 'A$', GHS: '₵', KES: 'KSh', ZAR: 'R' };
        const symbol = symbols[currency] || '$';
        return `${symbol}${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDate = (date: Date | string) => {
        const d = typeof date === 'string' ? new Date(date) : date;
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        return d.toLocaleDateString();
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    if (!currentBusiness) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
                <View style={[styles.emptyIconContainer, { backgroundColor: theme.surfaceSecondary }]}>
                    <Ionicons name="business-outline" size={48} color={theme.primary} />
                </View>
                <Text style={[styles.title, { color: theme.text }]}>No Business Selected</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Create a business to get started</Text>
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.primary }]}
                    onPress={() => router.push('/business/create')}
                >
                    <Text style={[styles.buttonText, { color: theme.buttonPrimaryText }]}>Create Business</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.surface }]}>
                <View style={styles.headerContent}>
                    <View>
                        <Text style={[styles.greeting, { color: theme.textSecondary }]}>{getGreeting()}</Text>
                        <Text style={[styles.userName, { color: theme.text }]}>
                            {user?.displayName || user?.email?.split('@')[0] || 'User'}
                        </Text>
                        <View style={styles.businessBadge}>
                            <View style={[styles.businessDot, { backgroundColor: theme.primary }]} />
                            <Text style={[styles.businessName, { color: theme.textMuted }]}>{currentBusiness.name}</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={[styles.profileButton, { backgroundColor: theme.primary + '15' }]}
                        onPress={() => router.push('/(tabs)/more')}
                    >
                        <Text style={[styles.profileInitial, { color: theme.primary }]}>
                            {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
                }
            >

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.primary} />
                        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading dashboard...</Text>
                    </View>
                ) : (
                    <>
                        {/* Net Profit Card - Hero */}
                        <View style={[styles.heroCard, { backgroundColor: theme.primary }]}>
                            <View style={styles.heroContent}>
                                <View>
                                    <Text style={styles.heroLabel}>Net Profit</Text>
                                    <Text style={styles.heroAmount}>{formatCurrency(stats.netProfit)}</Text>
                                    <Text style={styles.heroPeriod}>This month</Text>
                                </View>
                                <View style={styles.heroIcon}>
                                    <Ionicons name="trending-up" size={32} color="rgba(255,255,255,0.6)" />
                                </View>
                            </View>
                        </View>

                        {/* Stats Row */}
                        <View style={styles.statsRow}>
                            <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                <View style={[styles.statIconContainer, { backgroundColor: theme.success + '15' }]}>
                                    <Ionicons name="arrow-down" size={18} color={theme.success} />
                                </View>
                                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Income</Text>
                                <Text style={[styles.statAmount, { color: theme.success }]}>{formatCurrency(stats.totalIncome)}</Text>
                            </View>
                            <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                <View style={[styles.statIconContainer, { backgroundColor: theme.error + '15' }]}>
                                    <Ionicons name="arrow-up" size={18} color={theme.error} />
                                </View>
                                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Expenses</Text>
                                <Text style={[styles.statAmount, { color: theme.error }]}>{formatCurrency(stats.totalExpenses)}</Text>
                            </View>
                        </View>

                        {/* Quick Actions */}
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
                        <View style={styles.actionsContainer}>
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                                onPress={() => router.push('/transaction/add?type=INCOME')}
                            >
                                <View style={[styles.actionIcon, { backgroundColor: theme.success + '15' }]}>
                                    <Ionicons name="add" size={22} color={theme.success} />
                                </View>
                                <Text style={[styles.actionLabel, { color: theme.text }]}>Income</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                                onPress={() => router.push('/transaction/add?type=EXPENSE')}
                            >
                                <View style={[styles.actionIcon, { backgroundColor: theme.error + '15' }]}>
                                    <Ionicons name="remove" size={22} color={theme.error} />
                                </View>
                                <Text style={[styles.actionLabel, { color: theme.text }]}>Expense</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                                onPress={() => router.push('/invoice/create')}
                            >
                                <View style={[styles.actionIcon, { backgroundColor: theme.secondary + '15' }]}>
                                    <Ionicons name="document-text" size={20} color={theme.secondary} />
                                </View>
                                <Text style={[styles.actionLabel, { color: theme.text }]}>Invoice</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Reports Button */}
                        <TouchableOpacity
                            style={[styles.reportsButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                            onPress={() => router.push('/reports')}
                        >
                            <View style={styles.reportsContent}>
                                <View style={[styles.reportsIconContainer, { backgroundColor: '#A855F7' + '15' }]}>
                                    <Ionicons name="bar-chart" size={22} color="#A855F7" />
                                </View>
                                <View>
                                    <Text style={[styles.reportsTitle, { color: theme.text }]}>View Reports</Text>
                                    <Text style={[styles.reportsSubtitle, { color: theme.textSecondary }]}>P&L, Tax Estimates & More</Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
                        </TouchableOpacity>

                        {/* Recent Transactions */}
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Transactions</Text>
                            <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
                                <Text style={[styles.viewAll, { color: theme.primary }]}>View All</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.transactionsList}>
                            {recentTransactions.length === 0 ? (
                                <View style={[styles.emptyState, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                    <View style={[styles.emptyIconSmall, { backgroundColor: theme.surfaceSecondary }]}>
                                        <Ionicons name="wallet-outline" size={28} color={theme.textMuted} />
                                    </View>
                                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No transactions yet</Text>
                                    <TouchableOpacity
                                        style={[styles.addFirstButton, { backgroundColor: theme.primary }]}
                                        onPress={() => router.push('/transaction/add')}
                                    >
                                        <Text style={[styles.addFirstButtonText, { color: theme.buttonPrimaryText }]}>Add First Transaction</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                recentTransactions.map((tx) => (
                                    <View key={tx.id} style={[styles.transactionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                        <View style={styles.transactionLeft}>
                                            <View style={[
                                                styles.transactionIcon,
                                                { backgroundColor: tx.type === 'INCOME' ? theme.success + '15' : theme.error + '15' }
                                            ]}>
                                                <Ionicons
                                                    name={tx.type === 'INCOME' ? 'arrow-down' : 'arrow-up'}
                                                    size={18}
                                                    color={tx.type === 'INCOME' ? theme.success : theme.error}
                                                />
                                            </View>
                                            <View>
                                                <Text style={[styles.transactionTitle, { color: theme.text }]}>{(tx.description || tx.payee || 'Transaction').split(' - ')[0].replace('Payment received: ', '')}</Text>
                                                <Text style={[styles.transactionSubtitle, { color: theme.textMuted }]}>{tx.category || 'Uncategorized'}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.transactionRight}>
                                            <Text style={[
                                                styles.transactionAmount,
                                                { color: tx.type === 'INCOME' ? theme.success : theme.error }
                                            ]}>
                                                {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(Number(tx.amount))}
                                            </Text>
                                            <Text style={[styles.transactionDate, { color: theme.textMuted }]}>{formatDate(tx.date)}</Text>
                                        </View>
                                    </View>
                                ))
                            )}
                        </View>
                    </>
                )}

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },
    header: {
        paddingTop: 56,
        paddingBottom: 20,
        paddingHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    greeting: {
        fontSize: 14,
        fontWeight: '500',
    },
    userName: {
        fontSize: 26,
        fontWeight: '800',
        marginTop: 2,
        letterSpacing: -0.5,
    },
    businessBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },
    businessDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    businessName: {
        fontSize: 13,
        fontWeight: '500',
    },
    profileButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileInitial: {
        fontSize: 20,
        fontWeight: '700',
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        marginBottom: 24,
        textAlign: 'center',
    },
    button: {
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        fontWeight: '600',
        fontSize: 16,
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 15,
    },
    heroCard: {
        borderRadius: 20,
        padding: 24,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 6,
    },
    heroContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    heroLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    heroAmount: {
        color: '#FFFFFF',
        fontSize: 34,
        fontWeight: '800',
        letterSpacing: -1,
    },
    heroPeriod: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
        marginTop: 6,
    },
    heroIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 28,
    },
    statCard: {
        flex: 1,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    statIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    statLabel: {
        fontSize: 13,
        fontWeight: '500',
        marginBottom: 4,
    },
    statAmount: {
        fontSize: 20,
        fontWeight: '700',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
    },
    actionsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    actionButton: {
        flex: 1,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
    },
    actionIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    actionLabel: {
        fontSize: 13,
        fontWeight: '600',
    },
    reportsButton: {
        padding: 18,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 28,
        borderWidth: 1,
    },
    reportsContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    reportsIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    reportsTitle: {
        fontWeight: '600',
        fontSize: 15,
    },
    reportsSubtitle: {
        fontSize: 13,
        marginTop: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    viewAll: {
        fontWeight: '600',
        fontSize: 14,
    },
    transactionsList: {
        gap: 10,
    },
    emptyState: {
        padding: 32,
        alignItems: 'center',
        borderRadius: 16,
        borderWidth: 1,
    },
    emptyIconSmall: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 15,
        marginBottom: 20,
    },
    addFirstButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    addFirstButtonText: {
        fontWeight: '600',
        fontSize: 14,
    },
    transactionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
    },
    transactionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    transactionIcon: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
    },
    transactionTitle: {
        fontWeight: '600',
        fontSize: 15,
    },
    transactionSubtitle: {
        fontSize: 13,
        marginTop: 2,
    },
    transactionRight: {
        alignItems: 'flex-end',
    },
    transactionAmount: {
        fontWeight: '700',
        fontSize: 15,
    },
    transactionDate: {
        fontSize: 12,
        marginTop: 2,
    },
});
