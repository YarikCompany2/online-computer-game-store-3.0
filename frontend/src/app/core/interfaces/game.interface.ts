export interface ICategory {
  id: number;
  name: string;
}

export interface ICompany {
  id: string;
  name: string;
}

export interface IMedia {
  id: string;
  fileUrl: string;
  type: 'image' | 'video';
  isMain: boolean;
}

export interface IGame {
  id: string;
  title: string;
  description: string;
  price: number;
  status: string;
  developer: ICompany | null;
  publisher: ICompany | null;
  categories: ICategory[];
  fileUrl?: string;
  media: IMedia[];
  requirements: IRequirement[];
  isOwned: boolean;
  discount?: {
    id: string;
    name: string;
    discountPercent: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
  };
  calculatedPrice?: {
    hasDiscount: boolean;
    originalPrice: number;
    discountPercent: number;
    currentPrice: number;
  };
  createdAt: string;
}

export interface IPaginatedResponse<T> {
  data: T[];
  meta: {
    totalItems: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

export interface IRequirement {
  id: string;
  type: 'minimum' | 'recommended';
  os: string;
  platforms: IPlatform[];
  processor: string;
  ram: string;
  gpu: string;
  storage: string;
}

export interface IPlatform {
  id: number;
  name: string;
}

export interface ILibraryItem {
  id: string;
  userId: string;
  gameId: string;
  orderId: string | null;
  purchaseDate: string;
  game: IGame;
  accessType: 'purchased' | 'developer';
}