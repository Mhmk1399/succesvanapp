type ApiDate = string | Date;
type EntityStatus = "active" | "inactive";
type ReservationStatus =
  | "pending"
  | "confirmed"
  | "deposit_pending"
  | "deposit_paid"
  | "contract_pending"
  | "contract_signed"
  | "ready_for_collection"
  | "handover_in_progress"
  | "canceled"
  | "delivered"
  | "vehicle_returned"
  | "return_inspection"
  | "deposit_review"
  | "refund_processing"
  | "refund_completed"
  | "expired"
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
  deposit?: {
    amount?: number;
    fullPayDiscountPercent?: number;
    securePayPrice?: number;
    officePayPrice?: number;
  };
  amount?: number;
  fullPayDiscountPercent?: number;
  securePayPrice?: number;
  officePayPrice?: number;
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
  image?: string;
  imageUrl?: string;
  thumbnail?: string;
  photo?: string;
  picture?: string;
  images?: string[];
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

export interface CancellationCalculation {
  paymentOption?: "full" | "secure";
  paidAmount?: number;
  hoursBeforePickup?: number;
  window?: "over_72_hours" | "between_24_and_72_hours" | "under_24_hours";
  policyDeductionPercent?: number;
  agreedDeductionPercent?: number;
  deductionAmount?: number;
  refundAmount?: number;
  cancellationProtected?: boolean;
  calculatedAt?: string;
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
  serviceCharge?: number;
  adminDiscountAmount?: number;
  adminDiscountPercent?: number;
  cancellationRequest?: {
    status?: "pending" | "approved" | "rejected";
    reason?: string;
    reviewNote?: string;
    attachment?: { url?: string; filename?: string; contentType?: string };
    reviewAttachment?: { url?: string; filename?: string; contentType?: string };
    calculation?: CancellationCalculation;
    policyAcceptedAt?: string;
  };
  cancellationSettlement?: CancellationCalculation;
  vehicleIssueNotes?: Array<{ _id?: string; note: string; imageUrl: string; status: "pending" | "accepted" | "refused"; reviewReason?: string; createdAt?: string }>;
  rentalExtensions?: Array<{ contractNumber?: string; newReturnDateTime?: string; agreedPrice?: number; signedAt?: string }>;
  additionalDriver?: { name?: string; licenceNumber?: string };
  invoiceFinalPrice?: { amount?: number; confirmedAt?: string };
  status: ReservationStatus;
  statusHistory?: Array<{
    status: ReservationStatus | string;
    changedAt: string;
    source?: string;
    note?: string;
  }>;
  deposit?: {
    amount?: number;
    originalAmount?: number;
    option?: "full" | "secure" | "office";
    status?:
      | "not_paid"
      | "pending"
      | "paid"
      | "failed"
      | "held"
      | "refund_processing"
      | "refunded"
      | "partially_refunded";
    dueAt?: string;
    paidAt?: string;
    method?: string;
    transactionRef?: string;
    receiptUrl?: string;
    receiptUploadedAt?: string;
    failureReason?: string;
    discountPercent?: number;
    discountAmount?: number;
    cancellationPolicyAcceptedAt?: string;
    cancellationPolicyVersion?: string;
    priceAdjustment?: {
      status?: "payment_due" | "credit_due" | "balanced";
      paidAmount?: number;
      revisedTotal?: number;
      balanceDue?: number;
      creditAmount?: number;
    };
  };
  collectionCode?: string;
  handover?: {
    startedAt?: string;
    startMileage?: number;
    startFuelLevel?: string;
    conditionNotes?: string;
    existingDamages?: string[];
    photos?: string[];
    customerSignature?: string;
    staffSignature?: string;
    staff?: {
      user?: string;
      name?: string;
      role?: "admin" | "owner";
    };
    keyCount?: number;
    equipment?: string[];
    customFields?: {
      templateFieldId?: string;
      label?: string;
      fieldType?: "input" | "file";
      inputType?: string;
      value?: string;
      files?: string[];
      helpText?: string;
    }[];
    completedAt?: string;
  };
  inspection?: {
    receivedAt?: string;
    returnMileage?: number;
    returnFuelLevel?: string;
    newDamages?: string[];
    lateReturn?: boolean;
    lateMinutes?: number;
    cleaningIssue?: boolean;
    missingEquipment?: string[];
    photos?: string[];
    notes?: string;
    staff?: {
      user?: string;
      name?: string;
      role?: "admin" | "owner";
    };
    customFields?: {
      templateFieldId?: string;
      label?: string;
      fieldType?: "input" | "file";
      inputType?: string;
      value?: string;
      files?: string[];
      helpText?: string;
    }[];
    completedAt?: string;
  };
  refund?: {
    depositPaid?: number;
    deductionsTotal?: number;
    refundAmount?: number;
    status?: "not_started" | "under_review" | "approved" | "processing" | "completed" | "failed";
    reference?: string;
    expectedBy?: string;
    chargeReason?: string;
    otherChargeReason?: string;
    charges?: {
      fuel?: number;
      late?: number;
      damage?: number;
      cleaning?: number;
      missingEquipment?: number;
      other?: number;
    };
    additionalCharges?: Array<{ reason?: string; amount?: number; evidenceUrl?: string; ticketReference?: string }>;
  };
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
  reservationType?: "Office" | "Website" | "App";
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
  licenceDetails?: {
    isFrontSide?: boolean;
    sourceSide?: "front" | "back" | "unknown";
    firstName?: string | null;
    lastName?: string | null;
    fullName?: string | null;
    dateOfBirth?: string | null;
    address?: string | null;
    postcode?: string | null;
    licenseNumber?: string | null;
    licenceNumber?: string | null;
    issueDate?: string | null;
    expirationDate?: string | null;
    expiryDate?: string | null;
    issuingCountry?: string | null;
    issuingAuthority?: string | null;
    licenceCategories?: string[];
    extractedAt?: string | Date;
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
