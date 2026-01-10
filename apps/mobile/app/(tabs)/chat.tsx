import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { aiService } from '../../src/services/ai.service';
import { Colors } from '../../src/constants/Colors';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}

export default function ChatScreen() {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: 'Hello! I\'m Ima, your AI financial assistant. Ask me anything about your business finances, taxes, or bookkeeping. 💼',
            sender: 'ai',
            timestamp: new Date(),
        }
    ]);
    const [loading, setLoading] = useState(false);
    const flatListRef = useRef<FlatList>(null);
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: input,
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const context = {
                businessName: "Meluri Inc.",
                totalIncome: 15400,
                totalExpenses: 8200,
                pendingInvoices: 3,
                taxRegion: "Nigeria"
            };

            const aiResponseText = await aiService.chatWithAccountant(userMessage.text, context);

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: aiResponseText,
                sender: 'ai',
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: "I'm having trouble connecting. Please check your connection and try again.",
                sender: 'ai',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
    }, [messages]);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isUser = item.sender === 'user';
        return (
            <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
                {!isUser && (
                    <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                        <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                    </View>
                )}
                <View style={[
                    styles.messageBubble,
                    isUser
                        ? [styles.userBubble, { backgroundColor: theme.primary }]
                        : [styles.aiBubble, { backgroundColor: theme.surface, borderColor: theme.border }]
                ]}>
                    <Text style={[
                        styles.messageText,
                        { color: isUser ? '#FFFFFF' : theme.text }
                    ]}>
                        {item.text}
                    </Text>
                    <Text style={[
                        styles.timestamp,
                        { color: isUser ? 'rgba(255,255,255,0.7)' : theme.textMuted }
                    ]}>
                        {formatTime(item.timestamp)}
                    </Text>
                </View>
            </View>
        );
    };

    const quickPrompts = [
        "What's my profit margin?",
        "Show tax deductions",
        "Explain my expenses",
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <View style={styles.headerLeft}>
                    <View style={[styles.headerAvatar, { backgroundColor: theme.primary }]}>
                        <Ionicons name="sparkles" size={20} color="#FFFFFF" />
                    </View>
                    <View>
                        <Text style={[styles.headerTitle, { color: theme.text }]}>Ima</Text>
                        <Text style={[styles.headerSubtitle, { color: theme.success }]}>● Online</Text>
                    </View>
                </View>
                <TouchableOpacity style={[styles.headerButton, { backgroundColor: theme.surfaceSecondary }]}>
                    <Ionicons name="ellipsis-horizontal" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
                style={{ flex: 1 }}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={item => item.id}
                    renderItem={renderMessage}
                    contentContainerStyle={styles.listContent}
                    ListHeaderComponent={() => (
                        <View style={styles.welcomeContainer}>
                            <View style={[styles.welcomeIcon, { backgroundColor: theme.primary + '15' }]}>
                                <Text style={styles.welcomeEmoji}>🤖</Text>
                            </View>
                            <Text style={[styles.welcomeTitle, { color: theme.text }]}>AI Financial Assistant</Text>
                            <Text style={[styles.welcomeText, { color: theme.textSecondary }]}>
                                Ask me anything about your finances, taxes, or get insights about your business.
                            </Text>
                        </View>
                    )}
                />

                {loading && (
                    <View style={styles.loadingContainer}>
                        <View style={[styles.loadingBubble, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <ActivityIndicator size="small" color={theme.primary} />
                            <Text style={[styles.loadingText, { color: theme.textMuted }]}>Ima is thinking...</Text>
                        </View>
                    </View>
                )}

                {/* Quick Prompts */}
                {messages.length <= 1 && (
                    <View style={styles.quickPromptsContainer}>
                        {quickPrompts.map((prompt, idx) => (
                            <TouchableOpacity
                                key={idx}
                                style={[styles.quickPrompt, { backgroundColor: theme.surface, borderColor: theme.border }]}
                                onPress={() => setInput(prompt)}
                            >
                                <Text style={[styles.quickPromptText, { color: theme.primary }]}>{prompt}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Input */}
                <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
                    <View style={[styles.inputWrapper, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
                        <TextInput
                            style={[styles.input, { color: theme.text }]}
                            placeholder="Ask about your finances..."
                            placeholderTextColor={theme.textMuted}
                            value={input}
                            onChangeText={setInput}
                            multiline
                            maxLength={500}
                        />
                    </View>
                    <TouchableOpacity
                        onPress={sendMessage}
                        disabled={loading || !input.trim()}
                        style={[
                            styles.sendButton,
                            { backgroundColor: input.trim() ? theme.primary : theme.surfaceSecondary }
                        ]}
                    >
                        <Ionicons
                            name="send"
                            size={18}
                            color={input.trim() ? '#FFFFFF' : theme.textMuted}
                        />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerAvatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '700',
    },
    headerSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    listContent: {
        padding: 20,
        paddingBottom: 20,
    },
    welcomeContainer: {
        alignItems: 'center',
        paddingVertical: 32,
        marginBottom: 16,
    },
    welcomeIcon: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    welcomeEmoji: {
        fontSize: 36,
    },
    welcomeTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
    },
    welcomeText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 24,
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: 16,
        alignItems: 'flex-end',
    },
    messageRowUser: {
        justifyContent: 'flex-end',
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    messageBubble: {
        padding: 14,
        borderRadius: 18,
        maxWidth: '78%',
    },
    userBubble: {
        borderBottomRightRadius: 6,
    },
    aiBubble: {
        borderBottomLeftRadius: 6,
        borderWidth: 1,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 21,
    },
    timestamp: {
        fontSize: 11,
        marginTop: 6,
    },
    loadingContainer: {
        paddingHorizontal: 20,
        paddingBottom: 8,
    },
    loadingBubble: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        gap: 10,
    },
    loadingText: {
        fontSize: 13,
    },
    quickPromptsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        paddingHorizontal: 20,
        paddingBottom: 16,
    },
    quickPrompt: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
    },
    quickPromptText: {
        fontSize: 13,
        fontWeight: '500',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 16,
        borderTopWidth: 1,
        gap: 12,
    },
    inputWrapper: {
        flex: 1,
        borderRadius: 24,
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingVertical: 10,
        maxHeight: 120,
    },
    input: {
        fontSize: 15,
        maxHeight: 100,
    },
    sendButton: {
        width: 46,
        height: 46,
        borderRadius: 23,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
});
