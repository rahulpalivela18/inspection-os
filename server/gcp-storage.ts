import { Storage } from '@google-cloud/storage';
import path from 'path';
import fs from 'fs';

const keyFilename = path.join(process.cwd(), 'server', 'gcp-credentials.json');
const projectId = 'reportgen-494420';
const bucketName = 'reportgen-images';

let storage: any;
let bucket: any;

// Initialize GCP storage
try {
  if (fs.existsSync(keyFilename)) {
    storage = new Storage({
      projectId,
      keyFilename,
    });
    bucket = storage.bucket(bucketName);
    console.log('GCP Storage initialized for bucket:', bucketName);
  } else {
    console.log('GCP credentials not found, image uploads will use base64');
  }
} catch (error) {
  console.error('Failed to initialize GCP Storage:', error);
}

export async function uploadImageToGCP(base64Data: string, filename: string): Promise<string | null> {
  if (!bucket || !base64Data) return null;

  try {
    // Remove data URL prefix if present
    const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Content, 'base64');

    // Generate unique filename
    const uniqueFilename = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const file = bucket.file(uniqueFilename);

    // Upload
    await file.save(buffer, {
      contentType: getContentType(filename),
      metadata: {
        cacheControl: 'public, max-age=31536000',
      },
    });

    return `https://storage.googleapis.com/${bucketName}/${uniqueFilename}`;
  } catch (error) {
    console.error('GCP upload error:', error);
    return null;
  }
}

function getContentType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop();
  const types: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
  };
  return types[ext || 'jpg'] || 'image/jpeg';
}

export function isGCPUrl(url: string): boolean {
  return url?.includes('storage.googleapis.com') || url?.includes('gs://');
}