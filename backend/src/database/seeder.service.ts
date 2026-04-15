import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Category } from "../categories/entities/category.entity";
import { Company } from "../companies/entities/company.entity";
import { Game, GameStatus } from "../games/entities/game.entity";
import { User, UserRole } from "../users/entities/user.entity";
import { Repository } from "typeorm";
import * as bcrypt from 'bcrypt'; 
import { Media, MediaType } from "../media/entities/media.entity";
import { Requirement, RequirementType } from "../requirements/entities/requirement.entity";
import { Platform } from "../platform/entities/platform.entity";
import { Discount } from "../discounts/entities/discount.entity";
import { slugify } from "../utils/slugify";
import { Order, OrderStatus } from "../orders/entities/order.entity";
import { OrderItem } from "../orders/entities/order-item.entity";

interface IGameSeed {
  title: string;
  price: number;
  dev: string;
  pub: string;
  cats: string[];
  desc: string;
  image: string;
  screenshots: string[];
  releaseDate: Date;
  discountName?: string;
}

@Injectable()
export class SeederService {
  constructor(
    @InjectRepository(Category) private categoryRepo: Repository<Category>,
    @InjectRepository(Company) private companyRepo: Repository<Company>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Game) private gameRepo: Repository<Game>,
    @InjectRepository(Media) private mediaRepo: Repository<Media>,
    @InjectRepository(Requirement) private reqRepo: Repository<Requirement>,
    @InjectRepository(Platform) private platformRepo: Repository<Platform>,
    @InjectRepository(Discount) private discountRepo: Repository<Discount>,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private orderItemRepo: Repository<OrderItem>,
  ) {}

  async seed() {
    console.log('Seeding started...');

    const categories = ['Action', 'RPG', 'Strategy', 'Indie', 'Horror', 'Survival', 'Simulation', 'Management', 'Adventure', 'Arcade'];
    const catMap = new Map<string, Category>()

    for (const name of categories) {
      let cat = await this.categoryRepo.findOne({ where: { name } });

      if (!cat) {
        cat = await this.categoryRepo.save(this.categoryRepo.create({ name }));
      }
      catMap.set(name, cat);
    }
    console.log('Categories seeded');

    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    const discountsData = [
      { name: 'Summer Sale', percent: 50, start: lastMonth, end: nextMonth, global: true, active: true },
      { name: 'Indie Weekend', percent: 25, start: now, end: nextMonth, global: true, active: true },
    ];
    const discMap = new Map<string, Discount>();
    for (const d of discountsData) {
      let disc = await this.discountRepo.findOne({ where: { name: d.name } });
      if (!disc) disc = await this.discountRepo.save(this.discountRepo.create({
          name: d.name, discountPercent: d.percent, startDate: d.start, endDate: d.end, isGlobal: d.global, isActive: d.active
      }));
      discMap.set(d.name, disc);
    }

    const companiesData = [
      { name: 'Re-Logic', email: 'andrew@re-logic.com' },
      { name: 'Wube Software', email: 'kovarex@wube.com' },
      { name: 'Paradox Interactive', email: 'fred@paradox.com' },
      { name: 'Klei Entertainment', email: 'jamie@klei.com' },
      { name: 'Ludeon Studios', email: 'tynan@ludeon.com' },
      { name: 'Mouldy Toof Studios', email: 'chris@mouldy.com' },
      { name: 'AnukenDev', email: 'anuken@mindustry.com' },
      { name: '11 bit studios', email: 'pawel@11bit.com' },
      { name: 'ConcernedApe', email: 'eric@stardew.com' },
      { name: 'ToyAndYarikCompany', email: 'toyandyarik@gmail.com' },
      { name: 'Fury Studios', email: 'contact@furystudios.com' },
      { name: 'Raw Fury', email: 'hello@rawfury.com' },
    ];

    const compMap = new Map<string, string>();
    const pass = await bcrypt.hash('secret123', 10);

    for (const data of companiesData) {
      let owner = await this.userRepo.findOne({ where: { email: data.email } });
      if (!owner) {
        owner = await this.userRepo.save(this.userRepo.create({
          email: data.email,
          username: data.name.replace(/[^a-zA-Z0-9]/g, '') + '_CEO',
          passwordHash: pass,
          role: UserRole.USER,
          balance: 500.00
        }));
      }

      let company = await this.companyRepo.findOne({ where: { ownerId: owner.id } });
      if (!company) {
        company = await this.companyRepo.save(this.companyRepo.create({
          name: data.name,
          description: `Official studio profile for ${data.name}`,
          ownerId: owner.id,
          isVerified: true
        }));
        await this.userRepo.update(owner.id, { companyId: company.id });
      }
      compMap.set(data.name, company.id);
    }
    console.log('Companies and Owners created');
    
    const gamesData: IGameSeed[] = [
      { title: 'Terraria', price: 9.99, dev: 'Re-Logic', pub: 'Re-Logic', cats: ['Indie', 'Action', 'Survival'], desc: 'Dig, Fight, Explore, Build.', image: 'terraria.jpg', screenshots: ['terraria1.png', 'terraria2.png', 'terraria3.png', 'terraria4.png'], releaseDate: new Date('2011-05-16'), discountName: 'Summer Sale'  },
      { title: 'Factorio', price: 35.00, dev: 'Wube Software', pub: 'Wube Software', cats: ['Strategy', 'Simulation', 'Management'], desc: 'The factory must grow.', image: 'factorio.jpg', screenshots: ['factorio1.png', 'factorio2.png', 'factorio3.png', 'factorio4.png'], releaseDate: new Date('2020-08-14') },
      { title: 'Hearts of Iron IV', price: 49.99, dev: 'Paradox Interactive', pub: 'Paradox Interactive', cats: ['Strategy', 'Simulation'], desc: 'Victory is at your fingertips.', image: 'hearts_of_iron_iv.jpg', screenshots: ['hearts_of_iron_iv1.png', 'hearts_of_iron_iv2.png', 'hearts_of_iron_iv3.png', 'hearts_of_iron_iv4.png'], releaseDate: new Date('2016-06-06'), discountName: 'Indie Weekend' },
      { title: 'Europa Universalis IV', price: 39.99, dev: 'Paradox Interactive', pub: 'Paradox Interactive', cats: ['Strategy', 'Simulation'], desc: 'Rule your nation through the centuries.', image: 'europa_universalis_iv.jpg', screenshots: ['europa_universalis_iv1.png', 'europa_universalis_iv2.png', 'europa_universalis_iv3.png', 'europa_universalis_iv4.png'], releaseDate: new Date('2013-08-13') },
      { title: 'Crusader Kings III', price: 49.99, dev: 'Paradox Interactive', pub: 'Paradox Interactive', cats: ['Strategy', 'RPG'], desc: 'Love, fight, scheme, and claim greatness.', image: 'crusader_kings_iii.jpg', screenshots: ['crusader_kings_iii1.png', 'crusader_kings_iii2.png', 'crusader_kings_iii3.png'], releaseDate: new Date('2020-09-01') },
      { title: 'Don\'t Starve', price: 14.99, dev: 'Klei Entertainment', pub: 'Klei Entertainment', cats: ['Indie', 'Survival', 'Adventure'], desc: 'Fight for survival in a dark world.', image: `don't_starve.jpg`, screenshots: [`don't_starve1.png`, `don't_starve2.png`, `don't_starve3.png`], releaseDate: new Date('2013-04-23'), discountName: 'Summer Sale' },
      { title: 'Oxygen Not Included', price: 24.99, dev: 'Klei Entertainment', pub: 'Klei Entertainment', cats: ['Simulation', 'Management', 'Indie'], desc: 'Space-colony simulation game.', image: 'oxygen_not_included.jpg', screenshots: ['oxygen_not_included1.png', 'oxygen_not_included2.png', 'oxygen_not_included3.png', 'oxygen_not_included4.png'], releaseDate: new Date('2019-07-30') },
      { title: 'RimWorld', price: 34.99, dev: 'Ludeon Studios', pub: 'Ludeon Studios', cats: ['Indie', 'Simulation', 'Management'], desc: 'Sci-fi colony sim driven by an intelligent AI.', image: 'rimworld.jpg', screenshots: ['rimworld1.png', 'rimworld2.png', 'rimworld3.png', 'rimworld4.png'], releaseDate: new Date('2018-10-17') },
      { title: 'The Escapists', price: 17.99, dev: 'Mouldy Toof Studios', pub: 'Mouldy Toof Studios', cats: ['Indie', 'Strategy', 'Action'], desc: 'Prison escape simulator.', image: 'the_escapists.jpg', screenshots: ['the_escapists1.png', 'the_escapists2.png', 'the_escapists3.png', 'the_escapists4.png'], releaseDate: new Date('2015-02-13') },
      { title: 'Mindustry', price: 9.99, dev: 'AnukenDev', pub: 'AnukenDev', cats: ['Indie', 'Strategy', 'Management'], desc: 'Tower-defense factory game.', image: 'mindustry.jpg', screenshots: ['mindustry1.png', 'mindustry2.png', 'mindustry3.png', 'mindustry4.png'], releaseDate: new Date('2019-09-26') },
      { title: 'Frostpunk', price: 29.99, dev: '11 bit studios', pub: '11 bit studios', cats: ['Strategy', 'Survival', 'Management'], desc: 'The city must survive.', image: 'frostpunk.jpg', screenshots: ['frostpunk1.png', 'frostpunk2.png', 'frostpunk3.png', 'frostpunk4.png'], releaseDate: new Date('2018-04-24'), discountName: 'Indie Weekend' },
      { title: 'Stardew Valley', price: 14.99, dev: 'ConcernedApe', pub: 'ConcernedApe', cats: ['Indie', 'RPG', 'Simulation'], desc: 'Open-ended country-life RPG.', image: 'stardew_valley.jpg', screenshots: ['stardew_valley1.png', 'stardew_valley2.png', 'stardew_valley3.png', 'stardew_valley4.png'], releaseDate: new Date('2016-02-26') },
      { title: 'Kingdom Two Crowns', price: 19.99, dev: 'Fury Studios', pub: 'Raw Fury', cats: ['Indie', 'Strategy', 'Adventure'], desc: 'Build your kingdom and secure it from the Greed.', image: 'kingdom_two_crowns.jpg', screenshots: ['kingdom_two_crowns1.png', 'kingdom_two_crowns2.png', 'kingdom_two_crowns3.png', 'kingdom_two_crowns4.png'], releaseDate: new Date('2018-12-11') },
      { title: 'Kingdom: Classic', price: 4.99, dev: 'Fury Studios', pub: 'Raw Fury', cats: ['Indie', 'Strategy'], desc: 'Minimalist side-scrolling strategy.', image: 'kingdom:_classic.jpg', screenshots: ['kingdom:_classic1.png', 'kingdom:_classic2.png', 'kingdom:_classic3.png', 'kingdom:_classic4.png'], releaseDate: new Date('2015-10-21') },
      { title: 'Doodle Jump Like', price: 0.00, dev: 'ToyAndYarikCompany', pub: 'ToyAndYarikCompany', cats: ['Arcade', 'Indie'], desc: 'Jump high and avoid monsters!', image: 'doodle_jump_like.jpg', screenshots: ['doodle_jump_like1.jpg'], releaseDate: new Date('2025-08-08') },
    ];

    for (const g of gamesData) {
      let game = await this.gameRepo.findOne({ where: { title: g.title } });
      const slug = slugify(g.title);

      if (!game) {
        const gameCats = g.cats.map(name => catMap.get(name)).filter((c): c is Category => !!c);
        const devId = compMap.get(g.dev)!;
        const pubId = compMap.get(g.pub)!;
        const discount = g.discountName ? discMap.get(g.discountName) : null;

        game = await this.gameRepo.save(this.gameRepo.create({
          title: g.title,
          description: g.desc,
          price: g.price,
          status: GameStatus.ACTIVE,
          developerId: devId,
          publisherId: pubId,
          categories: gameCats,
          promotionId: discount ? discount.id : null,
          createdAt: g.releaseDate,
          buildUrl: `uploads/builds/${slug}/build-v1.zip`
        }));
      }

      const baseUrl = `http://localhost:3000/uploads/covers/${slug}`;
      const mainExist = await this.mediaRepo.findOne({ where: { gameId: game.id, isMain: true } });
      if (!mainExist) await this.mediaRepo.save(this.mediaRepo.create({
          gameId: game.id, fileUrl: `${baseUrl}/${g.image}`, type: MediaType.IMAGE, isMain: true
      }));

      for (const shot of g.screenshots) {
        const url = `${baseUrl}/${shot}`;
        const shotExist = await this.mediaRepo.findOne({ where: { gameId: game.id, fileUrl: url } });
        if (!shotExist) await this.mediaRepo.save(this.mediaRepo.create({
            gameId: game.id, fileUrl: url, type: MediaType.IMAGE, isMain: false
        }));
      }
    }

    let win = await this.platformRepo.findOne({ where: { name: 'Windows' } });
    if (!win) win = await this.platformRepo.save(this.platformRepo.create({ name: 'Windows' }));

    let mac = await this.platformRepo.findOne({ where: { name: 'macOS' } });
    if (!mac) mac = await this.platformRepo.save(this.platformRepo.create({ name: 'macOS' }));

    let lin = await this.platformRepo.findOne({ where: { name: 'Linux' } });
    if (!lin) lin = await this.platformRepo.save(this.platformRepo.create({ name: 'Linux' }));

    const allSavedGames = await this.gameRepo.find();
    const allPlatforms = [win, mac, lin];

    for (const game of allSavedGames) {
      const hasReqs = await this.reqRepo.findOne({ where: { gameId: game.id } });

      if (!hasReqs) {
        const minReq = this.reqRepo.create({
          gameId: game.id,
          type: RequirementType.MINIMUM,
          platforms: allPlatforms,
          processor: 'Intel Core i5',
          ram: '8 GB',
          gpu: 'NVIDIA GTX 760',
          storage: '50 GB'
        });
        await this.reqRepo.save(minReq);

        const recReq = this.reqRepo.create({
          gameId: game.id,
          type: RequirementType.RECOMMENDED,
          platforms: allPlatforms,
          processor: 'Intel Core i7',
          ram: '16 GB',
          gpu: 'NVIDIA GTX 1080 Ti',
          storage: '50 GB'
        });
        await this.reqRepo.save(recReq);
      }
    }

    const terraria = await this.gameRepo.findOne({ where: { title: 'Terraria' } });
    const buyer = await this.userRepo.findOne({ where: { email: 'fred@paradox.com' } });

    if (terraria && buyer) {
      const pattern = [
        { count: 1, daysAgo: 4 },
        { count: 3, daysAgo: 2 }, 
        { count: 2, daysAgo: 1 },
      ];

      for (const day of pattern) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - day.daysAgo);
        targetDate.setHours(12, 0, 0, 0);

        for (let i = 0; i < day.count; i++) {
          const order = await this.orderRepo.save(this.orderRepo.create({
            userId: buyer.id,
            totalAmount: Number(terraria.price),
            status: OrderStatus.PAID,
            createdAt: targetDate 
          }));

          await this.orderItemRepo.save(this.orderItemRepo.create({
            orderId: order.id,
            gameId: terraria.id,
            priceAtPurchase: Number(terraria.price)
          }));
        }
      }
    }

    console.log('System Requirements seeded');

    const staffPass = await bcrypt.hash('secret123', 10);
  
    const staffMembers = [
      { email: 'admin@sadstore.com', username: 'Platform_Admin', role: UserRole.ADMIN },
      { email: 'mod1@sadstore.com', username: 'Mod_Alpha', role: UserRole.MODERATOR },
      { email: 'mod2@sadstore.com', username: 'Mod_Beta', role: UserRole.MODERATOR },
      { email: 'mod3@sadstore.com', username: 'Mod_Gamma', role: UserRole.MODERATOR },
    ];

    for (const staff of staffMembers) {
      const exists = await this.userRepo.findOne({ where: { email: staff.email } });
      if (!exists) {
        await this.userRepo.save(this.userRepo.create({
          email: staff.email,
          username: staff.username,
          passwordHash: staffPass,
          role: staff.role,
          balance: 1000.00
        }));
      }
    }
  }
}
