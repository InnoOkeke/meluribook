// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.usersService.findOne(email);
        if (user && user.password === pass) { // MVP: Plaintext for now, switch to bcrypt later
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async googleLogin(req: any) {
        if (!req.user) {
            return 'No user from google';
        }
        const user = await this.usersService.createOrUpdateGoogleUser(req.user);

        return {
            message: 'User information from google',
            user,
            accessToken: this.jwtService.sign({ email: user.email, sub: user.id })
        };
    }

    async login(user: any) {
        const payload = { email: user.email, sub: user.id };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName
            }
        };
    }

    async register(userDto: any) {
        // userDto should have email, password, fullName
        const user = await this.usersService.createUser(userDto);
        return this.login(user);
    }
}
