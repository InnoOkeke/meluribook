import { Module } from '@nestjs/common';
import { TaxEngineService } from './tax-engine.service';
import { NigeriaTaxStrategy } from './strategies/nigeria.strategy';
import { USTaxStrategy } from './strategies/us.strategy';

@Module({
    providers: [TaxEngineService, NigeriaTaxStrategy, USTaxStrategy],
    exports: [TaxEngineService],
})
export class TaxEngineModule { }
