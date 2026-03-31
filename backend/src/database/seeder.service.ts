import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Category } from "../categories/entities/category.entity";
import { Company, CompanyType } from "../companies/entities/company.entity";
import { Game, GameStatus } from "../games/entities/game.entity";
import { User, UserRole } from "../users/entities/user.entity";
import { Repository } from "typeorm";
import * as bcrypt from 'bcrypt'; 
import { Media, MediaType } from "../media/entities/media.entity";

interface IGameSeed {
  title: string;
  price: number;
  dev: string;
  pub: string;
  cats: string[];
  desc: string;
  fileUrl?: string;
  image?: string;
  screenshots?: string[]; 
}

@Injectable()
export class SeederService {
  constructor(
    @InjectRepository(Category) private categoryRepo: Repository<Category>,
    @InjectRepository(Company) private companyRepo: Repository<Company>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Game) private gameRepo: Repository<Game>,
    @InjectRepository(Media) private mediaRepo: Repository<Media>,
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

    const companiesData = [
      { name: 'Re-Logic', ownerEmail: 'andrew@re-logic.com', type: CompanyType.DEVELOPER },
      { name: 'Wube Software', ownerEmail: 'kovarex@wube.com', type: CompanyType.DEVELOPER},
      { name: 'Paradox Interactive', ownerEmail: 'fred@paradox.com', type: CompanyType.BOTH },
      { name: 'Klei Entertainment', ownerEmail: 'jamie@klei.com', type: CompanyType.DEVELOPER },
      { name: 'Ludeon Studios', ownerEmail: 'tynan@ludeon.com', type: CompanyType.DEVELOPER },
      { name: 'Mouldy Toof Studios', ownerEmail: 'chris@mouldy.com', type: CompanyType.DEVELOPER },
      { name: 'AnukenDev', ownerEmail: 'anuken@mindustry.com', type: CompanyType.DEVELOPER },
      { name: '11 bit studios', ownerEmail: 'pawel@11bit.com', type: CompanyType.BOTH },
      { name: 'ConcernedApe', ownerEmail: 'eric@stardew.com', type: CompanyType.DEVELOPER },
      { name: 'ToyAndYarikCompany', ownerEmail: 'toyandyarik@gmail.com', type: CompanyType.BOTH },
      { name: 'Fury Studios', ownerEmail: 'contact@furystudios.com', type: CompanyType.DEVELOPER },
      { name: 'Raw Fury', ownerEmail: 'hello@rawfury.com', type: CompanyType.PUBLISHER },
    ];

    const compMap = new Map<string, string>();

    for (const data of companiesData) {
      let owner = await this.userRepo.findOne({ where: {email: data.ownerEmail } });
      if (!owner) {
        const pass = await bcrypt.hash('secret123', 10);
        owner = await this.userRepo.save(this.userRepo.create({
          email: data.ownerEmail,
          username: data.name + '_CEO',
          passwordHash: pass,
          role: UserRole.USER
        }));
      }

      let company = await this.companyRepo.findOne({ where: { ownerId: owner.id } });
      if (!company) {
        company = await this.companyRepo.save(this.companyRepo.create({
          name: data.name,
          description: `Official studio of ${data.name}`,
          type: data.type,
          ownerId: owner.id,
          isVerified: true
        }));

        await this.userRepo.update(owner.id, { companyId: company.id });
      }
      compMap.set(data.name, company.id);
    }
    console.log('Companies and Owners created');
    
    const employees = [
      { email: 'dev1@paradox.com', username: 'ParadoxDev_1', comp: 'Paradox Interactive'},
      { email: 'dev2@paradox.com', username: 'ParadoxDev_2', comp: 'Paradox Interactive'},
      { email: 'yarik@gmail.com', username: 'YarikCompany', comp: 'Toy Studio' },
    ];

    for (const emp of employees) {
      const exists = await this.userRepo.findOne({ where: { email: emp.email } });
      if (!exists) {
        const pass = await bcrypt.hash('dev123', 10);
        const companyId = compMap.get(emp.comp);
        await this.userRepo.save(this.userRepo.create({
          email: emp.email,
          username: emp.username,
          passwordHash: pass,
          role: UserRole.USER,
          companyId: companyId
        }));
      }
    }
    console.log('Additional employees added to companies');

    const gamesData: IGameSeed[] = [
      { title: 'Terraria', price: 9.99, dev: 'Re-Logic', pub: 'Re-Logic', cats: ['Indie', 'Action', 'Survival'], desc: 'Dig, Fight, Explore, Build.', image: 'terraria/terraria.jpg', screenshots: ['terraria/terraria1.png'] },
      { title: 'Factorio', price: 35.00, dev: 'Wube Software', pub: 'Wube Software', cats: ['Strategy', 'Simulation', 'Management'], desc: 'The factory must grow.', image: 'factorio/factorio.jpg' },
      { title: 'Hearts of Iron IV', price: 49.99, dev: 'Paradox Interactive', pub: 'Paradox Interactive', cats: ['Strategy', 'Simulation'], desc: 'Victory is at your fingertips.', image: 'hearts_of_iron_iv/hearts_of_iron_iv.jpg' },
      { title: 'Europa Universalis IV', price: 39.99, dev: 'Paradox Interactive', pub: 'Paradox Interactive', cats: ['Strategy', 'Simulation'], desc: 'Rule your nation through the centuries.', image: 'europa_universalis_iv/europa_universalis_iv.jpg' },
      { title: 'Crusader Kings III', price: 49.99, dev: 'Paradox Interactive', pub: 'Paradox Interactive', cats: ['Strategy', 'RPG'], desc: 'Love, fight, scheme, and claim greatness.', image: 'crusader_kings_iii/crusader_kings_iii.jpg' },
      { title: 'Don\'t Starve', price: 14.99, dev: 'Klei Entertainment', pub: 'Klei Entertainment', cats: ['Indie', 'Survival', 'Adventure'], desc: 'Fight for survival in a dark world.', image: `don't_starve/don't_starve.jpg` },
      { title: 'Oxygen Not Included', price: 24.99, dev: 'Klei Entertainment', pub: 'Klei Entertainment', cats: ['Simulation', 'Management', 'Indie'], desc: 'Space-colony simulation game.', image: 'oxygen_not_included/oxygen_not_included.jpg' },
      { title: 'RimWorld', price: 34.99, dev: 'Ludeon Studios', pub: 'Ludeon Studios', cats: ['Indie', 'Simulation', 'Management'], desc: 'Sci-fi colony sim driven by an intelligent AI.', image: 'rimworld/rimworld.jpg' },
      { title: 'The Escapists', price: 17.99, dev: 'Mouldy Toof Studios', pub: 'Mouldy Toof Studios', cats: ['Indie', 'Strategy', 'Action'], desc: 'Prison escape simulator.', image: 'the_escapists/the_escapists.jpg' },
      { title: 'Mindustry', price: 9.99, dev: 'AnukenDev', pub: 'AnukenDev', cats: ['Indie', 'Strategy', 'Management'], desc: 'Tower-defense factory game.', image: 'mindustry/mindustry.jpg' },
      { title: 'Frostpunk', price: 29.99, dev: '11 bit studios', pub: '11 bit studios', cats: ['Strategy', 'Survival', 'Management'], desc: 'The city must survive.', image: 'frostpunk/frostpunk.jpg' },
      { title: 'Stardew Valley', price: 14.99, dev: 'ConcernedApe', pub: 'ConcernedApe', cats: ['Indie', 'RPG', 'Simulation'], desc: 'Open-ended country-life RPG.', image: 'stardew_valley/stardew_valley.jpg' },
      { title: 'Kingdom Two Crowns', price: 19.99, dev: 'Fury Studios', pub: 'Raw Fury', cats: ['Indie', 'Strategy', 'Adventure'], desc: 'Build your kingdom and secure it from the Greed.', image: 'kingdom_two_crowns/kingdom_two_crowns.jpg' },
      { title: 'Kingdom: Classic', price: 4.99, dev: 'Fury Studios', pub: 'Raw Fury', cats: ['Indie', 'Strategy'], desc: 'Minimalist side-scrolling strategy.', image: 'kingdom:_classic/kingdom:_classic.jpg' },
      { title: 'Doodle Jump Like', price: 0.00, dev: 'ToyAndYarikCompany', pub: 'ToyAndYarikCompany', cats: ['Arcade', 'Indie'], desc: 'Jump high and avoid monsters!', fileUrl: 'https://github.com/toysmbb/Doodle-jump-like', image: 'doodle_jump_like/doodle_jump_like.jpg' },
    ];

    for (const g of gamesData) {
      let game = await this.gameRepo.findOne({ where: { title: g.title } });

      if (!game) {
        const gameCats = g.cats.map(name => catMap.get(name)).filter((c): c is Category => !!c);
        const developerId = compMap.get(g.dev)!;
        const publisherId = compMap.get(g.pub)!;

        game = await this.gameRepo.save(this.gameRepo.create({
          title: g.title,
          description: g.desc,
          price: g.price,
          status: GameStatus.ACTIVE,
          developerId: developerId,
          publisherId: publisherId,
          categories: gameCats,
          fileUrl: g.fileUrl || null
        }));
      }

      const mainExists = await this.mediaRepo.findOne({ where: { gameId: game.id, isMain: true } });
      if (!mainExists) {
        await this.mediaRepo.save(this.mediaRepo.create({
          gameId: game.id,
          fileUrl: `http://localhost:3000/uploads/covers/${g.image}`,
          type: MediaType.IMAGE,
          isMain: true
        }));
      }

      for (const shot of g.screenshots || 'placeholder.png') {
        const url = `http://localhost:3000/uploads/covers/${shot}`;
        const exists = await this.mediaRepo.findOne({ where: { gameId: game.id, fileUrl: url } });
        if (!exists) {
          await this.mediaRepo.save(this.mediaRepo.create({
            gameId: game.id,
            fileUrl: url,
            type: MediaType.IMAGE,
            isMain: false
          }));
        }
      }
    }
  }
}
