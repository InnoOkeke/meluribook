import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput, Image, StyleSheet, useColorScheme } from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { useBusiness } from '../../src/context/BusinessContext';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { Colors } from '../../src/constants/Colors';

export default function CompanySettingsScreen() {
    const { currentBusiness, updateBusiness } = useBusiness();
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
    const [loading, setLoading] = useState(false);

    // Business Info
    const [name, setName] = useState(currentBusiness?.name || '');
    const [email, setEmail] = useState(currentBusiness?.email || '');
    const [phone, setPhone] = useState(currentBusiness?.phone || '');
    const [website, setWebsite] = useState(currentBusiness?.website || '');
    const [taxId, setTaxId] = useState(currentBusiness?.taxId || '');

    // Address
    const [address, setAddress] = useState(currentBusiness?.address || '');
    const [city, setCity] = useState(currentBusiness?.city || '');
    const [state, setState] = useState(currentBusiness?.state || '');
    const [zipCode, setZipCode] = useState(currentBusiness?.zipCode || '');
    const [country, setCountry] = useState(currentBusiness?.country || '');

    // Bank Details
    const [bankName, setBankName] = useState(currentBusiness?.bankDetails?.bankName || '');
    const [accountName, setAccountName] = useState(currentBusiness?.bankDetails?.accountName || '');
    const [accountNumber, setAccountNumber] = useState(currentBusiness?.bankDetails?.accountNumber || '');
    const [routingCode, setRoutingCode] = useState(currentBusiness?.bankDetails?.routingCode || '');

    // Payment
    const [paymentInstructions, setPaymentInstructions] = useState('');
    const [signature, setSignature] = useState('');

    const handleSave = async () => {
        if (!currentBusiness || !name) {
            Alert.alert('Error', 'Business name is required');
            return;
        }

        const updateData = {
            name,
            email,
            phone,
            website,
            taxId,
            address,
            city,
            state,
            zipCode,
            country,
            bankDetails: {
                bankName,
                accountName,
                accountNumber,
                routingCode,
            },
        };

        // Optimistic UI - show success immediately and navigate back
        Alert.alert('Success', 'Company settings saved!', [
            { text: 'OK', onPress: () => router.back() }
        ]);

        // Background network call
        try {
            await updateBusiness(currentBusiness.id, updateData);
        } catch (error: any) {
            console.error('Error saving company settings:', error);
            // Error will be logged but user already navigated back
        }
    };

    const renderSection = (title: string, children: React.ReactNode) => (
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{title}</Text>
            <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                {children}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <Stack.Screen options={{
                headerShown: true,
                title: 'Company',
                headerBackTitle: 'Settings',
                headerTintColor: theme.text,
                headerStyle: { backgroundColor: theme.background },
                headerShadowVisible: false,
                headerTitleStyle: { color: theme.text, fontWeight: '700', fontSize: 18 }
            }} />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Logo Section */}
                <View style={styles.logoSection}>
                    <TouchableOpacity style={[styles.logoPlaceholder, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
                        <Ionicons name="camera" size={28} color={theme.textMuted} />
                        <Text style={[styles.logoText, { color: theme.textMuted }]}>Add Logo</Text>
                    </TouchableOpacity>
                    <Text style={[styles.logoHint, { color: theme.textMuted }]}>Appears on invoices</Text>
                </View>

                {renderSection('Business Information', (
                    <>
                        <Input label="Business Name" value={name} onChangeText={setName} placeholder="Your Company LLC" />
                        <Input label="Email" value={email} onChangeText={setEmail} placeholder="hello@company.com" keyboardType="email-address" />
                        <Input label="Phone" value={phone} onChangeText={setPhone} placeholder="+1 (555) 000-0000" keyboardType="phone-pad" />
                        <Input label="Website" value={website} onChangeText={setWebsite} placeholder="https://company.com" autoCapitalize="none" />
                        <Input label="Tax ID / VAT" value={taxId} onChangeText={setTaxId} placeholder="US-123456789" />
                    </>
                ))}

                {renderSection('Address', (
                    <>
                        <Input label="Street Address" value={address} onChangeText={setAddress} placeholder="123 Main Street" />
                        <View style={styles.row}>
                            <View style={styles.halfInput}>
                                <Input label="City" value={city} onChangeText={setCity} />
                            </View>
                            <View style={styles.halfInput}>
                                <Input label="State" value={state} onChangeText={setState} />
                            </View>
                        </View>
                        <View style={styles.row}>
                            <View style={styles.halfInput}>
                                <Input label="Zip Code" value={zipCode} onChangeText={setZipCode} />
                            </View>
                            <View style={styles.halfInput}>
                                <Input label="Country" value={country} onChangeText={setCountry} />
                            </View>
                        </View>
                    </>
                ))}

                {renderSection('Bank Details', (
                    <>
                        <Input label="Bank Name" value={bankName} onChangeText={setBankName} placeholder="Bank of America" />
                        <Input label="Account Name" value={accountName} onChangeText={setAccountName} placeholder="Your Company LLC" />
                        <Input label="Account Number" value={accountNumber} onChangeText={setAccountNumber} keyboardType="numeric" />
                        <Input label="Routing / Sort Code" value={routingCode} onChangeText={setRoutingCode} placeholder="021000021" />
                    </>
                ))}

                {renderSection('Signature', (
                    <TouchableOpacity style={[styles.signaturePlaceholder, { borderColor: theme.border }]}>
                        <Ionicons name="create-outline" size={24} color={theme.textMuted} />
                        <Text style={[styles.signatureText, { color: theme.textMuted }]}>Tap to add signature</Text>
                    </TouchableOpacity>
                ))}

                {renderSection('Payment Instructions', (
                    <TextInput
                        style={[styles.textArea, { backgroundColor: theme.surfaceSecondary, color: theme.text, borderColor: theme.border }]}
                        placeholder="Add custom payment instructions for your clients..."
                        placeholderTextColor={theme.textMuted}
                        value={paymentInstructions}
                        onChangeText={setPaymentInstructions}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />
                ))}

                <Button
                    title={loading ? 'Saving...' : 'Save Changes'}
                    onPress={handleSave}
                    disabled={loading}
                    style={styles.saveButton}
                />

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    logoSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 20,
        borderWidth: 2,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    logoText: {
        fontSize: 13,
        marginTop: 6,
        fontWeight: '500',
    },
    logoHint: {
        fontSize: 13,
    },
    section: {
        marginBottom: 28,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 12,
        marginLeft: 4,
    },
    sectionCard: {
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
    },
    row: {
        flexDirection: 'row',
        gap: 12,
    },
    halfInput: {
        flex: 1,
    },
    signaturePlaceholder: {
        height: 120,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    signatureText: {
        fontSize: 14,
        marginTop: 8,
    },
    textArea: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 16,
        fontSize: 15,
        minHeight: 100,
    },
    saveButton: {
        marginTop: 8,
    },
});
