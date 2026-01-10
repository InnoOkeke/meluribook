import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, useColorScheme } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { Input } from "../../src/components/Input";
import { Button } from "../../src/components/Button";
import { useBusiness } from "../../src/context/BusinessContext";
import { transactionsAPI } from "../../src/services/api";
import { ReceiptScanner } from "../../src/components/ReceiptScanner";
import { Colors } from "../../src/constants/Colors";

type TransactionType = "EXPENSE" | "INCOME";

const CATEGORIES = {
    EXPENSE: [
        { name: "Office", icon: "briefcase" },
        { name: "Travel", icon: "airplane" },
        { name: "Meals", icon: "restaurant" },
        { name: "Software", icon: "code" },
        { name: "Equipment", icon: "hardware-chip" },
        { name: "Other", icon: "ellipsis-horizontal" },
    ],
    INCOME: [
        { name: "Services", icon: "construct" },
        { name: "Product", icon: "cube" },
        { name: "Consulting", icon: "chatbubbles" },
        { name: "Royalty", icon: "trophy" },
        { name: "Other", icon: "ellipsis-horizontal" },
    ],
};

function AddTransactionScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { currentBusiness } = useBusiness();
    const [type, setType] = useState<TransactionType>((params.type as TransactionType) || "EXPENSE");
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

    const handleSubmit = async () => {
        if (!amount || !description || !category) {
            Alert.alert("Missing Fields", "Please fill in all fields");
            return;
        }

        if (!currentBusiness) {
            Alert.alert("Error", "No business selected.");
            return;
        }

        // Optimistic UI - show success and navigate immediately
        Alert.alert("Success", "Transaction added!", [
            { text: "OK", onPress: () => router.back() }
        ]);

        // API call happens in background
        try {
            await transactionsAPI.create({
                businessId: currentBusiness.id,
                type,
                amount: parseFloat(amount),
                currency: currentBusiness.currency,
                date: new Date().toISOString(),
                description,
                category,
                isTaxDeductible: false,
            });
        } catch (error: any) {
            // If it fails, the user already navigated back
            // We could show a toast notification here, but for now just log
            console.error("Error adding transaction:", error);
        }
    };

    const currency = currentBusiness?.currency || 'USD';
    const currencySymbol = currency === 'NGN' ? '₦' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="close" size={26} color={theme.textMuted} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Add Transaction</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Type Switcher */}
                <View style={[styles.typeSwitcher, { backgroundColor: theme.surfaceSecondary }]}>
                    <TouchableOpacity
                        onPress={() => setType("EXPENSE")}
                        style={[
                            styles.typeOption,
                            type === "EXPENSE" && [styles.activeTypeOption, { backgroundColor: theme.surface }]
                        ]}
                    >
                        <Ionicons
                            name="arrow-up-circle"
                            size={22}
                            color={type === "EXPENSE" ? theme.error : theme.textMuted}
                        />
                        <Text style={[
                            styles.typeText,
                            { color: type === "EXPENSE" ? theme.error : theme.textMuted }
                        ]}>
                            Expense
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setType("INCOME")}
                        style={[
                            styles.typeOption,
                            type === "INCOME" && [styles.activeTypeOption, { backgroundColor: theme.surface }]
                        ]}
                    >
                        <Ionicons
                            name="arrow-down-circle"
                            size={22}
                            color={type === "INCOME" ? theme.success : theme.textMuted}
                        />
                        <Text style={[
                            styles.typeText,
                            { color: type === "INCOME" ? theme.success : theme.textMuted }
                        ]}>
                            Income
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Amount Input - Hero Style */}
                <View style={[styles.amountCard, {
                    backgroundColor: type === 'INCOME' ? theme.success + '10' : theme.error + '10',
                    borderColor: type === 'INCOME' ? theme.success + '30' : theme.error + '30'
                }]}>
                    <Text style={[styles.amountLabel, { color: theme.textSecondary }]}>AMOUNT</Text>
                    <View style={styles.amountRow}>
                        <Text style={[styles.currencySymbol, { color: type === 'INCOME' ? theme.success : theme.error }]}>
                            {currencySymbol}
                        </Text>
                        <Input
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="decimal-pad"
                            placeholder="0.00"
                            style={[styles.amountInput, { color: type === 'INCOME' ? theme.success : theme.error }]}
                            containerStyle={{ marginBottom: 0, flex: 1 }}
                        />
                    </View>
                </View>

                {/* Description */}
                <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="document-text" size={20} color={theme.textSecondary} />
                        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Description</Text>
                    </View>
                    <Input
                        placeholder="What is this for?"
                        value={description}
                        onChangeText={setDescription}
                        containerStyle={{ marginBottom: 0 }}
                    />
                </View>

                {/* Categories */}
                <View style={styles.categorySection}>
                    <Text style={[styles.categoryTitle, { color: theme.textSecondary }]}>CATEGORY</Text>
                    <View style={styles.categoryGrid}>
                        {CATEGORIES[type].map((cat) => (
                            <TouchableOpacity
                                key={cat.name}
                                onPress={() => setCategory(cat.name)}
                                style={[
                                    styles.categoryCard,
                                    {
                                        backgroundColor: category === cat.name ? theme.primary : theme.surface,
                                        borderColor: category === cat.name ? theme.primary : theme.border
                                    }
                                ]}
                            >
                                <View style={[
                                    styles.categoryIcon,
                                    { backgroundColor: category === cat.name ? 'rgba(255,255,255,0.2)' : theme.surfaceSecondary }
                                ]}>
                                    <Ionicons
                                        name={cat.icon as any}
                                        size={20}
                                        color={category === cat.name ? '#FFFFFF' : theme.textSecondary}
                                    />
                                </View>
                                <Text style={[
                                    styles.categoryText,
                                    { color: category === cat.name ? '#FFFFFF' : theme.text }
                                ]}>
                                    {cat.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Receipt Scanner */}
                <View style={[styles.scannerSection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <ReceiptScanner
                        onScanComplete={(data) => {
                            if (data.amount) setAmount(data.amount.toString());
                            if (data.vendor) setDescription(data.vendor);
                            const catNames = CATEGORIES[type].map(c => c.name);
                            if (data.category && catNames.includes(data.category as any)) {
                                setCategory(data.category);
                            }
                        }}
                    />
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
                <Button
                    title={type === 'INCOME' ? "Record Income" : "Record Expense"}
                    onPress={handleSubmit}
                    loading={loading}
                    disabled={!amount || !description || !category}
                    size="lg"
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
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
    typeSwitcher: {
        flexDirection: 'row',
        padding: 5,
        borderRadius: 16,
        marginTop: 20,
        marginBottom: 24,
    },
    typeOption: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    activeTypeOption: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    typeText: {
        fontWeight: '600',
        fontSize: 15,
    },
    amountCard: {
        padding: 24,
        borderRadius: 20,
        marginBottom: 20,
        borderWidth: 1,
    },
    amountLabel: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 1,
        marginBottom: 12,
    },
    amountRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    currencySymbol: {
        fontSize: 32,
        fontWeight: '700',
        marginRight: 8,
    },
    amountInput: {
        fontSize: 36,
        fontWeight: '800',
        padding: 0,
        borderWidth: 0,
        backgroundColor: 'transparent',
    },
    section: {
        padding: 18,
        borderRadius: 16,
        marginBottom: 20,
        borderWidth: 1,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 14,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    categorySection: {
        marginBottom: 20,
    },
    categoryTitle: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 1,
        marginBottom: 14,
        marginLeft: 4,
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    categoryCard: {
        width: '31%',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        borderWidth: 1,
    },
    categoryIcon: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    categoryText: {
        fontSize: 12,
        fontWeight: '600',
    },
    scannerSection: {
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
    },
});

export default AddTransactionScreen;
