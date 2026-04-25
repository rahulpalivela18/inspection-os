import { Storage } from '@google-cloud/storage';

const projectId = process.env.GCP_PROJECT_ID || 'reportgen-494420';
const bucketName = process.env.GCP_BUCKET_NAME || 'reportgen-images-rahul';

let storage: any;
let bucket: any;

const creds = process.env.GCP_CREDENTIALS;
if (creds) {
  try {
    const credentials = JSON.parse(creds);
    storage = new Storage({ projectId, credentials });
    bucket = storage.bucket(bucketName);
  } catch (error) {}
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