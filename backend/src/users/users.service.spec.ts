import { Test, TestingModule } from "@nestjs/testing";
import { UsersService } from "./users.service"
import { getRepositoryToken } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { BadRequestException, NotFoundException } from "@nestjs/common";

describe('UsersService', () => {
    let service: UsersService;

    const mockUserRepository = {
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        update: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UsersService,
                { provide: getRepositoryToken(User), useValue: mockUserRepository },
            ],
        }).compile();

        service = module.get<UsersService>(UsersService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should successfully create a user with hashed password', async () => {
            const dto = { email: 'test@test.com', username: 'user', password: 'password123' };
            mockUserRepository.findOne.mockResolvedValue(null);
            mockUserRepository.create.mockImplementation((u) => u);
            mockUserRepository.save.mockImplementation((u) => Promise.resolve({ id: 'uuid', ...u }));

            const result = await service.create(dto);

            expect(result).toHaveProperty('id');
            expect(result.email).toBe(dto.email);
            expect(mockUserRepository.save).toHaveBeenCalled();
        });

        it('should throw BadRequestException if user email already exists', async () => {
            mockUserRepository.findOne.mockResolvedValue({ id: '1' });

            await expect(
                service.create({ email: 'exists@test.com', username: 'u', password: 'p'})
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('findOne', () => {
        it('should return a user if found', async () => {
            const user = { id: 'uuid', email: 'test@test.com' };
            mockUserRepository.findOne.mockResolvedValue(user);

            const result = await service.findOne('uuid');
            expect(result).toEqual(user);
        });

        it('should throw NotFoundException if user is not found', async () => {
            mockUserRepository.findOne.mockResolvedValue(null);

            await expect(service.findOne('wrong_id')).rejects.toThrow(NotFoundException);
        });
    });
});