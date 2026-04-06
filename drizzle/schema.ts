import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  mediumtext,
  timestamp,
  varchar,
  json,
  bigint,
} from "drizzle-orm/mysql-core";

export const CLIENTS = ["alinyrayze", "juniorlopes"] as const;
export type ClientSlug = typeof CLIENTS[number];

export const posts = mysqlTable("posts", {
  id: int("id").autoincrement().primaryKey(),
  client: varchar("client", { length: 100 }).notNull().default("alinyrayze"),
  socialNetwork: mysqlEnum("socialNetwork", [
    "instagram",
    "linkedin",
    "substack",
    "spotify",
    "youtube",
  ])
    .default("instagram")
    .notNull(),
  titulo: varchar("titulo", { length: 500 }).notNull(),
  formato: varchar("formato", { length: 100 }).notNull().default("Post"),
  conteudo: text("conteudo"),
  legenda: text("legenda"),
  status: mysqlEnum("status", [
    "nao_iniciado",
    "em_andamento",
    "em_aprovacao",
    "aprovado",
    "postado",
  ])
    .default("nao_iniciado")
    .notNull(),
  scheduledDate: bigint("scheduledDate", { mode: "number" }),
  canvaLink: text("canvaLink"),
  postUrl: text("postUrl"),
  responsavel: varchar("responsavel", { length: 200 }),
  coverImageUrl: mediumtext("coverImageUrl"),
  pilar: varchar("pilar", { length: 100 }),
  checklist: json("checklist").$type<{
    legenda: boolean;
    arte: boolean;
    revisao: boolean;
    aprovacao: boolean;
  }>(),
  // Performance metrics (used after publishing)
  alcance: int("alcance"),
  curtidas: int("curtidas"),
  compartilhamentos: int("compartilhamentos"),
  comentariosCount: int("comentariosCount"),
  salvamentos: int("salvamentos"),
  visualizacoes: int("visualizacoes"),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;

export const comments = mysqlTable("comments", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  authorName: varchar("authorName", { length: 200 }),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;

export const attachments = mysqlTable("attachments", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  fileName: varchar("fileName", { length: 500 }).notNull(),
  fileUrl: mediumtext("fileUrl").notNull(),
  mimeType: varchar("mimeType", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Attachment = typeof attachments.$inferSelect;
export type InsertAttachment = typeof attachments.$inferInsert;

export const prodTasks = mysqlTable("prod_tasks", {
  id: varchar("id", { length: 50 }).primaryKey(),
  client: varchar("client", { length: 100 }).notNull(),
  type: varchar("type", { length: 50 }).notNull().default("a_definir"),
  title: varchar("title", { length: 500 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("nao_iniciado"),
  dueDate: varchar("dueDate", { length: 20 }),
  obs: text("obs"),
  obsAliny: text("obsAliny"),
  canvaUrl: text("canvaUrl"),
  pilar: varchar("pilar", { length: 100 }),
  createdAt: bigint("createdAt", { mode: "number" }).notNull(),
});

export type ProdTask = typeof prodTasks.$inferSelect;
export type InsertProdTask = typeof prodTasks.$inferInsert;
