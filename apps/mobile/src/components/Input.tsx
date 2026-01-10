import { TextInput, View, Text, TextInputProps, StyleSheet, useColorScheme } from "react-native";
import { Colors } from "../constants/Colors";
import { useState } from "react";

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerStyle?: any;
    style?: any;
}

export const Input = ({
    label,
    error,
    containerStyle,
    style,
    ...props
}: InputProps) => {
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;
    const [isFocused, setIsFocused] = useState(false);

    return (
        <View style={[styles.container, containerStyle]}>
            {label && (
                <Text style={[styles.label, { color: theme.textSecondary }]}>
                    {label}
                </Text>
            )}
            <TextInput
                style={[
                    styles.input,
                    {
                        backgroundColor: theme.surface,
                        borderColor: error ? theme.error : (isFocused ? theme.primary : theme.border),
                        color: theme.text,
                        borderWidth: isFocused ? 2 : 1,
                    },
                    style
                ]}
                placeholderTextColor={theme.textMuted}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                {...props}
            />
            {error && <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        marginLeft: 2,
        letterSpacing: 0.2,
    },
    input: {
        width: '100%',
        borderRadius: 14,
        paddingHorizontal: 18,
        paddingVertical: 14,
        fontSize: 16,
    },
    errorText: {
        fontSize: 13,
        marginTop: 6,
        marginLeft: 4,
        fontWeight: '500',
    }
});
