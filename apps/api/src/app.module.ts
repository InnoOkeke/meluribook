import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { BusinessModule } from './modules/business/business.module';
import { LedgerModule } from './modules/ledger/ledger.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { TaxEngineModule } from './modules/tax-engine/tax-engine.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { AiAssistantModule } from './modules/ai-assistant/ai-assistant.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule, UsersModule, BusinessModule, LedgerModule, TransactionsModule, TaxEngineModule, InvoicesModule, AiAssistantModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
