import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
    constructor(private usersService: UsersService) { }

    @Get('me')
    async getProfile(@Request() req: any) {
        // req.user is populated by JwtStrategy
        return this.usersService.findById(req.user.userId);
    }

    @Patch('me')
    async updateProfile(@Request() req: any, @Body() body: any) {
        return this.usersService.updateUser(req.user.userId, body);
    }
}
