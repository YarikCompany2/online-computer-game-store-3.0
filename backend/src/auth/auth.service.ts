import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt'
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
import { RefreshDto } from './dto/refresh.dto';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) {}

    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;

        const user = await this.usersService.findByEmail(email);
        const errorMessage = 'Uncorrect email or password';

        if (!user) {
            throw new UnauthorizedException(errorMessage);
        }

        const isMatch = user ? await bcrypt.compare(password, user.passwordHash) : false;
        if (!isMatch) {
            throw new UnauthorizedException(errorMessage);
        }

        const tokens = await this.getTokens(user.id, user.email, user.role, user.companyId);
        await this.updateRefreshToken(user.id, tokens.refreshToken);

        return tokens;
    }

    async refreshTokens(refreshDto: RefreshDto) {
        const { userId, refreshToken } = refreshDto;

        const user = await this.usersService.findOneInternal(userId);
        if (!user || !user.refreshTokenHash) {
            throw new UnauthorizedException('User not found or no token');
        }

        const refreshTokenMatches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
        if (!refreshTokenMatches) {
            throw new UnauthorizedException('Invalid Refresh Token');
        }

        const tokens = await this.getTokens(user.id, user.email, user.role, user.companyId);
        await this.updateRefreshToken(user.id, tokens.refreshToken);

        return tokens;
    }

    private async getTokens(userId: string, email: string, role: string, companyId: string | null) {
        const payload = { sub: userId, email, role, companyId };

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.configService.get<string>('JWT_SECRET')!,
                expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') as any,
            }),

            this.jwtService.signAsync(payload, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET')!,
                expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') as any,
            }),
        ]);

        return {
            accessToken,
            refreshToken,
        };
    }

    private async updateRefreshToken(userId: string, refreshToken: string) {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(refreshToken, salt);
        await this.usersService.update(userId, { refreshTokenHash: hash });
    }
}
