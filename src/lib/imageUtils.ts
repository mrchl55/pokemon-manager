import fs from 'fs/promises';
import path from 'path';

/**
 * Deletes an uploaded image file from the public/uploads/pokemon directory 
 * if it exists and its path matches the expected pattern.
 * @param imagePath - The path to the image, relative to the public directory (e.g., /uploads/pokemon/image.png)
 */
export async function deleteUploadedImageIfExists(imagePath: string | null | undefined): Promise<void> {
  if (imagePath && imagePath.startsWith('/uploads/pokemon/')) {
    const fullPath = path.join(process.cwd(), 'public', imagePath);
    try {
      await fs.unlink(fullPath);
      console.log(`Deleted image: ${fullPath}`);
    } catch (unlinkError: any) {
      if (unlinkError.code !== 'ENOENT') { // Ignore if file doesn't exist, as it might have been deleted already or never existed
          console.warn(`Could not delete image ${fullPath} (may not exist or permissions issue):`, unlinkError.message);
      }
    }
  }
} 
export async function streamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
      }
    }
    return Buffer.concat(chunks);
  }
  
  // We can add more shared API utility functions here in the future. 