import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';

interface EmptyStateProps {
    title: string;
    description?: string;
    icon?: string;
    actionLabel?: string;
    onAction?: () => void;
    loading?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    title,
    description,
    icon = '📭',
    actionLabel,
    onAction,
    loading = false
}) => {
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={[styles.iconContainer, { backgroundColor: theme.surfaceSecondary }]}>
                <Text style={styles.icon}>{icon}</Text>
            </View>
            <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
            {description && (
                <Text style={[styles.description, { color: theme.textSecondary }]}>{description}</Text>
            )}
            {actionLabel && onAction && (
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: theme.primary }]}
                    onPress={onAction}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.buttonText, { color: theme.buttonPrimaryText }]}>{actionLabel}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    icon: {
        fontSize: 48,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    description: {
        fontSize: 15,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 22,
        paddingHorizontal: 16,
    },
    button: {
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
    },
});
