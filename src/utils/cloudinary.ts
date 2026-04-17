import { ENV } from '../config/env';

/**
 * Uploads a local file to Cloudinary using unsigned upload.
 * 
 * @param uri The local file path from react-native-image-picker
 * @param resourceType 'image' or 'video'
 * @param fileName Optional filename
 * @returns The secure URL of the uploaded file
 */
export const uploadToCloudinary = async (
  uri: string, 
  resourceType: 'image' | 'video' = 'image', 
  fileName?: string
): Promise<string> => {
  const { CLOUD_NAME, UPLOAD_PRESET } = ENV.CLOUDINARY;

  const data = new FormData();
  
  // Create file object for FormData
  const file = {
    uri: uri,
    type: resourceType === 'image' ? 'image/jpeg' : 'video/mp4',
    name: fileName || (resourceType === 'image' ? 'photo.jpg' : 'video.mp4'),
  };

  data.append('file', file as any);
  data.append('upload_preset', UPLOAD_PRESET);
  data.append('cloud_name', CLOUD_NAME);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
      {
        method: 'POST',
        body: data,
      }
    );

    const result = await response.json();

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result.secure_url;
  } catch (error: any) {
    console.error(`Cloudinary ${resourceType} Upload Error:`, error);
    throw new Error(error.message || `Failed to upload ${resourceType} to Cloudinary`);
  }
};

