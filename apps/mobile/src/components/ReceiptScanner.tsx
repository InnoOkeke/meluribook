import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, Alert, StyleSheet, useColorScheme } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { aiService } from '../services/ai.service';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

interface ReceiptScannerProps {
    onScanComplete: (data: any) => void;
}

export const ReceiptScanner: React.FC<ReceiptScannerProps> = ({ onScanComplete }) => {
    const [loading, setLoading] = useState(false);
    const [image, setImage] = useState<string | null>(null);
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
                base64: true,
            });

            if (!result.canceled && result.assets && result.assets[0].base64) {
                setImage(result.assets[0].uri);
                processReceipt(result.assets[0].base64);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    const takePhoto = async () => {
        try {
            const permission = await ImagePicker.requestCameraPermissionsAsync();
            if (permission.status !== 'granted') {
                Alert.alert('Permission needed', 'Camera access required.');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                quality: 0.8,
                base64: true,
            });

            if (!result.canceled && result.assets && result.assets[0].base64) {
                setImage(result.assets[0].uri);
                processReceipt(result.assets[0].base64);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to take photo');
        }
    };

    const processReceipt = async (base64: string) => {
        setLoading(true);
        try {
            const data = await aiService.scanReceipt(base64);
            Alert.alert('Success', 'Receipt scanned!');
            onScanComplete(data);
        } catch (error) {
            Alert.alert('Error', 'Failed to analyze receipt.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.header}>
                <View style={[styles.headerIcon, { backgroundColor: theme.primary + '15' }]}>
                    <Ionicons name="scan" size={20} color={theme.primary} />
                </View>
                <View>
                    <Text style={[styles.title, { color: theme.text }]}>AI Receipt Scanner</Text>
                    <Text style={[styles.subtitle, { color: theme.textMuted }]}>Auto-fill from receipt photo</Text>
                </View>
            </View>

            {image && (
                <View style={styles.previewContainer}>
                    <Image source={{ uri: image }} style={styles.preview} />
                    <TouchableOpacity
                        style={[styles.removeBtn, { backgroundColor: theme.error + '20' }]}
                        onPress={() => setImage(null)}
                    >
                        <Ionicons name="close" size={16} color={theme.error} />
                    </TouchableOpacity>
                </View>
            )}

            {loading ? (
                <View style={[styles.loadingContainer, { backgroundColor: theme.surfaceSecondary }]}>
                    <ActivityIndicator size="small" color={theme.primary} />
                    <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Analyzing receipt...</Text>
                </View>
            ) : (
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: theme.surfaceSecondary }]}
                        onPress={pickImage}
                    >
                        <View style={[styles.btnIcon, { backgroundColor: theme.primary + '15' }]}>
                            <Ionicons name="images" size={18} color={theme.primary} />
                        </View>
                        <Text style={[styles.buttonText, { color: theme.text }]}>Gallery</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.primaryButton, { backgroundColor: theme.primary }]}
                        onPress={takePhoto}
                    >
                        <View style={[styles.btnIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                            <Ionicons name="camera" size={18} color="#FFFFFF" />
                        </View>
                        <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Camera</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 18,
        borderRadius: 18,
        borderWidth: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginBottom: 18,
    },
    headerIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
    },
    subtitle: {
        fontSize: 13,
        marginTop: 2,
    },
    previewContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    preview: {
        width: '100%',
        height: 180,
        borderRadius: 12,
        backgroundColor: '#000',
    },
    removeBtn: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 12,
    },
    loadingText: {
        fontSize: 14,
        fontWeight: '500',
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 12,
        gap: 10,
    },
    primaryButton: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    btnIcon: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        fontWeight: '600',
        fontSize: 14,
    },
});
