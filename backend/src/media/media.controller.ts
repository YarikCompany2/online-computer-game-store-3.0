import { Controller, Get, Post, Body, Patch, Param, Request, UseGuards, ForbiddenException, Delete, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { MediaService } from './media.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express/multer/interceptors/file.interceptor';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';
import { slugify } from '../utils/slugify';

@UseGuards(JwtAuthGuard)
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, callback) => {
        const folderName = slugify(req.body.gameTitle || req.body.gameId || 'temp');
        const uploadPath = join(process.cwd(), 'uploads', 'covers', folderName);
        if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
        callback(null, uploadPath);
      },
      filename: (req, file, callback) => {
        const extension = extname(file.originalname);
        const nameOnly = file.originalname.replace(extension, '');
        const cleanName = slugify(nameOnly);
        const uniqueId = Math.random().toString(36).substring(2, 8);
        
        callback(null, `${cleanName}-${uniqueId}${extension}`);
      },
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, callback) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png|webp)$/)) {
        return callback(new BadRequestException('Only JPG, PNG, and WEBP are allowed!'), false);
      }
      callback(null, true);
    }
  }))
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Body() body, @Request() req) {
    const gameId = body.gameId;
    
    const folderName = slugify(body.gameTitle || gameId);
    const fileUrl = `http://localhost:3000/uploads/covers/${folderName}/${file.filename}`;
    
    return this.mediaService.saveToDb(gameId, fileUrl, body.isMain === 'true', req.user.companyId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.mediaService.remove(id, req.user.companyId);
  }
}
