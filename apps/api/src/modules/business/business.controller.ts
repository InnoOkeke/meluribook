import { Controller, Get, Post, Patch, Body, UseGuards, Request, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BusinessService } from './business.service';

@Controller('business')
@UseGuards(AuthGuard('jwt'))
export class BusinessController {
    constructor(private businessService: BusinessService) { }

    @Post()
    async createBusiness(@Request() req: any, @Body() body: any) {
        // body should have name, country, currency, etc.
        return this.businessService.createBusiness(req.user.userId, body);
    }

    @Get()
    async getMyBusinesses(@Request() req: any) {
        return this.businessService.findUserBusinesses(req.user.userId);
    }

    @Get(':id')
    async getBusiness(@Param('id') id: string) {
        return this.businessService.findOne(id);
    }

    @Patch(':id')
    async updateBusiness(@Param('id') id: string, @Body() body: any) {
        return this.businessService.updateBusiness(id, body);
    }
}
