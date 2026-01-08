import { Injectable, OnModuleInit } from '@nestjs/common';
import { TaxCalculatorStrategy, TaxContext } from './tax-engine.interface';
import { NigeriaTaxStrategy } from './strategies/nigeria.strategy';
import { USTaxStrategy } from './strategies/us.strategy';

@Injectable()
export class TaxEngineService implements OnModuleInit {
    private strategies: Map<string, TaxCalculatorStrategy> = new Map();

    constructor(
        private ngStrategy: NigeriaTaxStrategy,
        private usStrategy: USTaxStrategy
    ) { }

    onModuleInit() {
        this.registerStrategy(this.ngStrategy);
        this.registerStrategy(this.usStrategy);
    }

    registerStrategy(strategy: TaxCalculatorStrategy) {
        this.strategies.set(strategy.countryCode, strategy);
    }

    async calculateTax(countryCode: string, context: TaxContext) {
        const strategy = this.strategies.get(countryCode);
        if (!strategy) {
            console.warn(`No tax strategy found for ${countryCode}`);
            return [];
        }
        return strategy.calculateTax(context);
    }
}
