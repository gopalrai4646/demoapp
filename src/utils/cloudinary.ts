import { ENV } from '../config/env';

/**
 * Uploads a local image file to Cloudinary using unsigned upload.
 * 
 * @param uri The local file path from react-native-image-picker
 * @returns The secure URL of the uploaded image
 */
export const uploadToCloudinary = async (uri: string): Promise<string> => {
  const { CLOUD_NAME, UPLOAD_PRESET } = ENV.CLOUDINARY;

  const data = new FormData();
  
  // Create file object for FormData
  const file = {
    uri: uri,
    type: 'image/jpeg', // Standard type for profile photos
    name: 'profile_photo.jpg',
  };

  data.append('file', file as any);
  data.append('upload_preset', UPLOAD_PRESET);
  data.append('cloud_name', CLOUD_NAME);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: data,
        headers: {
          'Content-Type': 'multipart/form-external', // Use custom type for FormData in RN
        },
      }
    );

    const result = await response.json();

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.secure_url;
  } catch (error: any) {
    console.error('Cloudinary Upload Error:', error);
    throw new Error(error.message || 'Failed to upload image to Cloudinary');
  }
};
