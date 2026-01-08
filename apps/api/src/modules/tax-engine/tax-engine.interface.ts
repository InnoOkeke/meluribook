export interface TaxContext {
    amount: number;
    currency: string;
    date: Date;
    category?: string;
    businessConfig: any; // JSON Config for the business
}

export interface TaxResult {
    taxName: string;
    amount: number;
    rate: number;
    isDeductible: boolean;
    metadata?: any;
}

export interface TaxCalculatorStrategy {
    countryCode: string;
    calculateTax(context: TaxContext): Promise<TaxResult[]>;
}
