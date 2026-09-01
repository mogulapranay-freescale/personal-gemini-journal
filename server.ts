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

  // 3. Gemini Growth Insights API Endpoint
  app.post('/api/growth/insights', async (req: Request, res: Response): Promise<void> => {
    try {
      const data = (req.body && typeof req.body === 'object') ? req.body : {};
      const reflections = Array.isArray(data.reflections) ? data.reflections : [];

      if (reflections.length === 0) {
        res.json({
          themes: [],
          trend: [],
          summary: 'No journal entries found yet. Start writing reflections to unlock personalized insights.',
          suggestedFocus: 'Write your first reflection on what matters most to you today.',
        });
        return;
      }

      // Format a concise representation of recent entries (up to 20)
      const recentEntries = reflections.slice(0, 20).map((r: any, idx: number) => ({
        index: idx + 1,
        title: r.title || 'Untitled',
        category: r.category || 'Daily Log',
        date: r.createdAt ? r.createdAt.slice(0, 10) : 'Recent',
        summary: r.summary || r.initialPrompt || '',
        insights: Array.isArray(r.keyInsights) ? r.keyInsights.join('; ') : '',
      }));

      const systemInstruction = `You are an insightful personal growth and reflection analyst.
Analyze the user's recent journal entries and extract higher-level growth insights.
You must return your response STRICTLY as valid JSON matching this schema:
{
  "themes": [
    {
      "name": "Theme Name (e.g. Career & Learning, Personal Goals, Mindfulness)",
      "description": "Short explanation of how this theme appears in their notes.",
      "frequency": 3
    }
  ],
  "trend": [
    {
      "date": "YYYY-MM-DD",
      "tone": "positive", 
      "score": 0.8
    }
  ],
  "summary": "Concise 3-5 sentence summary answering: what recurring themes appear, what is improving/changing, what challenges persist, and what positive patterns are observed.",
  "suggestedFocus": "One practical, actionable focus/action for the user this week based on their entries."
}
Note: tone in trend must be one of: "positive", "neutral", "challenging". Score is a float between 0.0 and 1.0. Include approximately 3-5 themes and trend entries for available dates.`;

      const contents = [
        {
          role: 'user',
          parts: [{ text: `Here are the user's recent journal entries:\n${JSON.stringify(recentEntries, null, 2)}` }],
        },
      ];

      const { text } = await generateContentWithFallback({
        systemInstruction,
        contents,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.4,
        },
      });

      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = {
          themes: [
            { name: 'Self-Reflection', description: 'Consistent focus on personal growth and clarity.', frequency: reflections.length },
          ],
          trend: reflections.slice(0, 5).map((r: any, i: number) => ({
            date: r.createdAt ? r.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
            tone: 'positive',
            score: 0.7 + (i * 0.05),
          })),
          summary: 'Your recent reflections demonstrate steady engagement with your goals and daily tasks. Themes of self-improvement and focus recur frequently. Maintaining this journaling cadence will provide deeper clarity over time.',
          suggestedFocus: 'Allocate 15 minutes each morning to outline your primary priority for the day.',
        };
      }

      res.json({
        themes: Array.isArray(parsed.themes) ? parsed.themes : [],
        trend: Array.isArray(parsed.trend) ? parsed.trend : [],
        summary: parsed.summary || 'Summary generated from your reflections.',
        suggestedFocus: parsed.suggestedFocus || 'Stay consistent with your reflection practice.',
      });
    } catch (err: any) {
      console.error('Error generating growth insights:', err);
      res.status(500).json({
        error: err?.message || 'Failed to generate growth insights.',
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
