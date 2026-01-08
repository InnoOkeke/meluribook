// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.module';
import { JournalEntry, JournalLine, Prisma } from '@prisma/client';

export enum AccountType {
    ASSET = 'ASSET',
    LIABILITY = 'LIABILITY',
    EQUITY = 'EQUITY',
    REVENUE = 'REVENUE',
    EXPENSE = 'EXPENSE',
}

// Standard accounts every business gets
export const DEFAULT_ACCOUNTS = [
    { code: '1000', name: 'Cash on Hand', type: AccountType.ASSET },
    { code: '1200', name: 'Accounts Receivable', type: AccountType.ASSET },
    { code: '2000', name: 'Accounts Payable', type: AccountType.LIABILITY },
    { code: '2100', name: 'Sales Tax Payable', type: AccountType.LIABILITY }, // For Tax Engine
    { code: '3000', name: 'Owner Equity', type: AccountType.EQUITY },
    { code: '4000', name: 'Sales Revenue', type: AccountType.REVENUE },
    { code: '5000', name: 'General Expenses', type: AccountType.EXPENSE },
];

@Injectable()
export class LedgerService {
    constructor(private prisma: PrismaService) { }

    /**
     * Initializes default chart of accounts for a new business
     */
    async setupChartOfAccounts(businessId: string) {
        const operations = DEFAULT_ACCOUNTS.map((acc) =>
            this.prisma.account.create({
                data: {
                    businessId,
                    ...acc,
                },
            }),
        );
        await this.prisma.$transaction(operations);
    }

    /**
     * Records a Double-Entry Journal
     * Enforces that Debits == Credits checks
     */
    async recordJournalEntry(
        businessId: string,
        transactionId: string,
        date: Date,
        description: string,
        lines: { accountCode: string; debit: number; credit: number }[],
    ) {
        // 1. Validate Balance
        const totalDebit = lines.reduce((sum, l) => sum + l.debit, 0);
        const totalCredit = lines.reduce((sum, l) => sum + l.credit, 0);

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            throw new Error(`Unbalanced Journal: Debit ${totalDebit} != Credit ${totalCredit}`);
        }

        // 2. Find Account IDs by Code
        // Optimization: Cache this or fetch in bulk
        const accounts = await this.prisma.account.findMany({
            where: { businessId, code: { in: lines.map((l) => l.accountCode) } },
        });

        const accountMap = new Map(accounts.map(a => [a.code, a.id]));

        // 3. Create Entry
        return this.prisma.journalEntry.create({
            data: {
                businessId,
                date,
                description,
                transactionId,
                lines: {
                    create: lines.map((line) => {
                        const accountId = accountMap.get(line.accountCode);
                        if (!accountId) throw new Error(`Account code ${line.accountCode} not found`);

                        return {
                            accountId,
                            debit: line.debit,
                            credit: line.credit,
                            description: description
                        }
                    }),
                },
            },
            include: { lines: true },
        });
    }

    async getBalance(businessId: string, accountCode: string): Promise<number> {
        // Find account
        const account = await this.prisma.account.findFirst({
            where: { businessId, code: accountCode }
        });

        if (!account) return 0;

        // Sum lines
        const aggregate = await this.prisma.journalLine.aggregate({
            where: { accountId: account.id },
            _sum: { debit: true, credit: true }
        });

        const dr = aggregate._sum.debit?.toNumber() || 0;
        const cr = aggregate._sum.credit?.toNumber() || 0;

        // Basic normal balance logic
        if ([AccountType.ASSET, AccountType.EXPENSE].includes(account.type as AccountType)) {
            return dr - cr;
        } else {
            return cr - dr;
        }
    }
}
