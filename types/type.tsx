export interface Category {
  _id?: string;
  name: string;
  description?: string;
  image?: string;
  type: string | Type;
  servicesPeriod: ServicesPeriod;
  pricePerHour: number;
  fuel: "gas" | "diesel" | "electric" | "hybrid";
  gear: "automatic" | "manual" | "manual,automatic";
  seats: number;
  doors: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ServicesPeriod {
  tire: number;
  oil: number;
  battery: number;
  air: number;
  service: number;
}

export interface Type {
  _id?: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}
