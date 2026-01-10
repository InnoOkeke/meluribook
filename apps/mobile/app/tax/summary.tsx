import { View, Text, ScrollView, TouchableOpacity, StyleSheet, useColorScheme } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../src/constants/Colors";

const TAX_BREAKDOWN = [
    { id: '1', title: 'Income Tax', amount: 2450.00, percentage: 15, dueDate: 'Apr 15', icon: 'cash', color: '#8B5CF6' },
    { id: '2', title: 'VAT / Sales Tax', amount: 840.50, percentage: 7.5, dueDate: 'Monthly', icon: 'receipt', color: '#F59E0B' },
    { id: '3', title: 'Social Security', amount: 450.00, percentage: 0, dueDate: 'Quarterly', icon: 'people', color: '#0EA5A4' },
];

export default function TaxSummaryScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

    const formatCurrency = (amount: number) => `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Tax Outlook</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Hero Tax Card */}
                <View style={[styles.heroCard, { backgroundColor: theme.primary }]}>
                    <View style={styles.heroHeader}>
                        <View style={styles.heroIcon}>
                            <Ionicons name="calculator" size={24} color="#FFFFFF" />
                        </View>
                        <View style={[styles.rateBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                            <Text style={styles.rateText}>~22% Rate</Text>
                        </View>
                    </View>
                    <Text style={styles.heroLabel}>Estimated Tax Liability</Text>
                    <Text style={styles.heroAmount}>$3,740.50</Text>

                    <View style={[styles.heroStats, { borderTopColor: 'rgba(255,255,255,0.2)' }]}>
                        <View>
                            <Text style={styles.heroStatLabel}>Total Income</Text>
                            <Text style={styles.heroStatValue}>$16,850.00</Text>
                        </View>
                        <View style={[styles.heroStatDivider, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
                        <View>
                            <Text style={styles.heroStatLabel}>Deductions</Text>
                            <Text style={styles.heroStatValue}>-$4,200.00</Text>
                        </View>
                    </View>
                </View>

                {/* Tax Breakdown Section */}
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>TAX BREAKDOWN</Text>

                {TAX_BREAKDOWN.map((item) => (
                    <View
                        key={item.id}
                        style={[styles.breakdownCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    >
                        <View style={styles.breakdownLeft}>
                            <View style={[styles.breakdownIcon, { backgroundColor: item.color + '15' }]}>
                                <Ionicons name={item.icon as any} size={20} color={item.color} />
                            </View>
                            <View>
                                <Text style={[styles.breakdownTitle, { color: theme.text }]}>{item.title}</Text>
                                <Text style={[styles.breakdownDue, { color: theme.textMuted }]}>
                                    Due: {item.dueDate}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.breakdownRight}>
                            <Text style={[styles.breakdownAmount, { color: theme.text }]}>
                                {formatCurrency(item.amount)}
                            </Text>
                            {item.percentage > 0 && (
                                <Text style={[styles.breakdownPercent, { color: theme.textMuted }]}>
                                    {item.percentage}%
                                </Text>
                            )}
                        </View>
                    </View>
                ))}

                {/* Safe to Spend Card */}
                <View style={[styles.safeCard, { backgroundColor: theme.success + '10', borderColor: theme.success + '30' }]}>
                    <View style={styles.safeHeader}>
                        <View style={[styles.safeIcon, { backgroundColor: theme.success + '20' }]}>
                            <Ionicons name="shield-checkmark" size={24} color={theme.success} />
                        </View>
                        <View>
                            <Text style={[styles.safeTitle, { color: theme.success }]}>Safe to Spend</Text>
                            <Text style={[styles.safeSubtitle, { color: theme.textSecondary }]}>
                                After tax reserves
                            </Text>
                        </View>
                    </View>
                    <Text style={[styles.safeAmount, { color: theme.success }]}>$13,109.50</Text>
                    <Text style={[styles.safeNote, { color: theme.textMuted }]}>
                        This amount excludes your estimated tax liability.
                    </Text>
                </View>

                {/* Disclaimer */}
                <View style={[styles.disclaimerCard, { backgroundColor: theme.surfaceSecondary }]}>
                    <Ionicons name="information-circle" size={18} color={theme.textMuted} />
                    <Text style={[styles.disclaimerText, { color: theme.textMuted }]}>
                        These are simplified estimates. Consult a tax professional for accurate calculations.
                    </Text>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
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
    scrollContent: {
        flex: 1,
        paddingHorizontal: 20,
    },
    heroCard: {
        borderRadius: 24,
        padding: 24,
        marginTop: 20,
        marginBottom: 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 8,
    },
    heroHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    heroIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    rateBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    rateText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    heroLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        fontWeight: '500',
    },
    heroAmount: {
        color: '#FFFFFF',
        fontSize: 42,
        fontWeight: '800',
        marginTop: 4,
        letterSpacing: -1,
    },
    heroStats: {
        flexDirection: 'row',
        marginTop: 24,
        paddingTop: 20,
        borderTopWidth: 1,
    },
    heroStatLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
    },
    heroStatValue: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
        marginTop: 4,
    },
    heroStatDivider: {
        width: 1,
        marginHorizontal: 24,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 1,
        marginBottom: 14,
        marginLeft: 4,
    },
    breakdownCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 18,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
    },
    breakdownLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    breakdownIcon: {
        width: 46,
        height: 46,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    breakdownTitle: {
        fontSize: 15,
        fontWeight: '600',
    },
    breakdownDue: {
        fontSize: 13,
        marginTop: 2,
    },
    breakdownRight: {
        alignItems: 'flex-end',
    },
    breakdownAmount: {
        fontSize: 16,
        fontWeight: '700',
    },
    breakdownPercent: {
        fontSize: 12,
        marginTop: 2,
    },
    safeCard: {
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        marginTop: 16,
        marginBottom: 20,
    },
    safeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginBottom: 16,
    },
    safeIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    safeTitle: {
        fontSize: 17,
        fontWeight: '700',
    },
    safeSubtitle: {
        fontSize: 13,
        marginTop: 2,
    },
    safeAmount: {
        fontSize: 36,
        fontWeight: '800',
        marginBottom: 12,
    },
    safeNote: {
        fontSize: 13,
        lineHeight: 18,
    },
    disclaimerCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        borderRadius: 12,
        gap: 10,
    },
    disclaimerText: {
        flex: 1,
        fontSize: 12,
        lineHeight: 18,
    },
});
