/**
 * Google Drive integration — uploads files to a structured folder hierarchy:
 *
 *   Parent folder (GOOGLE_DRIVE_FOLDER_ID)
 *   └── YYYY-MM-DD  (scheduledDate of the post, e.g. "2026-04-20")
 *       └── 01 - Título do post - filename.jpg
 *
 * Required env vars:
 *   GOOGLE_SERVICE_ACCOUNT_JSON  — full JSON of the service account key file (stringify it)
 *   GOOGLE_DRIVE_FOLDER_ID       — ID of the shared parent folder
 */

import { google } from "googleapis";
import { Readable } from "stream";

let _drive: ReturnType<typeof google.drive> | null = null;

function getDrive() {
  if (_drive) return _drive;

  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;

  try {
    const credentials = JSON.parse(raw);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/drive"],
    });
    _drive = google.drive({ version: "v3", auth });
    return _drive;
  } catch (e) {
    console.warn("[GoogleDrive] Failed to init:", e);
    return null;
  }
}

export function driveAvailable(): boolean {
  return !!(process.env.GOOGLE_SERVICE_ACCOUNT_JSON && process.env.GOOGLE_DRIVE_FOLDER_ID);
}

/** Find or create a subfolder by name under parentId */
async function findOrCreateFolder(
  drive: ReturnType<typeof google.drive>,
  name: string,
  parentId: string
): Promise<string> {
  const q = `'${parentId}' in parents and name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const res = await drive.files.list({ q, fields: "files(id,name)", pageSize: 1 });
  if (res.data.files && res.data.files.length > 0) {
    return res.data.files[0].id!;
  }
  const created = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    },
    fields: "id",
  });
  return created.data.id!;
}

/** Make a file publicly readable */
async function makePublic(drive: ReturnType<typeof google.drive>, fileId: string) {
  try {
    await drive.permissions.create({
      fileId,
      requestBody: { role: "reader", type: "anyone" },
    });
  } catch (e) {
    console.warn("[GoogleDrive] Could not make file public:", e);
  }
}

export async function driveUpload(opts: {
  fileName: string;
  buffer: Buffer;
  mimeType: string;
  scheduledDate?: number | null;  // unix ms
  sortOrder?: number | null;
  postTitle?: string;
}): Promise<{ url: string }> {
  const drive = getDrive();
  if (!drive) return { url: "" };

  const parentFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID!;

  // Determine date folder name — "YYYY-MM-DD" from scheduledDate or "sem-data"
  let dateFolderName = "sem-data";
  if (opts.scheduledDate) {
    const d = new Date(opts.scheduledDate);
    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth() + 1).padStart(2, "0");
    const dd   = String(d.getDate()).padStart(2, "0");
    dateFolderName = `${yyyy}-${mm}-${dd}`;
  }

  // Find or create date sub-folder
  const dateFolderId = await findOrCreateFolder(drive, dateFolderName, parentFolderId);

  // Build a descriptive file name: "01 - Título - original.jpg"
  const order = opts.sortOrder != null ? String(opts.sortOrder + 1).padStart(2, "0") : "00";
  const titleSlug = (opts.postTitle || "post")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .trim()
    .slice(0, 40);
  const safeFileName = `${order} - ${titleSlug} - ${opts.fileName}`;

  // Upload file
  const stream = Readable.from(opts.buffer);
  const uploaded = await drive.files.create({
    requestBody: {
      name: safeFileName,
      parents: [dateFolderId],
    },
    media: {
      mimeType: opts.mimeType,
      body: stream,
    },
    fields: "id,webViewLink,webContentLink",
  });

  const fileId = uploaded.data.id!;
  await makePublic(drive, fileId);

  // Use direct download link for images (renders in <img> tags)
  const url = `https://drive.google.com/uc?export=view&id=${fileId}`;
  return { url };
}
