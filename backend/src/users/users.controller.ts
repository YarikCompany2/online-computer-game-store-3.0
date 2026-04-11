import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TopUpDto } from './dto/top-up.dto';
import { extname, join } from 'path';
import { diskStorage } from 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import * as fs from 'fs';
import { slugify } from '../utils/slugify';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  register(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('top-up')
  async topUp(@Request() req, @Body() topUpDto: TopUpDto) {
    return this.usersService.topUpBalance(req.user.userId, topUpDto.amount);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('avatar')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, callback) => {
        const user = (req as any).user;
        const folderName = slugify(user.username || 'unknown');
        
        const uploadPath = join(process.cwd(), 'uploads', 'avatars', folderName);

        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        callback(null, uploadPath);
      },
      filename: (req, file, callback) => {
        const userId = (req as any).user.userId;
        callback(null, `${userId}${extname(file.originalname)}`);
      },
    }),
    limits: { fileSize: 2 * 1024 * 1024 }
  }))
  async uploadAvatar(@UploadedFile() file: Express.Multer.File, @Request() req) {
    if (!file) throw new BadRequestException('No image provided');

    const folderName = slugify(req.user.username);
    const fileUrl = `http://localhost:3000/uploads/avatars/${folderName}/${file.filename}`;
    
    console.log(`[User] Avatar updated for ${req.user.username}: ${fileUrl}`);
    
    return this.usersService.update(req.user.userId, { avatarUrl: fileUrl });
  }

  @UseGuards(JwtAuthGuard)
  @Patch('leave-company')
  async leaveCompany(@Request() req) {
    return this.usersService.leaveCompany(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me')
  async removeMe(@Request() req) {
    return this.usersService.remove(req.user.userId);
  }
}
