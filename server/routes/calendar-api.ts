import { Router, type Request, type Response } from "express";
import { eq, desc } from "drizzle-orm";
import { getDb } from "../db";
import { posts, CLIENTS, type ClientSlug } from "../../drizzle/schema";

const calendarApiRouter = Router();

/**
 * GET /api/calendar/posts?client=<alinyrayze|juniorlopes>
 *
 * Returns all posts for the given client, ordered by scheduledDate descending
 * (newest scheduled date first). Posts without a scheduledDate appear last.
 */
calendarApiRouter.get(
  "/api/calendar/posts",
  async (req: Request, res: Response) => {
    const { client } = req.query;

    // ── Validate required `client` parameter ──────────────────────────────
    if (!client || typeof client !== "string") {
      return res.status(400).json({
        ok: false,
        error: "Missing required query parameter: client",
        allowedValues: CLIENTS,
      });
    }

    if (!(CLIENTS as readonly string[]).includes(client)) {
      return res.status(400).json({
        ok: false,
        error: `Invalid client "${client}". Allowed values: ${CLIENTS.join(", ")}`,
        allowedValues: CLIENTS,
      });
    }

    // ── Query database ─────────────────────────────────────────────────────
    try {
      const db = await getDb();

      if (!db) {
        return res.status(500).json({
          ok: false,
          error: "Database connection unavailable",
        });
      }

      const rows = await db
        .select()
        .from(posts)
        .where(eq(posts.client, client as ClientSlug))
        .orderBy(desc(posts.scheduledDate));

      return res.json({
        ok: true,
        client,
        count: rows.length,
        posts: rows,
      });
    } catch (err) {
      console.error("[REST /api/calendar/posts] DB error:", err);
      return res.status(500).json({
        ok: false,
        error: "Failed to fetch posts",
      });
    }
  }
);

export { calendarApiRouter };
