import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, useColorScheme } from "react-native";
import { Colors } from "../constants/Colors";

interface ButtonProps {
    onPress: () => void;
    title: string;
    variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
    size?: "sm" | "md" | "lg";
    loading?: boolean;
    disabled?: boolean;
    style?: any;
    textStyle?: any;
}

export const Button = ({
    onPress,
    title,
    variant = "primary",
    size = "md",
    loading = false,
    disabled = false,
    style,
    textStyle,
}: ButtonProps) => {
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

    const getBackgroundColor = () => {
        if (disabled) return theme.textMuted + '80'; // Opacity
        switch (variant) {
            case 'primary': return theme.buttonPrimaryBg;
            case 'secondary': return theme.secondary;
            case 'outline': return 'transparent';
            case 'ghost': return 'transparent';
            case 'danger': return theme.error;
            default: return theme.primary;
        }
    };

    const getBorderColor = () => {
        if (variant === 'outline') return theme.border;
        return 'transparent';
    };

    const getTextColor = () => {
        if (variant === 'primary') return theme.buttonPrimaryText;
        if (variant === 'secondary') return '#FFFFFF';
        if (variant === 'danger') return '#FFFFFF';
        if (variant === 'outline' || variant === 'ghost') return theme.text;
        return theme.text;
    };

    const buttonStyles = [
        styles.base,
        styles[size],
        {
            backgroundColor: getBackgroundColor(),
            borderColor: getBorderColor(),
            borderWidth: variant === 'outline' ? 1 : 0,
            opacity: disabled || loading ? 0.7 : 1,
        },
        style
    ];

    const textStyles = [
        styles.textBase,
        styles[`text${size}` as keyof typeof styles],
        { color: getTextColor() },
        textStyle
    ];

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            style={buttonStyles}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator color={getTextColor()} />
            ) : (
                <Text style={textStyles}>
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    base: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    sm: {
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    md: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    lg: {
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    textBase: {
        fontWeight: '600',
    },
    textsm: {
        fontSize: 14,
    },
    textmd: {
        fontSize: 16,
    },
    textlg: {
        fontSize: 18,
    },
});
