/**
 * Storage — files are stored as base64 data URLs directly in Railway MySQL.
 * No external services required.
 */

export async function storageUploadPostFile(opts: {
  buffer: Buffer;
  mimeType: string;
}): Promise<{ url: string }> {
  const base64 = opts.buffer.toString("base64");
  return { url: `data:${opts.mimeType};base64,${base64}` };
}
