import { safeFetch } from "@/services/apiClient";

const LONDON_TIME_ZONE = "Europe/London";

let serverClockOffsetMs = 0;
let serverEpochAtSyncMs: number | null = null;
let monotonicAtSyncMs = 0;
let syncPromise: Promise<number> | null = null;

const monotonicNow = () =>
  typeof globalThis.performance?.now === "function"
    ? globalThis.performance.now()
    : Date.now();

const getTimeApiUrl = () => {
  const base = (process.env.EXPO_PUBLIC_API_BASE_URL || "").trim();
  if (!base) return "";
  return `${base.replace(/\/$/, "")}/time`;
};

export const getTrustedNowMs = () => {
  if (serverEpochAtSyncMs !== null) {
    return serverEpochAtSyncMs + (monotonicNow() - monotonicAtSyncMs);
  }
  return Date.now() + serverClockOffsetMs;
};

export const getTrustedNow = () => new Date(getTrustedNowMs());

export const syncServerClock = async (force = false): Promise<number> => {
  const url = getTimeApiUrl();
  if (!url) return 0;
  if (force) syncPromise = null;

  if (!syncPromise) {
    syncPromise = (async () => {
      const requestStartClock = Date.now();
      const requestStartMono = monotonicNow();
      const response = await safeFetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to fetch server time");
      const data = await response.json();
      const requestEndClock = Date.now();
      const requestEndMono = monotonicNow();
      const timestamp = Number(data.timestamp || data?.data?.timestamp || 0);
      if (!Number.isFinite(timestamp) || timestamp <= 0) {
        throw new Error("Server time response is invalid");
      }

      const roundTripMs = Math.max(0, requestEndMono - requestStartMono);
      serverEpochAtSyncMs = timestamp + roundTripMs / 2;
      monotonicAtSyncMs = requestEndMono;
      serverClockOffsetMs = serverEpochAtSyncMs - requestEndClock;
      return serverClockOffsetMs;
    })().catch((error) => {
      syncPromise = null;
      throw error;
    });
  }

  return syncPromise;
};

export const getLondonTime = (): Date => {
  const now = getTrustedNow();
  const londonStr = now.toLocaleString("en-US", {
    timeZone: "Europe/London",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    hourCycle: "h23",
  });

  const [datePart, timePart] = londonStr.split(", ");
  if (!datePart || !timePart) return getTrustedNow();

  const [monthStr, dayStr, yearStr] = datePart.split("/");
  const [hourStr, minuteStr, secondStr] = timePart.split(":");
  return new Date(
    Date.UTC(
      Number(yearStr),
      Number(monthStr) - 1,
      Number(dayStr),
      Number(hourStr),
      Number(minuteStr),
      Number(secondStr),
    ),
  );
};

export const formatDateForStorage = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const formatDateInputInLondon = (value?: string | Date): string => {
  const date = value
    ? typeof value === "string"
      ? new Date(value)
      : value
    : getTrustedNow();
  if (Number.isNaN(date.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: LONDON_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const dateParts = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
};

export const addDaysToDateInput = (dateInput: string, days: number): string => {
  const [year, month, day] = dateInput.split("-").map(Number);
  if (!year || !month || !day) return "";
  const date = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0));
  return date.toISOString().split("T")[0];
};

export const getMinimumPickupDateInput = (): string => {
  const londonTime = getLondonTime();
  const daysAhead = londonTime.getUTCHours() < 16 ? 1 : 2;
  return addDaysToDateInput(formatDateInputInLondon(getTrustedNow()), daysAhead);
};

export const formatDateInLondon = (value?: string | Date): string => {
  if (!value) return "-";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB", {
    timeZone: LONDON_TIME_ZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const formatDateTimeInLondon = (value?: string | Date): string => {
  if (!value) return "-";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-GB", {
    timeZone: LONDON_TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const getTimeZoneOffsetMs = (date: Date, timeZone: string) => {
  const wholeSecondDate = new Date(Math.floor(date.getTime() / 1000) * 1000);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    hourCycle: "h23",
  }).formatToParts(wholeSecondDate);

  const dateParts = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  const zonedTimeAsUtc = Date.UTC(
    Number(dateParts.year),
    Number(dateParts.month) - 1,
    Number(dateParts.day),
    Number(dateParts.hour),
    Number(dateParts.minute),
    Number(dateParts.second),
  );

  return zonedTimeAsUtc - wholeSecondDate.getTime();
};

const londonDateTimeToUtcMs = (
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  millisecond = 0,
) => {
  const localAsUtc = Date.UTC(
    year,
    month - 1,
    day,
    hour,
    minute,
    second,
    millisecond,
  );
  let utc = localAsUtc;

  for (let i = 0; i < 2; i += 1) {
    const offset = getTimeZoneOffsetMs(new Date(utc), LONDON_TIME_ZONE);
    const next = localAsUtc - offset;
    if (next === utc) break;
    utc = next;
  }

  return utc;
};

export const getInclusiveLondonDeadline = (value?: string | Date): Date | null => {
  if (!value) return null;
  const text = String(value);
  const dateOnly = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    const deadline = new Date(
      londonDateTimeToUtcMs(
        Number(year),
        Number(month),
        Number(day),
        23,
        59,
        59,
        999,
      ),
    );
    return Number.isNaN(deadline.getTime()) ? null : deadline;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

export const createLondonDateTime = (date: Date, time: string): string => {
  const [year, month, day] = formatDateForStorage(date).split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));
  const londonOffset = getTimeZoneOffsetMs(utcGuess, LONDON_TIME_ZONE);
  return new Date(utcGuess.getTime() - londonOffset).toISOString();
};
