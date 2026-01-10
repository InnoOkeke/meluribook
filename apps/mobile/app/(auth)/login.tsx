import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, Image, StyleSheet, KeyboardAvoidingView, ScrollView, Platform, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { useAuth } from '../../src/context/AuthContext';
import googleLogo from '../../assets/google.png';
import { Colors } from '../../src/constants/Colors';

export default function LoginScreen() {
    const router = useRouter();
    const { login, loginWithGoogle } = useAuth();
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Missing Fields", "Please enter both email and password");
            return;
        }

        setLoading(true);
        try {
            await login(email, password);
            // Navigation is handled in AuthContext upon success
        } catch (error: any) {
            Alert.alert("Login Failed", error.message || "Invalid credentials");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            await loginWithGoogle();
        } catch (error: any) {
            console.error(error);
            Alert.alert("Google Login Failed", error.message || "Unknown error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: theme.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.header}>
                    <Text style={[styles.title, { color: theme.primary }]}>Welcome Back</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Sign in to manage your finances</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>Email Address</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                            placeholder="you@company.com"
                            placeholderTextColor={theme.textMuted}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            value={email}
                            onChangeText={setEmail}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>Password</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                            placeholder="••••••••"
                            secureTextEntry
                            placeholderTextColor={theme.textMuted}
                            value={password}
                            onChangeText={setPassword}
                        />
                    </View>

                    <TouchableOpacity style={styles.forgotPassword}>
                        <Text style={[styles.forgotPasswordText, { color: theme.primary }]}>Forgot Password?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.primaryButton, { backgroundColor: theme.buttonPrimaryBg }, loading && styles.disabledButton]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={[styles.primaryButtonText, { color: theme.buttonPrimaryText }]}>Sign In</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.divider}>
                        <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
                        <Text style={[styles.dividerText, { color: theme.textMuted }]}>OR</Text>
                        <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
                    </View>

                    <TouchableOpacity
                        style={[styles.googleButton, { backgroundColor: theme.surface, borderColor: theme.border }, loading && styles.disabledButton]}
                        onPress={handleGoogleLogin}
                        disabled={loading}
                    >
                        <Image source={googleLogo} style={styles.googleIcon} resizeMode="contain" />
                        <Text style={[styles.googleButtonText, { color: theme.textSecondary }]}>Continue with Google</Text>
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: theme.textSecondary }]}>Don't have an account? </Text>
                        <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
                            <Text style={[styles.footerLink, { color: theme.primary }]}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 28,
    },
    header: {
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        marginTop: 10,
        lineHeight: 22,
    },
    form: {
        gap: 20,
    },
    inputGroup: {
        marginBottom: 4,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 10,
        letterSpacing: 0.2,
    },
    input: {
        width: '100%',
        borderWidth: 1,
        padding: 18,
        borderRadius: 14,
        fontSize: 16,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginVertical: 4,
    },
    forgotPasswordText: {
        fontWeight: '600',
        fontSize: 14,
    },
    primaryButton: {
        width: '100%',
        padding: 18,
        borderRadius: 14,
        alignItems: 'center',
        marginTop: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButtonText: {
        fontWeight: '700',
        fontSize: 17,
        letterSpacing: 0.3,
    },
    disabledButton: {
        opacity: 0.6,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 28,
    },
    dividerLine: {
        flex: 1,
        height: 1,
    },
    dividerText: {
        marginHorizontal: 16,
        fontSize: 13,
        fontWeight: '500',
    },
    googleButton: {
        width: '100%',
        borderWidth: 1.5,
        padding: 16,
        borderRadius: 14,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
    },
    googleIcon: {
        width: 22,
        height: 22,
    },
    googleButtonText: {
        fontWeight: '600',
        fontSize: 16,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    footerText: {
        fontSize: 15,
    },
    footerLink: {
        fontWeight: '700',
        fontSize: 15,
    },
});
