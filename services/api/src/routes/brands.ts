import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth';
import { query } from '../db/client';
import type { AppContext } from '../types';

const app = new Hono<AppContext>();

// Get brand for a project
app.get('/:projectId', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const projectId = c.req.param('projectId');

    // Verify project ownership
    const projectResult = await query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = (SELECT id FROM users WHERE clerk_user_id = $2)',
      [projectId, userId]
    );

    if (projectResult.rows.length === 0) {
      return c.json({ error: 'Project not found or access denied' }, 404);
    }

    const result = await query(
      'SELECT * FROM brands WHERE project_id = $1',
      [projectId]
    );

    if (result.rows.length === 0) {
      return c.json({ error: 'Brand not found' }, 404);
    }

    return c.json({ brand: result.rows[0] });
  } catch (error: any) {
    console.error('Get brand error:', error);
    return c.json({ error: `Failed to fetch brand: ${error.message}` }, 500);
  }
});

// Create brand
app.post('/:projectId', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const projectId = c.req.param('projectId');
    const brandData = await c.req.json();

    // Verify project ownership
    const projectResult = await query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = (SELECT id FROM users WHERE clerk_user_id = $2)',
      [projectId, userId]
    );

    if (projectResult.rows.length === 0) {
      return c.json({ error: 'Project not found or access denied' }, 404);
    }

    // Check if brand already exists
    const existing = await query(
      'SELECT id FROM brands WHERE project_id = $1',
      [projectId]
    );

    if (existing.rows.length > 0) {
      return c.json({ error: 'Brand already exists for this project' }, 409);
    }

    const {
      primary_color, secondary_color, accent_color, palette_keywords,
      logo_light_url, logo_dark_url, logo_square_url, logo_keywords,
      primary_font, secondary_font,
      pillars, values, positioning_statement, taglines
    } = brandData;

    const result = await query(
      `INSERT INTO brands (
        project_id,
        primary_color, secondary_color, accent_color, palette_keywords,
        logo_light_url, logo_dark_url, logo_square_url, logo_keywords,
        primary_font, secondary_font,
        pillars, values, positioning_statement, taglines
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        projectId,
        primary_color, secondary_color, accent_color, palette_keywords,
        logo_light_url, logo_dark_url, logo_square_url, logo_keywords,
        primary_font, secondary_font,
        pillars, values, positioning_statement, taglines
      ]
    );

    return c.json({ brand: result.rows[0] });
  } catch (error: any) {
    console.error('Create brand error:', error);
    return c.json({ error: `Failed to create brand: ${error.message}` }, 500);
  }
});

// Update brand
app.put('/:projectId', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const projectId = c.req.param('projectId');
    const updates = await c.req.json();

    // Verify project ownership
    const projectResult = await query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = (SELECT id FROM users WHERE clerk_user_id = $2)',
      [projectId, userId]
    );

    if (projectResult.rows.length === 0) {
      return c.json({ error: 'Project not found or access denied' }, 404);
    }

    // We need to construct a dynamic update query
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    // Map possible fields
    const allowedFields = [
      'primary_color', 'secondary_color', 'accent_color', 'palette_keywords',
      'logo_light_url', 'logo_dark_url', 'logo_square_url', 'logo_keywords',
      'primary_font', 'secondary_font',
      'pillars', 'values', 'positioning_statement', 'taglines'
    ];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        fields.push(`${field} = $${paramCount}`);
        values.push(updates[field]);
        paramCount++;
      }
    }

    if (fields.length === 0) {
      return c.json({ error: 'No valid updates provided' }, 400);
    }

    values.push(projectId);
    const queryText = `UPDATE brands SET ${fields.join(', ')}, updated_at = NOW() WHERE project_id = $${paramCount} RETURNING *`;

    const result = await query(queryText, values);

    if (result.rows.length === 0) {
      return c.json({ error: 'Brand not found' }, 404);
    }

    return c.json({ brand: result.rows[0] });
  } catch (error: any) {
    console.error('Update brand error:', error);
    return c.json({ error: `Failed to update brand: ${error.message}` }, 500);
  }
});

// Delete brand
app.delete('/:projectId', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const projectId = c.req.param('projectId');

    // Verify project ownership
    const projectResult = await query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = (SELECT id FROM users WHERE clerk_user_id = $2)',
      [projectId, userId]
    );

    if (projectResult.rows.length === 0) {
      return c.json({ error: 'Project not found or access denied' }, 404);
    }

    await query(
      'DELETE FROM brands WHERE project_id = $1',
      [projectId]
    );

    return c.json({ message: 'Brand deleted successfully' });
  } catch (error: any) {
    console.error('Delete brand error:', error);
    return c.json({ error: `Failed to delete brand: ${error.message}` }, 500);
  }
});

export default app;
