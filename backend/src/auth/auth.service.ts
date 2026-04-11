import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt'
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
import { RefreshDto } from './dto/refresh.dto';
import { v4 as uuidv4 } from 'uuid';
import { timestamp } from 'rxjs/internal/operators/timestamp';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) {}

    async login(loginDto: LoginDto) {
        const { identifier, password } = loginDto;
        const user = await this.usersService.findInternalByIdentifier(identifier);

        if (!user) throw new UnauthorizedException('Invalid credentials');

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) throw new UnauthorizedException('Incorrect login or password');

        const tokens = await this.getTokens(
            user.id, 
            user.email, 
            user.role, 
            user.companyId, 
            user.username, 
            user.balance, 
            user.avatarUrl
        );

        await this.updateRefreshToken(user.id, tokens.refreshToken);
        return tokens;
    }

    async refreshTokens(refreshDto: RefreshDto) {
        const { userId, refreshToken: incomingToken } = refreshDto;
        const user = await this.usersService.findOneInternal(userId);

        if (!user || !user.refreshTokenHash) {
            throw new UnauthorizedException('Access denied');
        }

        const incomingTokenHash = crypto.createHash('sha256').update(incomingToken).digest('hex');
        const refreshTokenMatches = await bcrypt.compare(incomingTokenHash, user.refreshTokenHash);


        if (!refreshTokenMatches) {
            throw new UnauthorizedException('Access denied');
        }

        const tokens = await this.getTokens(user.id, user.email, user.role, user.companyId, user.username, user.balance, user.avatarUrl);

        await this.updateRefreshToken(user.id, tokens.refreshToken);

        return tokens;
    }

    private async getTokens(userId: string, email: string, role: string, companyId: string | null, username: string, balance: number, avatarUrl: string | null) {
        const accessTokenPayload = {
            sub: userId,
            email,
            role,
            companyId,
            username,
            balance,
            avatarUrl,
            tokenType: 'access',
        };

        const refreshTokenPayload = {
            sub: userId,
            tokenType: 'refresh',
            jti: uuidv4(),
            iat_micro: Date.now() + Math.random()
        }

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(accessTokenPayload, {
                secret: this.configService.get<string>('JWT_SECRET')!,
                expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') as any,
            }),

            this.jwtService.signAsync(refreshTokenPayload, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET')!,
                expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') as any,
            }),
        ]);

        return { accessToken, refreshToken };
    }

    private async updateRefreshToken(userId: string, tokenToHash: string) {
        const tokenHash = crypto.createHash('sha256').update(tokenToHash).digest('hex')

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(tokenHash, salt);

        await this.usersService.update(userId, { refreshTokenHash: hash });
    }
}
