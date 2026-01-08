import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Invoice, InvoiceItem, Prisma } from '@prisma/client';

@Injectable()
export class InvoicesService {
    constructor(private prisma: PrismaService) { }

    async createInvoice(businessId: string, data: Prisma.InvoiceCreateInput): Promise<Invoice> {
        // Enforce businessId association
        return this.prisma.invoice.create({
            data: {
                ...data,
                business: { connect: { id: businessId } },
                items: {
                    create: (data.items as any)?.create || [], // Handle nested writes if passed
                }
            },
            include: { items: true },
        });
    }

    async findAll(businessId: string): Promise<Invoice[]> {
        return this.prisma.invoice.findMany({
            where: { businessId },
            include: { items: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findOne(id: string): Promise<Invoice | null> {
        return this.prisma.invoice.findUnique({
            where: { id },
            include: { items: true },
        });
    }

    async updateStatus(id: string, status: string): Promise<Invoice> {
        return this.prisma.invoice.update({
            where: { id },
            data: { status },
        });
    }
}
