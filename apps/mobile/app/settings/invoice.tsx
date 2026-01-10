import { View, Text, ScrollView, TouchableOpacity, Switch, TextInput, StyleSheet, useColorScheme, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../src/constants/Colors';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';

const COLOR_OPTIONS = [
    '#0EA5A4', // Primary teal
    '#2DD4BF', // Mint
    '#38BDF8', // Blue
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#F59E0B', // Orange
    '#22C55E', // Green
    '#64748B', // Slate
];

const DUE_DAY_OPTIONS = [7, 14, 21, 30, 45, 60, 90];

export default function InvoiceSettingsScreen() {
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

    // Invoice Settings State
    const [primaryColor, setPrimaryColor] = useState('#0EA5A4');
    const [overdueReminder, setOverdueReminder] = useState(true);
    const [reminderDays, setReminderDays] = useState(3);
    const [defaultDueDays, setDefaultDueDays] = useState(30);
    const [defaultNote, setDefaultNote] = useState('Thank you for your business!');
    const [defaultEmailMessage, setDefaultEmailMessage] = useState('Please find attached the invoice for your recent purchase. Payment is due within the specified period.');
    const [receiveCopy, setReceiveCopy] = useState(true);

    // Load settings on mount
    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const settings = await AsyncStorage.getItem('invoiceSettings');
            if (settings) {
                const parsed = JSON.parse(settings);
                setPrimaryColor(parsed.primaryColor || '#0EA5A4');
                setOverdueReminder(parsed.overdueReminder ?? true);
                setReminderDays(parsed.reminderDays || 3);
                setDefaultDueDays(parsed.defaultDueDays || 30);
                setDefaultNote(parsed.defaultNote || 'Thank you for your business!');
                setDefaultEmailMessage(parsed.defaultEmailMessage || 'Please find attached the invoice for your recent purchase. Payment is due within the specified period.');
                setReceiveCopy(parsed.receiveCopy ?? true);
            }
        } catch (e) {
            console.error('Error loading invoice settings:', e);
        }
    };

    const handleSave = async () => {
        try {
            const settings = {
                primaryColor,
                overdueReminder,
                reminderDays,
                defaultDueDays,
                defaultNote,
                defaultEmailMessage,
                receiveCopy,
            };
            await AsyncStorage.setItem('invoiceSettings', JSON.stringify(settings));
            Alert.alert('Saved', 'Invoice settings saved successfully!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (e) {
            console.error('Error saving invoice settings:', e);
            Alert.alert('Error', 'Failed to save settings');
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

    const renderToggleRow = (label: string, subtitle: string, value: boolean, onChange: (val: boolean) => void) => (
        <View style={[styles.toggleRow, { borderBottomColor: theme.border }]}>
            <View style={styles.toggleTextContainer}>
                <Text style={[styles.toggleLabel, { color: theme.text }]}>{label}</Text>
                <Text style={[styles.toggleSubtitle, { color: theme.textMuted }]}>{subtitle}</Text>
            </View>
            <Switch
                value={value}
                onValueChange={onChange}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor={'#FFFFFF'}
            />
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <Stack.Screen options={{
                headerShown: true,
                title: 'Invoice',
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
                {/* Color Selection */}
                {renderSection('Invoice Accent Color', (
                    <View>
                        <Text style={[styles.colorDescription, { color: theme.textSecondary }]}>
                            Choose a primary color for your invoices
                        </Text>
                        <View style={styles.colorGrid}>
                            {COLOR_OPTIONS.map((color) => (
                                <TouchableOpacity
                                    key={color}
                                    style={[
                                        styles.colorOption,
                                        { backgroundColor: color },
                                        primaryColor === color && styles.colorOptionSelected
                                    ]}
                                    onPress={() => setPrimaryColor(color)}
                                >
                                    {primaryColor === color && (
                                        <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                        <View style={[styles.colorPreview, { backgroundColor: primaryColor + '15' }]}>
                            <View style={[styles.colorPreviewBadge, { backgroundColor: primaryColor }]}>
                                <Text style={styles.colorPreviewText}>INVOICE</Text>
                            </View>
                            <Text style={[styles.colorPreviewLabel, { color: theme.textSecondary }]}>Preview</Text>
                        </View>
                    </View>
                ))}

                {/* Due Days */}
                {renderSection('Default Due Period', (
                    <View>
                        <Text style={[styles.colorDescription, { color: theme.textSecondary }]}>
                            Default number of days until payment is due
                        </Text>
                        <View style={styles.daysGrid}>
                            {DUE_DAY_OPTIONS.map((days) => (
                                <TouchableOpacity
                                    key={days}
                                    style={[
                                        styles.dayOption,
                                        { borderColor: defaultDueDays === days ? theme.primary : theme.border },
                                        defaultDueDays === days && { backgroundColor: theme.primary + '10' }
                                    ]}
                                    onPress={() => setDefaultDueDays(days)}
                                >
                                    <Text style={[
                                        styles.dayText,
                                        { color: defaultDueDays === days ? theme.primary : theme.text }
                                    ]}>{days}</Text>
                                    <Text style={[styles.dayLabel, { color: theme.textMuted }]}>days</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ))}

                {/* Reminders */}
                {renderSection('Overdue Reminders', (
                    <>
                        {renderToggleRow(
                            'Enable Reminders',
                            'Send automatic reminders for overdue invoices',
                            overdueReminder,
                            setOverdueReminder
                        )}
                        {overdueReminder && (
                            <View style={styles.reminderDaysContainer}>
                                <Text style={[styles.reminderLabel, { color: theme.textSecondary }]}>Remind after</Text>
                                <View style={styles.reminderInputContainer}>
                                    <TextInput
                                        style={[styles.reminderInput, { backgroundColor: theme.surfaceSecondary, color: theme.text, borderColor: theme.border }]}
                                        value={reminderDays.toString()}
                                        onChangeText={(t) => setReminderDays(parseInt(t) || 0)}
                                        keyboardType="numeric"
                                    />
                                    <Text style={[styles.reminderLabel, { color: theme.textSecondary }]}>days overdue</Text>
                                </View>
                            </View>
                        )}
                    </>
                ))}

                {/* Default Note */}
                {renderSection('Default Invoice Note', (
                    <TextInput
                        style={[styles.textArea, { backgroundColor: theme.surfaceSecondary, color: theme.text, borderColor: theme.border }]}
                        placeholder="Add a default note that appears on all invoices..."
                        placeholderTextColor={theme.textMuted}
                        value={defaultNote}
                        onChangeText={setDefaultNote}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                    />
                ))}

                {/* Default Email Message */}
                {renderSection('Default Email Message', (
                    <TextInput
                        style={[styles.textArea, { backgroundColor: theme.surfaceSecondary, color: theme.text, borderColor: theme.border }]}
                        placeholder="Default message when sending invoices via email..."
                        placeholderTextColor={theme.textMuted}
                        value={defaultEmailMessage}
                        onChangeText={setDefaultEmailMessage}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />
                ))}

                {/* Receive Copy */}
                {renderSection('Email Preferences', (
                    renderToggleRow(
                        'Receive Invoice Copy',
                        'Get a copy of sent invoices in your email',
                        receiveCopy,
                        setReceiveCopy
                    )
                ))}

                <Button
                    title="Save Changes"
                    onPress={handleSave}
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
    colorDescription: {
        fontSize: 14,
        marginBottom: 16,
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 20,
    },
    colorOption: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    colorOptionSelected: {
        borderWidth: 3,
        borderColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    colorPreview: {
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    colorPreviewBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        marginBottom: 8,
    },
    colorPreviewText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
        letterSpacing: 1,
    },
    colorPreviewLabel: {
        fontSize: 12,
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    dayOption: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1.5,
        alignItems: 'center',
    },
    dayText: {
        fontSize: 18,
        fontWeight: '700',
    },
    dayLabel: {
        fontSize: 11,
        marginTop: 2,
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    toggleTextContainer: {
        flex: 1,
        marginRight: 12,
    },
    toggleLabel: {
        fontSize: 15,
        fontWeight: '500',
    },
    toggleSubtitle: {
        fontSize: 13,
        marginTop: 2,
    },
    reminderDaysContainer: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    reminderLabel: {
        fontSize: 14,
    },
    reminderInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 8,
    },
    reminderInput: {
        width: 60,
        borderRadius: 8,
        borderWidth: 1,
        padding: 10,
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '600',
    },
    textArea: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 16,
        fontSize: 15,
        minHeight: 80,
    },
    saveButton: {
        marginTop: 8,
    },
});
