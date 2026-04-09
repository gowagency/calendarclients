import { eq, desc, asc, and, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  posts,
  comments,
  attachments,
  prodTasks,
  type InsertPost,
  type InsertComment,
  type InsertAttachment,
  type InsertProdTask,
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
    console.log("[DB] Column type migrations applied");

    // Add pilar column — ignore error if it already exists (MySQL error 1060)
    try {
      await db.execute(sql`ALTER TABLE posts ADD COLUMN pilar VARCHAR(100)`);
      console.log("[DB] pilar column added");
    } catch (e: any) {
      if (!e.message?.includes("Duplicate column")) {
        console.warn("[DB] pilar column migration unexpected error:", e.message?.slice(0, 80));
      }
    }

    // Add obsAliny, obsAlinyRead, approvalHistory to posts
    const postCols = [
      `ALTER TABLE posts ADD COLUMN obsAliny TEXT`,
      `ALTER TABLE posts ADD COLUMN obsAlinyRead INT DEFAULT 0`,
      `ALTER TABLE posts ADD COLUMN approvalHistory TEXT`,
    ];
    for (const colSql of postCols) {
      try {
        await db.execute(sql.raw(colSql));
      } catch (e: any) {
        if (!e.message?.includes("Duplicate column")) {
          console.warn("[DB] posts column:", e.message?.slice(0, 60));
        }
      }
    }

    // Create prod_tasks table for production task tracking (synced across devices)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS prod_tasks (
        id VARCHAR(50) PRIMARY KEY,
        client VARCHAR(100) NOT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'a_definir',
        title VARCHAR(500) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'nao_iniciado',
        dueDate VARCHAR(20),
        obs TEXT,
        obsAliny TEXT,
        canvaUrl TEXT,
        creativoUrl TEXT,
        pilar VARCHAR(100),
        createdAt BIGINT NOT NULL
      )
    `);
    // Add creativoUrl column to existing tables (safe: ignore if already exists)
    try {
      await db.execute(sql`ALTER TABLE prod_tasks ADD COLUMN creativoUrl TEXT`);
    } catch (e: any) {
      if (!e.message?.includes("Duplicate column")) {
        console.warn("[DB] creativoUrl column:", e.message?.slice(0, 60));
      }
    }
    console.log("[DB] prod_tasks table ready");
  } catch (e) {
    console.log("[DB] Migration skipped:", (e as Error).message?.slice(0, 80));
  }

  // Seed Aliny Rayze March 2026 history
  try {
    const noon = (d: string) => new Date(d + "T12:00:00-03:00").getTime();
    const marchStart = new Date("2026-03-01T00:00:00Z").getTime();
    const marchEnd   = new Date("2026-04-01T00:00:00Z").getTime();

    const existing = await db
      .select({ id: posts.id })
      .from(posts)
      .where(and(eq(posts.client, "alinyrayze"), gte(posts.scheduledDate, marchStart), lte(posts.scheduledDate, marchEnd)))
      .limit(1);

    if (existing.length === 0) {
      const march: InsertPost[] = [
        { socialNetwork: "instagram", formato: "Reels",    status: "postado", scheduledDate: noon("2026-03-02"), sortOrder: 101, titulo: "Café sem açúcar",                                           legenda: "O amargo não é o problema. É o sinal de que algo está amadurecendo. Amadurecer tem gosto de renúncia no início. Depois, tem gosto de firmeza..." },
        { socialNetwork: "instagram", formato: "Post",     status: "postado", scheduledDate: noon("2026-03-03"), sortOrder: 102, titulo: "Espero que você aprenda isso logo",                        legenda: "Espero que você aprenda isso logo: Quanto mais direta, amorosa e firme você consegue ser, mais leve a sua vida se torna..." },
        { socialNetwork: "instagram", formato: "Reels",    status: "postado", scheduledDate: noon("2026-03-04"), sortOrder: 103, titulo: "si mesma",                                                  legenda: "Você não é o que você carrega. Você está com isso. Tem uma diferença enorme entre as duas coisas..." },
        { socialNetwork: "instagram", formato: "Post",     status: "postado", scheduledDate: noon("2026-03-05"), sortOrder: 104, titulo: "Amizade na vida adulta é diferente",                        legenda: "Amizade na vida adulta é diferente, talvez você já tenha percebido. A gente não se vê todos os dias. Não se fala o tempo todo..." },
        { socialNetwork: "instagram", formato: "Reels",    status: "postado", scheduledDate: noon("2026-03-06"), sortOrder: 105, titulo: "vez que eu fui",                                            legenda: "Às vezes a gente aprende cedo demais a esconder o que dói. Algumas crianças aprendem a não dar trabalho..." },
        { socialNetwork: "instagram", formato: "Reels",    status: "postado", scheduledDate: noon("2026-03-08"), sortOrder: 106, titulo: "Collab Dia Internacional da Mulher (@juniorlopescontador)", legenda: "Casei com uma mulher que não gosta de ganhar presentes... Ela gosta de ganhar momentos! Feliz Dia Internacional da Mulher, meu amor @alinyrayze" },
        { socialNetwork: "instagram", formato: "Post",     status: "postado", scheduledDate: noon("2026-03-08"), sortOrder: 107, titulo: "Feminilidade",                                              legenda: "Mas quais características, afinal? A cultura tenta nos vender um padrão: ser mais delicada, mais receptiva, mais 'feminina'... Feminilidade não é um padrão a alcançar. É uma essência a reconhecer." },
        { socialNetwork: "instagram", formato: "Reels",    status: "postado", scheduledDate: noon("2026-03-10"), sortOrder: 108, titulo: "teve uma mãe",                                              legenda: "Você não vai ter uma mãe diferente. Essa é a parte que dói. Mas é também a parte que liberta..." },
        { socialNetwork: "instagram", formato: "Post",     status: "postado", scheduledDate: noon("2026-03-11"), sortOrder: 109, titulo: "Como é, para você, achar que não merece ser feliz?",        legenda: "Como é, para você, achar que não merece ser feliz? Você conquista algo e, logo em seguida, arruma um problema em outra área..." },
        { socialNetwork: "instagram", formato: "Carrossel",status: "postado", scheduledDate: noon("2026-03-13"), sortOrder: 110, titulo: "Isso não era sobre água.",                                  legenda: "O que você tem pedido, quando na verdade precisa de outra coisa? O que me chamou atenção nesse momento com o José Miguel foi a clareza com que ele reconheceu." },
        { socialNetwork: "instagram", formato: "Reels",    status: "postado", scheduledDate: noon("2026-03-17"), sortOrder: 111, titulo: "As pessoas querem viver uma grande história de amor",       legenda: "As pessoas querem viver uma grande história de amor. Mas estão entrando nos relacionamentos cada vez mais individualistas..." },
        { socialNetwork: "instagram", formato: "Carrossel",status: "postado", scheduledDate: noon("2026-03-18"), sortOrder: 112, titulo: "Coisas que eu faço mesmo sendo psicanalista...",           legenda: "Ser psicanalista não me faz diferente de você. Me faz mais consciente do que acontece dentro de mim, mas não me livra de sentir. Não me livra de errar. Não me livra de ser humana." },
        { socialNetwork: "instagram", formato: "Post",     status: "postado", scheduledDate: noon("2026-03-19"), sortOrder: 113, titulo: "Por muito tempo, eu confundi amor com ser necessária",     legenda: "Eu era líder de setor em uma grande empresa. E lembro de um supervisor que sempre dizia: 'Um bom líder é aquele que não faz falta.'" },
        { socialNetwork: "instagram", formato: "Reels",    status: "postado", scheduledDate: noon("2026-03-20"), sortOrder: 114, titulo: "Vivendo a mesma coisa!",                                   legenda: "Tem uma diferença entre errar sem saber e errar sabendo. O segundo dói de um jeito diferente..." },
        { socialNetwork: "instagram", formato: "Post",     status: "postado", scheduledDate: noon("2026-03-23"), sortOrder: 115, titulo: "Se hoje fosse o seu último dia de vida...",                 legenda: "Se hoje fosse o seu último dia de vida, e as pessoas mais importantes fossem até você, te agradecer por algo. Pelo que elas iriam te agradecer?" },
        { socialNetwork: "instagram", formato: "Carrossel",status: "postado", scheduledDate: noon("2026-03-24"), sortOrder: 116, titulo: "Quando ficar quieta parece mais seguro do que falar",      legenda: "O silêncio que te protege também te apaga." },
        { socialNetwork: "instagram", formato: "Carrossel",status: "postado", scheduledDate: noon("2026-03-26"), sortOrder: 117, titulo: "O que muda no relacionamento quando vocês decidem ter filhos?", legenda: "O amor que sobrevive à maternidade não é o mais bonito. É o mais real." },
        { socialNetwork: "instagram", formato: "Reels",    status: "postado", scheduledDate: noon("2026-03-27"), sortOrder: 118, titulo: "não aceito viver uma vida no escuro",                      legenda: "Eu cresci tentando ser boa o suficiente pra não ser ferida, tentando entender o que ninguém me explicou..." },
        { socialNetwork: "instagram", formato: "Reels",    status: "postado", scheduledDate: noon("2026-03-31"), sortOrder: 119, titulo: "Qual é a finalidade do que você quer?",                   legenda: "Essa escolha simples dos meus filhos dormirem cedo me ensinou uma das coisas mais importantes da vida adulta: toda escolha tem um preço..." },
      ];
      for (const p of march) {
        await db.insert(posts).values({ ...p, client: "alinyrayze" });
      }
      console.log("[DB] Seeded Aliny Rayze March 2026 — 19 posts");
    }
  } catch (e) {
    console.warn("[DB] March 2026 seed failed:", (e as Error).message?.slice(0, 120));
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

// ─── PROD TASKS ───

export async function getProdTasks(client: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(prodTasks)
    .where(eq(prodTasks.client, client))
    .orderBy(asc(prodTasks.createdAt));
}

export async function createProdTask(task: InsertProdTask) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(prodTasks).values(task);
  return task;
}

export async function updateProdTask(id: string, fields: Partial<Omit<InsertProdTask, "id" | "client" | "createdAt">>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(prodTasks).set(fields).where(eq(prodTasks.id, id));
}

export async function deleteProdTask(id: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(prodTasks).where(eq(prodTasks.id, id));
}
