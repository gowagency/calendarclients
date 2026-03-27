import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from "./_core/env";

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

export async function storageDelete(key: string): Promise<void> {
  const s3 = getS3();
  if (!s3) return;
  await s3.send(new DeleteObjectCommand({ Bucket: ENV.awsBucket, Key: key }));
}
