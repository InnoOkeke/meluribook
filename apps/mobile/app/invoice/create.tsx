import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal, FlatList, StyleSheet, useColorScheme, Share, Linking, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { Input } from "../../src/components/Input";
import { Button } from "../../src/components/Button";
import * as Contacts from 'expo-contacts';
import { useBusiness } from "../../src/context/BusinessContext";
import { Colors } from "../../src/constants/Colors";
import { invoicesAPI } from "../../src/services/api";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
type InvoiceItem = {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
};

type ClientDetails = {
    name: string;
    email: string;
    phone: string;
    address: string;
};

type InvoiceStep = 'FORM' | 'CUSTOMIZE' | 'SHARE';

const MOCK_RECENT_ITEMS = [
    { id: '1', description: 'Web Design', unitPrice: 500 },
    { id: '2', description: 'Consultation (Hour)', unitPrice: 150 },
    { id: '3', description: 'Logo Design', unitPrice: 300 },
    { id: '4', description: 'Maintenance', unitPrice: 100 },
];
const CURRENCIES = [
    { code: "USD", name: "US Dollar", symbol: "$" },
    { code: "NGN", name: "Nigerian Naira", symbol: "₦" },
    { code: "EUR", name: "Euro", symbol: "€" },
    { code: "GBP", name: "British Pound", symbol: "£" },
    { code: "CAD", name: "Canadian Dollar", symbol: "CA$" },
    { code: "AUD", name: "Australian Dollar", symbol: "A$" },
    { code: "GHS", name: "Ghanaian Cedi", symbol: "₵" },
    { code: "KES", name: "Kenyan Shilling", symbol: "KSh" },
    { code: "ZAR", name: "South African Rand", symbol: "R" },
];

const COLOR_OPTIONS = [
    '#0EA5A4',
    '#2DD4BF',
    '#38BDF8',
    '#8B5CF6',
    '#EC4899',
    '#F59E0B',
];

// Step Indicator Component
const StepIndicator = ({ currentStep, theme }: { currentStep: InvoiceStep; theme: any }) => {
    const steps = [
        { key: 'FORM', label: 'Details' },
        { key: 'CUSTOMIZE', label: 'Customize' },
        { key: 'SHARE', label: 'Share' },
    ];
    const currentIndex = steps.findIndex(s => s.key === currentStep);

    return (
        <View style={stepStyles.container}>
            {steps.map((step, index) => (
                <View key={step.key} style={stepStyles.stepWrapper}>
                    <View style={stepStyles.stepItem}>
                        <View style={[
                            stepStyles.circle,
                            {
                                backgroundColor: index <= currentIndex ? theme.primary : theme.surfaceSecondary,
                                borderColor: index <= currentIndex ? theme.primary : theme.border
                            }
                        ]}>
                            {index < currentIndex ? (
                                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                            ) : (
                                <Text style={[
                                    stepStyles.circleText,
                                    { color: index <= currentIndex ? '#FFFFFF' : theme.textMuted }
                                ]}>{index + 1}</Text>
                            )}
                        </View>
                        <Text style={[
                            stepStyles.label,
                            { color: index <= currentIndex ? theme.text : theme.textMuted }
                        ]}>{step.label}</Text>
                    </View>
                    {index < steps.length - 1 && (
                        <View style={[
                            stepStyles.line,
                            { backgroundColor: index < currentIndex ? theme.primary : theme.border }
                        ]} />
                    )}
                </View>
            ))}
        </View>
    );
};

const stepStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    stepWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stepItem: {
        alignItems: 'center',
    },
    circle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    circleText: {
        fontSize: 12,
        fontWeight: '600',
    },
    label: {
        fontSize: 11,
        fontWeight: '500',
    },
    line: {
        width: 40,
        height: 2,
        marginHorizontal: 8,
        marginBottom: 20,
    },
});

// Customize Modal with Live Invoice Preview
const CustomizeModal = ({ visible, onClose, onNext, theme, client, items, currency, business, dueDate, selectedColor, onColorChange }: any) => {
    // const [selectedColor, setSelectedColor] = useState('#0EA5A4'); // Lifted up
    const [showBankDetails, setShowBankDetails] = useState(true);
    const [showLogo, setShowLogo] = useState(true);

    const totalAmount = items?.reduce((sum: number, item: InvoiceItem) => sum + item.amount, 0) || 0;
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const dueDateFormatted = dueDate ? new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : today;

    const formatCurrency = (amount: number) => {
        const symbols: Record<string, string> = { USD: '$', NGN: '₦', EUR: '€', GBP: '£', CAD: 'CA$', AUD: 'A$', GHS: '₵', KES: 'KSh', ZAR: 'R' };
        return `${symbols[currency] || '$'}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={[styles.header, { borderBottomColor: theme.border }]}>
                    <TouchableOpacity onPress={onClose} style={{ padding: 8, marginLeft: -8 }}>
                        <Ionicons name="arrow-back" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Customize Invoice</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                    {/* Live Invoice Preview - Professional Letter Style */}
                    <View style={[invoicePreviewStyles.container, { backgroundColor: '#FFFFFF' }]}>
                        {/* Company Header */}
                        <View style={invoicePreviewStyles.companyHeader}>
                            {showLogo && (
                                <View style={[invoicePreviewStyles.logoPlaceholder, { backgroundColor: selectedColor + '15' }]}>
                                    <Ionicons name="business" size={24} color={selectedColor} />
                                </View>
                            )}
                            <View style={invoicePreviewStyles.companyInfo}>
                                <Text style={[invoicePreviewStyles.companyName, { color: '#111827' }]}>
                                    {business?.name || 'Your Business'}
                                </Text>
                                <Text style={invoicePreviewStyles.companyDetail}>{business?.email || 'email@example.com'}</Text>
                                <Text style={invoicePreviewStyles.companyDetail}>{business?.phone || '+1 (555) 000-0000'}</Text>
                                {business?.address && <Text style={invoicePreviewStyles.companyDetail}>{business.address}</Text>}
                                {(business?.city || business?.state || business?.zipCode) && (
                                    <Text style={invoicePreviewStyles.companyDetail}>
                                        {[business?.city, business?.state, business?.zipCode].filter(Boolean).join(', ')}
                                    </Text>
                                )}
                            </View>
                        </View>

                        {/* Invoice Title & Number */}
                        <View style={[invoicePreviewStyles.invoiceTitleRow, { borderBottomColor: selectedColor }]}>
                            <View>
                                <Text style={[invoicePreviewStyles.invoiceTitle, { color: selectedColor }]}>INVOICE</Text>
                                <Text style={invoicePreviewStyles.invoiceNumber}>{invoiceNumber}</Text>
                            </View>
                            <View style={invoicePreviewStyles.dateBlock}>
                                <Text style={invoicePreviewStyles.dateLabel}>Date: {today}</Text>
                                <Text style={invoicePreviewStyles.dateLabel}>Due: {dueDateFormatted}</Text>
                            </View>
                        </View>

                        {/* Bill To & Ship To Row */}
                        <View style={{ flexDirection: 'row', marginBottom: 16, gap: 16 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={[invoicePreviewStyles.billToLabel, { color: selectedColor }]}>BILL TO</Text>
                                <Text style={invoicePreviewStyles.clientName}>{client?.name || 'Client Name'}</Text>
                                {client?.email && <Text style={invoicePreviewStyles.clientDetail}>{client.email}</Text>}
                                {client?.phone && <Text style={invoicePreviewStyles.clientDetail}>{client.phone}</Text>}
                            </View>
                            {client?.address && (
                                <View style={{ flex: 1 }}>
                                    <Text style={[invoicePreviewStyles.billToLabel, { color: selectedColor }]}>SHIP TO</Text>
                                    <Text style={invoicePreviewStyles.clientDetail}>{client.address}</Text>
                                </View>
                            )}
                        </View>

                        {/* Items Table */}
                        <View style={invoicePreviewStyles.itemsSection}>
                            <View style={[invoicePreviewStyles.itemHeader, { backgroundColor: selectedColor }]}>
                                <Text style={[invoicePreviewStyles.itemHeaderText, { flex: 2, color: '#FFFFFF' }]}>Description</Text>
                                <Text style={[invoicePreviewStyles.itemHeaderText, { color: '#FFFFFF' }]}>Qty</Text>
                                <Text style={[invoicePreviewStyles.itemHeaderText, { textAlign: 'right', color: '#FFFFFF' }]}>Amount</Text>
                            </View>
                            {items?.slice(0, 3).map((item: InvoiceItem, idx: number) => (
                                <View key={idx} style={[invoicePreviewStyles.itemRow, { backgroundColor: idx % 2 === 0 ? '#F9FAFB' : '#FFFFFF' }]}>
                                    <Text style={[invoicePreviewStyles.itemText, { flex: 2 }]} numberOfLines={1}>{item.description}</Text>
                                    <Text style={invoicePreviewStyles.itemText}>{item.quantity}</Text>
                                    <Text style={[invoicePreviewStyles.itemText, { textAlign: 'right', fontWeight: '600' }]}>{formatCurrency(item.amount)}</Text>
                                </View>
                            ))}
                            {items?.length > 3 && (
                                <Text style={invoicePreviewStyles.moreItems}>+{items.length - 3} more items</Text>
                            )}
                        </View>

                        {/* Total Section */}
                        <View style={invoicePreviewStyles.totalSection}>
                            <View style={invoicePreviewStyles.totalRow}>
                                <Text style={invoicePreviewStyles.subtotalLabel}>Subtotal</Text>
                                <Text style={invoicePreviewStyles.subtotalValue}>{formatCurrency(totalAmount)}</Text>
                            </View>
                            <View style={[invoicePreviewStyles.grandTotalRow, { backgroundColor: selectedColor + '10' }]}>
                                <Text style={[invoicePreviewStyles.grandTotalLabel, { color: selectedColor }]}>Total Due</Text>
                                <Text style={[invoicePreviewStyles.grandTotalValue, { color: selectedColor }]}>
                                    {formatCurrency(totalAmount)}
                                </Text>
                            </View>
                        </View>

                        {/* Bank Details */}
                        {showBankDetails && (
                            <View style={invoicePreviewStyles.bankSection}>
                                <Text style={[invoicePreviewStyles.bankTitle, { color: selectedColor }]}>Payment Details</Text>
                                <Text style={invoicePreviewStyles.bankText}>Bank: {business?.bankDetails?.bankName || 'Your Bank'}</Text>
                                <Text style={invoicePreviewStyles.bankText}>Account: {business?.bankDetails?.accountNumber || 'XXXX-XXXX-1234'}</Text>
                            </View>
                        )}

                        {/* Thank You Note */}
                        <View style={invoicePreviewStyles.noteSection}>
                            <Text style={invoicePreviewStyles.noteText}>Thank you for your business!</Text>
                        </View>
                    </View>

                    {/* Customization Options */}
                    <View style={{ padding: 20 }}>
                        {/* Color Selection */}
                        <View style={styles.customizeSection}>
                            <Text style={[styles.customizeLabel, { color: theme.text }]}>Invoice Color</Text>
                            <View style={styles.colorRow}>
                                {COLOR_OPTIONS.map((color) => (
                                    <TouchableOpacity
                                        key={color}
                                        style={[
                                            styles.colorCircle,
                                            { backgroundColor: color },
                                            selectedColor === color && styles.colorCircleSelected
                                        ]}
                                        onPress={() => onColorChange(color)}
                                    >
                                        {selectedColor === color && (
                                            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Toggle Options */}
                        <View style={styles.customizeSection}>
                            <Text style={[styles.customizeLabel, { color: theme.text }]}>Display Options</Text>

                            <TouchableOpacity
                                style={[styles.toggleRow, { borderColor: theme.border }]}
                                onPress={() => setShowLogo(!showLogo)}
                            >
                                <View style={styles.toggleLeft}>
                                    <Ionicons name="image" size={22} color={theme.textSecondary} />
                                    <Text style={[styles.toggleText, { color: theme.text }]}>Show Logo</Text>
                                </View>
                                <Ionicons
                                    name={showLogo ? "checkbox" : "square-outline"}
                                    size={24}
                                    color={showLogo ? theme.primary : theme.textMuted}
                                />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.toggleRow, { borderColor: theme.border }]}
                                onPress={() => setShowBankDetails(!showBankDetails)}
                            >
                                <View style={styles.toggleLeft}>
                                    <Ionicons name="card" size={22} color={theme.textSecondary} />
                                    <Text style={[styles.toggleText, { color: theme.text }]}>Show Bank Details</Text>
                                </View>
                                <Ionicons
                                    name={showBankDetails ? "checkbox" : "square-outline"}
                                    size={24}
                                    color={showBankDetails ? theme.primary : theme.textMuted}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>

                <View style={[styles.footer, { borderTopColor: theme.border, backgroundColor: theme.surface }]}>
                    <Button title="Preview & Share" onPress={onNext} size="lg" />
                </View>
            </SafeAreaView>
        </Modal>
    );
};

// Invoice Preview Styles - Professional Letter Layout
const invoicePreviewStyles = StyleSheet.create({
    container: {
        margin: 16,
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    companyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    logoPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    companyInfo: {
        flex: 1,
    },
    companyName: {
        fontSize: 14,
        fontWeight: '700',
    },
    companyDetail: {
        fontSize: 9,
        color: '#6B7280',
        marginTop: 1,
    },
    invoiceTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingBottom: 12,
        borderBottomWidth: 2,
        marginBottom: 16,
    },
    invoiceTitle: {
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: 2,
    },
    invoiceNumber: {
        fontSize: 10,
        color: '#6B7280',
        marginTop: 2,
    },
    dateBlock: {
        alignItems: 'flex-end',
    },
    dateLabel: {
        fontSize: 9,
        color: '#6B7280',
        marginTop: 2,
    },
    billToSection: {
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    billToLabel: {
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 4,
    },
    clientName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#111827',
    },
    clientDetail: {
        fontSize: 10,
        color: '#6B7280',
        marginTop: 1,
    },
    itemsSection: {
        marginBottom: 16,
        borderRadius: 6,
        overflow: 'hidden',
    },
    itemHeader: {
        flexDirection: 'row',
        paddingVertical: 8,
        paddingHorizontal: 10,
    },
    itemHeaderText: {
        fontSize: 9,
        fontWeight: '600',
        flex: 1,
    },
    itemRow: {
        flexDirection: 'row',
        paddingVertical: 8,
        paddingHorizontal: 10,
    },
    itemText: {
        fontSize: 10,
        color: '#374151',
        flex: 1,
    },
    moreItems: {
        fontSize: 9,
        color: '#9CA3AF',
        fontStyle: 'italic',
        textAlign: 'center',
        paddingVertical: 8,
        backgroundColor: '#F9FAFB',
    },
    totalSection: {
        marginBottom: 16,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    subtotalLabel: {
        fontSize: 10,
        color: '#6B7280',
    },
    subtotalValue: {
        fontSize: 10,
        color: '#374151',
    },
    grandTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderRadius: 6,
        marginTop: 6,
    },
    grandTotalLabel: {
        fontSize: 12,
        fontWeight: '700',
    },
    grandTotalValue: {
        fontSize: 16,
        fontWeight: '800',
    },
    bankSection: {
        paddingTop: 12,
        paddingBottom: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    bankTitle: {
        fontSize: 10,
        fontWeight: '600',
        marginBottom: 4,
    },
    bankText: {
        fontSize: 9,
        color: '#6B7280',
        marginTop: 1,
    },
    noteSection: {
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        alignItems: 'center',
    },
    noteText: {
        fontSize: 10,
        color: '#6B7280',
        fontStyle: 'italic',
    },
});

// Share Modal with Invoice Preview
const ShareModal = ({ visible, onDismiss, onDone, client, items, totalAmount, currency, theme, business, dueDate, selectedColor }: any) => {
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const dueDateFormatted = dueDate ? new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : today;

    const formatCurrency = (amount: number) => {
        const symbols: Record<string, string> = { USD: '$', NGN: '₦', EUR: '€', GBP: '£', CAD: 'CA$', AUD: 'A$', GHS: '₵', KES: 'KSh', ZAR: 'R' };
        return `${symbols[currency] || '$'}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const handleShare = async (method: string) => {
        const message = `Invoice for ${client.name}\nAmount: ${formatCurrency(totalAmount)}`;

        switch (method) {
            case 'email':
                if (client.email) {
                    Linking.openURL(`mailto:${client.email}?subject=Invoice ${invoiceNumber}&body=${encodeURIComponent(message)}`);
                } else {
                    Alert.alert('No Email', 'Client email not provided');
                }
                break;
            case 'whatsapp':
                if (client.phone) {
                    const phone = client.phone.replace(/[^0-9]/g, '');
                    Linking.openURL(`whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`);
                } else {
                    Alert.alert('No Phone', 'Client phone not provided');
                }
                break;
            case 'copy':
            case 'more':
                await Share.share({ message });
                break;
        }
    };

    const shareOptions = [
        { id: 'email', icon: 'mail', color: '#EA4335' },
        { id: 'whatsapp', icon: 'logo-whatsapp', color: '#25D366' },
        { id: 'copy', icon: 'copy', color: '#6366F1' },
        { id: 'more', icon: 'share-social', color: '#64748B' },
    ];

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={[styles.header, { borderBottomColor: theme.border }]}>
                    <TouchableOpacity onPress={onDismiss} style={{ padding: 8, marginLeft: -8 }}>
                        <Ionicons name="close" size={24} color={theme.textMuted} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>Preview & Share</Text>
                    <View style={{ width: 24 }} />
                </View>

                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
                    {/* Invoice Preview */}
                    <View style={[invoicePreviewStyles.container, { backgroundColor: '#FFFFFF', marginBottom: 16 }]}>
                        {/* Company Header */}
                        <View style={invoicePreviewStyles.companyHeader}>
                            <View style={[invoicePreviewStyles.logoPlaceholder, { backgroundColor: selectedColor + '15' }]}>
                                <Ionicons name="business" size={24} color={selectedColor} />
                            </View>
                            <View style={invoicePreviewStyles.companyInfo}>
                                <Text style={[invoicePreviewStyles.companyName, { color: '#111827' }]}>{business?.name || 'Your Business'}</Text>
                                <Text style={invoicePreviewStyles.companyDetail}>{business?.email || 'email@example.com'}</Text>
                                <Text style={invoicePreviewStyles.companyDetail}>{business?.phone || '+1 (555) 000-0000'}</Text>
                                {business?.address && <Text style={invoicePreviewStyles.companyDetail}>{business.address}</Text>}
                            </View>
                        </View>

                        {/* Invoice Title */}
                        <View style={[invoicePreviewStyles.invoiceTitleRow, { borderBottomColor: selectedColor }]}>
                            <View>
                                <Text style={[invoicePreviewStyles.invoiceTitle, { color: selectedColor }]}>INVOICE</Text>
                                <Text style={invoicePreviewStyles.invoiceNumber}>{invoiceNumber}</Text>
                            </View>
                            <View style={invoicePreviewStyles.dateBlock}>
                                <Text style={invoicePreviewStyles.dateLabel}>Date: {today}</Text>
                                <Text style={invoicePreviewStyles.dateLabel}>Due: {dueDateFormatted}</Text>
                            </View>
                        </View>

                        {/* Bill To & Ship To */}
                        <View style={{ flexDirection: 'row', marginBottom: 16, gap: 12 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={[invoicePreviewStyles.billToLabel, { color: selectedColor }]}>BILL TO</Text>
                                <Text style={invoicePreviewStyles.clientName}>{client?.name || 'Client'}</Text>
                                {client?.email && <Text style={invoicePreviewStyles.clientDetail}>{client.email}</Text>}
                                {client?.phone && <Text style={invoicePreviewStyles.clientDetail}>{client.phone}</Text>}
                            </View>
                            {client?.address && (
                                <View style={{ flex: 1 }}>
                                    <Text style={[invoicePreviewStyles.billToLabel, { color: selectedColor }]}>SHIP TO</Text>
                                    <Text style={invoicePreviewStyles.clientDetail}>{client.address}</Text>
                                </View>
                            )}
                        </View>

                        {/* Items */}
                        <View style={invoicePreviewStyles.itemsSection}>
                            <View style={[invoicePreviewStyles.itemHeader, { backgroundColor: selectedColor }]}>
                                <Text style={[invoicePreviewStyles.itemHeaderText, { flex: 2, color: '#FFFFFF' }]}>Description</Text>
                                <Text style={[invoicePreviewStyles.itemHeaderText, { color: '#FFFFFF' }]}>Qty</Text>
                                <Text style={[invoicePreviewStyles.itemHeaderText, { textAlign: 'right', color: '#FFFFFF' }]}>Amount</Text>
                            </View>
                            {items?.map((item: InvoiceItem, idx: number) => (
                                <View key={idx} style={[invoicePreviewStyles.itemRow, { backgroundColor: idx % 2 === 0 ? '#F9FAFB' : '#FFFFFF' }]}>
                                    <Text style={[invoicePreviewStyles.itemText, { flex: 2 }]} numberOfLines={1}>{item.description}</Text>
                                    <Text style={invoicePreviewStyles.itemText}>{item.quantity}</Text>
                                    <Text style={[invoicePreviewStyles.itemText, { textAlign: 'right', fontWeight: '600' }]}>{formatCurrency(item.amount)}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Total */}
                        <View style={invoicePreviewStyles.totalSection}>
                            <View style={invoicePreviewStyles.totalRow}>
                                <Text style={invoicePreviewStyles.subtotalLabel}>Subtotal</Text>
                                <Text style={invoicePreviewStyles.subtotalValue}>{formatCurrency(totalAmount)}</Text>
                            </View>
                            <View style={[invoicePreviewStyles.grandTotalRow, { backgroundColor: selectedColor + '10' }]}>
                                <Text style={[invoicePreviewStyles.grandTotalLabel, { color: selectedColor }]}>Total Due</Text>
                                <Text style={[invoicePreviewStyles.grandTotalValue, { color: selectedColor }]}>{formatCurrency(totalAmount)}</Text>
                            </View>
                        </View>

                        {/* Bank Details */}
                        {business?.bankDetails?.bankName && (
                            <View style={invoicePreviewStyles.bankSection}>
                                <Text style={[invoicePreviewStyles.bankTitle, { color: selectedColor }]}>Payment Details</Text>
                                <Text style={invoicePreviewStyles.bankText}>Bank: {business.bankDetails.bankName}</Text>
                                <Text style={invoicePreviewStyles.bankText}>Account: {business.bankDetails.accountNumber || 'N/A'}</Text>
                                <Text style={invoicePreviewStyles.bankText}>Name: {business.bankDetails.accountName || business.name}</Text>
                            </View>
                        )}

                        {/* Note */}
                        <View style={invoicePreviewStyles.noteSection}>
                            <Text style={invoicePreviewStyles.noteText}>Thank you for your business!</Text>
                        </View>
                    </View>
                </ScrollView>

                {/* Compact Share Bar */}
                <View style={[styles.shareBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
                    <Text style={[styles.shareBarLabel, { color: theme.textSecondary }]}>Share via</Text>
                    <View style={styles.shareButtonRow}>
                        {shareOptions.map((option) => (
                            <TouchableOpacity
                                key={option.id}
                                style={[styles.shareButton, { backgroundColor: option.color + '15' }]}
                                onPress={() => handleShare(option.id)}
                            >
                                <Ionicons name={option.icon as any} size={22} color={option.color} />
                            </TouchableOpacity>
                        ))}
                    </View>
                    <TouchableOpacity style={[styles.doneButton, { backgroundColor: theme.primary }]} onPress={onDone}>
                        <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Done</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </Modal>
    );
};

// Main Component
function CreateInvoiceScreen() {
    const router = useRouter();
    const { currentBusiness } = useBusiness();
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

    // Step State
    const [currentStep, setCurrentStep] = useState<InvoiceStep>('FORM');

    // Form State
    const [client, setClient] = useState<ClientDetails>({ name: "", email: "", phone: "", address: "" });
    const [items, setItems] = useState<InvoiceItem[]>([]);
    const [dueDate, setDueDate] = useState('');
    const [currency, setCurrency] = useState(currentBusiness?.currency || "USD");
    const [loading, setLoading] = useState(false);
    const [defaultNote, setDefaultNote] = useState('Thank you for your business!');
    const [selectedColor, setSelectedColor] = useState('#0EA5A4');

    // Load invoice settings on mount
    useEffect(() => {
        loadInvoiceSettings();
    }, []);

    const loadInvoiceSettings = async () => {
        try {
            const settings = await AsyncStorage.getItem('invoiceSettings');
            if (settings) {
                const parsed = JSON.parse(settings);
                const dueDays = parsed.defaultDueDays || 30;
                const dueD = new Date();
                dueD.setDate(dueD.getDate() + dueDays);
                setDueDate(dueD.toISOString().split('T')[0]);
                if (parsed.defaultNote) setDefaultNote(parsed.defaultNote);
            } else {
                // Default to 30 days
                const dueD = new Date();
                dueD.setDate(dueD.getDate() + 30);
                setDueDate(dueD.toISOString().split('T')[0]);
            }
        } catch (e) {
            console.error('Error loading invoice settings:', e);
            const dueD = new Date();
            dueD.setDate(dueD.getDate() + 30);
            setDueDate(dueD.toISOString().split('T')[0]);
        }
    };

    // Modals
    const [showClientModal, setShowClientModal] = useState(false);
    const [showItemModal, setShowItemModal] = useState(false);
    const [showCustomizeModal, setShowCustomizeModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showCurrencyModal, setShowCurrencyModal] = useState(false);

    // Item Modal State
    const [newItem, setNewItem] = useState({ description: "", quantity: "1", unitPrice: "" });
    const [itemTab, setItemTab] = useState<'NEW' | 'RECENT'>('NEW');

    // Client Modal State
    const [clientTab, setClientTab] = useState<'NEW' | 'SAVED'>('NEW');
    const [savedClients, setSavedClients] = useState<ClientDetails[]>([]);

    // Recent Items State
    const [recentItems, setRecentItems] = useState<InvoiceItem[]>([]);

    // Load saved clients and items on mount
    useEffect(() => {
        loadSavedClients();
        loadRecentItems();
    }, []);

    const loadRecentItems = async () => {
        try {
            const data = await AsyncStorage.getItem('recentItems');
            if (data) {
                setRecentItems(JSON.parse(data));
            }
        } catch (e) {
            console.error('Error loading recent items:', e);
        }
    };

    const loadSavedClients = async () => {
        try {
            const data = await AsyncStorage.getItem('savedClients');
            if (data) {
                setSavedClients(JSON.parse(data));
            }
        } catch (e) {
            console.error('Error loading saved clients:', e);
        }
    };

    const saveClient = async () => {
        if (!client.name) return;

        try {
            const data = await AsyncStorage.getItem('savedClients');
            let clients: ClientDetails[] = data ? JSON.parse(data) : [];

            // Check if client already exists (by name)
            const existingIndex = clients.findIndex(c => c.name.toLowerCase() === client.name.toLowerCase());
            if (existingIndex >= 0) {
                // Update existing
                clients[existingIndex] = client;
            } else {
                // Add new
                clients.unshift(client);
            }

            // Keep only last 20 clients
            clients = clients.slice(0, 20);

            await AsyncStorage.setItem('savedClients', JSON.stringify(clients));
            setSavedClients(clients);
        } catch (e) {
            console.error('Error saving client:', e);
        }

        setShowClientModal(false);
    };

    const pickContact = async () => {
        try {
            const { status } = await Contacts.requestPermissionsAsync();
            if (status === 'granted') {
                const { data } = await Contacts.getContactsAsync({
                    fields: [Contacts.Fields.Emails, Contacts.Fields.PhoneNumbers],
                });

                if (data.length > 0) {
                    setClient({
                        name: data[0].name || "John Doe",
                        email: data[0].emails?.[0]?.email || "",
                        phone: data[0].phoneNumbers?.[0]?.number || ""
                    });
                    setShowClientModal(false);
                } else {
                    Alert.alert("No Contacts", "No contacts found on device.");
                }
            } else {
                Alert.alert("Permission Denied", "We need permission to access your contacts.");
            }
        } catch (e) {
            console.error(e);
        }
    };

    const addItem = () => {
        if (!newItem.description || !newItem.unitPrice) {
            Alert.alert("Error", "Please fill description and price");
            return;
        }

        const quantity = parseFloat(newItem.quantity) || 1;
        const price = parseFloat(newItem.unitPrice) || 0;

        const item: InvoiceItem = {
            id: Date.now().toString(),
            description: newItem.description,
            quantity,
            unitPrice: price,
            amount: quantity * price
        };



        setItems([...items, item]);

        // Save to recent items
        try {
            const updatedRecents = [item, ...recentItems.filter(i => i.description !== item.description)].slice(0, 20);
            setRecentItems(updatedRecents);
            AsyncStorage.setItem('recentItems', JSON.stringify(updatedRecents));
        } catch (e) {
            console.error('Error saving recent item:', e);
        }

        setNewItem({ description: "", quantity: "1", unitPrice: "" });
        setShowItemModal(false);
    };

    const addRecentItem = (recent: any) => {
        setNewItem({
            description: recent.description,
            quantity: "1",
            unitPrice: String(recent.unitPrice)
        });
        setItemTab('NEW');
    };

    const removeItem = (id: string) => {
        setItems(items.filter(i => i.id !== id));
    };

    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

    const handleSave = () => {
        if (!client.name || items.length === 0) {
            Alert.alert("Missing Fields", "Please add a client and at least one item.");
            return;
        }
        setShowCustomizeModal(true);
        setCurrentStep('CUSTOMIZE');
    };

    const handleCustomizeNext = () => {
        setShowCustomizeModal(false);
        setShowShareModal(true);
        setCurrentStep('SHARE');
    };

    const handleComplete = async () => {
        if (!currentBusiness) {
            Alert.alert("Error", "No business selected");
            return;
        }

        try {
            setLoading(true);

            // Generate invoice number and ID
            const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
            // Generate robust ID for optimistic navigation
            const newInvoiceId = Date.now().toString(36) + Math.random().toString(36).substring(2, 8);

            // Calculate total
            const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

            // Prepare invoice data for API
            const invoiceData = {
                id: newInvoiceId, // Pass custom ID
                businessId: currentBusiness.id,
                number: invoiceNumber,
                customerName: client.name,
                customerEmail: client.email,
                customerPhone: client.phone,
                issueDate: new Date().toISOString(),
                dueDate: dueDate,
                currency: currency,
                totalAmount: totalAmount,
                note: 'Thank you for your business!',
                status: 'SENT', // Mark as SENT when completing
                items: items.map(item => ({
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    amount: item.amount,
                })),
            };

            // OPTIMISTIC NAVIGATION: Don't wait for network
            setShowShareModal(false);
            setLoading(false);

            // Save in background (Fire & Forget)
            // Firestore offline persistence handles the queue
            invoicesAPI.create(invoiceData).catch(err => {
                console.error("Background save failed:", err);
            });

            // Navigate immediately
            setTimeout(() => {
                router.replace(`/invoice/${newInvoiceId}`);
            }, 50);

        } catch (error) {
            console.error("Error preparing invoice:", error);
            Alert.alert("Error", "Failed to create invoice.");
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style="auto" />

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, marginLeft: -8 }}>
                    <Ionicons name="close" size={24} color={theme.textMuted} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>New Invoice</Text>
                <TouchableOpacity
                    onPress={() => setShowCurrencyModal(true)}
                    style={[styles.currencyToggle, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
                >
                    <Text style={{ fontWeight: '800', color: theme.primary, fontSize: 16 }}>
                        {CURRENCIES.find(c => c.code === currency)?.symbol || '$'}
                    </Text>
                    <Text style={{ fontWeight: '600', color: theme.textSecondary, fontSize: 12, marginLeft: 4 }}>{currency}</Text>
                    <Ionicons name="chevron-down" size={14} color={theme.primary} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
            </View>

            {/* Step Indicator */}
            <StepIndicator currentStep={currentStep} theme={theme} />

            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>

                {/* Client Section */}
                <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Bill To</Text>
                        <TouchableOpacity onPress={() => setShowClientModal(true)}>
                            <Text style={{ color: theme.primary, fontWeight: '600', fontSize: 14 }}>
                                {client.name ? 'Edit' : 'Add'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {client.name ? (
                        <View style={styles.clientInfo}>
                            <View style={[styles.clientAvatar, { backgroundColor: theme.primary + '15' }]}>
                                <Text style={[styles.clientAvatarText, { color: theme.primary }]}>
                                    {client.name.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <View>
                                <Text style={[styles.clientName, { color: theme.text }]}>{client.name}</Text>
                                {client.email ? <Text style={[styles.clientDetail, { color: theme.textSecondary }]}>{client.email}</Text> : null}
                            </View>
                        </View>
                    ) : (
                        <TouchableOpacity
                            onPress={() => setShowClientModal(true)}
                            style={[styles.emptyClientBox, { borderColor: theme.border }]}
                        >
                            <Ionicons name="person-add-outline" size={28} color={theme.textMuted} />
                            <Text style={[styles.emptyClientText, { color: theme.textMuted }]}>Add Client</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Items Section */}
                <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Items</Text>
                        <TouchableOpacity onPress={() => setShowItemModal(true)}>
                            <Ionicons name="add-circle" size={26} color={theme.primary} />
                        </TouchableOpacity>
                    </View>

                    {items.length === 0 ? (
                        <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                            <Text style={{ color: theme.textMuted, fontSize: 14 }}>No items added</Text>
                        </View>
                    ) : (
                        items.map((item) => (
                            <View key={item.id} style={[styles.itemRow, { borderBottomColor: theme.border }]}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.itemDesc, { color: theme.text }]}>{item.description}</Text>
                                    <Text style={{ fontSize: 13, color: theme.textSecondary }}>
                                        {item.quantity} × {currency} {item.unitPrice}
                                    </Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                                    <Text style={[styles.itemAmount, { color: theme.text }]}>
                                        {currency} {item.amount.toFixed(2)}
                                    </Text>
                                    <TouchableOpacity onPress={() => removeItem(item.id)}>
                                        <Ionicons name="trash-outline" size={20} color={theme.error} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    )}
                </View>

                {/* Summary */}
                <View style={[styles.summaryCard, { backgroundColor: theme.primary + '10', borderColor: theme.primary + '30' }]}>
                    <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Subtotal</Text>
                        <Text style={[styles.summaryValue, { color: theme.text }]}>{currency} {totalAmount.toFixed(2)}</Text>
                    </View>
                    <View style={[styles.summaryDivider, { backgroundColor: theme.border }]} />
                    <View style={styles.summaryRow}>
                        <Text style={[styles.totalLabel, { color: theme.primary }]}>Total</Text>
                        <Text style={[styles.totalValue, { color: theme.primary }]}>{currency} {totalAmount.toFixed(2)}</Text>
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, { borderTopColor: theme.border, backgroundColor: theme.surface }]}>
                <Button
                    title="Save & Customize"
                    onPress={handleSave}
                    disabled={!client.name || items.length === 0}
                    size="lg"
                />
            </View>

            {/* Customize Modal */}
            <CustomizeModal
                visible={showCustomizeModal}
                onClose={() => {
                    setShowCustomizeModal(false);
                    setCurrentStep('FORM');
                }}
                onNext={handleCustomizeNext}
                theme={theme}
                client={client}
                items={items}
                currency={currency}
                business={currentBusiness}
                dueDate={dueDate}
                selectedColor={selectedColor}
                onColorChange={setSelectedColor}
            />

            {/* Share Modal */}
            <ShareModal
                visible={showShareModal}
                onDismiss={() => setShowShareModal(false)}
                onDone={handleComplete}
                client={client}
                items={items}
                totalAmount={totalAmount}
                currency={currency}
                theme={theme}
                business={currentBusiness}
                dueDate={dueDate}
                selectedColor={selectedColor}
            />

            {/* Client Selection Modal */}
            <Modal visible={showClientModal} animationType="slide" transparent>
                <KeyboardAvoidingView
                    style={styles.modalOverlay}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>Add Client</Text>
                            <TouchableOpacity onPress={() => setShowClientModal(false)}>
                                <Ionicons name="close" size={24} color={theme.textMuted} />
                            </TouchableOpacity>
                        </View>

                        {/* Tab Switcher */}
                        <View style={[styles.tabContainer, { backgroundColor: theme.surfaceSecondary }]}>
                            <TouchableOpacity
                                onPress={() => setClientTab('NEW')}
                                style={[styles.tab, clientTab === 'NEW' && { backgroundColor: theme.surface }]}
                            >
                                <Text style={[styles.tabText, { color: clientTab === 'NEW' ? theme.primary : theme.textSecondary }]}>New Client</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setClientTab('SAVED')}
                                style={[styles.tab, clientTab === 'SAVED' && { backgroundColor: theme.surface }]}
                            >
                                <Text style={[styles.tabText, { color: clientTab === 'SAVED' ? theme.primary : theme.textSecondary }]}>
                                    Saved ({savedClients.length})
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            {clientTab === 'NEW' ? (
                                <View style={{ gap: 12, paddingBottom: 20 }}>
                                    <TouchableOpacity
                                        onPress={pickContact}
                                        style={[styles.importContactBtn, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
                                    >
                                        <Ionicons name="people-outline" size={20} color={theme.primary} />
                                        <Text style={{ color: theme.primary, fontWeight: '600', fontSize: 14 }}>Import from Contacts</Text>
                                    </TouchableOpacity>

                                    <Input
                                        label="Client Name"
                                        value={client.name}
                                        onChangeText={(t) => setClient({ ...client, name: t })}
                                        placeholder="John Doe"
                                    />
                                    <Input
                                        label="Email Address"
                                        value={client.email}
                                        onChangeText={(t) => setClient({ ...client, email: t })}
                                        keyboardType="email-address"
                                        placeholder="john@example.com"
                                    />
                                    <Input
                                        label="Phone Number"
                                        value={client.phone}
                                        onChangeText={(t) => setClient({ ...client, phone: t })}
                                        keyboardType="phone-pad"
                                        placeholder="+1 (555) 000-0000"
                                    />
                                    <Input
                                        label="Address (Ship To)"
                                        value={client.address}
                                        onChangeText={(t) => setClient({ ...client, address: t })}
                                        placeholder="123 Main St, City, State 12345"
                                    />
                                    <Button title="Save & Confirm" onPress={saveClient} />
                                </View>
                            ) : (
                                <View style={{ gap: 8, paddingBottom: 20 }}>
                                    {savedClients.length === 0 ? (
                                        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                                            <Ionicons name="people-outline" size={48} color={theme.textMuted} />
                                            <Text style={{ color: theme.textSecondary, marginTop: 12 }}>No saved clients yet</Text>
                                            <Text style={{ color: theme.textMuted, fontSize: 13 }}>Add a client to save them here</Text>
                                        </View>
                                    ) : (
                                        savedClients.map((c, idx) => (
                                            <TouchableOpacity
                                                key={idx}
                                                onPress={() => {
                                                    setClient(c);
                                                    setShowClientModal(false);
                                                }}
                                                style={[styles.savedClientRow, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
                                            >
                                                <View style={[styles.clientAvatar, { backgroundColor: theme.primary + '20' }]}>
                                                    <Text style={[styles.clientAvatarText, { color: theme.primary }]}>
                                                        {c.name.slice(0, 1).toUpperCase()}
                                                    </Text>
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={[styles.savedClientName, { color: theme.text }]}>{c.name}</Text>
                                                    {c.email && <Text style={[styles.savedClientDetail, { color: theme.textSecondary }]}>{c.email}</Text>}
                                                </View>
                                                <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
                                            </TouchableOpacity>
                                        ))
                                    )}
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Item Selection Modal */}
            <Modal visible={showItemModal} animationType="slide" transparent>
                <KeyboardAvoidingView
                    style={styles.modalOverlay}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>Add Item</Text>
                            <TouchableOpacity onPress={() => setShowItemModal(false)}>
                                <Ionicons name="close" size={24} color={theme.textMuted} />
                            </TouchableOpacity>
                        </View>

                        <View style={[styles.tabContainer, { backgroundColor: theme.surfaceSecondary }]}>
                            <TouchableOpacity
                                onPress={() => setItemTab('NEW')}
                                style={[styles.tabButton, itemTab === 'NEW' && { backgroundColor: theme.surface }]}
                            >
                                <Text style={[styles.tabText, { color: itemTab === 'NEW' ? theme.primary : theme.textMuted }]}>New Item</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setItemTab('RECENT')}
                                style={[styles.tabButton, itemTab === 'RECENT' && { backgroundColor: theme.surface }]}
                            >
                                <Text style={[styles.tabText, { color: itemTab === 'RECENT' ? theme.primary : theme.textMuted }]}>Recent</Text>
                            </TouchableOpacity>
                        </View>

                        {itemTab === 'NEW' ? (
                            <ScrollView
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled"
                            >
                                <View style={{ gap: 12, paddingBottom: 20 }}>
                                    <Input
                                        label="Description"
                                        value={newItem.description}
                                        onChangeText={(t) => setNewItem({ ...newItem, description: t })}
                                        placeholder="e.g. Website Design"
                                    />
                                    <View style={{ flexDirection: 'row', gap: 12 }}>
                                        <View style={{ flex: 1 }}>
                                            <Input
                                                label="Qty"
                                                value={newItem.quantity}
                                                onChangeText={(t) => setNewItem({ ...newItem, quantity: t })}
                                                keyboardType="numeric"
                                            />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Input
                                                label={`Price (${currency})`}
                                                value={newItem.unitPrice}
                                                onChangeText={(t) => setNewItem({ ...newItem, unitPrice: t })}
                                                keyboardType="decimal-pad"
                                            />
                                        </View>
                                    </View>
                                    <Button title="Add Item" onPress={addItem} />
                                </View>
                            </ScrollView>
                        ) : (
                            <FlatList
                                data={recentItems.length > 0 ? recentItems : MOCK_RECENT_ITEMS}
                                keyExtractor={item => item.id}
                                style={{ maxHeight: 300 }}
                                keyboardShouldPersistTaps="handled"
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        onPress={() => addRecentItem(item)}
                                        style={[styles.recentItemCard, { backgroundColor: theme.surfaceSecondary }]}
                                    >
                                        <View>
                                            <Text style={{ fontWeight: '600', color: theme.text }}>{item.description}</Text>
                                            <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{currency} {item.unitPrice}</Text>
                                        </View>
                                        <Ionicons name="add-circle" size={26} color={theme.primary} />
                                    </TouchableOpacity>
                                )}
                            />
                        )}
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Currency Selection Modal */}
            <Modal visible={showCurrencyModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>Select Currency</Text>
                            <TouchableOpacity onPress={() => setShowCurrencyModal(false)}>
                                <Ionicons name="close" size={24} color={theme.textMuted} />
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={CURRENCIES}
                            keyExtractor={item => item.code}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => {
                                        setCurrency(item.code);
                                        setShowCurrencyModal(false);
                                    }}
                                    style={[
                                        styles.currencyOption,
                                        {
                                            backgroundColor: currency === item.code ? theme.primary + '10' : 'transparent',
                                            borderColor: currency === item.code ? theme.primary : theme.border
                                        }
                                    ]}
                                >
                                    <View style={styles.currencyOptionLeft}>
                                        <View style={[styles.currencySymbolBox, { backgroundColor: theme.surfaceSecondary }]}>
                                            <Text style={[styles.currencySymbol, { color: theme.primary }]}>{item.symbol}</Text>
                                        </View>
                                        <View>
                                            <Text style={[styles.currencyCode, { color: theme.text }]}>{item.code}</Text>
                                            <Text style={[styles.currencyName, { color: theme.textSecondary }]}>{item.name}</Text>
                                        </View>
                                    </View>
                                    {currency === item.code && (
                                        <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
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
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    currencyToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
    },
    currencyOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 10,
    },
    currencyOptionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    currencySymbolBox: {
        width: 44,
        height: 44,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    currencySymbol: {
        fontSize: 18,
        fontWeight: '700',
    },
    currencyCode: {
        fontSize: 16,
        fontWeight: '600',
    },
    currencyName: {
        fontSize: 13,
        marginTop: 2,
    },
    scrollContainer: {
        flex: 1,
        paddingHorizontal: 20,
    },
    card: {
        padding: 18,
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionLabel: {
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    clientInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    clientAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    clientAvatarText: {
        fontSize: 20,
        fontWeight: '700',
    },
    clientName: {
        fontSize: 17,
        fontWeight: '600',
    },
    clientDetail: {
        fontSize: 14,
        marginTop: 2,
    },
    emptyClientBox: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 32,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderRadius: 12,
    },
    emptyClientText: {
        fontWeight: '500',
        marginTop: 8,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    itemDesc: {
        fontWeight: '600',
        fontSize: 15,
    },
    itemAmount: {
        fontWeight: '700',
        fontSize: 15,
    },
    summaryCard: {
        padding: 18,
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    summaryLabel: {
        fontSize: 14,
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '600',
    },
    summaryDivider: {
        height: 1,
        marginVertical: 12,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: '700',
    },
    totalValue: {
        fontSize: 18,
        fontWeight: '700',
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
    },
    // Modals
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        maxHeight: '85%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    modalOptionBox: {
        flex: 1,
        padding: 18,
        borderRadius: 14,
        alignItems: 'center',
    },
    tabContainer: {
        flexDirection: 'row',
        padding: 4,
        borderRadius: 12,
        marginBottom: 20,
        gap: 8,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
    },
    tabButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
    },
    tabText: {
        fontWeight: '600',
        fontSize: 14,
    },
    recentItemCard: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    // Customize Modal
    customizeSection: {
        marginBottom: 28,
    },
    customizeLabel: {
        fontSize: 17,
        fontWeight: '600',
        marginBottom: 6,
    },
    customizeHint: {
        fontSize: 14,
        marginBottom: 16,
    },
    colorRow: {
        flexDirection: 'row',
        gap: 14,
    },
    colorCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    colorCircleSelected: {
        borderWidth: 3,
        borderColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    toggleLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    toggleText: {
        fontSize: 15,
        fontWeight: '500',
    },
    previewCard: {
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
    },
    previewHeader: {
        padding: 16,
        alignItems: 'center',
    },
    previewTitle: {
        fontWeight: '800',
        fontSize: 16,
        letterSpacing: 1,
    },
    previewBody: {
        padding: 16,
        gap: 8,
    },
    previewLine: {
        height: 8,
        backgroundColor: '#E2E8F0',
        borderRadius: 4,
    },
    previewLineShort: {
        height: 8,
        width: '60%',
        backgroundColor: '#E2E8F0',
        borderRadius: 4,
    },
    // Share Modal
    successBadge: {
        alignItems: 'center',
        padding: 32,
        borderRadius: 20,
        marginBottom: 32,
    },
    successTitle: {
        fontSize: 22,
        fontWeight: '700',
        marginTop: 12,
    },
    successSubtitle: {
        fontSize: 15,
        marginTop: 6,
    },
    shareLabel: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 1,
        marginBottom: 16,
    },
    shareGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    shareOption: {
        width: '47%',
        padding: 18,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
    },
    shareIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    shareOptionLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    // Compact share bar
    shareBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingBottom: 24,
        borderTopWidth: 1,
        gap: 12,
    },
    shareBarLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
    shareButtonRow: {
        flexDirection: 'row',
        gap: 10,
        flex: 1,
    },
    shareButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    doneButton: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 10,
    },
    // Saved clients
    savedClientRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        gap: 12,
    },
    savedClientName: {
        fontSize: 15,
        fontWeight: '600',
    },
    savedClientDetail: {
        fontSize: 13,
        marginTop: 2,
    },
    importContactBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 8,
    },
});

export default CreateInvoiceScreen;
