import { Controller, Get, Post, Patch, Body, UseGuards, Request, Param, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InvoicesService } from './invoices.service';

@Controller('invoices')
@UseGuards(AuthGuard('jwt'))
export class InvoicesController {
    constructor(private invoicesService: InvoicesService) { }

    @Post()
    async createInvoice(@Request() req: any, @Body() body: any) {
        // Assuming body.businessId is passed or derived from context
        // For MVP, user passes businessId in body
        return this.invoicesService.createInvoice(body.businessId, body);
    }

    @Get()
    async getInvoices(@Query('businessId') businessId: string) {
        return this.invoicesService.findAll(businessId);
    }

    @Get(':id')
    async getInvoice(@Param('id') id: string) {
        return this.invoicesService.findOne(id);
    }

    @Patch(':id/status')
    async updateStatus(@Param('id') id: string, @Body('status') status: string) {
        return this.invoicesService.updateStatus(id, status);
    }
}
