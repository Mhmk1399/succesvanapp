import * as ImagePicker from "expo-image-picker";

const UPLOAD_API = process.env.EXPO_PUBLIC_UPLOAD_API;

interface FormDataFile {
  uri: string;
  type: string;
  name: string;
}

export const uploadToS3 = async (
  file: ImagePicker.ImagePickerAsset,
  fileType: "license-front" | "license-back"
): Promise<string> => {
  try {
    if (!file.uri) {
      throw new Error("No file URI provided");
    }

    if (!UPLOAD_API) {
      throw new Error("Upload API not configured");
    }

    const formData = new FormData();
    const fileData: FormDataFile = {
      uri: file.uri,
      type: file.type || "image/jpeg",
      name: `${fileType}-${Date.now()}.jpg`,
    };
    formData.append("file", fileData as any);
    formData.append("fileType", fileType);

    const response = await fetch(UPLOAD_API, {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    const data = await response.json();
    return data.url || data.fileUrl;
  } catch (error) {
    console.error("[s3Upload] Error:", error);
    throw error;
  }
};
