let serverClockOffsetMs = 0;
let syncPromise: Promise<number> | null = null;

const getTimeApiUrl = () => {
  const base = (process.env.EXPO_PUBLIC_API_BASE_URL || "").trim();
  if (!base) return "";
  return `${base.replace(/\/$/, "")}/time`;
};

export const getTrustedNow = () => new Date(Date.now() + serverClockOffsetMs);

export const syncServerClock = async (force = false): Promise<number> => {
  const url = getTimeApiUrl();
  if (!url) return 0;
  if (force) syncPromise = null;

  if (!syncPromise) {
    syncPromise = (async () => {
      const requestStart = Date.now();
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error("Failed to fetch server time");
      const data = await response.json();
      const requestEnd = Date.now();
      const midpoint = requestStart + (requestEnd - requestStart) / 2;
      serverClockOffsetMs = Number(data.timestamp || 0) - midpoint;
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

const getTimeZoneOffsetMs = (date: Date, timeZone: string) => {
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
  }).formatToParts(date);

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

  return zonedTimeAsUtc - date.getTime();
};

export const createLondonDateTime = (date: Date, time: string): string => {
  const [year, month, day] = formatDateForStorage(date).split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));
  const londonOffset = getTimeZoneOffsetMs(utcGuess, "Europe/London");
  return new Date(utcGuess.getTime() - londonOffset).toISOString();
};
