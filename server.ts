import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { generateContentWithFallback } from './src/server/gemini.ts';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. Top-Level Request Deserialization (Ordering Guarantee)
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      timestamp: new Date().toISOString(),
    });
  });

  // 2. Gemini Multi-Turn Reflection and Brainstorming API Endpoint
  app.post('/api/gemini/reflect', async (req: Request, res: Response): Promise<void> => {
    try {
      // Defensive Payload Ingestion (Null-Safe Destructuring)
      const data = (req.body && typeof req.body === 'object') ? req.body : {};
      const prompt = typeof data.prompt === 'string' ? data.prompt.trim() : '';
      const mode = typeof data.mode === 'string' ? data.mode : 'reflect';
      const contextHistory = Array.isArray(data.contextHistory) ? data.contextHistory : [];
      const entryTitle = typeof data.entryTitle === 'string' ? data.entryTitle : '';

      if (!prompt) {
        res.status(400).json({ error: 'Prompt is required.' });
        return;
      }

      const systemInstruction = `You are an empathetic, insightful, and constructive AI Reflection Partner and Journaling Assistant.
Your goal is to help the user thoughtfully reflect on their thoughts, ideas, feelings, work, and goals.
When responding:
1. Provide a direct, compassionate, and clear conversational reflection or response to what the user wrote.
2. In addition, extract a concise summary (1-2 sentences), 3 actionable brainstorm ideas or questions, and 2-3 key insights.
3. Keep the tone grounded, constructive, and warm without excessive flattery or generic filler.

Output your response strictly as valid JSON matching this schema:
{
  "reply": "Conversational reflection response addressing the user directly...",
  "summary": "1-2 sentence executive summary of the core thoughts/themes.",
  "brainstormIdeas": ["Idea or deep question 1", "Idea or actionable experiment 2", "Idea or prompt 3"],
  "keyInsights": ["Key observation or pattern 1", "Key takeaway 2"],
  "suggestedFollowUps": ["Short follow-up question for the user 1", "Short follow-up question 2"]
}`;

      // Build contents array for multi-turn history
      const contents: any[] = [];

      if (entryTitle) {
        contents.push({
          role: 'user',
          parts: [{ text: `[Journal Topic / Title]: ${entryTitle}` }],
        });
        contents.push({
          role: 'model',
          parts: [{ text: `I am ready to reflect with you on "${entryTitle}".` }],
        });
      }

      // Add conversation history
      for (const turn of contextHistory) {
        if (turn.role && turn.text) {
          contents.push({
            role: turn.role === 'model' ? 'model' : 'user',
            parts: [{ text: turn.text }],
          });
        }
      }

      // Add current user prompt with requested mode annotation
      const modeInstruction = mode === 'brainstorm'
        ? `[Mode: Brainstorming & Expansion] Focus on creative solutions and new angles.`
        : mode === 'summarize'
        ? `[Mode: Synthesis & Summary] Focus on core takeaways and clarity.`
        : `[Mode: Mindful Reflection] Focus on deep exploration, emotional clarity, and thoughtful feedback.`;

      contents.push({
        role: 'user',
        parts: [{ text: `${modeInstruction}\n\n${prompt}` }],
      });

      const { text, modelUsed } = await generateContentWithFallback({
        systemInstruction,
        contents,
        config: {
          responseMimeType: 'application/json',
          temperature: mode === 'brainstorm' ? 0.8 : 0.6,
        },
      });

      let parsedResult: any;
      try {
        parsedResult = JSON.parse(text);
      } catch {
        // Fallback if formatting was non-json
        parsedResult = {
          reply: text,
          summary: 'Reflection completed.',
          brainstormIdeas: ['Explore deeper motives', 'Identify next practical step', 'Revisit in tomorrow\'s reflection'],
          keyInsights: ['Active self-awareness and intentional thought process'],
          suggestedFollowUps: ['How do you feel after writing this?', 'What is one concrete next action?'],
        };
      }

      res.json({
        reply: parsedResult.reply || text,
        summary: parsedResult.summary || 'Summary saved.',
        brainstormIdeas: Array.isArray(parsedResult.brainstormIdeas) ? parsedResult.brainstormIdeas : [],
        keyInsights: Array.isArray(parsedResult.keyInsights) ? parsedResult.keyInsights : [],
        suggestedFollowUps: Array.isArray(parsedResult.suggestedFollowUps) ? parsedResult.suggestedFollowUps : [],
        modelUsed,
      });
    } catch (err: any) {
      console.error('Error generating reflection:', err);
      res.status(500).json({
        error: err?.message || 'Failed to generate reflection with Gemini API.',
      });
    }
  });

  // 3. Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Gemini Reflection Journal server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
