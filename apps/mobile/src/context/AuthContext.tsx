import React, { createContext, useState, useContext, useEffect } from 'react';
import { firebaseAuth } from '../config/firebase';
import { router } from 'expo-router';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';

// Google Sign-In configuration moved to AuthProvider


// Define Auth Context Type
type AuthContextType = {
    user: FirebaseAuthTypes.User | null;
    loading: boolean;
    login: (email: string, pass: string) => Promise<void>;
    register: (email: string, pass: string, fullName: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
    const [loading, setLoading] = useState(true);

    // Listen to auth state changes
    useEffect(() => {
        console.log("AuthProvider: Starting initialization");

        // Failsafe: Force loading to false after 2 seconds if Firebase doesn't respond
        const timeoutId = setTimeout(() => {
            console.warn("AuthProvider: Firebase init timed out, forcing app load");
            setLoading(false);
        }, 2000);

        // Configure Google Sign-In with defensive try-catch
        const initGoogleSignIn = async () => {
            try {
                console.log("Attempting Google Sign-In configuration...");
                await GoogleSignin.configure({
                    // webClientId can be added later
                });
                console.log("Google Sign-In configured successfully");
            } catch (e) {
                console.warn("Google Sign-In configuration failed (non-critical):", e);
                // Don't throw - this is optional functionality
            }
        };

        // Initialize Firebase auth listener
        const initFirebaseAuth = () => {
            try {
                console.log("Setting up Firebase auth listener...");
                const unsubscribe = firebaseAuth.onAuthStateChanged((authUser) => {
                    console.log("Auth state changed:", authUser ? "User logged in" : "No user");
                    clearTimeout(timeoutId); // Clear failsafe if we get a response
                    setUser(authUser);
                    setLoading(false);
                });
                console.log("Firebase auth listener ready");
                return unsubscribe;
            } catch (error) {
                console.error("Firebase Auth initialization FAILED:", error);
                setLoading(false);
                // Return empty cleanup function
                return () => { };
            }
        };

        // Initialize both services
        initGoogleSignIn(); // Don't await - let it run in background
        const unsubscribe = initFirebaseAuth();

        return () => {
            console.log("AuthProvider: Cleaning up");
            clearTimeout(timeoutId);
            unsubscribe();
        };
    }, []);

    const login = async (email: string, pass: string) => {
        setLoading(true);
        try {
            await firebaseAuth.signInWithEmailAndPassword(email, pass);
            router.replace('/(tabs)/home');
        } catch (error: any) {
            console.error('Login failed', error.message);
            throw error; // Let UI handle invalid credentials alert
        } finally {
            setLoading(false);
        }
    };

    const register = async (email: string, pass: string, fullName: string) => {
        setLoading(true);
        try {
            const userCredential = await firebaseAuth.createUserWithEmailAndPassword(email, pass);

            // Update user profile with display name
            await userCredential.user.updateProfile({
                displayName: fullName,
            });

            router.replace('/(tabs)/home');
        } catch (error: any) {
            console.error('Register failed', error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const loginWithGoogle = async () => {
        setLoading(true);
        try {
            // Check if device supports Google Play
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

            // Get the users ID token
            const { data } = await GoogleSignin.signIn();
            const idToken = data?.idToken;

            if (!idToken) throw new Error('No ID token found');

            // Create a Google credential with the token
            const googleCredential = auth.GoogleAuthProvider.credential(idToken);

            // Sign-in the user with the credential
            const userCredential = await firebaseAuth.signInWithCredential(googleCredential);

            // If new user, could update profile here or just let normal flow handle it
            router.replace('/(tabs)/home');

        } catch (error: any) {
            console.error('Google login failed', error);
            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                // user cancelled the login flow
                console.warn("User cancelled Google Login");
            } else if (error.code === statusCodes.IN_PROGRESS) {
                // operation (e.g. sign in) is in progress already
            } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                // play services not available or outdated
                throw new Error("Google Play Services not available");
            } else {
                // some other error happened
                throw error;
            }
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        await firebaseAuth.signOut();
        setUser(null);
        router.replace('/(auth)/login');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
