const IMAGE_PATH_PATTERN = /\.(avif|gif|jpe?g|png|webp)(\?.*)?$/i;

const getApiOrigin = () => {
  const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || "";
  return baseUrl.replace(/\/api(?:\/.*)?$/i, "").replace(/\/$/, "");
};

const normalizeImageValue = (value: unknown): string | null => {
  if (!value) return null;

  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;
    return normalizeImageValue(
      record.url || record.uri || record.src || record.location,
    );
  }

  if (typeof value !== "string") return null;

  const imageValue = value.trim();
  if (!imageValue) return null;

  if (/^(https?:|file:|content:|data:image\/)/i.test(imageValue)) {
    return imageValue;
  }

  const origin = getApiOrigin();

  if (imageValue.startsWith("//")) {
    return `https:${imageValue}`;
  }

  if (imageValue.startsWith("/") && origin) {
    return `${origin}${imageValue}`;
  }

  if (IMAGE_PATH_PATTERN.test(imageValue) && origin) {
    return `${origin}/${imageValue.replace(/^\/+/, "")}`;
  }

  return null;
};

export const getAddonImageUri = (addon: unknown): string | null => {
  if (!addon || typeof addon !== "object") return null;

  const record = addon as Record<string, unknown>;
  const images = Array.isArray(record.images) ? record.images : [];
  const candidates = [
    record.image,
    record.imageUrl,
    record.thumbnail,
    record.photo,
    record.picture,
    images[0],
    record.icon,
  ];

  for (const candidate of candidates) {
    const imageUri = normalizeImageValue(candidate);
    if (imageUri) return imageUri;
  }

  return null;
};
