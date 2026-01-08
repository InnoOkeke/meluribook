import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findOne(email: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    async findById(id: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { id },
        });
    }

    async updateUser(id: string, data: Prisma.UserUpdateInput): Promise<User> {
        return this.prisma.user.update({
            where: { id },
            data,
        });
    }

    async findByGoogleId(googleId: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { googleId },
        });
    }

    async createUser(data: Prisma.UserCreateInput): Promise<User> {
        return this.prisma.user.create({
            data,
        });
    }

    async createOrUpdateGoogleUser(profile: any): Promise<User> {
        const { email, firstName, lastName, googleId } = profile;
        const existingUser = await this.findOne(email);

        if (existingUser) {
            if (!existingUser.googleId) {
                return this.prisma.user.update({
                    where: { email },
                    data: { googleId },
                });
            }
            return existingUser;
        }

        // Create new
        return this.prisma.user.create({
            data: {
                email,
                googleId,
                fullName: `${firstName} ${lastName}`,
                // Password not required for OAuth users if schema supports it
            }
        });

    }
}
