// @ts-nocheck
import { TaxCalculatorStrategy, TaxContext, TaxResult } from '../tax-engine.interface';
import { Injectable } from '@nestjs/common';

@Injectable()
export class USTaxStrategy implements TaxCalculatorStrategy {
    countryCode = 'US';

    async calculateTax(context: TaxContext): Promise<TaxResult[]> {
        const results: TaxResult[] = [];

        // 1. Sales Tax
        // Highly complex in US (state/county level).
        // MVP: Flat estimate or use config provided by user (e.g. "I'm in NY")
        // Let's assume a safe average of 8.875% if in NY, or generic 6%
        const state = context.businessConfig?.state || 'DE';
        let rate = 0;

        if (state === 'NY') rate = 0.08875;
        else if (state === 'CA') rate = 0.0725;
        else rate = 0.06; // National avg placeholder

        // Simplified logic: Sales tax only on Income
        if (context.category !== 'Transfer') {
            const taxAmount = context.amount * rate;
            results.push({
                taxName: `Sales Tax (${state})`,
                amount: taxAmount,
                rate: rate,
                isDeductible: false
            });
        }

        // 2. Self Employment Tax Estimate (15.3%)
        // This is typically calculated on Net Income, not gross transaction.
        // But we can reserve for it.
        results.push({
            taxName: 'Set-Aside: Self-Employment Tax',
            amount: context.amount * 0.153,
            rate: 0.153,
            isDeductible: false
        });

        return results;
    }
}
