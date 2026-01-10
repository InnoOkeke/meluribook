import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Export Firestore and Auth instances for use in other modules
export const db = admin.firestore();
export const auth = admin.auth();

// Auth Triggers
export { onUserCreated, onUserDeleted } from './auth/authTriggers';

// Business Management Functions
export {
    createBusiness,
    updateBusiness,
    addBusinessMember,
    removeBusinessMember,
    getBusinesses
} from './business/businessFunctions';

// Transaction Functions
export {
    createTransaction,
    updateTransaction,
    deleteTransaction,
    getTransactions
} from './transactions/transactionFunctions';

// Invoice Functions
export {
    createInvoice,
    updateInvoice,
    sendInvoice,
    markInvoicePaid,
    getInvoices
} from './invoices/invoiceFunctions';

// Ledger Functions
export {
    generateJournalEntries,
    getJournalEntries
} from './ledger/ledgerFunctions';

// Tax Functions
export {
    calculateTaxes,
    updateTaxSettings
} from './tax/taxFunctions';
