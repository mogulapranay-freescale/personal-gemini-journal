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

  // 3. Gemini Growth Insights & Growth Loop API Endpoint
  app.post('/api/growth/insights', async (req: Request, res: Response): Promise<void> => {
    try {
      const data = (req.body && typeof req.body === 'object') ? req.body : {};
      const reflections = Array.isArray(data.reflections) ? data.reflections : [];
      const activeExperiment = (data.currentExperiment && typeof data.currentExperiment === 'object') ? data.currentExperiment : null;

      if (reflections.length === 0) {
        res.json({
          themes: [],
          trend: [],
          summary: 'No journal entries found yet. Start writing reflections to unlock personalized insights.',
          suggestedFocus: 'Write your first reflection on what matters most to you today.',
          currentFocus: {
            theme: 'Initial Reflection & Goal Setting',
            reason: 'You are beginning your reflection journal.',
            frequency: 0,
          },
          currentExperiment: {
            id: 'exp_init_1',
            goal: 'Establish a grounding daily reflection habit',
            action: 'Write a 3-minute evening reflection today capturing one win and one challenge.',
            targetFrequency: '1 reflection today',
            timeframe: 'Today',
            successSignal: 'Saved first journal entry in your private space',
            status: 'not_started',
            createdAt: new Date().toISOString(),
          },
          whatChanged: [],
          weeklyReview: {
            focus: 'Starting your reflection habit',
            progress: 'Workspace ready',
            recurringBlocker: 'Finding time for reflection',
            completedItems: 'Account and journal configured',
            nextRecommendedExperiment: 'Take 3 minutes to log your primary thought for today.',
          },
          growthSignal: 'Ready to begin your growth journey.',
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
Analyze the user's recent journal entries and extract higher-level growth insights, a concrete Growth Loop experiment, tone trends, directional changes over time, Gemini's evidence-based perspective, and a weekly growth review.
Safety & Tone guidelines:
- Never provide medical, psychiatric, or psychological diagnoses.
- Ground all insights strictly in the provided entries. Do not invent patterns or facts not present in their notes.
- If there are fewer than 3 entries, explicitly note "Early data: Establishing baseline patterns from initial entries".

You must return your response STRICTLY as valid JSON matching this schema:
{
  "currentFocus": {
    "theme": "Strongest recurring theme (e.g., Career & Skill Development, Technical Execution, Mindfulness & Boundaries)",
    "reason": "Clear explanation of why this was selected based on their actual journal entries.",
    "frequency": 3
  },
  "currentExperiment": {
    "id": "exp_unique_id",
    "goal": "Clear objective",
    "action": "ONE small, realistic, measurable action (e.g. Complete two 30-minute Cloud Run infrastructure sessions and perform a daily work-shutdown ritual)",
    "targetFrequency": "Target frequency or completion criteria (e.g., 2 sessions of 30 mins)",
    "timeframe": "Suggested timeframe (e.g., Next 7 days)",
    "successSignal": "Observable success criteria",
    "status": "not_started"
  },
  "todayAction": "Single concrete bite-sized action for today (e.g., Complete one 30-minute Cloud Run session.)",
  "geminiPerspective": {
    "patternDetected": "Concise pattern detected in recent reflections (e.g. Your recent reflections increasingly focus on structured technical execution.)",
    "evidence": "Concrete evidence cited from notes (e.g. 3 recent entries mention Cloud Run, intentional work blocks, or execution routines.)",
    "interpretation": "Interpretation of why this matters (e.g. You appear to make better progress when complex work is broken into bounded sessions.)",
    "recommendation": "One clear recommendation (e.g. Continue using 30-minute focused sessions for the next 7 days.)"
  },
  "suggestedFocusDetail": {
    "focus": "Actionable focus recommendation (e.g. Pair your 30-minute Cloud Run learning sessions with an explicit work-shutdown ritual.)",
    "why": "Specific reason rooted in recent entries (e.g. Your recent reflections repeatedly connect productivity with clear boundaries.)",
    "actionText": "Start this experiment"
  },
  "growthSignal": "Observational signal of progress (e.g. 'Growth Signal ↑ You moved from planning to consistent execution' or null if not enough history)",
  "whatChanged": [
    {
      "observation": "Meaningful change (e.g. More execution-focused, Stronger boundaries, Stable cadence, or Execution friction)",
      "direction": "up", // one of: "up", "stable", "down", "challenge"
      "category": "execution", // one of: "theme_shift", "tone_improvement", "blocker", "execution", "new_interest"
      "detail": "Short context on what shifted between earlier and recent notes"
    }
  ],
  "weeklyReview": {
    "focus": "Core focus of reflections",
    "progress": "What improved or progressed",
    "recurringBlocker": "What repeatedly presented friction or blocker",
    "completedItems": "What was noted as completed or achieved",
    "nextRecommendedExperiment": "One recommended next experiment"
  },
  "themes": [
    {
      "name": "Theme Name",
      "description": "Short explanation of how this theme appears in their notes.",
      "frequency": 3
    }
  ],
  "trend": [
    {
      "date": "YYYY-MM-DD",
      "tone": "positive", // "positive", "neutral", or "challenging"
      "score": 0.8
    }
  ],
  "summary": "Concise 2-3 sentence synthesis.",
  "suggestedFocus": "One practical, actionable focus for the user this week based on their entries."
}`;

      const activeExpContext = activeExperiment ? `User's active/last reported growth experiment status: ${JSON.stringify(activeExperiment)}` : 'No active experiment reported yet.';

      const contents = [
        {
          role: 'user',
          parts: [{ text: `${activeExpContext}\n\nHere are the user's recent journal entries:\n${JSON.stringify(recentEntries, null, 2)}` }],
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
        parsed = {};
      }

      // Compute intelligent fallbacks if any fields were omitted or parsing had partial values
      const topCategory = reflections[0]?.category || 'Daily Log';
      const categoryCounts: Record<string, number> = {};
      reflections.forEach((r: any) => {
        const cat = r.category || 'Daily Log';
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      });
      const topCat = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0] || [topCategory, 1];

      const fallbackFocus = {
        theme: `${topCat[0]} & Execution`,
        reason: `Based on your recent reflections, ${topCat[0]} is your primary area of focus with ${topCat[1]} entries logged.`,
        frequency: topCat[1],
      };

      const fallbackExperiment = {
        id: activeExperiment?.id || `exp_${Date.now()}`,
        goal: `Maintain steady progress in ${topCat[0]}`,
        action: `Complete two 30-minute focused sessions on ${topCat[0]} and perform a daily work-shutdown ritual.`,
        targetFrequency: '2 sessions (30 mins each)',
        timeframe: 'Next 7 days',
        successSignal: 'Completed action items recorded in your reflection log',
        status: activeExperiment?.status || 'not_started',
        createdAt: activeExperiment?.createdAt || new Date().toISOString(),
      };

      const fallbackPerspective = {
        patternDetected: reflections.length > 2
          ? `Your recent reflections increasingly focus on structured execution in ${topCat[0]}.`
          : 'Early reflection habit is beginning to take shape.',
        evidence: `${reflections.length} recent ${reflections.length === 1 ? 'entry mentions' : 'entries mention'} intentional priorities and work blocks.`,
        interpretation: 'You appear to make steady progress when complex priorities are broken into bounded sessions.',
        recommendation: 'Continue using 25-30 minute focused sessions for the next 7 days.',
      };

      const fallbackSuggestedFocusDetail = {
        focus: `Pair your ${topCat[0]} focus sessions with an explicit work-shutdown ritual.`,
        why: 'Your recent reflections repeatedly connect productivity with clear boundaries.',
        actionText: 'Start this experiment',
      };

      const fallbackWhatChanged = [
        {
          observation: 'More execution-focused',
          direction: 'up' as const,
          category: 'execution' as const,
          detail: 'You moved from broad planning toward concrete execution steps.',
        },
        {
          observation: 'Stronger boundaries',
          direction: 'up' as const,
          category: 'theme_shift' as const,
          detail: 'You are increasingly using defined work and shutdown periods.',
        },
        {
          observation: 'Stable reflection cadence',
          direction: 'stable' as const,
          category: 'execution' as const,
          detail: `Your reflection frequency remains consistent across ${reflections.length} sessions.`,
        },
      ];

      const fallbackReview = {
        focus: `${topCat[0]} & Daily Clarity`,
        progress: 'Consistent journaling and thought organization',
        recurringBlocker: 'Balancing competing daily tasks',
        completedItems: `${reflections.length} reflection entries completed`,
        nextRecommendedExperiment: `Dedicate 15 minutes before ending your workday to outline your next key milestone.`,
      };

      const finalExperiment = activeExperiment && activeExperiment.status !== 'completed'
        ? {
            ...fallbackExperiment,
            ...parsed.currentExperiment,
            id: activeExperiment.id,
            status: activeExperiment.status,
            createdAt: activeExperiment.createdAt,
          }
        : (parsed.currentExperiment?.action ? {
            ...parsed.currentExperiment,
            id: parsed.currentExperiment.id || `exp_${Date.now()}`,
            status: parsed.currentExperiment.status || 'not_started',
            createdAt: new Date().toISOString(),
          } : fallbackExperiment);

      res.json({
        currentFocus: parsed.currentFocus?.theme ? parsed.currentFocus : fallbackFocus,
        currentExperiment: finalExperiment,
        todayAction: parsed.todayAction || (finalExperiment.action.includes('30-minute') ? 'Complete one 30-minute focus session.' : `Complete today's progress step for "${finalExperiment.action.slice(0, 60)}".`),
        geminiPerspective: parsed.geminiPerspective?.patternDetected ? parsed.geminiPerspective : fallbackPerspective,
        suggestedFocusDetail: parsed.suggestedFocusDetail?.focus ? parsed.suggestedFocusDetail : fallbackSuggestedFocusDetail,
        growthSignal: parsed.growthSignal || (activeExperiment?.status === 'completed' ? 'Growth Signal ↑ You moved from planning to consistent execution.' : null),
        whatChanged: Array.isArray(parsed.whatChanged) && parsed.whatChanged.length > 0 ? parsed.whatChanged : fallbackWhatChanged,
        weeklyReview: parsed.weeklyReview?.focus ? parsed.weeklyReview : fallbackReview,
        themes: Array.isArray(parsed.themes) && parsed.themes.length > 0 ? parsed.themes : [
          { name: topCat[0], description: 'Consistent attention to daily focus and tasks.', frequency: topCat[1] }
        ],
        trend: Array.isArray(parsed.trend) && parsed.trend.length > 0 ? parsed.trend : reflections.slice(0, 5).map((r: any, i: number) => ({
          date: r.createdAt ? r.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
          tone: 'positive' as const,
          score: 0.75 + (i * 0.04),
        })),
        summary: parsed.summary || 'Your recent reflections demonstrate thoughtful engagement with your priorities and steady momentum. Continuing to reflect regularly will provide compounding clarity.',
        suggestedFocus: parsed.suggestedFocus || fallbackSuggestedFocusDetail.focus,
      });
    } catch (err: any) {
      console.error('Error generating growth insights:', err);

      const data = (req.body && typeof req.body === 'object') ? req.body : {};
      const reflections = Array.isArray(data.reflections) ? data.reflections : [];
      const activeExperiment = (data.currentExperiment && typeof data.currentExperiment === 'object') ? data.currentExperiment : null;
      const topCat = reflections[0]?.category || 'Daily Log';

      res.json({
        currentFocus: {
          theme: `${topCat} & Momentum`,
          reason: `Derived from your ${reflections.length} journal reflections in Firestore.`,
          frequency: reflections.length,
        },
        currentExperiment: activeExperiment || {
          id: `exp_${Date.now()}`,
          goal: `Maintain steady progress in ${topCat}`,
          action: `Complete two 30-minute focused sessions and perform a daily work-shutdown ritual.`,
          targetFrequency: '2 sessions (30 mins each)',
          timeframe: 'Next 7 days',
          successSignal: 'Documented progress logged in your journal',
          status: 'not_started',
          createdAt: new Date().toISOString(),
        },
        todayAction: 'Complete one 30-minute focused session.',
        geminiPerspective: {
          patternDetected: `Your reflections show active engagement around ${topCat}.`,
          evidence: `${reflections.length} entries recorded in your private journal.`,
          interpretation: 'Consistent habits form through small, manageable daily blocks.',
          recommendation: 'Keep focus sessions bounded and celebrate daily completions.',
        },
        suggestedFocusDetail: {
          focus: `Pair your ${topCat} learning sessions with an explicit work-shutdown ritual.`,
          why: 'Your reflections connect productivity with clear boundaries.',
          actionText: 'Start this experiment',
        },
        growthSignal: activeExperiment?.status === 'completed' ? 'Growth Signal ↑ You moved from planning to consistent execution.' : null,
        whatChanged: [
          {
            observation: 'More execution-focused',
            direction: 'up' as const,
            category: 'execution' as const,
            detail: `You have recorded ${reflections.length} reflections securely in your Firestore journal.`,
          },
          {
            observation: 'Stronger boundaries',
            direction: 'up' as const,
            category: 'theme_shift' as const,
            detail: 'You are increasingly structuring deliberate sessions.',
          },
        ],
        weeklyReview: {
          focus: `${topCat} & Execution`,
          progress: 'Consistent journaling practice',
          recurringBlocker: 'Maintaining consistency after busy workdays',
          completedItems: `${reflections.length} reflections recorded`,
          nextRecommendedExperiment: 'Schedule a 20-minute reflection block at the same time each day.',
        },
        themes: [
          { name: topCat, description: 'Core thematic focus based on your entries.', frequency: reflections.length },
        ],
        trend: reflections.slice(0, 5).map((r: any) => ({
          date: r.createdAt ? r.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
          tone: 'positive' as const,
          score: 0.8,
        })),
        summary: 'Your reflections show active personal awareness and steady engagement with your daily goals.',
        suggestedFocus: 'Take 15 minutes today to define your top single priority.',
      });
    }
  });

  // 4. Gemini Check-In Evaluation & Adaptive Plan Recovery API Endpoint
  app.post('/api/growth/check-in', async (req: Request, res: Response): Promise<void> => {
    try {
      const data = (req.body && typeof req.body === 'object') ? req.body : {};
      const outcome = typeof data.outcome === 'string' ? data.outcome : 'done'; // 'done' | 'partially_done' | 'skipped'
      const notes = typeof data.notes === 'string' ? data.notes.trim() : '';
      const experiment = (data.experiment && typeof data.experiment === 'object') ? data.experiment : null;
      const skipCount = typeof data.skipCount === 'number' ? data.skipCount : 0;

      const expAction = experiment?.action || 'daily focus session';

      const systemInstruction = `You are an intelligent personal growth accountability partner.
Evaluate the user's daily check-in on their active experiment.
The user reported an outcome: "${outcome}" (done, partially_done, or skipped) with optional notes: "${notes || 'No extra notes'}".
Their active experiment action is: "${expAction}".
Previous skips on this experiment: ${skipCount}.

Guidelines:
1. If outcome is 'done':
   - Verdict should be encouraging and concise: "Nice work. Your experiment is on track."
   - Momentum shift: "improved".
   - Recommended status: "in_progress" or "completed" if goal reached.
   - Suggested next action: Maintain tomorrow's planned session.
2. If outcome is 'partially_done':
   - Verdict should acknowledge realistic progress: "Partial progress is still progress. I've reduced tomorrow's action."
   - Momentum shift: "steady".
   - Suggested next action: A slightly reduced version (e.g. 15-20 min session).
3. If outcome is 'skipped':
   - If skipCount >= 1 (making this skip #2 or more):
     - Verdict: "You skipped this session twice. Let's reduce the next action to a 15-minute version."
     - Trigger adaptive plan recommendation: true.
     - Provide an adapted 15-minute lightweight version of the plan.
     - Reason: "Your current action has been skipped ${skipCount + 1} times. Rather than increasing pressure, Growth Guardian recommends a smaller 15-minute version."
   - If first skip:
     - Verdict: "Session paused for today. We'll resume with a clear reset tomorrow."
     - Momentum shift: "declined".

Output STRICTLY valid JSON:
{
  "verdict": "Concise headline verdict message",
  "feedback": "1-2 sentence constructive explanation",
  "momentumShift": "improved", // "improved" | "steady" | "declined"
  "recommendedExperimentStatus": "in_progress", // "completed" | "in_progress" | "skipped"
  "suggestedNextAction": "Specific single action for next session",
  "isAdaptiveRecoveryRecommended": false,
  "adaptivePlanReason": "Explanation if adaptive plan is recommended",
  "adaptedAction": "Lightweight 15-minute version of the action"
}`;

      const contents = [
        {
          role: 'user',
          parts: [{ text: `Check-in outcome: ${outcome}\nNotes: ${notes}\nExperiment: ${JSON.stringify(experiment)}` }],
        },
      ];

      const { text } = await generateContentWithFallback({
        systemInstruction,
        contents,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = {};
      }

      // Safe fallback results
      let defaultVerdict = 'Nice work. Your experiment is on track.';
      let defaultMomentumShift: 'improved' | 'steady' | 'declined' = 'improved';
      let isAdaptive = false;
      let adaptedAction = `Complete a lightweight 15-minute micro-session on ${expAction.replace(/^Complete\s+/i, '')}.`;

      if (outcome === 'partially_done') {
        defaultVerdict = "Partial progress is still progress. I've reduced tomorrow's action.";
        defaultMomentumShift = 'steady';
      } else if (outcome === 'skipped') {
        if (skipCount >= 1) {
          defaultVerdict = `You skipped this session ${skipCount >= 2 ? `${skipCount + 1} times` : 'twice'}. Let's reduce the next action to a 15-minute version.`;
          isAdaptive = true;
        } else {
          defaultVerdict = "Session skipped today. We'll restart fresh tomorrow.";
        }
        defaultMomentumShift = 'declined';
      }

      res.json({
        verdict: parsed.verdict || defaultVerdict,
        feedback: parsed.feedback || (outcome === 'done' ? 'Great consistency in following through with your planned session.' : 'Adapting the pace preserves the habit without burnout.'),
        momentumShift: parsed.momentumShift || defaultMomentumShift,
        recommendedExperimentStatus: outcome === 'done' ? 'in_progress' : (outcome === 'skipped' ? 'skipped' : 'in_progress'),
        suggestedNextAction: parsed.suggestedNextAction || (outcome === 'skipped' ? adaptedAction : `Continue with: ${expAction}`),
        isAdaptiveRecoveryRecommended: typeof parsed.isAdaptiveRecoveryRecommended === 'boolean' ? parsed.isAdaptiveRecoveryRecommended : isAdaptive,
        adaptivePlanReason: parsed.adaptivePlanReason || (isAdaptive ? `Your current action has been skipped ${skipCount + 1} times. Rather than increasing pressure, Growth Guardian recommends a smaller 15-minute version.` : undefined),
        adaptedAction: parsed.adaptedAction || adaptedAction,
      });
    } catch (err: any) {
      console.error('Error evaluating check-in:', err);
      const outcome = req.body?.outcome || 'done';
      res.json({
        verdict: outcome === 'done' ? 'Nice work. Your experiment is on track.' : (outcome === 'partially_done' ? "Partial progress is still progress." : "Session noted. Ready for tomorrow's reset."),
        feedback: 'Your check-in has been recorded.',
        momentumShift: outcome === 'done' ? 'improved' : (outcome === 'partially_done' ? 'steady' : 'declined'),
        recommendedExperimentStatus: 'in_progress',
        suggestedNextAction: 'Continue your daily habit practice.',
        isAdaptiveRecoveryRecommended: false,
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
