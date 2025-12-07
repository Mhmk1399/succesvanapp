import { Van } from "../vanlist";

export type BookingModalProps = {
  visible: boolean;
  van: Van | null;
  onClose: () => void;
  prefilledData?: {
    office: string;
    category: string;
    pickupDate: string;
    returnDate: string;
  };
};

export type PickerField = "pickupDate" | "pickupTime" | "returnDate" | "returnTime" | null;
