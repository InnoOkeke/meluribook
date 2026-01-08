// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.module';
import { LedgerService } from '../ledger/ledger.service';
import { Transaction, Prisma } from '@prisma/client';

export interface CreateTransactionDto {
    businessId: string;
    amount: number;
    currency: string;
    type: 'INCOME' | 'EXPENSE';
    date: Date;
    category?: string;
    description?: string;
}

@Injectable()
export class TransactionsService {
    constructor(
        private prisma: PrismaService,
        private ledger: LedgerService,
    ) { }

    async create(dto: CreateTransactionDto): Promise<Transaction> {
        // 1. Save the "User" view of the transaction
        const transaction = await this.prisma.transaction.create({
            data: {
                businessId: dto.businessId,
                type: dto.type,
                amount: dto.amount,
                currency: dto.currency,
                date: new Date(dto.date),
                category: dto.category,
                description: dto.description || '',
            },
        });

        // 2. Automate the accounting (The "Hidden Ledger" Magic)
        // In a real app, this mapping logic is complex (e.g., depends on category)
        // MVP: Simple mapping

        const lines = [];

        if (dto.type === 'INCOME') {
            // Dr Asset (Cash), Cr Revenue
            lines.push({ accountCode: '1000', debit: dto.amount, credit: 0 });
            lines.push({ accountCode: '4000', debit: 0, credit: dto.amount });
        } else { // EXPENSE
            // Dr Expense, Cr Asset (Cash)
            lines.push({ accountCode: '5000', debit: dto.amount, credit: 0 });
            lines.push({ accountCode: '1000', debit: 0, credit: dto.amount });
        }

        await this.ledger.recordJournalEntry(
            dto.businessId,
            transaction.id,
            new Date(dto.date),
            dto.description || `Auto-generated for ${dto.type}`,
            lines
        );

        // 3. TODO: Trigger Tax Engine for estimation

        return transaction;
    }

    async findAll(businessId: string) {
        return this.prisma.transaction.findMany({
            where: { businessId },
            orderBy: { date: 'desc' }
        });
    }
}
