import { eq, desc, asc, and, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  posts,
  comments,
  attachments,
  type InsertPost,
  type InsertComment,
  type InsertAttachment,
} from "../drizzle/schema";

let _db: ReturnType<typeof drizzle> | null = null;
let _migrated = false;

async function runMigrations(db: ReturnType<typeof drizzle>) {
  if (_migrated) return;
  _migrated = true;
  try {
    // Widen image columns to MEDIUMTEXT (16 MB) so base64 data URLs fit
    await db.execute(sql`ALTER TABLE posts MODIFY COLUMN coverImageUrl MEDIUMTEXT`);
    await db.execute(sql`ALTER TABLE attachments MODIFY COLUMN fileUrl MEDIUMTEXT`);
    console.log("[DB] Column migrations applied");
  } catch (e) {
    // Safe to ignore — column already correct or table doesn't exist yet
    console.log("[DB] Migration skipped:", (e as Error).message?.slice(0, 80));
  }
}

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
      await runMigrations(_db);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── POSTS ───

export async function getAllPosts(client: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(posts).where(eq(posts.client, client)).orderBy(asc(posts.sortOrder), asc(posts.id));
}

export async function getPostsByDateRange(client: string, startMs: number, endMs: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(posts)
    .where(and(eq(posts.client, client), gte(posts.scheduledDate, startMs), lte(posts.scheduledDate, endMs)))
    .orderBy(asc(posts.scheduledDate), asc(posts.sortOrder));
}

export async function getPostStats(client: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      status: posts.status,
      socialNetwork: posts.socialNetwork,
      count: sql<number>`count(*)`,
    })
    .from(posts)
    .where(eq(posts.client, client))
    .groupBy(posts.status, posts.socialNetwork);
}

export async function getPostById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createPost(post: InsertPost) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(posts).values(post);
  return { id: result[0].insertId };
}

export async function updatePost(id: number, data: Partial<InsertPost>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(posts).set(data).where(eq(posts.id, id));
}

export async function deletePost(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(comments).where(eq(comments.postId, id));
  await db.delete(attachments).where(eq(attachments.postId, id));
  await db.delete(posts).where(eq(posts.id, id));
}

export async function seedInitialPosts(client: string) {
  const db = await getDb();
  if (!db) return;

  const existing = await db.select().from(posts).where(eq(posts.client, client)).limit(1);
  if (existing.length > 0) return;

  const now = Date.now();
  const day = 86400000;

  const seedData: InsertPost[] = [
    // Instagram
    {
      socialNetwork: "instagram",
      titulo: "Bastidores da equipe Gow",
      formato: "Carrossel",
      status: "postado",
      scheduledDate: now - 10 * day,
      conteudo: "Um olhar por trás das câmeras do nosso time.",
      sortOrder: 1,
    },
    {
      socialNetwork: "instagram",
      titulo: "Dicas de criação de conteúdo",
      formato: "Reels",
      status: "postado",
      scheduledDate: now - 7 * day,
      conteudo: "5 hacks para criar conteúdo que converte.",
      sortOrder: 2,
    },
    {
      socialNetwork: "instagram",
      titulo: "Lançamento da nova metodologia",
      formato: "Post",
      status: "aprovado",
      scheduledDate: now + 2 * day,
      conteudo: "Conheça a nossa nova abordagem para gestão de redes.",
      sortOrder: 3,
    },
    {
      socialNetwork: "instagram",
      titulo: "Tendências de social media 2026",
      formato: "Carrossel",
      status: "em_aprovacao",
      scheduledDate: now + 4 * day,
      sortOrder: 4,
    },
    {
      socialNetwork: "instagram",
      titulo: "Depoimento de cliente — Case de sucesso",
      formato: "Story",
      status: "nao_iniciado",
      sortOrder: 5,
    },
    // LinkedIn
    {
      socialNetwork: "linkedin",
      titulo: "O que aprendemos em 2025",
      formato: "Artigo",
      status: "postado",
      scheduledDate: now - 8 * day,
      conteudo: "Reflexões sobre crescimento, desafios e aprendizados.",
      sortOrder: 6,
    },
    {
      socialNetwork: "linkedin",
      titulo: "Por que consistência vence criatividade",
      formato: "Post",
      status: "aprovado",
      scheduledDate: now + 1 * day,
      sortOrder: 7,
    },
    {
      socialNetwork: "linkedin",
      titulo: "Estratégia de conteúdo B2B — Guia completo",
      formato: "Artigo",
      status: "em_andamento",
      sortOrder: 8,
    },
    // Substack
    {
      socialNetwork: "substack",
      titulo: "Newsletter #12 — Algoritmo ou audiência?",
      formato: "Newsletter",
      status: "postado",
      scheduledDate: now - 14 * day,
      conteudo: "A grande questão que todo criador precisa responder.",
      sortOrder: 9,
    },
    {
      socialNetwork: "substack",
      titulo: "Newsletter #13 — O poder do nicho",
      formato: "Newsletter",
      status: "em_aprovacao",
      scheduledDate: now + 5 * day,
      sortOrder: 10,
    },
    // Spotify
    {
      socialNetwork: "spotify",
      titulo: "Episódio 08 — Marketing com alma",
      formato: "Episódio",
      status: "postado",
      scheduledDate: now - 6 * day,
      conteudo: "Conversa sobre propósito e comunicação autêntica.",
      sortOrder: 11,
    },
    {
      socialNetwork: "spotify",
      titulo: "Episódio 09 — Criação de comunidade",
      formato: "Episódio",
      status: "nao_iniciado",
      sortOrder: 12,
    },
    // YouTube
    {
      socialNetwork: "youtube",
      titulo: "Como montar um calendário editorial",
      formato: "Vídeo",
      status: "postado",
      scheduledDate: now - 9 * day,
      conteudo: "Tutorial completo de 20 minutos com exemplos reais.",
      sortOrder: 13,
    },
    {
      socialNetwork: "youtube",
      titulo: "Shorts — 3 erros que destroem seu alcance",
      formato: "Short",
      status: "aprovado",
      scheduledDate: now + 3 * day,
      sortOrder: 14,
    },
  ];

  for (const post of seedData) {
    await db.insert(posts).values({ ...post, client });
  }
}

// ─── COMMENTS ───

export async function getCommentsByPost(postId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(comments)
    .where(eq(comments.postId, postId))
    .orderBy(desc(comments.createdAt));
}

export async function createComment(comment: InsertComment) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(comments).values(comment);
  return { id: result[0].insertId };
}

// ─── ATTACHMENTS ───

export async function getAttachmentsByPost(postId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(attachments)
    .where(eq(attachments.postId, postId))
    .orderBy(desc(attachments.createdAt));
}

export async function createAttachment(attachment: InsertAttachment) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(attachments).values(attachment);
  return { id: result[0].insertId };
}

export async function deleteAttachment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(attachments).where(eq(attachments.id, id));
}
