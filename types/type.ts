type ApiDate = string | Date;
type EntityStatus = "active" | "inactive";
type ReservationStatus =
  | "pending"
  | "confirmed"
  | "canceled"
  | "delivered"
  | "completed";
type FuelType = "gas" | "diesel" | "electric" | "hybrid";
type GearType = "manual" | "automatic";
type UserRole =
  | "user"
  | "admin"
  | "owner"
  | "Secretary"
  | "Consultant"
  | "Accountant";

// Shared -------------------------------------------------------------------------------------
export interface MongoTimestamps {
  createdAt?: ApiDate;
  updatedAt?: ApiDate;
}

export interface Property {
  _id?: string;
  name?: string;
  key?: string;
  value: string;
}

export interface Rule {
  _id?: string;
  key?: string;
  value?: string;
}

// Office -------------------------------------------------------------------------------------
export interface WorkingTimeWindow {
  isOpen?: boolean;
  startTime?: string;
  endTime?: string;
}

export interface WorkingTimeExtension {
  startTime?: string;
  endTime?: string;
  hoursBefore: number;
  hoursAfter: number;
  flatPrice: number;
}

export interface SpecialDayTimeWindow {
  startTime?: string;
  endTime?: string;
}

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
  pickupTime?: WorkingTimeWindow;
  returnTime?: WorkingTimeWindow;
  pickupExtension?: WorkingTimeExtension;
  returnExtension?: WorkingTimeExtension;
}

export interface SpecialDay {
  month: number;
  day: number;
  isOpen: boolean;
  startTime?: string;
  endTime?: string;
  pickupTime?: SpecialDayTimeWindow;
  returnTime?: SpecialDayTimeWindow;
  pickupExtension?: SpecialDayTimeWindow;
  returnExtension?: SpecialDayTimeWindow;
  reason?: string;
  extraPrice?: number;
}

export interface OfficeVehicleInventory {
  _id?: string;
  vehicle: Vehicle;
  inventory: number;
}

export interface Office extends MongoTimestamps {
  _id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
  status?: EntityStatus;
  categories: Category[];
  address: string;
  phone: string;
  workingTime: WorkingTime[];
  specialDays: SpecialDay[];
  vehicles: OfficeVehicleInventory[];
}

// Vehicle ------------------------------------------------------------------------------------
export interface ServiceHistory {
  tyre?: ApiDate;
  tire?: ApiDate;
  oil?: ApiDate;
  coolant?: ApiDate;
  breakes?: ApiDate;
  battery?: ApiDate;
  air?: ApiDate;
  service?: ApiDate;
  adBlue?: ApiDate;
}

export interface Vehicle extends MongoTimestamps {
  _id?: string;
  title: string;
  description: string;
  category: Category;
  office?: Office;
  reservation?: Reservation;
  available?: boolean;
  gear: {
    availableTypes: Array<{ gearType: GearType }>;
  };
  status?: EntityStatus;
  brand?: string;
  keyNumber?: string;
  number: string | number;
  properties: Property[];
  serviceHistory: ServiceHistory;
  needsService: boolean;
  pricePerHour?: number;
  fuel?: FuelType;
  seats?: number;
  doors?: number;
  images?: string[];
}

// Category -----------------------------------------------------------------------------------
export interface ServicesPeriod {
  tyre?: number;
  tire?: number;
  oil?: number;
  coolant?: number;
  breakes?: number;
  battery?: number;
  air?: number;
  service?: number;
  adBlue?: number;
}

export interface PricingTier {
  _id?: string;
  minDays: number;
  maxDays: number;
  pricePerDay: number;
}

export interface Category extends MongoTimestamps {
  _id: string;
  name: string;
  description?: string;
  purpose?: string;
  expert?: string;
  image?: string;
  video?: string;
  type: Type;
  showPrice: number;
  selloffer?: number;
  status?: EntityStatus;
  properties: Property[];
  rules?: Rule[];
  requiredLicense: string;
  pricingTiers: PricingTier[];
  extrahoursRate: number;
  extraHoursRate?: number;
  fuel: FuelType;
  gear: {
    availableTypes: GearType[];
    automaticExtraCost: number;
  };
  seats: number;
  doors: number;
  servicesPeriod?: ServicesPeriod;
}

// Type ---------------------------------------------------------------------------------------
export interface Type extends MongoTimestamps {
  _id: string;
  name: string;
  description?: string;
  offices: Office[];
  status?: EntityStatus;
}

// Dashboard ----------------------------------------------------------------------------------
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

// AddOn --------------------------------------------------------------------------------------
export interface AddOnTier {
  _id?: string;
  minDays: number;
  maxDays: number;
  price: number;
}

export interface AddOn extends MongoTimestamps {
  _id: string;
  name: string;
  description?: string;
  type?: string;
  icon?: string;
  pricingType: "flat" | "tiered";
  flatPrice?: {
    amount?: number;
    isPerDay: boolean;
  };
  tieredPrice?: {
    isPerDay: boolean;
    tiers: AddOnTier[];
  };
  status?: EntityStatus;
  categoryId?: Category | null;
}

// Reservation --------------------------------------------------------------------------------
export interface ReservationAddOn {
  _id?: string;
  addOn?: AddOn;
  quantity: number;
  selectedTierIndex?: number;
}

export interface Reservation extends MongoTimestamps {
  _id?: string;
  reservationCode?: string;
  user?: User;
  office?: Office;
  category?: Category;
  vehicle?: Vehicle;
  startDate: string;
  endDate: string;
  startDateDisplay?: string;
  endDateDisplay?: string;
  pickupTime?: string;
  returnTime?: string;
  totalPrice: number;
  status: ReservationStatus;
  cancelReason?: string;
  driverAge?: number;
  dirverAge?: number;
  selectedGear?: GearType;
  messege?: string;
  addOns?: ReservationAddOn[];
  discountCode?: string;
  pickupExtensionPrice?: number;
  returnExtensionPrice?: number;
  isManualPrice?: boolean;
  manualPricePerDay?: number;
  manualPriceNote?: string;
  perInvoice?: boolean;
  reservationType?: "Office" | "Website";
}

// Custom Select ------------------------------------------------------------------------------
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
  disabled?: boolean;
  id?: string;
}

// Testimonial --------------------------------------------------------------------------------
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
  link?: string;
}

export interface TestimonialsProps {
  testimonials?: Testimonial[];
  layout?: "carousel" | "grid" | "masonry";
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showRating?: boolean;
  accentColor?: string;
}

// User ---------------------------------------------------------------------------------------
export interface User extends MongoTimestamps {
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
  role?: UserRole;
  licenceAttached?: {
    front?: string;
    back?: string;
  };
  avatar?: string;
  address?: string;
  postalCode?: string;
  city?: string;
}

// Van ----------------------------------------------------------------------------------------
export interface VanData {
  _id?: string;
  name: string;
  description?: string;
  image: string;
  video?: string;
  requiredLicense?: string;
  type?: string | Type;
  purpose?: string;
  expert?: string;
  servicesPeriod?: ServicesPeriod;
  pricingTiers?: PricingTier[];
  showPrice?: number;
  selloffer?: number;
  pricePerHour?: number;
  extrahoursRate?: number;
  extraHoursRate?: number;
  fuel: FuelType;
  gear:
    | "automatic"
    | "manual"
    | "manual,automatic"
    | {
        availableTypes: GearType[];
        automaticExtraCost?: number;
      };
  seats: number;
  doors: number;
  id?: number | string;
  category?: Category;
  transmission?: "Manual" | "Automatic";
  cargo?: string;
  features?: string[];
  properties?: Property[];
  rules?: Rule[];
  popular?: boolean;
  available?: boolean;
  deposit?: number;
  mileage?: string;
  priceUnit?: string;
  status?: EntityStatus;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}
