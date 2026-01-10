export const Colors = {
    light: {
        primary: '#0EA5A4', // Deep Cyan (Action)
        primaryAccent: '#2DD4BF', // Mint Blue
        secondary: '#38BDF8', // Soft Blue
        background: '#F8FAFC', // Soft Paper
        surface: '#FFFFFF',
        surfaceSecondary: '#F1F5F9',
        text: '#0F172A',
        textSecondary: '#475569',
        textMuted: '#94A3B8',
        border: '#E2E8F0',
        icon: '#475569',
        success: '#22C55E',
        warning: '#FACC15',
        error: '#EF4444',
        // Button specific
        buttonPrimaryBg: '#0EA5A4',
        buttonPrimaryText: '#FFFFFF',
    },
    dark: {
        primary: '#2DD4BF', // Mint Blue (Action for Dark mode)
        primaryAccent: '#0EA5A4', // Deep Cyan
        secondary: '#38BDF8', // Soft Blue
        background: '#020617', // True Dark
        surface: '#020617', // Match bg
        surfaceSecondary: '#020617',
        text: '#E5E7EB',
        textSecondary: '#94A3B8',
        textMuted: '#64748B',
        border: '#1E293B',
        icon: '#94A3B8',
        success: '#22C55E',
        warning: '#FACC15',
        error: '#EF4444',
        // Button specific
        buttonPrimaryBg: '#2DD4BF',
        buttonPrimaryText: '#042F2E',
    },
};

export const ChartColors = {
    income: '#22C55E',
    expenses: '#EF4444',
    savings: '#2DD4BF',
    taxes: '#FACC15',
    neutral: '#38BDF8',
};

export type Theme = typeof Colors.light;

export const getThemeColor = (scheme: 'light' | 'dark' | null | undefined, key: keyof typeof Colors.light) => {
    const currentScheme = scheme === 'dark' ? 'dark' : 'light';
    return Colors[currentScheme][key];
};
