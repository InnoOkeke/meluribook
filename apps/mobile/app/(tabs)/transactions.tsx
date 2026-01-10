import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet, useColorScheme } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useCallback } from 'react';
import { useBusiness } from '../../src/context/BusinessContext';
import { transactionsAPI } from '../../src/services/api';
import { Transaction } from '../../src/types/models';
import { EmptyState } from '../../src/components/EmptyState';
import { Colors } from '../../src/constants/Colors';

export default function TransactionsScreen() {
    const router = useRouter();
    const { currentBusiness } = useBusiness();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

    // Real-time subscription
    useEffect(() => {
        if (!currentBusiness) return;

        setLoading(true);
        const unsubscribe = transactionsAPI.subscribe(
            { businessId: currentBusiness.id, limit: 100 },
            (data) => {
                // Client-side sort by date (descending)
                // prioritize createdAt (Timestamp/Date object) then date (string)
                const sorted = data.sort((a: any, b: any) => {
                    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.date || 0);
                    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.date || 0);
                    return dateB.getTime() - dateA.getTime();
                });

                setTransactions(sorted);
                setLoading(false);
                setRefreshing(false);
            }
        );

        return () => unsubscribe();
    }, [currentBusiness]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        // Subscription auto-updates, but we can force re-render or just wait
        setTimeout(() => setRefreshing(false), 1000);
    }, []);

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
        return d.toLocaleDateString();
    };

    const filteredTransactions = transactions.filter(tx =>
        filter === 'ALL' ? true : tx.type === filter
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Transactions</Text>

                {/* Filter Tabs */}
                <View style={styles.filterContainer}>
                    {(['ALL', 'INCOME', 'EXPENSE'] as const).map((f) => (
                        <TouchableOpacity
                            key={f}
                            style={[
                                styles.filterButton,
                                { backgroundColor: filter === f ? theme.primary : theme.surfaceSecondary }
                            ]}
                            onPress={() => setFilter(f)}
                        >
                            <Text style={[
                                styles.filterText,
                                { color: filter === f ? theme.buttonPrimaryText : theme.text }
                            ]}>
                                {f === 'ALL' ? 'All' : f === 'INCOME' ? 'Income' : 'Expenses'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : filteredTransactions.length === 0 ? (
                <EmptyState
                    title="No Transactions"
                    description="Start tracking your income and expenses"
                    icon="💸"
                    actionLabel="Add Transaction"
                    onAction={() => router.push('/transaction/add')}
                />
            ) : (
                <FlatList
                    data={filteredTransactions}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
                    }
                    renderItem={({ item }) => (
                        <View style={styles.transactionItem}>
                            <View style={styles.transactionLeft}>
                                <View style={[
                                    styles.iconContainer,
                                    { backgroundColor: item.type === 'INCOME' ? theme.success + '20' : theme.error + '20' }
                                ]}>
                                    <Ionicons
                                        name={item.type === 'INCOME' ? "arrow-down" : "arrow-up"}
                                        size={20}
                                        color={item.type === 'INCOME' ? theme.success : theme.error}
                                    />
                                </View>
                                <View>
                                    <Text style={[styles.transactionTitle, { color: theme.text }]}>
                                        {item.description || item.payee || 'Transaction'}
                                    </Text>
                                    <Text style={[styles.transactionSubtitle, { color: theme.textSecondary }]}>
                                        {formatDate(item.date)} • {item.category || 'Uncategorized'}
                                    </Text>
                                </View>
                            </View>
                            <Text style={[
                                styles.transactionAmount,
                                { color: item.type === 'INCOME' ? theme.success : theme.text }
                            ]}>
                                {item.type === 'INCOME' ? '+' : '-'}{formatCurrency(Number(item.amount))}
                            </Text>
                        </View>
                    )}
                />
            )}

            <TouchableOpacity
                onPress={() => router.push("/transaction/add")}
                style={[styles.fab, { backgroundColor: theme.primary }]}
            >
                <Ionicons name="add" size={30} color="#FFFFFF" />
            </TouchableOpacity>
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
        marginBottom: 14,
    },
    filterContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    filterButton: {
        paddingHorizontal: 16,
        paddingVertical: 9,
        borderRadius: 22,
    },
    filterText: {
        fontSize: 14,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    listContent: {
        padding: 20,
        paddingBottom: 100,
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
        paddingBottom: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F020',
    },
    transactionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        flex: 1,
        marginRight: 16,
    },
    iconContainer: {
        width: 46,
        height: 46,
        borderRadius: 23,
        alignItems: 'center',
        justifyContent: 'center',
    },
    transactionTitle: {
        fontWeight: '600',
        fontSize: 15,
        marginBottom: 3,
    },
    transactionSubtitle: {
        fontSize: 13,
    },
    transactionAmount: {
        fontWeight: '700',
        fontSize: 16,
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 8,
    },
});
