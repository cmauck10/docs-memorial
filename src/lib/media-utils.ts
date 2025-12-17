import imageCompression from 'browser-image-compression';

/**
 * Convert HEIC/HEIF files to JPEG
 */
export async function convertHeicToJpeg(file: File): Promise<File> {
  // Dynamically import heic2any only when needed (it's a large library)
  const heic2any = (await import('heic2any')).default;
  
  const blob = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: 0.85
  });
  
  // heic2any can return an array of blobs for multi-image HEIC files
  const resultBlob = Array.isArray(blob) ? blob[0] : blob;
  
  // Create a new file with .jpg extension
  const newFileName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
  return new File([resultBlob], newFileName, { type: 'image/jpeg' });
}

/**
 * Compress an image file
 */
export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 0.5, // Target ~500KB
    maxWidthOrHeight: 1920, // Max dimension
    useWebWorker: true,
    fileType: 'image/jpeg' as const,
    initialQuality: 0.85,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    
    // Ensure the file has the right extension
    let fileName = file.name;
    if (!fileName.toLowerCase().endsWith('.jpg') && !fileName.toLowerCase().endsWith('.jpeg')) {
      fileName = fileName.replace(/\.[^.]+$/, '.jpg');
    }
    
    return new File([compressedFile], fileName, { type: 'image/jpeg' });
  } catch (error) {
    console.error('Image compression failed:', error);
    return file; // Return original if compression fails
  }
}

/**
 * Process an image file - convert HEIC if needed and compress
 */
export async function processImage(file: File): Promise<File> {
  let processedFile = file;
  
  // Check if it's a HEIC/HEIF file
  const isHeic = file.type === 'image/heic' || 
                 file.type === 'image/heif' ||
                 file.name.toLowerCase().endsWith('.heic') ||
                 file.name.toLowerCase().endsWith('.heif');
  
  if (isHeic) {
    console.log('Converting HEIC to JPEG...');
    processedFile = await convertHeicToJpeg(file);
  }
  
  // Compress the image
  console.log('Compressing image...');
  const originalSize = processedFile.size;
  processedFile = await compressImage(processedFile);
  const newSize = processedFile.size;
  
  console.log(`Image processed: ${(originalSize / 1024 / 1024).toFixed(2)}MB → ${(newSize / 1024 / 1024).toFixed(2)}MB`);
  
  return processedFile;
}

/**
 * Compress a video file (basic - just checks size for now)
 * Full video compression would require ffmpeg.wasm which is heavy
 */
export async function processVideo(file: File): Promise<File> {
  // For now, we just validate size
  // Video compression in browser is complex and resource-intensive
  // Consider using a service like Mux or Cloudinary for production
  
  const maxSizeMB = 50; // 50MB max for videos
  
  if (file.size > maxSizeMB * 1024 * 1024) {
    throw new Error(`Video must be less than ${maxSizeMB}MB. Consider trimming or compressing before upload.`);
  }
  
  return file;
}

/**
 * Process any media file
 */
export async function processMedia(file: File): Promise<{ file: File; type: 'image' | 'video' }> {
  const isImage = file.type.startsWith('image/') || 
                  file.name.toLowerCase().endsWith('.heic') ||
                  file.name.toLowerCase().endsWith('.heif');
  const isVideo = file.type.startsWith('video/');
  
  if (isImage) {
    const processed = await processImage(file);
    return { file: processed, type: 'image' };
  } else if (isVideo) {
    const processed = await processVideo(file);
    return { file: processed, type: 'video' };
  }
  
  throw new Error('Unsupported file type');
}

