import { TaxCalculatorStrategy, TaxContext, TaxResult } from '../tax-engine.interface';
import { Injectable } from '@nestjs/common';

@Injectable()
export class NigeriaTaxStrategy implements TaxCalculatorStrategy {
    countryCode = 'NG';

    async calculateTax(context: TaxContext): Promise<TaxResult[]> {
        const results: TaxResult[] = [];

        // 1. VAT (Value Added Tax)
        // Current Rate: 7.5%
        // Logic: Applied on Income. Refundable on Expenses (Input VAT) if registered.
        const VAT_RATE = 0.075;

        // MVP Logic: If no category or generic, assume standard rate applies
        // In production, check exempt categories (medical, books, etc)
        const vatAmount = context.amount * VAT_RATE;

        results.push({
            taxName: 'VAT',
            amount: vatAmount,
            rate: VAT_RATE,
            isDeductible: true, // simplified
        });

        // 2. Company Income Tax (CIT) Estimate
        // 30% for Large, 20% for Medium, 0% for Small (<25m turnover)
        // We'd need total turnover to know for sure. estimating flat 20% of PROFIT for now (but context is gross)
        // This is just a *Transaction Level* estimate.

        return results;
    }
}
