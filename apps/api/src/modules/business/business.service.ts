import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Business, BusinessMember, Prisma } from '@prisma/client';

@Injectable()
export class BusinessService {
    constructor(private prisma: PrismaService) { }

    async createBusiness(userId: string, data: Prisma.BusinessCreateInput): Promise<Business> {
        // Create business and link user as owner
        const business = await this.prisma.business.create({
            data: {
                ...data,
                members: {
                    create: {
                        userId: userId,
                        role: 'OWNER',
                    }
                }
            }
        });
        return business;
    }

    async findUserBusinesses(userId: string): Promise<Business[]> {
        const members = await this.prisma.businessMember.findMany({
            where: { userId },
            include: { business: true },
        });
        return members.map((m) => m.business);
    }

    async findOne(id: string): Promise<Business | null> {
        return this.prisma.business.findUnique({ where: { id } });
    }

    async updateBusiness(id: string, data: Prisma.BusinessUpdateInput): Promise<Business> {
        return this.prisma.business.update({
            where: { id },
            data,
        });
    }
}
