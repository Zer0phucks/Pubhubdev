import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * DigitalOcean Spaces integration
 * Replaces Supabase Storage functionality
 */

const spacesClient = new S3Client({
  endpoint: `https://${process.env.SPACES_REGION || 'nyc3'}.digitaloceanspaces.com`,
  region: process.env.SPACES_REGION || 'nyc3',
  credentials: {
    accessKeyId: process.env.SPACES_ACCESS_KEY || '',
    secretAccessKey: process.env.SPACES_SECRET_KEY || '',
  },
  forcePathStyle: false,
});

const BUCKET_NAME = process.env.SPACES_BUCKET || 'pubhub-uploads';
const CDN_ENDPOINT = process.env.SPACES_CDN_ENDPOINT || '';

/**
 * Upload a file to DigitalOcean Spaces
 */
export async function uploadFile(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
  options?: {
    public?: boolean;
    cacheControl?: string;
  }
): Promise<{ url: string; key: string }> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
    ACL: options?.public ? 'public-read' : 'private',
    CacheControl: options?.cacheControl,
  });

  await spacesClient.send(command);

  // Return CDN URL if available, otherwise construct Spaces URL
  const url = CDN_ENDPOINT
    ? `https://${CDN_ENDPOINT}/${key}`
    : `https://${BUCKET_NAME}.${process.env.SPACES_REGION || 'nyc3'}.digitaloceanspaces.com/${key}`;

  return { url, key };
}

/**
 * Generate a signed URL for private file access
 */
export async function getSignedUrlForFile(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(spacesClient, command, { expiresIn });
}

/**
 * Delete a file from Spaces
 */
export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await spacesClient.send(command);
}

/**
 * List files with a prefix
 */
export async function listFiles(prefix: string): Promise<string[]> {
  const command = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    Prefix: prefix,
  });

  const response = await spacesClient.send(command);
  return (response.Contents || []).map((obj) => obj.Key || '').filter(Boolean);
}

/**
 * Initialize storage bucket (create if doesn't exist)
 * Note: This requires Spaces API or manual setup via DO console
 */
export async function initializeBucket(): Promise<void> {
  // DigitalOcean Spaces buckets must be created via console or API
  // This function is a placeholder for validation
  console.log(`Using Spaces bucket: ${BUCKET_NAME}`);
}

