import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth';
import { query } from '../db/client';
import type { AppContext } from '../types';

const app = new Hono<AppContext>();

// Get content sources for a project
app.get('/sources', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const projectId = c.req.query('projectId');
    const platform = c.req.query('platform');
    const status = c.req.query('status');
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');

    if (!projectId) {
      return c.json({ error: 'projectId is required' }, 400);
    }

    // Verify project ownership
    const projectResult = await query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = (SELECT id FROM users WHERE clerk_user_id = $2)',
      [projectId, userId]
    );

    if (projectResult.rows.length === 0) {
      return c.json({ error: 'Project not found or access denied' }, 404);
    }

    let queryText = 'SELECT * FROM content_sources WHERE project_id = $1';
    const queryParams: any[] = [projectId];
    let paramCount = 1;

    if (platform) {
      paramCount++;
      queryText += ` AND platform = $${paramCount}`;
      queryParams.push(platform);
    }

    if (status) {
      paramCount++;
      queryText += ` AND status = $${paramCount}`;
      queryParams.push(status);
    }

    queryText += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    queryParams.push(limit, offset);

    const result = await query(queryText, queryParams);

    return c.json({ sources: result.rows });
  } catch (error: any) {
    console.error('Get content sources error:', error);
    return c.json({ error: `Failed to fetch content sources: ${error.message}` }, 500);
  }
});

// Get single content source
app.get('/sources/:id', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const sourceId = c.req.param('id');

    const result = await query(
      `SELECT cs.* FROM content_sources cs
       JOIN projects p ON cs.project_id = p.id
       JOIN users u ON p.user_id = u.id
       WHERE cs.id = $1 AND u.clerk_user_id = $2`,
      [sourceId, userId]
    );

    if (result.rows.length === 0) {
      return c.json({ error: 'Content source not found or access denied' }, 404);
    }

    return c.json({ source: result.rows[0] });
  } catch (error: any) {
    console.error('Get content source error:', error);
    return c.json({ error: `Failed to fetch content source: ${error.message}` }, 500);
  }
});

// Create content source
app.post('/sources', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const { project_id, url, platform, status } = await c.req.json();

    // Verify project ownership
    const projectResult = await query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = (SELECT id FROM users WHERE clerk_user_id = $2)',
      [project_id, userId]
    );

    if (projectResult.rows.length === 0) {
      return c.json({ error: 'Project not found or access denied' }, 404);
    }

    const result = await query(
      `INSERT INTO content_sources (project_id, url, platform, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [project_id, url, platform, status || 'pending']
    );

    return c.json({ source: result.rows[0] });
  } catch (error: any) {
    console.error('Create content source error:', error);
    return c.json({ error: `Failed to create content source: ${error.message}` }, 500);
  }
});

// Batch create content sources
app.post('/sources/batch', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const { sources } = await c.req.json();

    if (!sources || !Array.isArray(sources) || sources.length === 0) {
      return c.json({ error: 'No sources provided' }, 400);
    }

    const projectId = sources[0].project_id;

    // Verify project ownership
    const projectResult = await query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = (SELECT id FROM users WHERE clerk_user_id = $2)',
      [projectId, userId]
    );

    if (projectResult.rows.length === 0) {
      return c.json({ error: 'Project not found or access denied' }, 404);
    }

    // Construct batch insert query
    const createdSources = [];
    for (const source of sources) {
        if (source.project_id !== projectId) continue; // Skip if project ID mismatch

        const result = await query(
            `INSERT INTO content_sources (project_id, url, platform, status)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [projectId, source.url, source.platform, source.status || 'pending']
        );
        createdSources.push(result.rows[0]);
    }

    return c.json({ sources: createdSources });
  } catch (error: any) {
    console.error('Batch create content sources error:', error);
    return c.json({ error: `Failed to batch create content sources: ${error.message}` }, 500);
  }
});

// Update content source status
app.put('/sources/:id/status', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const sourceId = c.req.param('id');
    const { status, error_message } = await c.req.json();

    // Verify ownership via join
    const result = await query(
      `UPDATE content_sources cs
       SET status = $1, error_message = $2, updated_at = NOW()
       FROM projects p, users u
       WHERE cs.id = $3 AND cs.project_id = p.id AND p.user_id = u.id AND u.clerk_user_id = $4
       RETURNING cs.*`,
      [status, error_message, sourceId, userId]
    );

    if (result.rows.length === 0) {
      return c.json({ error: 'Content source not found or access denied' }, 404);
    }

    return c.json({ source: result.rows[0] });
  } catch (error: any) {
    console.error('Update content source status error:', error);
    return c.json({ error: `Failed to update content source status: ${error.message}` }, 500);
  }
});

// Update content source content
app.put('/sources/:id', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const sourceId = c.req.param('id');
    const content = await c.req.json();

    // Verify ownership via join
    const result = await query(
      `UPDATE content_sources cs
       SET 
         title = COALESCE($1, title),
         raw_content = COALESCE($2, raw_content),
         processed_content = COALESCE($3, processed_content),
         content_type = COALESCE($4, content_type),
         metadata = COALESCE($5, metadata),
         updated_at = NOW()
       FROM projects p, users u
       WHERE cs.id = $6 AND cs.project_id = p.id AND p.user_id = u.id AND u.clerk_user_id = $7
       RETURNING cs.*`,
      [
        content.title,
        content.raw_content,
        content.processed_content,
        content.content_type,
        content.metadata ? JSON.stringify(content.metadata) : null,
        sourceId,
        userId
      ]
    );

    if (result.rows.length === 0) {
      return c.json({ error: 'Content source not found or access denied' }, 404);
    }

    return c.json({ source: result.rows[0] });
  } catch (error: any) {
    console.error('Update content source error:', error);
    return c.json({ error: `Failed to update content source: ${error.message}` }, 500);
  }
});

// Delete content source
app.delete('/sources/:id', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const sourceId = c.req.param('id');

    // Verify ownership and delete
    const result = await query(
      `DELETE FROM content_sources cs
       USING projects p, users u
       WHERE cs.id = $1 AND cs.project_id = p.id AND p.user_id = u.id AND u.clerk_user_id = $2
       RETURNING cs.id`,
      [sourceId, userId]
    );

    if (result.rows.length === 0) {
      return c.json({ error: 'Content source not found or access denied' }, 404);
    }

    return c.json({ message: 'Content source deleted successfully' });
  } catch (error: any) {
    console.error('Delete content source error:', error);
    return c.json({ error: `Failed to delete content source: ${error.message}` }, 500);
  }
});

// Ingest content
app.post('/ingest', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const { project_id, urls } = await c.req.json();

    if (!project_id || !urls || !Array.isArray(urls)) {
      return c.json({ error: 'project_id and urls array are required' }, 400);
    }

    // Verify project ownership
    const projectResult = await query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = (SELECT id FROM users WHERE clerk_user_id = $2)',
      [project_id, userId]
    );

    if (projectResult.rows.length === 0) {
      return c.json({ error: 'Project not found or access denied' }, 404);
    }

    // Create content sources with 'pending' status
    const createdSources = [];
    for (const url of urls) {
        let platform = 'manual_url';
        const urlLower = url.toLowerCase();
        if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) platform = 'youtube';
        else if (urlLower.includes('tiktok.com')) platform = 'tiktok';
        else if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) platform = 'twitter';
        else if (urlLower.includes('instagram.com')) platform = 'instagram';
        else if (urlLower.includes('linkedin.com')) platform = 'linkedin';
        else if (urlLower.includes('medium.com') || urlLower.includes('substack.com')) platform = 'blog';

        const result = await query(
            `INSERT INTO content_sources (project_id, url, platform, status)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [project_id, url, platform, 'pending']
        );
        createdSources.push(result.rows[0]);
    }

    return c.json({ 
        message: 'Content ingestion started', 
        sources: createdSources,
        job_id: 'placeholder_job_id' 
    });
  } catch (error: any) {
    console.error('Ingest content error:', error);
    return c.json({ error: `Failed to ingest content: ${error.message}` }, 500);
  }
});

export default app;
