/**
 * Extracts the public ID from a Cloudinary URL.
 * Example URL: https://res.cloudinary.com/drkgxobb3/image/upload/v1740292021/lms-project/q7n3z1x9b2v5c4r6e8t0.jpg
 * Public ID: lms-project/q7n3z1x9b2v5c4r6e8t0
 */
export const extractPublicIdFromUrl = (url: string): string | null => {
  if (!url || !url.includes('cloudinary.com')) return null;

  try {
    // Split by '/upload/' to get the part after it
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;

    // Remove the version (e.g., 'v12345678/') if it exists
    let publicIdWithExtension = parts[1];
    if (publicIdWithExtension.startsWith('v')) {
      const versionSlashIndex = publicIdWithExtension.indexOf('/');
      if (versionSlashIndex !== -1) {
        publicIdWithExtension = publicIdWithExtension.substring(versionSlashIndex + 1);
      }
    }

    // Remove the file extension (e.g., '.jpg')
    const lastDotIndex = publicIdWithExtension.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      return publicIdWithExtension.substring(0, lastDotIndex);
    }

    return publicIdWithExtension;
  } catch (error) {
    console.error('Error extracting public ID from Cloudinary URL:', error);
    return null;
  }
};
