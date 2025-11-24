import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import { query } from "../db/client";
import { generateText } from "../utils/ai";
import type { AppContext } from "../types";

const app = new Hono<AppContext>();

// Get persona for a project
app.get("/:projectId", requireAuth, async c => {
  try {
    const userId = c.get("userId");
    const projectId = c.req.param("projectId");

    // Verify project ownership
    const projectResult = await query(
      "SELECT id FROM projects WHERE id = $1 AND user_id = (SELECT id FROM users WHERE clerk_user_id = $2)",
      [projectId, userId]
    );

    if (projectResult.rows.length === 0) {
      return c.json({ error: "Project not found or access denied" }, 404);
    }

    const result = await query("SELECT * FROM personas WHERE project_id = $1", [
      projectId,
    ]);

    if (result.rows.length === 0) {
      return c.json({ error: "Persona not found" }, 404);
    }

    return c.json({ persona: result.rows[0] });
  } catch (error: any) {
    console.error("Get persona error:", error);
    return c.json({ error: `Failed to fetch persona: ${error.message}` }, 500);
  }
});

// Create persona
app.post("/:projectId", requireAuth, async c => {
  try {
    const userId = c.get("userId");
    const projectId = c.req.param("projectId");
    const { persona } = await c.req.json();

    // Verify project ownership
    const projectResult = await query(
      "SELECT id FROM projects WHERE id = $1 AND user_id = (SELECT id FROM users WHERE clerk_user_id = $2)",
      [projectId, userId]
    );

    if (projectResult.rows.length === 0) {
      return c.json({ error: "Project not found or access denied" }, 404);
    }

    // Check if persona already exists
    const existing = await query(
      "SELECT id FROM personas WHERE project_id = $1",
      [projectId]
    );

    if (existing.rows.length > 0) {
      return c.json({ error: "Persona already exists for this project" }, 409);
    }

    const result = await query(
      `INSERT INTO personas (project_id, persona_data, created_by)
       VALUES ($1, $2, (SELECT id FROM users WHERE clerk_user_id = $3))
       RETURNING *`,
      [projectId, JSON.stringify(persona), userId]
    );

    return c.json({ persona: result.rows[0] });
  } catch (error: any) {
    console.error("Create persona error:", error);
    return c.json({ error: `Failed to create persona: ${error.message}` }, 500);
  }
});

// Generate persona
app.post('/:projectId/generate', requireAuth, async (c) => {
  try {
    const userId = c.get('userId');
    const projectId = c.req.param('projectId');
    const { source_ids } = await c.req.json();

    // Verify project ownership
    const projectResult = await query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = (SELECT id FROM users WHERE clerk_user_id = $2)',
      [projectId, userId]
    );

    if (projectResult.rows.length === 0) {
      return c.json({ error: 'Project not found or access denied' }, 404);
    }

    // Fetch content sources
    let contentText = '';
    if (source_ids && source_ids.length > 0) {
      const sourcesResult = await query(
        'SELECT processed_content, raw_content FROM content_sources WHERE id = ANY($1) AND project_id = $2',
        [source_ids, projectId]
      );
      
      contentText = sourcesResult.rows
        .map(row => row.processed_content || row.raw_content || '')
        .join('\n\n');
    }

    if (!contentText) {
      return c.json({ error: 'No content found to generate persona from' }, 400);
    }

    // Truncate content if too long (simple approach)
    if (contentText.length > 100000) {
      contentText = contentText.substring(0, 100000);
    }

    // Generate persona using AI
    const systemPrompt = `You are an expert at analyzing content creators and extracting their persona. 
    You will be given a sample of content. Your task is to analyze it and generate a detailed persona profile in JSON format.
    The JSON should match this structure:
    {
      "identity": { "display_name": "...", "bio_summary": "...", "expertise_domains": ["..."], "audience_profile": { ... } },
      "voice": { "tone_axes": { ... }, "lexical_preferences": { ... }, ... },
      "topics": { ... },
      "dos_and_donts": { ... },
      "safety_and_ethics": { ... }
    }`;

    const prompt = `Analyze the following content and generate a creator persona:\n\n${contentText}`;

    const aiResponse = await generateText(prompt, systemPrompt);
    
    // Parse JSON from AI response
    let personaData;
    try {
      // Extract JSON if wrapped in code blocks
      const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) || aiResponse.match(/```\n([\s\S]*?)\n```/);
      const jsonString = jsonMatch ? jsonMatch[1] : aiResponse;
      personaData = JSON.parse(jsonString);
    } catch (e) {
      console.error('Failed to parse AI response:', aiResponse);
      return c.json({ error: 'Failed to generate valid persona JSON' }, 500);
    }

    return c.json({ persona: { persona_data: personaData } });
  } catch (error: any) {
    console.error('Generate persona error:', error);
    return c.json({ error: `Failed to generate persona: ${error.message}` }, 500);
  }
});

// Update persona
app.put("/:projectId", requireAuth, async c => {
  try {
    const userId = c.get("userId");
    const projectId = c.req.param("projectId");
    const { updates } = await c.req.json();

    // Verify project ownership
    const projectResult = await query(
      "SELECT id FROM projects WHERE id = $1 AND user_id = (SELECT id FROM users WHERE clerk_user_id = $2)",
      [projectId, userId]
    );

    if (projectResult.rows.length === 0) {
      return c.json({ error: "Project not found or access denied" }, 404);
    }

    // Get existing persona to merge
    const existingResult = await query(
      "SELECT persona_data FROM personas WHERE project_id = $1",
      [projectId]
    );

    if (existingResult.rows.length === 0) {
      return c.json({ error: "Persona not found" }, 404);
    }

    const currentData = existingResult.rows[0].persona_data;

    // Simple shallow merge for now, but deep merge might be better if structure is complex
    const newData = { ...currentData, ...updates };

    const result = await query(
      `UPDATE personas
       SET persona_data = $1, updated_at = NOW()
       WHERE project_id = $2
       RETURNING *`,
      [JSON.stringify(newData), projectId]
    );

    return c.json({ persona: result.rows[0] });
  } catch (error: any) {
    console.error("Update persona error:", error);
    return c.json({ error: `Failed to update persona: ${error.message}` }, 500);
  }
});

// Delete persona
app.delete("/:projectId", requireAuth, async c => {
  try {
    const userId = c.get("userId");
    const projectId = c.req.param("projectId");

    // Verify project ownership
    const projectResult = await query(
      "SELECT id FROM projects WHERE id = $1 AND user_id = (SELECT id FROM users WHERE clerk_user_id = $2)",
      [projectId, userId]
    );

    if (projectResult.rows.length === 0) {
      return c.json({ error: "Project not found or access denied" }, 404);
    }

    await query("DELETE FROM personas WHERE project_id = $1", [projectId]);

    return c.json({ message: "Persona deleted successfully" });
  } catch (error: any) {
    console.error("Delete persona error:", error);
    return c.json({ error: `Failed to delete persona: ${error.message}` }, 500);
  }
});

export default app;
