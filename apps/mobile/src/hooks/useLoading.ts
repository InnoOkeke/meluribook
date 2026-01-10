import { useState, useCallback } from 'react';

export function useLoading() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const execute = useCallback(async <T,>(
        asyncFunction: () => Promise<T>,
        onSuccess?: (data: T) => void,
        onError?: (error: any) => void
    ): Promise<T | null> => {
        try {
            setLoading(true);
            setError(null);
            const result = await asyncFunction();
            onSuccess?.(result);
            return result;
        } catch (err: any) {
            const errorMessage = err.message || 'An error occurred';
            setError(errorMessage);
            onError?.(err);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    return { loading, error, execute, setError };
}
