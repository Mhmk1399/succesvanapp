import type { Office, SpecialDay, WorkingTime } from "@/types/type";

type WorkingWindowKind = "pickup" | "return";
type ExtensionKind = "pickupExtension" | "returnExtension";

type TimeWindow = {
  isOpen: boolean;
  startTime: string;
  endTime: string;
};

export type ExtensionRange = {
  startTime: string;
  endTime: string;
  flatPrice: number;
};

export type TimeSlotInfo = {
  start: string;
  end: string;
  normalStart: string;
  normalEnd: string;
  slots: string[];
  specialDay?: SpecialDay;
  extensionRanges: ExtensionRange[];
};

const DAYS: WorkingTime["day"][] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const fallbackWindow = (specialDay: SpecialDay) => ({
  startTime: specialDay.startTime || "00:00",
  endTime: specialDay.endTime || "23:59",
});

const toMinutes = (time?: string, fallback = "00:00") => {
  const [hours, minutes] = (time || fallback).split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return undefined;
  return hours * 60 + minutes;
};

const toTime = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(
    minutes % 60,
  ).padStart(2, "0")}`;

export const getDayName = (date: Date) => DAYS[date.getDay()];

export const isSameCalendarDate = (left: Date, right: Date) =>
  left.toDateString() === right.toDateString();

export const findSpecialDayForDate = (
  specialDays: SpecialDay[] | undefined,
  date: Date,
) => {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return specialDays?.find(
    (specialDay) => specialDay.month === month && specialDay.day === day,
  );
};

export const getSpecialDayPickupWindow = (specialDay: SpecialDay) => {
  const fallback = fallbackWindow(specialDay);
  return {
    startTime:
      specialDay.pickupTime?.startTime ||
      specialDay.pickupExtension?.startTime ||
      fallback.startTime,
    endTime:
      specialDay.pickupTime?.endTime ||
      specialDay.pickupExtension?.endTime ||
      fallback.endTime,
  };
};

export const getSpecialDayReturnWindow = (specialDay: SpecialDay) => {
  const fallback = fallbackWindow(specialDay);
  return {
    startTime:
      specialDay.returnTime?.startTime ||
      specialDay.returnExtension?.startTime ||
      specialDay.pickupTime?.startTime ||
      specialDay.pickupExtension?.startTime ||
      fallback.startTime,
    endTime:
      specialDay.returnTime?.endTime ||
      specialDay.returnExtension?.endTime ||
      specialDay.pickupTime?.endTime ||
      specialDay.pickupExtension?.endTime ||
      fallback.endTime,
  };
};

export const getWorkingDayWindow = (
  workingDay: WorkingTime,
  kind: WorkingWindowKind,
): TimeWindow => {
  const timeWindow =
    kind === "pickup" ? workingDay.pickupTime : workingDay.returnTime;
  const hasDedicatedWindow = Boolean(timeWindow);

  return {
    isOpen: timeWindow?.isOpen ?? workingDay.isOpen,
    startTime: hasDedicatedWindow
      ? timeWindow?.startTime || "00:00"
      : workingDay.startTime || "00:00",
    endTime: hasDedicatedWindow
      ? timeWindow?.endTime || "23:59"
      : workingDay.endTime || "23:59",
  };
};

const getExtensionKey = (kind: WorkingWindowKind): ExtensionKind =>
  kind === "pickup" ? "pickupExtension" : "returnExtension";

const buildLegacyExtensionRanges = (
  window: TimeWindow,
  extension: WorkingTime[ExtensionKind],
) => {
  if (!extension) return [];

  const startMinutes = toMinutes(window.startTime);
  const endMinutes = toMinutes(window.endTime);
  if (startMinutes === undefined || endMinutes === undefined) return [];

  const ranges: ExtensionRange[] = [];
  const flatPrice = extension.flatPrice || 0;

  if ((extension.hoursBefore || 0) > 0) {
    ranges.push({
      startTime: toTime(Math.max(0, startMinutes - extension.hoursBefore * 60)),
      endTime: window.startTime,
      flatPrice,
    });
  }

  if ((extension.hoursAfter || 0) > 0) {
    ranges.push({
      startTime: window.endTime,
      endTime: toTime(Math.min(1439, endMinutes + extension.hoursAfter * 60)),
      flatPrice,
    });
  }

  return ranges;
};

export const getWorkingDayExtensionRanges = (
  workingDay: WorkingTime,
  kind: WorkingWindowKind,
) => {
  const normalWindow = getWorkingDayWindow(workingDay, kind);
  const extension = workingDay[getExtensionKey(kind)];
  if (!normalWindow.isOpen || !extension) return [];

  if (extension.startTime && extension.endTime) {
    return [
      {
        startTime: extension.startTime,
        endTime: extension.endTime,
        flatPrice: extension.flatPrice || 0,
      },
    ];
  }

  return buildLegacyExtensionRanges(normalWindow, extension);
};

export const generateTimeSlots = (
  startTime: string,
  endTime: string,
  interval = 15,
) => {
  const startMinutes = toMinutes(startTime);
  const endMinutes = toMinutes(endTime);
  if (
    startMinutes === undefined ||
    endMinutes === undefined ||
    startMinutes > endMinutes
  ) {
    return [];
  }

  const slots: string[] = [];
  for (
    let currentMinutes = startMinutes;
    currentMinutes <= endMinutes;
    currentMinutes += interval
  ) {
    slots.push(toTime(currentMinutes));
  }
  return slots;
};

export const getWorkingDayTimeSlots = (
  workingDay: WorkingTime,
  kind: WorkingWindowKind,
  interval = 15,
) => {
  const normalWindow = getWorkingDayWindow(workingDay, kind);
  if (!normalWindow.isOpen) return [];

  const slots =
    normalWindow.startTime === normalWindow.endTime
      ? []
      : generateTimeSlots(normalWindow.startTime, normalWindow.endTime, interval);

  getWorkingDayExtensionRanges(workingDay, kind).forEach((range) => {
    slots.push(...generateTimeSlots(range.startTime, range.endTime, interval));
  });

  return Array.from(new Set(slots)).sort();
};

export const isDateDisabled = (date: Date, office?: Office) => {
  if (!office) return false;

  const specialDay = findSpecialDayForDate(office.specialDays, date);
  if (specialDay && !specialDay.isOpen) return true;

  const workingDay = office.workingTime?.find(
    (workingTime) => workingTime.day === getDayName(date),
  );
  return Boolean(workingDay && !workingDay.isOpen);
};

export const getAvailableTimeSlots = (
  date: Date | null,
  office: Office | undefined,
  kind: WorkingWindowKind = "pickup",
): TimeSlotInfo => {
  if (!office || !date) {
    return {
      start: "00:00",
      end: "23:59",
      normalStart: "00:00",
      normalEnd: "23:59",
      slots: generateTimeSlots("00:00", "23:59", 15),
      extensionRanges: [],
    };
  }

  const specialDay = findSpecialDayForDate(office.specialDays, date);
  if (specialDay?.isOpen) {
    const window =
      kind === "pickup"
        ? getSpecialDayPickupWindow(specialDay)
        : getSpecialDayReturnWindow(specialDay);

    return {
      start: window.startTime,
      end: window.endTime,
      normalStart: window.startTime,
      normalEnd: window.endTime,
      slots: generateTimeSlots(window.startTime, window.endTime, 15),
      specialDay,
      extensionRanges: [],
    };
  }

  const workingDay = office.workingTime?.find(
    (workingTime) =>
      workingTime.day === getDayName(date) && workingTime.isOpen,
  );

  if (!workingDay) {
    return {
      start: "00:00",
      end: "23:59",
      normalStart: "00:00",
      normalEnd: "23:59",
      slots: generateTimeSlots("00:00", "23:59", 15),
      extensionRanges: [],
    };
  }

  const normalWindow = getWorkingDayWindow(workingDay, kind);
  const extensionRanges = getWorkingDayExtensionRanges(workingDay, kind);
  const slots = getWorkingDayTimeSlots(workingDay, kind, 15);

  return {
    start: slots[0] || normalWindow.startTime,
    end: slots[slots.length - 1] || normalWindow.endTime,
    normalStart: normalWindow.startTime,
    normalEnd: normalWindow.endTime,
    slots,
    extensionRanges,
  };
};

const calculateRegularExtensionPrice = (
  workingDay: WorkingTime | undefined,
  selectedTime: string | undefined,
  kind: WorkingWindowKind,
) => {
  if (!workingDay || !selectedTime) return 0;
  const normalWindow = getWorkingDayWindow(workingDay, kind);
  if (!normalWindow.isOpen) return 0;

  const extension = workingDay[getExtensionKey(kind)];
  if (!extension) return 0;

  const selectedMinutes = toMinutes(selectedTime);
  const startMinutes = toMinutes(normalWindow.startTime);
  const endMinutes = toMinutes(normalWindow.endTime);

  if (
    selectedMinutes === undefined ||
    startMinutes === undefined ||
    endMinutes === undefined
  ) {
    return 0;
  }

  const isClosedNormalWindow = startMinutes === endMinutes;
  const isOutsideNormalWindow =
    selectedMinutes < startMinutes || selectedMinutes > endMinutes;

  if (!isClosedNormalWindow && !isOutsideNormalWindow) return 0;

  const extensionRange = getWorkingDayExtensionRanges(workingDay, kind).find(
    (range) => {
      const rangeStart = toMinutes(range.startTime);
      const rangeEnd = toMinutes(range.endTime);
      return (
        rangeStart !== undefined &&
        rangeEnd !== undefined &&
        selectedMinutes >= rangeStart &&
        selectedMinutes <= rangeEnd
      );
    },
  );

  return extensionRange?.flatPrice || 0;
};

export const calculateOfficeExtensionPrices = ({
  office,
  pickupDate,
  pickupTime,
  returnDate,
  returnTime,
}: {
  office: Office;
  pickupDate?: Date | null;
  pickupTime?: string;
  returnDate?: Date | null;
  returnTime?: string;
}) => {
  let pickupExtension = 0;
  let returnExtension = 0;

  if (pickupDate && pickupTime) {
    const pickupSpecialDay = findSpecialDayForDate(
      office.specialDays,
      pickupDate,
    );

    if (pickupSpecialDay?.isOpen) {
      pickupExtension = pickupSpecialDay.extraPrice || 0;
    } else {
      const pickupDaySchedule = office.workingTime?.find(
        (workingDay) =>
          workingDay.day === getDayName(pickupDate) && workingDay.isOpen,
      );
      pickupExtension = calculateRegularExtensionPrice(
        pickupDaySchedule,
        pickupTime,
        "pickup",
      );
    }
  }

  if (returnDate && returnTime) {
    const returnSpecialDay = findSpecialDayForDate(
      office.specialDays,
      returnDate,
    );

    if (returnSpecialDay?.isOpen) {
      const pickupSpecialDay = pickupDate
        ? findSpecialDayForDate(office.specialDays, pickupDate)
        : undefined;
      const isSamePricedSpecialDay = Boolean(
        pickupDate &&
          pickupSpecialDay?.isOpen &&
          pickupSpecialDay.month === returnSpecialDay.month &&
          pickupSpecialDay.day === returnSpecialDay.day &&
          isSameCalendarDate(pickupDate, returnDate),
      );

      returnExtension = isSamePricedSpecialDay
        ? 0
        : returnSpecialDay.extraPrice || 0;
    } else {
      const returnDaySchedule = office.workingTime?.find(
        (workingDay) =>
          workingDay.day === getDayName(returnDate) && workingDay.isOpen,
      );
      returnExtension = calculateRegularExtensionPrice(
        returnDaySchedule,
        returnTime,
        "return",
      );
    }
  }

  if (
    pickupDate &&
    returnDate &&
    pickupExtension > 0 &&
    returnExtension > 0 &&
    isSameCalendarDate(pickupDate, returnDate)
  ) {
    returnExtension = 0;
  }

  return { pickupExtension, returnExtension };
};
