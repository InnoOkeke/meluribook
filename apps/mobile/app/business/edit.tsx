import { View, Text, ScrollView, TouchableOpacity, Alert, Modal, FlatList, TextInput, StyleSheet, useColorScheme } from 'react-native';
import { Stack, router } from 'expo-router';
import { useState, useEffect } from 'react';
import { useBusiness } from '../../src/context/BusinessContext';
import { useLoading } from '../../src/hooks/useLoading';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { Ionicons } from '@expo/vector-icons';
import { COUNTRIES, CURRENCIES } from '../../src/constants/data';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../src/constants/Colors';

const REPORTING_PERIODS = ['Monthly', 'Quarterly', 'Annually'];

type SelectionModalProps = {
    visible: boolean;
    onClose: () => void;
    title: string;
    data: any[];
    onSelect: (item: any) => void;
    renderItem: (item: any) => React.ReactNode;
    searchKeys: string[];
};

const SelectionModal = ({ visible, onClose, title, data, onSelect, renderItem, searchKeys }: SelectionModalProps) => {
    const [search, setSearch] = useState('');
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

    const filteredData = data.filter(item =>
        searchKeys.some(key => item[key].toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.background }]}>
                <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                    <Text style={[styles.modalTitle, { color: theme.text }]}>{title}</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close" size={24} color={theme.textMuted} />
                    </TouchableOpacity>
                </View>

                <View style={styles.modalSearchContainer}>
                    <View style={[styles.searchBox, { backgroundColor: theme.surfaceSecondary }]}>
                        <Ionicons name="search" size={20} color={theme.textMuted} />
                        <TextInput
                            style={[styles.searchInput, { color: theme.text }]}
                            placeholder="Search..."
                            placeholderTextColor={theme.textMuted}
                            value={search}
                            onChangeText={setSearch}
                        />
                    </View>
                </View>

                <FlatList
                    data={filteredData}
                    keyExtractor={(item) => item.code}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[styles.listItem, { borderBottomColor: theme.border }]}
                            onPress={() => {
                                onSelect(item);
                                onClose();
                                setSearch('');
                            }}
                        >
                            {renderItem(item)}
                        </TouchableOpacity>
                    )}
                />
            </SafeAreaView>
        </Modal>
    );
};

export default function EditBusinessScreen() {
    const { currentBusiness, updateBusiness } = useBusiness();
    const { loading, execute } = useLoading();
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

    const [name, setName] = useState(currentBusiness?.name || '');
    const [reportingPeriod, setReportingPeriod] = useState(currentBusiness?.reportingPeriod || 'Monthly');

    // Address
    const [address, setAddress] = useState(currentBusiness?.address || '');
    const [city, setCity] = useState(currentBusiness?.city || '');
    const [state, setState] = useState(currentBusiness?.state || '');
    const [zipCode, setZipCode] = useState(currentBusiness?.zipCode || '');

    // Contact
    const [phone, setPhone] = useState(currentBusiness?.phone || '');
    const [email, setEmail] = useState(currentBusiness?.email || '');
    const [website, setWebsite] = useState(currentBusiness?.website || '');
    const [taxId, setTaxId] = useState(currentBusiness?.taxId || '');

    // Bank Details
    const [bankName, setBankName] = useState(currentBusiness?.bankDetails?.bankName || '');
    const [accountName, setAccountName] = useState(currentBusiness?.bankDetails?.accountName || '');
    const [accountNumber, setAccountNumber] = useState(currentBusiness?.bankDetails?.accountNumber || '');
    const [routingCode, setRoutingCode] = useState(currentBusiness?.bankDetails?.routingCode || '');

    // Country State
    const initialCountry = COUNTRIES.find(c => c.code === currentBusiness?.country) || COUNTRIES.find(c => c.code === 'US') || COUNTRIES[0];
    const [country, setCountry] = useState(initialCountry);
    const [showCountryModal, setShowCountryModal] = useState(false);

    // Currency State
    const initialCurrency = CURRENCIES.find(c => c.code === currentBusiness?.currency) || CURRENCIES.find(c => c.code === 'USD') || CURRENCIES[0];
    const [currency, setCurrency] = useState(initialCurrency);
    const [showCurrencyModal, setShowCurrencyModal] = useState(false);

    const handleSubmit = async () => {
        if (!name || !currentBusiness) {
            Alert.alert('Error', 'Please enter a business name');
            return;
        }

        await execute(
            async () => {
                await updateBusiness(currentBusiness.id, {
                    name,
                    country: country.code,
                    currency: currency.code,
                    reportingPeriod,
                    address,
                    city,
                    state,
                    zipCode,
                    phone,
                    email,
                    website,
                    taxId,
                    bankDetails: {
                        bankName,
                        accountName,
                        accountNumber,
                        routingCode
                    }
                });
                return true;
            },
            () => {
                Alert.alert('Success', 'Business updated successfully');
                router.back();
            },
            (error) => {
                Alert.alert('Error', error.title || "Failed to update business");
            }
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <Stack.Screen options={{
                title: 'Business Details',
                headerBackTitle: 'Back',
                headerTintColor: theme.text,
                headerStyle: { backgroundColor: theme.background },
                headerShadowVisible: false,
                headerTitleStyle: { color: theme.text, fontWeight: '700', fontSize: 18 }
            }} />

            <ScrollView style={styles.scrollContent}>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>General Information</Text>
                    <Input
                        label="Business Name"
                        value={name}
                        onChangeText={setName}
                    />
                    <Input
                        label="Tax ID / VAT Number"
                        value={taxId}
                        onChangeText={setTaxId}
                        placeholder="e.g. US-123456789"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: theme.text }]}>Country</Text>
                    <TouchableOpacity
                        onPress={() => setShowCountryModal(true)}
                        style={[styles.selectBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    >
                        <View style={styles.rowCenter}>
                            <Text style={styles.flag}>{country.flag}</Text>
                            <Text style={[styles.selectText, { color: theme.text }]}>{country.name}</Text>
                        </View>
                        <Ionicons name="chevron-down" size={20} color={theme.textMuted} />
                    </TouchableOpacity>
                </View>

                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: theme.text }]}>Currency</Text>
                    <TouchableOpacity
                        onPress={() => setShowCurrencyModal(true)}
                        style={[styles.selectBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    >
                        <View style={styles.rowCenter}>
                            <View style={[styles.currencyIcon, { backgroundColor: theme.primary + '20' }]}>
                                <Text style={[styles.currencySymbol, { color: theme.primary }]}>{currency.symbol}</Text>
                            </View>
                            <View>
                                <Text style={[styles.currencyCode, { color: theme.text }]}>{currency.code}</Text>
                                <Text style={[styles.currencyName, { color: theme.textSecondary }]}>{currency.name}</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-down" size={20} color={theme.textMuted} />
                    </TouchableOpacity>
                </View>

                {/* Contact Information */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Contact Information</Text>
                    <Input
                        label="Email Address"
                        value={email}
                        onChangeText={setEmail}
                        placeholder="business@example.com"
                        keyboardType="email-address"
                    />
                    <Input
                        label="Phone Number"
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="+1 (555) 000-0000"
                        keyboardType="phone-pad"
                    />
                    <Input
                        label="Website"
                        value={website}
                        onChangeText={setWebsite}
                        placeholder="https://example.com"
                        autoCapitalize="none"
                    />
                </View>

                {/* Address */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Location</Text>
                    <Input
                        label="Street Address"
                        value={address}
                        onChangeText={setAddress}
                        placeholder="123 Main St"
                    />
                    <View style={styles.rowGap}>
                        <View style={styles.flex1}>
                            <Input
                                label="City"
                                value={city}
                                onChangeText={setCity}
                            />
                        </View>
                        <View style={styles.flex1}>
                            <Input
                                label="State/Province"
                                value={state}
                                onChangeText={setState}
                            />
                        </View>
                    </View>
                    <Input
                        label="Zip/Postal Code"
                        value={zipCode}
                        onChangeText={setZipCode}
                    />
                </View>

                {/* Bank Details */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Bank Details (for Invoices)</Text>
                    <Input
                        label="Bank Name"
                        value={bankName}
                        onChangeText={setBankName}
                        placeholder="Bank of America"
                    />
                    <Input
                        label="Account Name"
                        value={accountName}
                        onChangeText={setAccountName}
                        placeholder="Acme Inc."
                    />
                    <Input
                        label="Account Number"
                        value={accountNumber}
                        onChangeText={setAccountNumber}
                        keyboardType="numeric"
                    />
                    <Input
                        label="Routing / Sort Code"
                        value={routingCode}
                        onChangeText={setRoutingCode}
                        placeholder="Routing Number or Sort Code"
                    />
                </View>

                <Button
                    title={loading ? 'Saving...' : 'Save Changes'}
                    onPress={handleSubmit}
                    disabled={loading}
                    style={styles.saveButton}
                />
            </ScrollView>

            {/* Country Modal */}
            <SelectionModal
                visible={showCountryModal}
                onClose={() => setShowCountryModal(false)}
                title="Select Country"
                data={COUNTRIES}
                searchKeys={['name', 'code']}
                onSelect={setCountry}
                renderItem={(item) => (
                    <>
                        <Text style={styles.modalFlag}>{item.flag}</Text>
                        <Text style={[styles.modalItemText, { color: theme.text }]}>{item.name}</Text>
                        <Text style={[styles.modalItemCode, { color: theme.textMuted }]}>{item.code}</Text>
                    </>
                )}
            />

            {/* Currency Modal */}
            <SelectionModal
                visible={showCurrencyModal}
                onClose={() => setShowCurrencyModal(false)}
                title="Select Currency"
                data={CURRENCIES}
                searchKeys={['name', 'code']}
                onSelect={setCurrency}
                renderItem={(item) => (
                    <>
                        <View style={[styles.modalCurrencyIcon, { backgroundColor: theme.surfaceSecondary }]}>
                            <Text style={[styles.currencySymbol, { color: theme.text }]}>{item.symbol}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.modalItemText, { color: theme.text }]}>{item.code}</Text>
                            <Text style={[styles.modalItemSub, { color: theme.textSecondary }]}>{item.name}</Text>
                        </View>
                        {currency.code === item.code && (
                            <Ionicons name="checkmark" size={24} color={theme.primary} />
                        )}
                    </>
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 12,
    },
    section: {
        marginBottom: 28,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 18,
        letterSpacing: -0.3,
    },
    formGroup: {
        marginBottom: 20,
        paddingHorizontal: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 10,
    },
    selectBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
    },
    rowCenter: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    flag: {
        fontSize: 26,
        marginRight: 12,
    },
    selectText: {
        fontSize: 16,
        fontWeight: '500',
    },
    currencyIcon: {
        width: 42,
        height: 42,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    currencySymbol: {
        fontWeight: '700',
        fontSize: 16,
    },
    currencyCode: {
        fontSize: 16,
        fontWeight: '600',
    },
    currencyName: {
        fontSize: 12,
        marginTop: 2,
    },
    rowGap: {
        flexDirection: 'row',
        gap: 14,
    },
    flex1: {
        flex: 1,
    },
    saveButton: {
        marginBottom: 40,
    },
    // Modal Styles
    modalContainer: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    modalSearchContainer: {
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
    },
    listContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    modalFlag: {
        fontSize: 30,
        marginRight: 16,
    },
    modalItemText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
    },
    modalItemCode: {
        fontWeight: '500',
    },
    modalCurrencyIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    modalItemSub: {
        fontSize: 14,
    },
});
