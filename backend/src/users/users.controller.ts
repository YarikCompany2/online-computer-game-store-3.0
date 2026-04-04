import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TopUpDto } from './dto/top-up.dto';

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
  @Delete('me')
  async removeMe(@Request() req) {
    return this.usersService.remove(req.user.userId);
  }
}
