import { View, Text, ScrollView, TouchableOpacity, Alert, Modal, FlatList, TextInput, StyleSheet, useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useState } from 'react';
import { useBusiness } from '../../src/context/BusinessContext';
import { useLoading } from '../../src/hooks/useLoading';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { Ionicons } from '@expo/vector-icons';
import { COUNTRIES, CURRENCIES } from '../../src/constants/data';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../src/constants/Colors';

const REPORTING_PERIODS = [
    { id: 'Monthly', icon: 'calendar-outline', label: 'Monthly' },
    { id: 'Quarterly', icon: 'layers-outline', label: 'Quarterly' },
    { id: 'Annually', icon: 'ribbon-outline', label: 'Annually' },
];

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
                    <TouchableOpacity
                        onPress={onClose}
                        style={[styles.modalCloseBtn, { backgroundColor: theme.surfaceSecondary }]}
                    >
                        <Ionicons name="close" size={20} color={theme.textMuted} />
                    </TouchableOpacity>
                </View>

                <View style={styles.modalSearchContainer}>
                    <View style={[styles.searchBox, { backgroundColor: theme.surfaceSecondary }]}>
                        <Ionicons name="search" size={18} color={theme.textMuted} />
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

export default function CreateBusinessScreen() {
    const { createBusiness } = useBusiness();
    const { loading, execute } = useLoading();
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

    const [name, setName] = useState('');
    const [reportingPeriod, setReportingPeriod] = useState('Monthly');
    const [country, setCountry] = useState(COUNTRIES.find(c => c.code === 'US') || COUNTRIES[0]);
    const [showCountryModal, setShowCountryModal] = useState(false);
    const [currency, setCurrency] = useState(CURRENCIES.find(c => c.code === 'USD') || CURRENCIES[0]);
    const [showCurrencyModal, setShowCurrencyModal] = useState(false);

    const handleSubmit = async () => {
        if (!name) {
            Alert.alert('Error', 'Please enter a business name');
            return;
        }

        await execute(
            async () => {
                await createBusiness({
                    name,
                    country: country.code,
                    currency: currency.code,
                    reportingPeriod,
                });
                return true;
            },
            () => {
                Alert.alert('Success', 'Business created!');
                router.replace('/(tabs)/home');
            },
            (error) => {
                Alert.alert('Error', error.title || "Failed to create business");
            }
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />

            {/* Header */}
            <View style={styles.header}>
                <View style={[styles.headerIcon, { backgroundColor: theme.primary + '15' }]}>
                    <Ionicons name="business" size={28} color={theme.primary} />
                </View>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Create Business</Text>
                <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                    Set up your business profile to get started
                </Text>
            </View>

            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Business Name */}
                <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="storefront" size={20} color={theme.textSecondary} />
                        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Business Name</Text>
                    </View>
                    <Input
                        placeholder="E.g., Acme Consulting LLC"
                        value={name}
                        onChangeText={setName}
                        containerStyle={{ marginBottom: 0 }}
                    />
                </View>

                {/* Country */}
                <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="globe" size={20} color={theme.textSecondary} />
                        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Country</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => setShowCountryModal(true)}
                        style={[styles.selectBtn, { backgroundColor: theme.surfaceSecondary }]}
                    >
                        <View style={styles.selectBtnLeft}>
                            <Text style={styles.flag}>{country.flag}</Text>
                            <Text style={[styles.selectText, { color: theme.text }]}>{country.name}</Text>
                        </View>
                        <Ionicons name="chevron-down" size={20} color={theme.textMuted} />
                    </TouchableOpacity>
                </View>

                {/* Currency */}
                <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="cash" size={20} color={theme.textSecondary} />
                        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Currency</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => setShowCurrencyModal(true)}
                        style={[styles.selectBtn, { backgroundColor: theme.surfaceSecondary }]}
                    >
                        <View style={styles.selectBtnLeft}>
                            <View style={[styles.currencyBadge, { backgroundColor: theme.primary + '15' }]}>
                                <Text style={[styles.currencySymbol, { color: theme.primary }]}>{currency.symbol}</Text>
                            </View>
                            <View>
                                <Text style={[styles.currencyCode, { color: theme.text }]}>{currency.code}</Text>
                                <Text style={[styles.currencyName, { color: theme.textMuted }]}>{currency.name}</Text>
                            </View>
                        </View>
                        <Ionicons name="chevron-down" size={20} color={theme.textMuted} />
                    </TouchableOpacity>
                </View>

                {/* Reporting Period */}
                <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="calendar" size={20} color={theme.textSecondary} />
                        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Reporting Period</Text>
                    </View>
                    <View style={styles.periodGrid}>
                        {REPORTING_PERIODS.map((period) => (
                            <TouchableOpacity
                                key={period.id}
                                style={[
                                    styles.periodCard,
                                    {
                                        backgroundColor: reportingPeriod === period.id ? theme.primary : theme.surfaceSecondary,
                                        borderColor: reportingPeriod === period.id ? theme.primary : 'transparent'
                                    }
                                ]}
                                onPress={() => setReportingPeriod(period.id)}
                            >
                                <Ionicons
                                    name={period.icon as any}
                                    size={22}
                                    color={reportingPeriod === period.id ? '#FFFFFF' : theme.textSecondary}
                                />
                                <Text style={[
                                    styles.periodText,
                                    { color: reportingPeriod === period.id ? '#FFFFFF' : theme.text }
                                ]}>
                                    {period.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
                <Button
                    title={loading ? 'Creating...' : 'Create Business'}
                    onPress={handleSubmit}
                    disabled={loading || !name}
                    size="lg"
                />
            </View>

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
                            <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
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
    header: {
        alignItems: 'center',
        paddingVertical: 32,
        paddingHorizontal: 24,
    },
    headerIcon: {
        width: 72,
        height: 72,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '800',
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 15,
        textAlign: 'center',
    },
    scrollContent: {
        flex: 1,
        paddingHorizontal: 20,
    },
    section: {
        padding: 18,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 14,
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
    selectBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
    },
    selectBtnLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    flag: {
        fontSize: 28,
    },
    selectText: {
        fontSize: 16,
        fontWeight: '500',
    },
    currencyBadge: {
        width: 44,
        height: 44,
        borderRadius: 12,
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
    periodGrid: {
        flexDirection: 'row',
        gap: 10,
    },
    periodCard: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    periodText: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 6,
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
    },
    // Modal Styles
    modalContainer: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    modalCloseBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalSearchContainer: {
        paddingHorizontal: 20,
        paddingVertical: 14,
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        gap: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    modalFlag: {
        fontSize: 28,
        marginRight: 14,
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
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    modalItemSub: {
        fontSize: 13,
        marginTop: 2,
    },
});
