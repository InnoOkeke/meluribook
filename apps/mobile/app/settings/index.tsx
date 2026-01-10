import { View, Text, ScrollView, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/Colors';

type SettingsItem = {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle: string;
    route: string;
    color: string;
};

const SETTINGS_ITEMS: SettingsItem[] = [
    {
        icon: 'person',
        title: 'User Account',
        subtitle: 'Profile, password & personal info',
        route: '/settings/profile',
        color: '#8B5CF6',
    },
    {
        icon: 'business',
        title: 'Company',
        subtitle: 'Business info, logo, bank details & signature',
        route: '/settings/company',
        color: '#0EA5A4',
    },
    {
        icon: 'document-text',
        title: 'Invoice',
        subtitle: 'Colors, reminders, defaults & templates',
        route: '/settings/invoice',
        color: '#F59E0B',
    },
];

export default function SettingsScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <Stack.Screen options={{
                headerShown: true,
                title: 'Settings',
                headerBackTitle: 'Back',
                headerTintColor: theme.text,
                headerStyle: { backgroundColor: theme.background },
                headerShadowVisible: false,
                headerTitleStyle: {
                    color: theme.text,
                    fontWeight: '700',
                    fontSize: 18,
                }
            }} />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Text style={[styles.description, { color: theme.textSecondary }]}>
                    Manage your account, company information, and invoice preferences.
                </Text>

                <View style={styles.itemsContainer}>
                    {SETTINGS_ITEMS.map((item, index) => (
                        <TouchableOpacity
                            key={item.route}
                            style={[styles.settingsItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
                            onPress={() => router.push(item.route as any)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
                                <Ionicons name={item.icon} size={26} color={item.color} />
                            </View>
                            <View style={styles.textContainer}>
                                <Text style={[styles.itemTitle, { color: theme.text }]}>{item.title}</Text>
                                <Text style={[styles.itemSubtitle, { color: theme.textMuted }]}>{item.subtitle}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={22} color={theme.textMuted} />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Additional Info */}
                <View style={[styles.infoCard, { backgroundColor: theme.surfaceSecondary }]}>
                    <Ionicons name="information-circle" size={20} color={theme.textMuted} />
                    <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                        Changes to Company and Invoice settings will apply to all new invoices.
                    </Text>
                </View>
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
    },
    description: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 24,
    },
    itemsContainer: {
        gap: 12,
    },
    settingsItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 18,
        borderRadius: 16,
        borderWidth: 1,
    },
    iconContainer: {
        width: 52,
        height: 52,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textContainer: {
        flex: 1,
        marginLeft: 16,
    },
    itemTitle: {
        fontSize: 17,
        fontWeight: '600',
    },
    itemSubtitle: {
        fontSize: 13,
        marginTop: 4,
        lineHeight: 18,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        borderRadius: 12,
        marginTop: 32,
        gap: 12,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        lineHeight: 18,
    },
});
