import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth';
import { query } from '../db/client';
import { generateEmbedding } from '../utils/ai';
import type { AppContext } from '../types';

const app = new Hono<AppContext>();

// RAG Query
app.post('/query', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const { project_id, query_text, match_threshold, match_count } = await c.req.json();

    if (!project_id || !query_text) {
      return c.json({ error: 'project_id and query_text are required' }, 400);
    }

    // Verify project ownership
    const projectResult = await query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = (SELECT id FROM users WHERE clerk_user_id = $2)',
      [project_id, userId]
    );

    if (projectResult.rows.length === 0) {
      return c.json({ error: 'Project not found or access denied' }, 404);
    }

    // Generate embedding for the query text
    const embedding = await generateEmbedding(query_text);

    // Query vectors using the pgvector function
    const result = await query(
      `SELECT * FROM match_persona_vectors($1, $2, $3, $4)`,
      [
        JSON.stringify(embedding),
        match_threshold || 0.7,
        match_count || 5,
        project_id
      ]
    );

    return c.json({ matches: result.rows });
  } catch (error: any) {
    console.error('RAG query error:', error);
    return c.json({ error: `Failed to execute RAG query: ${error.message}` }, 500);
  }
});

export default app;
