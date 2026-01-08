// @ts-nocheck
import { Controller, Post, Body, Get, UseGuards, Req, Query } from '@nestjs/common';
import { TransactionsService, CreateTransactionDto } from './transactions.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('transactions')
@UseGuards(AuthGuard('jwt'))
export class TransactionsController {
    constructor(private readonly transactionsService: TransactionsService) { }

    @Post()
    create(@Body() dto: CreateTransactionDto, @Req() req: any) {
        // In real app, get businessId from Query or User context
        // MVP hardcode or expect in body
        return this.transactionsService.create(dto);
    }

    @Get()
    findAll(@Req() req: any, @Query('businessId') businessId: string) {
        return this.transactionsService.findAll(businessId);
    }
}
