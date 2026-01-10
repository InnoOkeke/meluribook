import React, { createContext, useState, useContext, useEffect } from 'react';
import { businessAPI } from '../services/api';
import { Business } from '../types/models';
import { useAuth } from './AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

type BusinessContextType = {
    currentBusiness: Business | null;
    businesses: Business[];
    loading: boolean;
    setCurrentBusiness: (business: Business) => Promise<void>;
    loadBusinesses: () => Promise<void>;
    createBusiness: (data: Partial<Business>) => Promise<void>;
    updateBusiness: (id: string, data: Partial<Business>) => Promise<void>;
};

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const BusinessProvider = ({ children }: { children: React.ReactNode }) => {
    const [currentBusiness, setCurrentBusinessState] = useState<Business | null>(null);
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            loadBusinesses();
        } else {
            setLoading(false);
        }
    }, [user]);

    const loadBusinesses = async () => {
        try {
            setLoading(true);
            const response = await businessAPI.getAll();
            setBusinesses(response.businesses || []);

            // Load saved current business or default to first
            const savedBusinessId = await AsyncStorage.getItem('currentBusinessId');
            if (savedBusinessId) {
                const saved = response.businesses.find((b: Business) => b.id === savedBusinessId);
                if (saved) {
                    setCurrentBusinessState(saved);
                    return;
                }
            }

            if (response.businesses && response.businesses.length > 0) {
                setCurrentBusinessState(response.businesses[0]);
            }
        } catch (error) {
            console.error('Error loading businesses:', error);
        } finally {
            setLoading(false);
        }
    };

    const setCurrentBusiness = async (business: Business) => {
        setCurrentBusinessState(business);
        await AsyncStorage.setItem('currentBusinessId', business.id);
    };

    const createBusiness = async (data: Partial<Business>) => {
        try {
            const response = await businessAPI.create(data);
            await loadBusinesses();
            return response;
        } catch (error) {
            console.error('Error creating business:', error);
            throw error;
        }
    };

    return (
        <BusinessContext.Provider
            value={{
                currentBusiness,
                businesses,
                loading,
                setCurrentBusiness,
                loadBusinesses,
                createBusiness,
                updateBusiness: async (id: string, data: Partial<Business>) => {
                    // Optimistic update - update local state immediately
                    const updatedBusiness = { ...currentBusiness, ...data } as Business;
                    setCurrentBusinessState(updatedBusiness);
                    setBusinesses(prev => prev.map(b => b.id === id ? updatedBusiness : b));

                    try {
                        // Background network call
                        await businessAPI.update({ businessId: id, updates: data });
                    } catch (error) {
                        // Rollback on error - reload from server
                        console.error('Error updating business:', error);
                        await loadBusinesses();
                        throw error;
                    }
                },
            }}
        >
            {children}
        </BusinessContext.Provider>
    );
};

export const useBusiness = () => {
    const context = useContext(BusinessContext);
    if (!context) {
        throw new Error('useBusiness must be used within a BusinessProvider');
    }
    return context;
};
