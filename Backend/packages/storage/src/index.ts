import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  type PutObjectCommandInput,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '@mcq-platform/config';
import { createLogger } from '@mcq-platform/logger';
import type { Readable } from 'node:stream';

const logger = createLogger('storage');

// Initialize S3 client pointing at MinIO
const s3 = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region: env.S3_REGION,
  forcePathStyle: true, // Required for MinIO
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY,
    secretAccessKey: env.S3_SECRET_KEY,
  },
});

const BUCKET = env.S3_BUCKET;

export interface UploadParams {
  key: string;
  body: Buffer | Readable | ReadableStream | Blob | string;
  contentType: string;
  metadata?: Record<string, string>;
}

export interface PresignedUploadParams {
  key: string;
  contentType: string;
  expiresIn?: number; // seconds, default 3600
}

export interface PresignedDownloadParams {
  key: string;
  expiresIn?: number; // seconds, default 3600
  filename?: string; // Content-Disposition filename
}

/**
 * Upload a file to S3/MinIO.
 */
export async function upload({ key, body, contentType, metadata }: UploadParams): Promise<void> {
  const input: PutObjectCommandInput = {
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
    Metadata: metadata,
  };

  await s3.send(new PutObjectCommand(input));
  logger.info({ key, contentType }, 'File uploaded');
}

/**
 * Generate a presigned URL for direct client upload.
 */
export async function getPresignedUploadUrl({
  key,
  contentType,
  expiresIn = 3600,
}: PresignedUploadParams): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(s3, command, { expiresIn });
}

/**
 * Generate a presigned URL for client download.
 */
export async function getPresignedDownloadUrl({
  key,
  expiresIn = 3600,
  filename,
}: PresignedDownloadParams): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ...(filename && {
      ResponseContentDisposition: `attachment; filename="${filename}"`,
    }),
  });

  return getSignedUrl(s3, command, { expiresIn });
}

/**
 * Download a file and return the body stream.
 */
export async function download(key: string): Promise<{
  body: Readable;
  contentType: string | undefined;
  contentLength: number | undefined;
}> {
  const result = await s3.send(
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
  );

  return {
    body: result.Body as Readable,
    contentType: result.ContentType,
    contentLength: result.ContentLength,
  };
}

/**
 * Check if a file exists and get its metadata.
 */
export async function headObject(key: string): Promise<{
  exists: boolean;
  contentLength?: number;
  contentType?: string;
}> {
  try {
    const result = await s3.send(
      new HeadObjectCommand({ Bucket: BUCKET, Key: key }),
    );
    return {
      exists: true,
      contentLength: result.ContentLength,
      contentType: result.ContentType,
    };
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'NotFound') {
      return { exists: false };
    }
    throw err;
  }
}

/**
 * Delete a file.
 */
export async function deleteObject(key: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({ Bucket: BUCKET, Key: key }),
  );
  logger.info({ key }, 'File deleted');
}

/**
 * List objects with a given prefix.
 */
export async function listObjects(
  prefix: string,
  maxKeys: number = 1000,
): Promise<Array<{ key: string; size: number; lastModified: Date }>> {
  const result = await s3.send(
    new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix,
      MaxKeys: maxKeys,
    }),
  );

  return (result.Contents ?? []).map((obj) => ({
    key: obj.Key!,
    size: obj.Size!,
    lastModified: obj.LastModified!,
  }));
}

/**
 * Build the S3 key for a document upload.
 * Format: workspaces/{wid}/documents/{docId}/{filename}
 */
export function buildDocumentKey(
  workspaceId: string,
  documentId: string,
  filename: string,
): string {
  return `workspaces/${workspaceId}/documents/${documentId}/${filename}`;
}

/**
 * Build the S3 key for a page image.
 * Format: workspaces/{wid}/documents/{docId}/pages/{pageNum}.{format}
 */
export function buildPageImageKey(
  workspaceId: string,
  documentId: string,
  pageNum: number,
  format: string,
): string {
  return `workspaces/${workspaceId}/documents/${documentId}/pages/${pageNum}.${format}`;
}

/**
 * Build the S3 key for an export artifact.
 * Format: workspaces/{wid}/exports/{exportId}/{filename}
 */
export function buildExportKey(
  workspaceId: string,
  exportId: string,
  filename: string,
): string {
  return `workspaces/${workspaceId}/exports/${exportId}/${filename}`;
}

export { s3, BUCKET };
