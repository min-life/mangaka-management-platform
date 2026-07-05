import type { ImagePickerAsset } from 'expo-image-picker';

interface CloudinaryUploadResponse {
  error?: {
    message?: string;
  };
  secure_url?: string;
  url?: string;
}

const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.trim();

function getCloudinaryUploadUrl() {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error(
      'Missing Cloudinary configuration. Please set EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME and EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET.',
    );
  }

  return `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
}

function getUploadFile(asset: ImagePickerAsset) {
  const fileName = asset.fileName || `avatar-${Date.now()}.jpg`;
  const mimeType = asset.mimeType || 'image/jpeg';

  return {
    name: fileName,
    type: mimeType,
    uri: asset.uri,
  };
}

export async function uploadAvatarToCloudinary(asset: ImagePickerAsset) {
  const formData = new FormData();
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET ?? '');
  formData.append('folder', 'mangaka/avatars');
  formData.append('file', getUploadFile(asset) as unknown as Blob);

  let response: Response;
  try {
    response = await fetch(getCloudinaryUploadUrl(), {
      body: formData,
      method: 'POST',
    });
  } catch {
    throw new Error('Unable to upload the image to Cloudinary. Please try again.');
  }

  let body: CloudinaryUploadResponse | undefined;
  try {
    body = (await response.json()) as CloudinaryUploadResponse;
  } catch {
    body = undefined;
  }

  if (!response.ok) {
    throw new Error(body?.error?.message || 'Cloudinary upload failed.');
  }

  if (!body?.secure_url) {
    throw new Error('Cloudinary did not return a valid image URL.');
  }

  return body.secure_url || body.url;
}
