import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useCallback } from 'react';
import { useBusiness } from '../../src/context/BusinessContext';
import { invoicesAPI } from '../../src/services/api';
import { Invoice } from '../../src/types/models';
import { EmptyState } from '../../src/components/EmptyState';
import { Colors } from '../../src/constants/Colors';

const STATUS_CONFIG = {
    PAID: { bg: 'success', text: 'success' },
    SENT: { bg: 'primary', text: 'primary' },
    OVERDUE: { bg: 'error', text: 'error' },
    DRAFT: { bg: 'surfaceSecondary', text: 'textSecondary' },
    CANCELLED: { bg: 'surfaceSecondary', text: 'textMuted' },
};

export default function InvoicesScreen() {
    const router = useRouter();
    const { currentBusiness } = useBusiness();
    const [filter, setFilter] = useState('ALL');
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

    const loadInvoices = async () => {
        if (!currentBusiness) return;

        try {
            setLoading(true);
            const response = await invoicesAPI.getAll({
                businessId: currentBusiness.id,
                limit: 100,
                status: filter === 'ALL' ? undefined : filter,
            });
            setInvoices(response.invoices || []);
        } catch (error) {
            console.error('Error loading invoices:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (currentBusiness) {
            loadInvoices();
        }
    }, [currentBusiness, filter]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadInvoices();
    }, [currentBusiness, filter]);

    const formatCurrency = (amount: number) => {
        const currency = currentBusiness?.currency || 'USD';
        const symbols: Record<string, string> = { USD: '$', NGN: '₦', EUR: '€', GBP: '£', CAD: 'CA$', AUD: 'A$', GHS: '₵', KES: 'KSh', ZAR: 'R' };
        const symbol = symbols[currency] || '$';
        return `${symbol}${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDate = (date: Date | string) => {
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleDateString();
    };

    const filteredInvoices = filter === 'ALL'
        ? invoices
        : invoices.filter(inv => inv.status === filter);

    const getStatusStyle = (status: string) => {
        const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.DRAFT;
        // @ts-ignore
        const bgColor = theme[config.bg] || theme.surfaceSecondary;
        // @ts-ignore
        const textColor = theme[config.text] || theme.text;

        // Adjust background opacity for badge effect
        return {
            bg: status === 'DRAFT' || status === 'CANCELLED' ? bgColor : bgColor + '20', // Add opacity for colored badges
            text: textColor
        };
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Invoices</Text>
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
                {['ALL', 'PAID', 'SENT', 'OVERDUE', 'DRAFT'].map((status) => (
                    <TouchableOpacity
                        key={status}
                        onPress={() => setFilter(status)}
                        style={[
                            styles.filterButton,
                            {
                                backgroundColor: filter === status ? theme.primary : theme.surface,
                                borderColor: filter === status ? theme.primary : theme.border,
                                borderWidth: 1
                            }
                        ]}
                    >
                        <Text style={[
                            styles.filterText,
                            { color: filter === status ? theme.buttonPrimaryText : theme.textSecondary }
                        ]}>{status}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : filteredInvoices.length === 0 ? (
                <EmptyState
                    title="No Invoices"
                    description="Create your first invoice to get started"
                    icon="📄"
                    actionLabel="Create Invoice"
                    onAction={() => router.push('/invoice/create')}
                />
            ) : (
                <FlatList
                    data={filteredInvoices}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
                    }
                    renderItem={({ item }) => {
                        const statusStyle = getStatusStyle(item.status);
                        return (
                            <TouchableOpacity
                                onPress={() => router.push(`/invoice/${item.id}`)}
                                style={[
                                    styles.invoiceCard,
                                    {
                                        backgroundColor: theme.surface,
                                        borderColor: theme.border
                                    }
                                ]}>
                                <View style={styles.cardHeader}>
                                    <Text style={[styles.customerName, { color: theme.text }]}>{item.customerName}</Text>
                                    <Text style={[styles.amount, { color: theme.text }]}>{formatCurrency(Number(item.totalAmount))}</Text>
                                </View>
                                <View style={styles.cardFooter}>
                                    <Text style={[styles.invoiceDetails, { color: theme.textSecondary }]}>{item.number} • {formatDate(item.issueDate)}</Text>
                                    <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                                        <Text style={[styles.statusText, { color: statusStyle.text }]}>
                                            {item.status}
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                />
            )}

            <TouchableOpacity
                onPress={() => router.push("/invoice/create")}
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
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 14,
        gap: 8,
    },
    filterButton: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
    },
    filterText: {
        fontSize: 12,
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
    invoiceCard: {
        padding: 18,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    customerName: {
        fontWeight: '700',
        fontSize: 16,
    },
    amount: {
        fontWeight: '700',
        fontSize: 16,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    invoiceDetails: {
        fontSize: 13,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
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
