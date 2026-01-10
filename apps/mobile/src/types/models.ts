// Firebase Cloud Functions Types
export interface Business {
    id: string;
    name: string;
    country: string;
    currency: string;
    reportingPeriod: string;
    role?: 'OWNER' | 'EDITOR' | 'VIEWER' | 'ACCOUNTANT';
    logoUrl?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    phone?: string;
    email?: string;
    website?: string;
    taxId?: string;
    bankDetails?: {
        bankName: string;
        accountName: string;
        accountNumber: string;
        routingCode?: string; // Sort Code / Routing Number / SWIFT
    };
    createdAt: Date;
    updatedAt: Date;
}

export interface BusinessMember {
    id: string;
    userId: string;
    role: 'OWNER' | 'EDITOR' | 'VIEWER' | 'ACCOUNTANT';
    createdAt: Date;
}

export interface Transaction {
    id: string;
    businessId: string;
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
    amount: number;
    currency: string;
    date: Date;
    payee?: string;
    category?: string;
    description?: string;
    receiptUrl?: string;
    isTaxDeductible: boolean;
    accountId?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface InvoiceItem {
    id?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
}

export interface Invoice {
    id: string;
    businessId: string;
    number: string;
    status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
    issueDate: Date;
    dueDate: Date;
    customerName: string;
    customerEmail?: string;
    currency: string;
    totalAmount: number;
    taxAmount: number;
    items: InvoiceItem[];
    createdAt: Date;
    updatedAt: Date;
}

export interface JournalLine {
    id: string;
    description?: string;
    debit: number;
    credit: number;
    accountCode?: string;
}

export interface JournalEntry {
    id: string;
    date: Date;
    description: string;
    reference?: string;
    lines: JournalLine[];
    createdAt: Date;
}

export interface TaxCalculation {
    period: {
        start: string;
        end: string;
    };
    totalIncome: number;
    totalExpenses: number;
    taxDeductibleExpenses: number;
    taxableIncome: number;
    taxRate: number;
    taxOwed: number;
    currency: string;
}

export interface TaxSettings {
    countryCode: string;
    config: any;
}

// UI State Types
export interface DashboardStats {
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    pendingInvoices: number;
}

export interface TransactionFormData {
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
    amount: string;
    date: Date;
    payee: string;
    category: string;
    description: string;
    isTaxDeductible: boolean;
}

export interface InvoiceFormData {
    number: string;
    customerName: string;
    customerEmail: string;
    issueDate: Date;
    dueDate: Date;
    items: InvoiceItem[];
    taxAmount: string;
}
