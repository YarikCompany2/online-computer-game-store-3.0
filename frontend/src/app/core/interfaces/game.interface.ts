export interface ICategory {
  id: number;
  name: string;
}

export interface ICompany {
  id: string;
  name: string;
}

export interface IGame {
  id: string;
  title: string;
  description: string;
  price: number;
  status: string;
  company: ICompany | null;
  categories: ICategory[];
  fileUrl?: string;
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