
export const uploadToS3 = async (
  file: any,
  fileType: "license-front" | "license-back"
): Promise<string> => {
  try {
    // For now, return the local URI as-is
    // In production, you would upload to actual S3 or a server endpoint
    if (file.uri) {
      console.log(`[s3Upload] Saving license ${fileType} from:`, file.uri);
      return file.uri;
    } else {
      throw new Error("No file URI provided");
    }
  } catch (error) {
    console.error("[s3Upload] Error:", error);
    throw error;
  }
};
