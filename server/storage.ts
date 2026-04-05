import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { ENV } from "./_core/env";
import { driveUpload, driveAvailable } from "./googleDrive";

let _s3: S3Client | null = null;

function getS3(): S3Client | null {
  if (!ENV.awsBucket) return null;
  if (!_s3) {
    _s3 = new S3Client({ region: ENV.awsRegion });
  }
  return _s3;
}

export async function storagePut(
  key: string,
  body: Buffer,
  contentType = "application/octet-stream"
): Promise<{ url: string }> {
  const s3 = getS3();
  if (!s3) {
    console.warn("[Storage] S3 not configured, skipping upload");
    return { url: "" };
  }
  await s3.send(
    new PutObjectCommand({
      Bucket: ENV.awsBucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  const url = `https://${ENV.awsBucket}.s3.${ENV.awsRegion}.amazonaws.com/${key}`;
  return { url };
}

/**
 * Upload a post cover or attachment.
 * Prefers Google Drive when configured, falls back to S3, throws if neither is available.
 */
export async function storageUploadPostFile(opts: {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  scheduledDate?: number | null;
  sortOrder?: number | null;
  postTitle?: string;
}): Promise<{ url: string }> {
  // 1. Try Google Drive first
  if (driveAvailable()) {
    return driveUpload(opts);
  }

  // 2. Fall back to S3
  const s3 = getS3();
  if (s3) {
    const key = `gow-calendar/uploads/${Date.now()}-${opts.fileName}`;
    await s3.send(
      new PutObjectCommand({
        Bucket: ENV.awsBucket,
        Key: key,
        Body: opts.buffer,
        ContentType: opts.mimeType,
      })
    );
    return { url: `https://${ENV.awsBucket}.s3.${ENV.awsRegion}.amazonaws.com/${key}` };
  }

  throw new Error("Nenhum armazenamento configurado. Configure GOOGLE_SERVICE_ACCOUNT_JSON + GOOGLE_DRIVE_FOLDER_ID no Railway.");
}

export async function storageDelete(key: string): Promise<void> {
  const s3 = getS3();
  if (!s3) return;
  await s3.send(new DeleteObjectCommand({ Bucket: ENV.awsBucket, Key: key }));
}
