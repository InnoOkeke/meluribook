// @ts-nocheck
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionsService } from '../modules/transactions/transactions.service';
import { TaxEngineService } from '../modules/tax-engine/tax-engine.service';
import { LedgerService } from '../modules/ledger/ledger.service';

describe('Verification Flow', () => {
    let app: TestingModule;
    let prisma: PrismaService;
    let transactions: TransactionsService;
    let taxEngine: TaxEngineService;
    let ledger: LedgerService;

    // Increase timeout for db ops
    jest.setTimeout(30000);

    beforeAll(async () => {
        app = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        prisma = app.get(PrismaService);
        transactions = app.get(TransactionsService);
        taxEngine = app.get(TaxEngineService);
        ledger = app.get(LedgerService);
    });

    afterAll(async () => {
        await app.close();
    });

    it('should run the full flow', async () => {
        console.log('🚀 Starting Verification Flow...');

        // 1. Setup User & Business
        console.log('1. Creating User & Business...');
        const user = await prisma.user.upsert({
            where: { email: 'demo-test@meluribook.com' },
            update: {},
            create: {
                email: 'demo-test@meluribook.com',
                fullName: 'Demo Test User',
                password: 'password123'
            }
        });

        const business = await prisma.business.create({
            data: {
                name: 'Test Freelance Biz',
                country: 'NG',
                currency: 'NGN',
                reportingPeriod: 'Monthly',
                members: {
                    create: { userId: user.id, role: 'OWNER' }
                }
            }
        });
        console.log(`   Business Created: ${business.name} (${business.country})`);

        // 2. Setup Chart of Accounts
        console.log('2. Setting up Chart of Accounts...');
        await ledger.setupChartOfAccounts(business.id);

        // 3. Record Transaction
        console.log('3. Recording Income Transaction check...');
        const tx = await transactions.create({
            businessId: business.id,
            amount: 500000,
            currency: 'NGN',
            type: 'INCOME',
            date: new Date(),
            category: 'Design Services',
            description: 'Website Project Payment'
        });
        console.log(`   Transaction ID: ${tx.id}`);

        // 4. Verify Ledger
        console.log('4. Verifying Ledger Entries...');
        const journal = await prisma.journalEntry.findFirst({
            where: { transactionId: tx.id },
            include: { lines: { include: { account: true } } }
        });

        journal?.lines.forEach(line => {
            console.log(`   [${line.account.code}] ${line.account.name}: Dr ${line.debit} | Cr ${line.credit}`);
        });

        // 5. Check Tax Engine
        console.log('5. Checking Tax Engine Calculation...');
        const taxes = await taxEngine.calculateTax(business.country, {
            amount: Number(tx.amount),
            currency: tx.currency,
            date: tx.date,
            category: tx.category,
            businessConfig: {}
        });

        console.log('   Tax Estimates:');
        taxes.forEach(t => console.log(`   - ${t.taxName}: ${t.amount} (${t.rate * 100}%)`));

        expect(tx).toBeDefined();
        expect(journal).toBeDefined();
        // NG tax should find VAT (7.5%)
        expect(taxes.some(t => t.taxName === 'VAT')).toBe(true);
    });
});
