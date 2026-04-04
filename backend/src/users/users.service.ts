import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt'
import { UpdateResult } from 'typeorm';
import { DataSource } from 'typeorm';
import { Transaction, TransactionType } from './entities/transaction.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existingUser) {
      throw new BadRequestException('User with the same email already exists');
    }

    const existingUsername = await this.userRepository.findOne({
      where: { username: createUserDto.username },
    });
    if (existingUsername) {
      throw new BadRequestException('Username is already taken');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

    const newUser = this.userRepository.create({
      ...createUserDto,
      passwordHash: hashedPassword,
    });

    const savedUser = await this.userRepository.save(newUser);

    const { passwordHash, ...result } = savedUser;

    return result as User;
  }

  async findByIdentifier(identifier: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: [
        { email: identifier },
        { username: identifier }
      ],
    });
  }

  async findInternalByIdentifier(identifier: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: [
        { email: identifier },
        { username: identifier }
      ],
      select: ['id', 'email', 'role', 'companyId', 'username', 'passwordHash', 'refreshTokenHash', 'balance'],
    });
  }

  async update(id: string, updateData: Partial<User>) {
    await this.userRepository.update(id, updateData);
    return this.findOne(id);
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async topUpBalance(userId: string, amount: number): Promise<User> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        const user = await queryRunner.manager.findOne(User, { where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        await new Promise(resolve => setTimeout(resolve, 500));

        const transactionLog = queryRunner.manager.create(Transaction, {
            userId,
            amount,
            type: TransactionType.TOPUP,
            description: 'Wallet top-up via Mock Payment Gateway'
        });
        await queryRunner.manager.save(transactionLog);

        const newBalance = Number(user.balance) + Number(amount);
        await queryRunner.manager.update(User, userId, { balance: newBalance });

        await queryRunner.commitTransaction();

        return this.findOne(userId);
    } catch (err) {
        await queryRunner.rollbackTransaction();
        throw err;
    } finally {
        await queryRunner.release();
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: {email } });
  }

  async findOneInternal(id: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { id },
      select: ['id', 'email', 'role', 'companyId', 'username', 'refreshTokenHash', 'balance'],
    });
  }

  async remove(id: string): Promise<UpdateResult> {
    const user = await this.findOne(id);

    if (user.companyId) {
      throw new BadRequestException(`Can't delete account while owning a company`);
    }

    return await this.userRepository.softDelete(id);
  }
}
