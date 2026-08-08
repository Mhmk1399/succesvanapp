import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";

const UPLOAD_API = process.env.EXPO_PUBLIC_UPLOAD_API;

interface FormDataFile {
  uri: string;
  type: string;
  name: string;
}

export type UploadProgressCallback = (progress: number) => void;

const mimeByExtension: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
  mp4: "video/mp4",
  mov: "video/quicktime",
};

function inferMimeType(file: ImagePicker.ImagePickerAsset) {
  if (file.mimeType) return file.mimeType;

  const nameOrUri = file.fileName || file.uri || "";
  const ext = nameOrUri.split("?")[0].split(".").pop()?.toLowerCase() || "";
  if (mimeByExtension[ext]) return mimeByExtension[ext];

  if (file.type === "video") return "video/mp4";
  return "image/jpeg";
}

function fileExtension(mimeType: string) {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/gif") return "gif";
  if (mimeType === "image/heic") return "heic";
  if (mimeType === "image/heif") return "heif";
  if (mimeType === "video/quicktime") return "mov";
  if (mimeType === "video/mp4") return "mp4";
  return mimeType.startsWith("video/") ? "mp4" : "jpg";
}

async function buildUploadFormData(
  file: ImagePicker.ImagePickerAsset,
  fileType: "license-front" | "license-back" | "deposit-receipt" | "avatar",
) {
  const formData = new FormData();
  const mimeType = inferMimeType(file);
  const name =
    file.fileName || `${fileType}-${Date.now()}.${fileExtension(mimeType)}`;

  if (Platform.OS === "web") {
    const blob = await fetch(file.uri).then((res) => res.blob());
    const typedBlob = blob.type ? blob : blob.slice(0, blob.size, mimeType);
    formData.append("file", typedBlob as any, name);
  } else {
    const fileData: FormDataFile = {
      uri: file.uri,
      type: mimeType,
      name,
    };
    formData.append("file", fileData as any);
  }

  formData.append("fileType", fileType);
  return formData;
}

function uploadFormDataWithProgress(
  formData: FormData,
  onProgress: UploadProgressCallback,
): Promise<string> {
  if (!UPLOAD_API) {
    return Promise.reject(new Error("Upload API not configure"));
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      onProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
    };

    xhr.onload = () => {
      try {
        if (xhr.status < 200 || xhr.status >= 300) {
          reject(new Error(`Upload failed: ${xhr.status}`));
          return;
        }

        const data = JSON.parse(xhr.responseText || "{}");
        const url = data.url || data.fileUrl;
        if (!url) {
          reject(new Error("Upload response did not include a file URL"));
          return;
        }

        onProgress(100);
        resolve(url);
      } catch (error) {
        reject(error);
      }
    };

    xhr.onerror = () => reject(new Error("Upload failed. Please try again."));
    xhr.onabort = () => reject(new Error("Upload was cancelled."));
    xhr.open("POST", UPLOAD_API);
    xhr.send(formData);
  });
}

export const uploadToS3 = async (
  file: ImagePicker.ImagePickerAsset,
  fileType: "license-front" | "license-back" | "deposit-receipt" | "avatar",
  onProgress?: UploadProgressCallback,
): Promise<string> => {
  try {
    if (!file.uri) {
      throw new Error("No file URI provided");
    }

    if (!UPLOAD_API) {
      throw new Error("Upload API not configure");
    }

    const formData = await buildUploadFormData(file, fileType);

    if (onProgress) {
      return uploadFormDataWithProgress(formData, onProgress);
    }

    const response = await fetch(UPLOAD_API, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    const data = await response.json();
    return data.url || data.fileUrl;
  } catch (error) {
    console.log("[s3Upload] Error:", error);
    throw error;
  }
};
