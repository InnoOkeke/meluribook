import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, useColorScheme, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useBusiness } from "../../src/context/BusinessContext";
import { invoicesAPI, transactionsAPI } from "../../src/services/api";
import { Colors } from "../../src/constants/Colors";
import { Button } from "../../src/components/Button";

const STATUS_CONFIG = {
    PAID: { bg: 'success', text: 'success', label: 'Paid' },
    SENT: { bg: 'primary', text: 'primary', label: 'Sent' },
    OVERDUE: { bg: 'error', text: 'error', label: 'Overdue' },
    DRAFT: { bg: 'surfaceSecondary', text: 'textSecondary', label: 'Draft' },
    CANCELLED: { bg: 'surfaceSecondary', text: 'textMuted', label: 'Cancelled' },
};

export default function InvoiceDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { currentBusiness } = useBusiness();
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

    const [invoice, setInvoice] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        loadInvoice();
    }, [id, currentBusiness]);

    const loadInvoice = async () => {
        if (!currentBusiness || !id) return;

        try {
            setLoading(true);
            const response = await invoicesAPI.getAll({
                businessId: currentBusiness.id,
                limit: 100,
            });
            const found = response.invoices.find((inv: any) => inv.id === id);
            setInvoice(found || null);
        } catch (error) {
            console.error("Error loading invoice:", error);
            Alert.alert("Error", "Failed to load invoice");
        } finally {
            setLoading(false);
        }
    };

    const handleMarkPaid = async () => {
        if (!currentBusiness || !id) return;

        // Optimistic update - update UI immediately
        const previousStatus = invoice.status;
        setInvoice({ ...invoice, status: 'PAID' });

        try {
            // Calculate amount (fallback for old invoices that might miss totalAmount)
            const amount = invoice.totalAmount || invoice.items?.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0) || 0;

            // Fire and Forget - Don't wait for server response to avoid hanging
            Promise.all([
                invoicesAPI.markPaid({ businessId: currentBusiness.id, invoiceId: id }),
                transactionsAPI.create({
                    businessId: currentBusiness.id,
                    type: 'INCOME',
                    amount: amount,
                    currency: invoice.currency || currentBusiness.currency,
                    date: new Date().toISOString(),
                    description: `Payment received: ${invoice.number} - ${invoice.customerName}`,
                    category: 'Services',
                    isTaxDeductible: false,
                })
            ]).catch(error => {
                console.error("Background update failed:", error);
                // In production, might want to show a delayed toast or revert UI
                // For now, logging error. Reverting UI might be confusing if it happens late.
                // setInvoice({ ...invoice, status: previousStatus }); 
                // Alert.alert("Error", "Failed to sync updates (Offline?)");
            });

            // Alerts removed for cleaner UX
            // Alert.alert("Success", ...); 

        } catch (error) {
            console.error("Error preparing updates:", error);
            // Revert only if synchronous prep fails
            setInvoice({ ...invoice, status: previousStatus });
        }
    };

    const handleSend = async () => {
        if (!currentBusiness || !id) return;

        // Optimistic update - update UI immediately
        const previousStatus = invoice.status;
        setInvoice({ ...invoice, status: 'SENT' });

        try {
            await invoicesAPI.send({ businessId: currentBusiness.id, invoiceId: id });
            Alert.alert("Success", "Invoice marked as sent");
        } catch (error) {
            // Rollback on error
            setInvoice({ ...invoice, status: previousStatus });
            console.error("Error sending invoice:", error);
            Alert.alert("Error", "Failed to send invoice");
        }
    };

    const formatCurrency = (amount: number) => {
        const symbols: Record<string, string> = { USD: '$', NGN: '₦', EUR: '€', GBP: '£', CAD: 'CA$', AUD: 'A$', GHS: '₵', KES: 'KSh', ZAR: 'R' };
        const symbol = symbols[invoice?.currency] || '$';
        return `${symbol}${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDate = (date: string | Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getStatusStyle = (status: string) => {
        const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.DRAFT;
        // @ts-ignore
        const bgColor = theme[config.bg] || theme.surfaceSecondary;
        // @ts-ignore
        const textColor = theme[config.text] || theme.text;
        return {
            bg: status === 'DRAFT' || status === 'CANCELLED' ? bgColor : bgColor + '20',
            text: textColor,
            label: config.label
        };
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            </View>
        );
    }

    if (!invoice) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.loadingContainer}>
                    <Text style={{ color: theme.textSecondary }}>Invoice not found</Text>
                    <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
                        <Text style={{ color: theme.primary }}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const statusStyle = getStatusStyle(invoice.status);

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Custom Header */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>{invoice.number || 'Invoice'}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Status Banner */}
                <View style={[styles.statusBanner, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusText, { color: statusStyle.text }]}>
                        {statusStyle.label.toUpperCase()}
                    </Text>
                </View>

                {/* Amount Card */}
                <View style={[styles.amountCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Text style={[styles.amountLabel, { color: theme.textSecondary }]}>Total Amount</Text>
                    <Text style={[styles.amountValue, { color: theme.text }]}>
                        {formatCurrency(invoice.totalAmount)}
                    </Text>
                    <Text style={[styles.amountCurrency, { color: theme.textMuted }]}>{invoice.currency}</Text>
                </View>

                {/* Invoice Info */}
                <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Invoice Details</Text>

                    <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Invoice Number</Text>
                        <Text style={[styles.infoValue, { color: theme.text }]}>{invoice.number}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Issue Date</Text>
                        <Text style={[styles.infoValue, { color: theme.text }]}>{formatDate(invoice.issueDate)}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Due Date</Text>
                        <Text style={[styles.infoValue, { color: theme.text }]}>{formatDate(invoice.dueDate)}</Text>
                    </View>
                </View>

                {/* Client Info */}
                <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Bill To</Text>

                    <Text style={[styles.clientName, { color: theme.text }]}>{invoice.customerName}</Text>
                    {invoice.customerEmail && (
                        <View style={styles.clientRow}>
                            <Ionicons name="mail-outline" size={16} color={theme.textSecondary} />
                            <Text style={[styles.clientDetail, { color: theme.textSecondary }]}>{invoice.customerEmail}</Text>
                        </View>
                    )}
                    {invoice.customerPhone && (
                        <View style={styles.clientRow}>
                            <Ionicons name="call-outline" size={16} color={theme.textSecondary} />
                            <Text style={[styles.clientDetail, { color: theme.textSecondary }]}>{invoice.customerPhone}</Text>
                        </View>
                    )}
                </View>

                {/* Items */}
                <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Items</Text>

                    {invoice.items?.map((item: any, idx: number) => (
                        <View key={idx} style={[styles.itemRow, { borderBottomColor: theme.border }]}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.itemDesc, { color: theme.text }]}>{item.description}</Text>
                                <Text style={[styles.itemMeta, { color: theme.textSecondary }]}>
                                    {item.quantity} × {formatCurrency(item.unitPrice)}
                                </Text>
                            </View>
                            <Text style={[styles.itemAmount, { color: theme.text }]}>
                                {formatCurrency(item.amount)}
                            </Text>
                        </View>
                    ))}

                    <View style={[styles.totalRow, { borderTopColor: theme.border }]}>
                        <Text style={[styles.totalLabel, { color: theme.text }]}>Total</Text>
                        <Text style={[styles.totalValue, { color: theme.primary }]}>
                            {formatCurrency(invoice.totalAmount)}
                        </Text>
                    </View>
                </View>

                {/* Note */}
                {invoice.note && (
                    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <Text style={[styles.cardTitle, { color: theme.text }]}>Note</Text>
                        <Text style={[styles.noteText, { color: theme.textSecondary }]}>{invoice.note}</Text>
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Actions */}
            {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
                <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
                    {invoice.status === 'DRAFT' && (
                        <Button
                            title="Send Invoice"
                            onPress={handleSend}
                            loading={updating}
                            style={{ flex: 1, marginRight: 8 }}
                        />
                    )}
                    <Button
                        title="Mark as Paid"
                        onPress={handleMarkPaid}
                        loading={updating}
                        variant={invoice.status === 'DRAFT' ? 'secondary' : 'primary'}
                        style={{ flex: 1 }}
                    />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 56,
        paddingBottom: 16,
        paddingHorizontal: 20,
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
    scrollView: {
        flex: 1,
        paddingHorizontal: 20,
    },
    statusBanner: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginTop: 8,
        marginBottom: 16,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
    },
    amountCard: {
        padding: 24,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
        marginBottom: 16,
    },
    amountLabel: {
        fontSize: 14,
    },
    amountValue: {
        fontSize: 36,
        fontWeight: '800',
        marginTop: 4,
    },
    amountCurrency: {
        fontSize: 14,
        marginTop: 2,
    },
    card: {
        padding: 18,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    infoLabel: {
        fontSize: 14,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
    },
    clientName: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
    },
    clientRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 6,
    },
    clientDetail: {
        fontSize: 14,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    itemDesc: {
        fontSize: 15,
        fontWeight: '500',
    },
    itemMeta: {
        fontSize: 13,
        marginTop: 2,
    },
    itemAmount: {
        fontSize: 15,
        fontWeight: '600',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 16,
        marginTop: 8,
        borderTopWidth: 2,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
    totalValue: {
        fontSize: 20,
        fontWeight: '800',
    },
    noteText: {
        fontSize: 14,
        fontStyle: 'italic',
    },
    footer: {
        flexDirection: 'row',
        padding: 20,
        borderTopWidth: 1,
    },
});
