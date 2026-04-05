import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { storagePut, storageUploadPostFile } from "./storage";
import { nanoid } from "nanoid";
import { CLIENTS, type ClientSlug } from "../drizzle/schema";

const clientSchema = z.enum(CLIENTS as [ClientSlug, ...ClientSlug[]]);

export const appRouter = router({
  posts: router({
    list: publicProcedure
      .input(z.object({ client: clientSchema }))
      .query(({ input }) => db.getAllPosts(input.client)),

    byDateRange: publicProcedure
      .input(z.object({ client: clientSchema, start: z.number(), end: z.number() }))
      .query(({ input }) => db.getPostsByDateRange(input.client, input.start, input.end)),

    stats: publicProcedure
      .input(z.object({ client: clientSchema }))
      .query(({ input }) => db.getPostStats(input.client)),

    create: publicProcedure
      .input(
        z.object({
          client: clientSchema,
          socialNetwork: z
            .enum(["instagram", "linkedin", "substack", "spotify", "youtube"])
            .default("instagram"),
          titulo: z.string().min(1).max(500),
          formato: z.string().default("Post"),
          conteudo: z.string().optional(),
          legenda: z.string().optional(),
          status: z
            .enum(["nao_iniciado", "em_andamento", "em_aprovacao", "aprovado", "postado"])
            .default("nao_iniciado"),
          scheduledDate: z.number().optional(),
          canvaLink: z.string().optional(),
          postUrl: z.string().optional(),
          responsavel: z.string().optional(),
          coverImageUrl: z.string().optional(),
          checklist: z
            .object({
              legenda: z.boolean(),
              arte: z.boolean(),
              revisao: z.boolean(),
              aprovacao: z.boolean(),
            })
            .optional(),
        })
      )
      .mutation(({ input }) => db.createPost(input)),

    update: publicProcedure
      .input(
        z.object({
          id: z.number(),
          socialNetwork: z
            .enum(["instagram", "linkedin", "substack", "spotify", "youtube"])
            .optional(),
          titulo: z.string().optional(),
          formato: z.string().optional(),
          conteudo: z.string().nullable().optional(),
          legenda: z.string().nullable().optional(),
          status: z
            .enum(["nao_iniciado", "em_andamento", "em_aprovacao", "aprovado", "postado"])
            .optional(),
          scheduledDate: z.number().nullable().optional(),
          canvaLink: z.string().nullable().optional(),
          postUrl: z.string().nullable().optional(),
          responsavel: z.string().nullable().optional(),
          sortOrder: z.number().optional(),
          coverImageUrl: z.string().nullable().optional(),
          checklist: z
            .object({
              legenda: z.boolean(),
              arte: z.boolean(),
              revisao: z.boolean(),
              aprovacao: z.boolean(),
            })
            .optional(),
          alcance: z.number().nullable().optional(),
          curtidas: z.number().nullable().optional(),
          compartilhamentos: z.number().nullable().optional(),
          comentariosCount: z.number().nullable().optional(),
          salvamentos: z.number().nullable().optional(),
          visualizacoes: z.number().nullable().optional(),
        })
      )
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return db.updatePost(id, data);
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deletePost(input.id)),

    seed: publicProcedure
      .input(z.object({ client: clientSchema }))
      .mutation(({ input }) => db.seedInitialPosts(input.client)),

    uploadCover: publicProcedure
      .input(
        z.object({
          postId: z.number(),
          fileName: z.string(),
          fileData: z.string(),
          mimeType: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.fileData, "base64");
        // Fetch post metadata for Drive folder naming
        const posts = await db.getPostById(input.postId);
        const { url } = await storageUploadPostFile({
          buffer,
          fileName: `${nanoid()}-${input.fileName}`,
          mimeType: input.mimeType || "image/jpeg",
          scheduledDate: posts?.scheduledDate ?? null,
          sortOrder: posts?.sortOrder ?? null,
          postTitle: posts?.titulo ?? undefined,
        });
        await db.updatePost(input.postId, { coverImageUrl: url });
        return { url };
      }),
  }),

  comments: router({
    byPost: publicProcedure
      .input(z.object({ postId: z.number() }))
      .query(({ input }) => db.getCommentsByPost(input.postId)),

    create: publicProcedure
      .input(
        z.object({
          postId: z.number(),
          authorName: z.string().optional(),
          content: z.string().min(1).max(2000),
        })
      )
      .mutation(({ input }) => db.createComment(input)),
  }),

  attachments: router({
    byPost: publicProcedure
      .input(z.object({ postId: z.number() }))
      .query(({ input }) => db.getAttachmentsByPost(input.postId)),

    upload: publicProcedure
      .input(
        z.object({
          postId: z.number(),
          fileName: z.string(),
          fileData: z.string(),
          mimeType: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.fileData, "base64");
        const post = await db.getPostById(input.postId);
        const { url } = await storageUploadPostFile({
          buffer,
          fileName: `${nanoid()}-${input.fileName}`,
          mimeType: input.mimeType || "application/octet-stream",
          scheduledDate: post?.scheduledDate ?? null,
          sortOrder: post?.sortOrder ?? null,
          postTitle: post?.titulo ?? undefined,
        });
        return db.createAttachment({
          postId: input.postId,
          fileName: input.fileName,
          fileUrl: url,
          mimeType: input.mimeType || null,
        });
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteAttachment(input.id)),
  }),
});

export type AppRouter = typeof appRouter;
