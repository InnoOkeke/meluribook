import { View, Text, ScrollView, TouchableOpacity, Alert, TextInput, StyleSheet, useColorScheme } from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { useState } from 'react';
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth } from '../../src/config/firebase';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/Colors';

export default function ProfileScreen() {
    const { user } = useAuth();
    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [newPassword, setNewPassword] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPasswordSection, setShowPasswordSection] = useState(false);
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

    const handleUpdateProfile = async () => {
        if (!user) return;
        setLoading(true);
        try {
            await updateProfile(user, { displayName });
            Alert.alert('Success', 'Profile updated successfully');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (!user || !user.email) return;
        if (!currentPassword || !newPassword) {
            Alert.alert('Error', 'Please fill in all password fields');
            return;
        }

        setLoading(true);
        try {
            // Re-authenticate first
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);

            // Update password
            await updatePassword(user, newPassword);
            Alert.alert('Success', 'Password updated successfully');
            setNewPassword('');
            setCurrentPassword('');
            setShowPasswordSection(false);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update password. Check your current password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <Stack.Screen options={{
                headerShown: true,
                title: 'User Account',
                headerBackTitle: 'Settings',
                headerTintColor: theme.text,
                headerStyle: { backgroundColor: theme.background },
                headerShadowVisible: false,
                headerTitleStyle: { color: theme.text, fontWeight: '700', fontSize: 18 }
            }} />

            <ScrollView style={styles.scrollContent}>

                {/* Profile Header */}
                <View style={styles.headerProfile}>
                    <View style={[styles.avatarContainer, {
                        backgroundColor: theme.primary + '20',
                        borderColor: theme.primary + '40'
                    }]}>
                        <Text style={[styles.avatarText, { color: theme.primary }]}>
                            {user?.displayName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                        </Text>
                    </View>
                    <Text style={[styles.emailText, { color: theme.textSecondary }]}>{user?.email}</Text>
                </View>

                {/* Edit Form */}
                <View style={styles.section}>
                    <Input
                        label="Full Name"
                        value={displayName}
                        onChangeText={setDisplayName}
                        placeholder="Enter your full name"
                    />

                    <Button
                        title={loading ? "Saving..." : "Update Profile"}
                        onPress={handleUpdateProfile}
                        disabled={loading || displayName === user?.displayName}
                        variant="outline"
                        style={styles.updateButton}
                    />
                </View>

                <View style={[styles.divider, { borderTopColor: theme.border }]} />

                {/* Password Section */}
                <View style={styles.section}>
                    <TouchableOpacity
                        style={styles.sectionHeader}
                        onPress={() => setShowPasswordSection(!showPasswordSection)}
                    >
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Security</Text>
                        <Ionicons
                            name={showPasswordSection ? "chevron-up" : "chevron-down"}
                            size={20}
                            color={theme.textMuted}
                        />
                    </TouchableOpacity>

                    {showPasswordSection && (
                        <View style={[styles.passwordContainer, {
                            backgroundColor: theme.surfaceSecondary,
                            borderColor: theme.border
                        }]}>
                            <Input
                                label="Current Password"
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                placeholder="Enter current password"
                                secureTextEntry
                            />
                            <Input
                                label="New Password"
                                value={newPassword}
                                onChangeText={setNewPassword}
                                placeholder="Enter new password"
                                secureTextEntry
                            />

                            <Button
                                title={loading ? "Updating..." : "Change Password"}
                                onPress={handleChangePassword}
                                disabled={loading}
                                style={styles.updateButton}
                            />
                        </View>
                    )}
                </View>

            </ScrollView>
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
        paddingTop: 24,
    },
    headerProfile: {
        alignItems: 'center',
        marginBottom: 36,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        borderWidth: 3,
    },
    avatarText: {
        fontSize: 40,
        fontWeight: '700',
    },
    emailText: {
        fontSize: 15,
    },
    section: {
        marginBottom: 28,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '700',
    },
    updateButton: {
        marginTop: 12,
    },
    divider: {
        borderTopWidth: 1,
        marginVertical: 20,
    },
    passwordContainer: {
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
    },
});
