import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { Colors } from '../src/constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export default function WelcomeScreen() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={[styles.loadingIndicator, { backgroundColor: theme.primary + '20' }]}>
                    <Ionicons name="pulse" size={32} color={theme.primary} />
                </View>
            </View>
        );
    }

    if (user) {
        return <Redirect href="/(tabs)/home" />;
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.content}>
                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <View style={[styles.logoContainer, { backgroundColor: theme.primary + '15' }]}>
                        <View style={[styles.logoInner, { backgroundColor: theme.primary }]}>
                            <Ionicons name="bar-chart" size={36} color="#FFFFFF" />
                        </View>
                    </View>

                    <Text style={[styles.title, { color: theme.text }]}>Meluribook</Text>
                    <Text style={[styles.tagline, { color: theme.primary }]}>Smart Finance Manager</Text>

                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                        Track expenses, create invoices, and manage your business finances with ease.
                    </Text>
                </View>

                {/* Features Preview */}
                <View style={styles.featuresRow}>
                    <View style={styles.featureItem}>
                        <View style={[styles.featureIcon, { backgroundColor: theme.success + '15' }]}>
                            <Ionicons name="receipt" size={20} color={theme.success} />
                        </View>
                        <Text style={[styles.featureText, { color: theme.textSecondary }]}>Invoicing</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <View style={[styles.featureIcon, { backgroundColor: theme.warning + '15' }]}>
                            <Ionicons name="analytics" size={20} color={theme.warning} />
                        </View>
                        <Text style={[styles.featureText, { color: theme.textSecondary }]}>Reports</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <View style={[styles.featureIcon, { backgroundColor: theme.primary + '15' }]}>
                            <Ionicons name="sparkles" size={20} color={theme.primary} />
                        </View>
                        <Text style={[styles.featureText, { color: theme.textSecondary }]}>AI Chat</Text>
                    </View>
                </View>

                {/* Buttons */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.primaryButton, { backgroundColor: theme.primary }]}
                        onPress={() => router.push('/(auth)/login')}
                    >
                        <Text style={styles.primaryButtonText}>Get Started</Text>
                        <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.secondaryButton, { borderColor: theme.border }]}
                        onPress={() => router.push('/(auth)/signup')}
                    >
                        <Text style={[styles.secondaryButtonText, { color: theme.text }]}>
                            Create New Account
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <Text style={[styles.footer, { color: theme.textMuted }]}>
                    By continuing, you agree to our Terms of Service
                </Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingIndicator: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 28,
        width: '100%',
    },
    heroSection: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logoContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 28,
    },
    logoInner: {
        width: 80,
        height: 80,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    title: {
        fontSize: 36,
        fontWeight: '800',
        letterSpacing: -1,
        marginBottom: 6,
    },
    tagline: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 16,
    },
    featuresRow: {
        flexDirection: 'row',
        gap: 32,
        marginBottom: 48,
    },
    featureItem: {
        alignItems: 'center',
    },
    featureIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    featureText: {
        fontSize: 12,
        fontWeight: '500',
    },
    buttonContainer: {
        width: '100%',
        gap: 14,
    },
    primaryButton: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 18,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 6,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 17,
    },
    secondaryButton: {
        width: '100%',
        paddingVertical: 18,
        borderRadius: 16,
        borderWidth: 1.5,
    },
    secondaryButtonText: {
        textAlign: 'center',
        fontWeight: '600',
        fontSize: 16,
    },
    footer: {
        fontSize: 12,
        marginTop: 32,
    },
});
