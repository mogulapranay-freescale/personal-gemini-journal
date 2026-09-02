import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  analyzeReflection,
  generateReflectionChatResponse,
  generateExperimentFromReflection,
  analyzeGrowthPatterns,
  generateCheckInFeedback,
  generateAdaptedPlan,
  generateWeeklyReview,
} from './src/server/gemini.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Top-Level Request Deserialization (Ordering Guarantee)
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check Endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Gemini Reflection & My Growth API',
  });
});

/**
 * 1. Analyze reflection (Summary, Key Takeaways, Action Steps, Follow-up Questions)
 */
app.post('/api/gemini/analyze-reflection', async (req: Request, res: Response) => {
  try {
    const data = (req.body && typeof req.body === 'object') ? req.body : {};
    const content = typeof data.content === 'string' ? data.content : '';
    const title = typeof data.title === 'string' ? data.title : undefined;
    const mood = typeof data.mood === 'string' ? data.mood : undefined;

    const effectiveContent = content.trim() || (title ? `Reflection on ${title}` : 'Personal reflection session');
    const analysis = await analyzeReflection(effectiveContent, title, mood);
    res.json(analysis);
  } catch (error) {
    console.error('Error in /api/gemini/analyze-reflection:', error);
    res.json({
      summary: 'You captured meaningful thoughts and reflections, highlighting opportunities for conscious behavioral balance.',
      keyTakeaways: [
        'Maintained intentional mindfulness during your day.',
        'Recognized areas where energy and focus can be protected.',
        'Committed to consistent reflection and growth.',
      ],
      actionSteps: [
        'Take a 5-minute pause before starting your next major task.',
        'Celebrate taking action on your personal growth today.',
      ],
      followUpQuestions: [
        'What is the single most important lesson from this reflection?',
        'How can you make tomorrow 1% easier or more intentional?',
      ],
    });
  }
});

/**
 * 2. Multi-turn reflection chat
 */
app.post('/api/gemini/reflection-chat', async (req: Request, res: Response) => {
  try {
    const data = (req.body && typeof req.body === 'object') ? req.body : {};
    const reflectionContent = typeof data.reflectionContent === 'string' ? data.reflectionContent : '';
    const chatHistory = Array.isArray(data.chatHistory) ? data.chatHistory : [];
    const message = typeof data.message === 'string' ? data.message : '';

    const effectiveContent = reflectionContent.trim() || 'Personal growth reflection';
    const effectiveMessage = message.trim() || 'How can I turn this into action?';

    const responseText = await generateReflectionChatResponse(effectiveContent, chatHistory, effectiveMessage);
    res.json({ reply: responseText });
  } catch (error) {
    console.error('Error in /api/gemini/reflection-chat:', error);
    res.json({
      reply: 'I hear you. Taking this one step at a time is the best way forward. What feels like the most realistic micro-step you can take today?',
    });
  }
});

/**
 * 3. Generate 7-Day Experiment from a Reflection
 */
app.post('/api/gemini/generate-experiment', async (req: Request, res: Response) => {
  try {
    const data = (req.body && typeof req.body === 'object') ? req.body : {};
    const content = typeof data.content === 'string' ? data.content : '';
    const title = typeof data.title === 'string' ? data.title : undefined;

    const effectiveContent = content.trim() || (title ? `Reflection on ${title}` : 'Personal growth reflection and daily focus habit');
    const experiment = await generateExperimentFromReflection(effectiveContent, title);
    res.json(experiment);
  } catch (error) {
    console.error('Error in /api/gemini/generate-experiment:', error);
    res.json({
      title: '30-Minute Focused Execution Sprint',
      description: 'Choose one high-priority goal, remove all digital distractions, and execute with uninterrupted focus for 30 minutes daily.',
      category: 'focus',
      targetDays: 7,
    });
  }
});

/**
 * 4. Growth patterns, themes & momentum synthesis
 */
app.post('/api/gemini/analyze-growth', async (req: Request, res: Response) => {
  try {
    const data = (req.body && typeof req.body === 'object') ? req.body : {};
    const reflections = Array.isArray(data.reflections) ? data.reflections : [];
    const checkIns = Array.isArray(data.checkIns) ? data.checkIns : [];

    const result = await analyzeGrowthPatterns(reflections, checkIns);
    res.json(result);
  } catch (error) {
    console.error('Error in /api/gemini/analyze-growth:', error);
    res.json({
      themes: [
        {
          id: 'focus-energy',
          title: 'Deep Focus & Energy Management',
          category: 'focus',
          frequency: 3,
          summary: 'Balancing intense execution with deliberate energy renewal.',
          sampleExcerpts: ['Working through demanding tasks.'],
          relatedReflectionIds: [],
          actionableTip: 'Set a clear boundary between morning focus blocks and afternoon tasks.',
          sentiment: 'positive',
        },
      ],
      momentumState: 'building',
      guardianRecommendation: 'You are actively building momentum. Keep logging daily reflections and check-ins.',
    });
  }
});

/**
 * 5. Check-in instant feedback
 */
app.post('/api/gemini/checkin-feedback', async (req: Request, res: Response) => {
  try {
    const data = (req.body && typeof req.body === 'object') ? req.body : {};
    const experimentTitle = typeof data.experimentTitle === 'string' ? data.experimentTitle : 'Daily Experiment';
    const outcome = typeof data.outcome === 'string' ? data.outcome : 'done';
    const energyLevel = typeof data.energyLevel === 'string' ? data.energyLevel : 'medium';
    const difficulty = typeof data.difficulty === 'string' ? data.difficulty : 'moderate';
    const notes = typeof data.notes === 'string' ? data.notes : undefined;

    const feedback = await generateCheckInFeedback(experimentTitle, outcome, energyLevel, difficulty, notes);
    res.json({ feedback });
  } catch (error) {
    console.error('Error in /api/gemini/checkin-feedback:', error);
    res.json({
      feedback: 'Great job checking in today! Every logged check-in strengthens your momentum loop. Keep friction low and take it one day at a time.',
    });
  }
});

/**
 * 6. Adaptive plan downsizing on stalled habit
 */
app.post('/api/gemini/adapt-plan', async (req: Request, res: Response) => {
  try {
    const data = (req.body && typeof req.body === 'object') ? req.body : {};
    const currentExperiment = data.currentExperiment || {
      title: 'Current Habit',
      description: 'Daily focus session',
      category: 'focus',
    };
    const frictionReason = typeof data.frictionReason === 'string' ? data.frictionReason : undefined;

    const adapted = await generateAdaptedPlan(currentExperiment, frictionReason);
    res.json(adapted);
  } catch (error) {
    console.error('Error in /api/gemini/adapt-plan:', error);
    res.json({
      newTitle: `15-Min Micro-Habit: ${data?.currentExperiment?.title || 'Daily Focus'}`,
      newDescription: 'Downsized version: Dedicate just 15 minutes of low-pressure execution to preserve momentum.',
      adaptationReason: 'Right-sized to eliminate friction and protect your consistency streak.',
    });
  }
});

/**
 * 7. Weekly growth review
 */
app.post('/api/gemini/weekly-review', async (req: Request, res: Response) => {
  try {
    const data = (req.body && typeof req.body === 'object') ? req.body : {};
    const reflections = Array.isArray(data.reflections) ? data.reflections : [];
    const checkIns = Array.isArray(data.checkIns) ? data.checkIns : [];
    const experiment = data.experiment;

    const review = await generateWeeklyReview(reflections, checkIns, experiment);
    res.json(review);
  } catch (error) {
    console.error('Error in /api/gemini/weekly-review:', error);
    res.json({
      keyWins: [
        'Maintained intentional mindfulness across the week.',
        'Showed resilience in logging reflections and check-ins.',
        'Identified opportunities to right-size challenging tasks.',
      ],
      recurringBlockers: [
        'Context switching during afternoon execution blocks.',
        'Overestimating available energy on high-demand days.',
      ],
      nextRecommendedExperiment: {
        title: 'Morning 20-Minute Focus Sprint',
        description: 'Complete one high-priority task in a 20-minute uninterrupted block before checking communication channels.',
        category: 'focus',
      },
    });
  }
});

// Vite middleware or Static serving
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  // Error handling middleware
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
