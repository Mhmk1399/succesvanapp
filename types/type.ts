// Office ----------------------------------------------------------------------------
export interface WorkingTime {
  day:
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday";
  isOpen: boolean;
  startTime?: string;
  endTime?: string;
  pickupExtension?: {
    hoursBefore: number;
    hoursAfter: number;
    flatPrice: number;
  };
  returnExtension?: {
    hoursBefore: number;
    hoursAfter: number;
    flatPrice: number;
  };
}

export interface SpecialDay {
  month: number;
  day: number;
  isOpen: boolean;
  startTime?: string;
  endTime?: string;
  reason?: string;
}

export interface Office {
  _id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
  address: string;
  phone: string;
  workingTime: WorkingTime[];
  specialDays: SpecialDay[];
  vehicles: Vehicle[];
  createdAt?: Date;
  updatedAt?: Date;
  categories: Category;
}

// Vehicle --------------------------------------------------------------------------------
export interface ServiceHistory {
  tire: Date;
  oil: Date;
  battery: Date;
  air: Date;
  service: Date;
}

export interface Property {
  name: string;
  value: string;
}

export interface Vehicle {
  _id?: string;
  title: string;
  description: string;
  images: string[];
  category: string;
  pricePerHour: number;
  fuel: "gas" | "diesel" | "electric" | "hybrid";
  gear: "automatic" | "manual" | "manual,automatic";
  seats: number;
  doors: number;
  properties: Property[];
  serviceHistory: ServiceHistory;
  needsService: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  number: number;
}

// Category -----------------------------------------------------------------------------------
export interface ServicesPeriod {
  tire: number;
  oil: number;
  battery: number;
  air: number;
  service: number;
}

export interface PricingTier {
  minDays: number;
  maxDays: number;
  pricePerDay: number;
}

export interface Category {
  _id?: string;
  name: string;
  expert: string;
  description?: string;
  image?: string;
  video?: string;
  type: Type;
  showPrice: number;
  servicesPeriod: ServicesPeriod;
  pricingTiers: PricingTier[];
  extraHoursRate?: number;
  extrahoursRate?: number;
  fuel: "gas" | "diesel" | "electric" | "hybrid";
  gear?: {
    availableTypes: ("manual" | "automatic")[];
    automaticExtraCost: number;
  };
  purpose: string;
  seats: number;
  doors: number;
  selloffer?: number;
  createdAt?: Date;
  updatedAt?: Date;
  properties: Property[];
}

// Type -------------------------------------------------------------------------------------------

export interface Type {
  _id?: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

// dashboard
export interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

export interface Stats {
  vehicles: number;
  offices: number;
  reservations: number;
  categories: number;
}

// AddOn ------------------------------------------------------------------------------------------
export interface AddOn {
  _id: string;
  name: string;
  description?: string;
  pricingType: "flat" | "tiered";
  flatPrice: {
    amount?: number;
    isPerDay: boolean;
  };
  tieredPrice: {
    isPerDay: boolean;
    tiers: Array<{
      _id?: string;
      minDays: number;
      maxDays: number;
      price: number;
    }>;
  };
  createdAt?: string;
  updatedAt?: string;
}

// Reservation ------------------------------------------------------------------------------------------
export interface Reservation {
  _id?: string;
  user?: User;
  office?: { _id: string; name: string; workingTime?: WorkingTime[] };
  category?: Category;
  startDate: string;
  endDate: string;
  totalPrice: number;
  status: "pending" | "confirmed" | "canceled" | "completed";
  dirverAge: number;
  messege?: string;
  addOns?: Array<{
    addOn?: AddOn;
    quantity: number;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
}

// custom Select -------------------------------------------------------------------
interface Option {
  _id?: string;
  name: string;
}

export interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  isInline?: boolean;
}

// Testimonial -------------------------------------------------------------------------------
export interface Testimonial {
  id: number;
  name: string;
  role?: string;
  company?: string;
  message: string;
  rating: number;
  image?: string;
  date?: string;
  location?: string;
}

export interface TestimonialsProps {
  testimonials?: Testimonial[];
  layout?: "carousel" | "grid" | "masonry";
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showRating?: boolean;
  accentColor?: string;
}

// User -----------------------------------------------------------------------------------------
export interface User {
  _id: string;
  name: string;
  lastName: string;
  emaildata: {
    emailAddress: string;
    isVerified: boolean;
  };
  phoneData: {
    phoneNumber: string;
    isVerified: boolean;
  };
  address?: string;
  licenceAttached?: {
    front?: string;
    back?: string;
  };
  role?: string;
  createdAt: Date;
}

// van --------------------------------------------------------------------------------------------
// Van data type
export interface VanData {
  _id?: string;
  name: string;
  description?: string;
  image: string;
  type?: string;
  servicesPeriod?: {
    tire: number;
    oil: number;
    battery: number;
    air: number;
    service: number;
  };
  pricingTiers?: PricingTier[];
  fuel: "gas" | "diesel" | "electric" | "hybrid";
  gear?: {
    availableTypes: ("manual" | "automatic")[];
    automaticExtraCost: number;
  };
  seats: number;
  doors: number;
  id?: number;
  category?: string;
  transmission?: "Manual" | "Automatic";
  cargo?: string;
  features?: string[];
  popular?: boolean;
  available?: boolean;
  deposit?: number;
  mileage?: string;
  priceUnit?: string;
}
