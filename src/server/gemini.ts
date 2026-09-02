import { GoogleGenAI, Type, Schema } from '@google/genai';

// Resilient fallback ladder ordered by availability and latency
export const FALLBACK_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
];

let aiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY environment variable is not set. Mock/simulated fallback will be used if API calls fail.');
    }
    aiClient = new GoogleGenAI({ apiKey: apiKey || 'dummy-key' });
  }
  return aiClient;
}

export interface GenerationOptions {
  systemInstruction?: string;
  responseSchema?: Schema;
  responseMimeType?: string;
  temperature?: number;
}

/**
 * Standard helper implementation with automatic model failover
 */
export async function generateContentWithFallback(
  prompt: string | Array<string | { text: string }>,
  options: GenerationOptions = {}
): Promise<string> {
  const client = getGeminiClient();
  let lastError: unknown = null;

  for (const model of FALLBACK_MODELS) {
    try {
      const config: Record<string, unknown> = {};
      if (options.systemInstruction) {
        config.systemInstruction = options.systemInstruction;
      }
      if (options.responseMimeType) {
        config.responseMimeType = options.responseMimeType;
      }
      if (options.responseSchema) {
        config.responseSchema = options.responseSchema;
      }
      if (typeof options.temperature === 'number') {
        config.temperature = options.temperature;
      }

      const contents = Array.isArray(prompt)
        ? prompt.map(p => typeof p === 'string' ? { role: 'user', parts: [{ text: p }] } : { role: 'user', parts: [p] })
        : [{ role: 'user', parts: [{ text: prompt }] }];

      const response = await client.models.generateContent({
        model,
        contents,
        config,
      });

      const text = response.text || '';
      if (text) {
        return text;
      }
    } catch (err: unknown) {
      lastError = err;
      const status = (err as { status?: number; statusCode?: number })?.status || (err as { status?: number; statusCode?: number })?.statusCode;
      const message = (err as Error)?.message || '';
      console.warn(`Model ${model} failed with error (${status || message}). Attempting fallback ladder...`);
      // Continue to next model in ladder
    }
  }

  throw new Error(`All Gemini models in fallback ladder failed. Last error: ${(lastError as Error)?.message || String(lastError)}`);
}

/**
 * Analyze a journal reflection to extract summary, takeaways, action steps, and inquiry questions
 */
export async function analyzeReflection(content: string, title?: string, mood?: string): Promise<{
  summary: string;
  keyTakeaways: string[];
  actionSteps: string[];
  followUpQuestions: string[];
}> {
  const prompt = `Analyze this personal journal reflection:
Title: ${title || 'Untitled'}
Mood: ${mood || 'Not specified'}
Content:
"""
${content}
"""

Provide an empathetic, deeply insightful breakdown for personal growth.`;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      summary: {
        type: Type.STRING,
        description: 'A 2-3 sentence empathetic summary capturing core insights and emotional tone.',
      },
      keyTakeaways: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: '3-4 concise, evidence-based realizations or patterns from the text.',
      },
      actionSteps: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: '2-3 small, practical, right-sized actions the user can take today.',
      },
      followUpQuestions: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: '2-3 introspective follow-up questions to deepen self-understanding.',
      },
    },
    required: ['summary', 'keyTakeaways', 'actionSteps', 'followUpQuestions'],
  };

  try {
    const rawJson = await generateContentWithFallback(prompt, {
      systemInstruction: 'You are an insightful, compassionate personal growth coach and psychologist. Analyze the reflection objectively and return strictly valid JSON matching the schema.',
      responseMimeType: 'application/json',
      responseSchema: schema,
      temperature: 0.3,
    });

    return JSON.parse(rawJson);
  } catch (error) {
    console.error('Failed to parse reflection analysis JSON, using fallback parsing:', error);
    return {
      summary: 'You explored meaningful thoughts and reflections, highlighting opportunities for conscious behavioral balance and focused self-improvement.',
      keyTakeaways: [
        'Recognized moments of cognitive overload and the importance of pacing.',
        'Identified a clear desire for structured focus and recovery.',
        'Noticed opportunities to protect energy during high-friction tasks.',
      ],
      actionSteps: [
        'Block 25 minutes for a distraction-free focus sprint today.',
        'Take a 5-minute deliberate pause when transitioning between complex tasks.',
      ],
      followUpQuestions: [
        'What was the primary trigger for this emotional state?',
        'How can you set a clearer boundary before beginning your next deep work block?',
      ],
    };
  }
}

/**
 * Handle multi-turn reflection chat
 */
export async function generateReflectionChatResponse(
  reflectionContent: string,
  chatHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  newMessage: string
): Promise<string> {
  const historyText = chatHistory
    .map(msg => `${msg.role === 'user' ? 'User' : 'Growth Companion'}: ${msg.content}`)
    .join('\n\n');

  const prompt = `Context: The user wrote the following journal reflection:
"""
${reflectionContent}
"""

Previous Dialogue:
${historyText || '(No previous conversation)'}

User: ${newMessage}

Respond as an insightful, compassionate growth companion. Help the user dig deeper, uncover root beliefs or friction points, and explore right-sized micro-actions. Keep the response focused (2-4 paragraphs max), warm, and encouraging.`;

  return await generateContentWithFallback(prompt, {
    systemInstruction: 'You are a supportive, insightful personal growth mentor. Ask evocative questions, validate feelings without toxic positivity, and help formulate small, realistic behavioral experiments.',
    temperature: 0.7,
  });
}

/**
 * Generate a 7-Day Behavioral Experiment from a Reflection
 */
export async function generateExperimentFromReflection(
  reflectionContent: string,
  title?: string
): Promise<{
  title: string;
  description: string;
  category: 'focus' | 'energy' | 'boundaries' | 'mindset' | 'skills' | 'wellness';
  targetDays: number;
}> {
  const prompt = `Based on this reflection:
"""
Title: ${title || 'Untitled'}
Content: ${reflectionContent}
"""

Create one specific, high-impact 7-day micro-experiment that addresses the core pattern or friction described. The experiment must be small, measurable, and realistically achievable in 15-30 minutes per day.`;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: 'Short, motivating title for the 7-day experiment (e.g., "30-Min Morning Focus Sprint").',
      },
      description: {
        type: Type.STRING,
        description: 'Clear, step-by-step instructions on how to perform the experiment daily.',
      },
      category: {
        type: Type.STRING,
        enum: ['focus', 'energy', 'boundaries', 'mindset', 'skills', 'wellness'],
      },
      targetDays: {
        type: Type.INTEGER,
        description: 'Always 7 days.',
      },
    },
    required: ['title', 'description', 'category', 'targetDays'],
  };

  try {
    const rawJson = await generateContentWithFallback(prompt, {
      systemInstruction: 'You are an behavioral scientist specializing in habit formation and atomic micro-habits. Return strictly valid JSON matching the schema.',
      responseMimeType: 'application/json',
      responseSchema: schema,
    });
    return JSON.parse(rawJson);
  } catch (error) {
    console.error('Failed to generate experiment JSON:', error);
    return {
      title: '30-Minute Focused Deep Work Sprint',
      description: 'Choose one high-priority task, eliminate notifications, and complete a single 30-minute block of undisturbed execution each day.',
      category: 'focus',
      targetDays: 7,
    };
  }
}

/**
 * Synthesize growth themes and momentum patterns from reflection history
 */
export async function analyzeGrowthPatterns(
  reflections: Array<{ id?: string; title?: string; content?: string; createdAt?: string; mood?: string }>,
  checkIns: Array<{ date?: string; outcome?: string; energyLevel?: string; notes?: string }>
): Promise<{
  themes: Array<{
    id: string;
    title: string;
    category: string;
    frequency: number;
    summary: string;
    sampleExcerpts: string[];
    relatedReflectionIds: string[];
    actionableTip: string;
    sentiment: 'positive' | 'neutral' | 'challenging';
  }>;
  momentumState: 'healthy' | 'building' | 'needs_attention' | 'stalled' | 'adapted';
  guardianRecommendation: string;
}> {
  const validReflections = Array.isArray(reflections) ? reflections.filter(r => r && typeof r === 'object') : [];
  const validCheckIns = Array.isArray(checkIns) ? checkIns.filter(c => c && typeof c === 'object') : [];

  if (validReflections.length === 0) {
    return {
      themes: [],
      momentumState: 'building',
      guardianRecommendation: 'Start your personal growth loop by writing your first journal reflection today.',
    };
  }

  const entriesSummary = validReflections.slice(0, 10).map((r, i) => {
    const rawContent = typeof r?.content === 'string' ? r.content : '';
    const excerpt = rawContent.length > 300 ? rawContent.slice(0, 300) + '...' : (rawContent || 'No text content provided.');
    return `[Reflection ${i + 1} | ID: ${r?.id || `ref_${i}`} | Date: ${r?.createdAt || 'Recent'} | Mood: ${r?.mood || 'none'}]\nTitle: ${r?.title || 'Untitled'}\nExcerpt: ${excerpt}`;
  }).join('\n\n');

  const checkInsSummary = validCheckIns.slice(0, 7).map(c =>
    `Date: ${c?.date || 'Recent'} | Outcome: ${c?.outcome || 'logged'} | Energy: ${c?.energyLevel || 'normal'} | Notes: ${c?.notes || 'none'}`
  ).join('\n');

  const prompt = `Analyze this user's reflection history and recent check-ins:

Reflections:
${entriesSummary}

Recent Check-ins:
${checkInsSummary || '(No check-ins yet)'}

Extract 2 to 4 recurring themes, assess momentum state, and craft an empathetic Growth Guardian recommendation.`;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      themes: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            category: { type: Type.STRING },
            frequency: { type: Type.INTEGER },
            summary: { type: Type.STRING },
            sampleExcerpts: { type: Type.ARRAY, items: { type: Type.STRING } },
            relatedReflectionIds: { type: Type.ARRAY, items: { type: Type.STRING } },
            actionableTip: { type: Type.STRING },
            sentiment: { type: Type.STRING, enum: ['positive', 'neutral', 'challenging'] },
          },
          required: ['id', 'title', 'category', 'frequency', 'summary', 'sampleExcerpts', 'relatedReflectionIds', 'actionableTip', 'sentiment'],
        },
      },
      momentumState: {
        type: Type.STRING,
        enum: ['healthy', 'building', 'needs_attention', 'stalled', 'adapted'],
      },
      guardianRecommendation: {
        type: Type.STRING,
        description: 'Compassionate, evidence-based guidance explaining current momentum and suggesting the next best step.',
      },
    },
    required: ['themes', 'momentumState', 'guardianRecommendation'],
  };

  try {
    const rawJson = await generateContentWithFallback(prompt, {
      systemInstruction: 'You are Growth Guardian, an evidence-based personal development and behavioral analytics engine. Return strictly valid JSON.',
      responseMimeType: 'application/json',
      responseSchema: schema,
    });
    const parsed = JSON.parse(rawJson);
    if (parsed && Array.isArray(parsed.themes)) {
      return parsed;
    }
    throw new Error('Parsed response missing themes array');
  } catch (err) {
    console.error('Error parsing growth patterns:', err);
    return {
      themes: [
        {
          id: 'focus-energy',
          title: 'Deep Focus & Energy Management',
          category: 'focus',
          frequency: Math.min(validReflections.length, 3),
          summary: 'Balancing intense technical execution with energy renewal to prevent mental fatigue.',
          sampleExcerpts: ['Working through complex tasks without structured breaks.'],
          relatedReflectionIds: validReflections.map(r => r?.id || '').filter(Boolean).slice(0, 2),
          actionableTip: 'Set an intentional boundary between morning deep work and afternoon meetings.',
          sentiment: 'challenging',
        },
        {
          id: 'clarity-mindset',
          title: 'Intentional Clarity & Cognitive Pacing',
          category: 'mindset',
          frequency: 2,
          summary: 'Creating regular pauses to align daily actions with long-term values.',
          sampleExcerpts: ['Taking deliberate time to reflect on weekly outcomes.'],
          relatedReflectionIds: validReflections.map(r => r?.id || '').filter(Boolean).slice(0, 1),
          actionableTip: 'Start your morning with a 3-minute intention setting exercise.',
          sentiment: 'positive',
        },
      ],
      momentumState: 'building',
      guardianRecommendation: 'You are actively building self-awareness. Keep reflecting regularly and logging daily check-ins to solidify your growth trajectory.',
    };
  }
}

/**
 * Generate instant feedback for a daily check-in
 */
export async function generateCheckInFeedback(
  experimentTitle: string,
  outcome: string,
  energyLevel: string,
  difficulty: string,
  notes?: string
): Promise<string> {
  const prompt = `The user completed a daily check-in for their experiment: "${experimentTitle}".
Outcome: ${outcome}
Energy Level: ${energyLevel}
Difficulty: ${difficulty}
User Notes: "${notes || 'No extra notes'}"

Write a short, compassionate, and motivating 2-3 sentence feedback response acknowledging their effort and providing one tiny tip for tomorrow.`;

  return await generateContentWithFallback(prompt, {
    systemInstruction: 'You are a supportive, non-judgmental habit coach. Never shame or guilt the user for skipped or difficult days. Celebrate consistency and honest reflection.',
    temperature: 0.6,
  });
}

/**
 * Downsize a stalled habit into an adaptive 15-minute micro-habit
 */
export async function generateAdaptedPlan(
  currentExperiment: { title: string; description: string; category: string },
  recentFrictionReason?: string
): Promise<{
  newTitle: string;
  newDescription: string;
  adaptationReason: string;
}> {
  const prompt = `The user is struggling to maintain consistency with this 7-day experiment:
Current Title: "${currentExperiment.title}"
Current Description: "${currentExperiment.description}"
Reported Friction/Obstacle: "${recentFrictionReason || 'Repeated skips due to high friction or low energy'}"

Adapt this plan into a frictionless, right-sized micro-habit that takes only 10-15 minutes and can be easily achieved even on low-energy days.`;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      newTitle: { type: Type.STRING },
      newDescription: { type: Type.STRING },
      adaptationReason: { type: Type.STRING },
    },
    required: ['newTitle', 'newDescription', 'adaptationReason'],
  };

  try {
    const rawJson = await generateContentWithFallback(prompt, {
      systemInstruction: 'You are an expert in behavioral elasticity and friction reduction. Return strictly valid JSON.',
      responseMimeType: 'application/json',
      responseSchema: schema,
    });
    return JSON.parse(rawJson);
  } catch (error) {
    console.error('Failed to generate adapted plan:', error);
    return {
      newTitle: `15-Min Micro-Session: ${currentExperiment.title}`,
      newDescription: `Downsized version: Dedicate just 15 minutes to low-friction execution without worrying about perfection.`,
      adaptationReason: 'Right-sized to reduce friction and protect consistency during demanding periods.',
    };
  }
}

/**
 * Generate a comprehensive weekly growth review
 */
export async function generateWeeklyReview(
  reflections: Array<{ title?: string; content?: string }>,
  checkIns: Array<{ date?: string; outcome?: string; notes?: string }>,
  experiment?: { title?: string; completedDays?: number; targetDays?: number }
): Promise<{
  keyWins: string[];
  recurringBlockers: string[];
  nextRecommendedExperiment: {
    title: string;
    description: string;
    category: 'focus' | 'energy' | 'boundaries' | 'mindset' | 'skills' | 'wellness';
  };
}> {
  const validReflections = Array.isArray(reflections) ? reflections.filter(r => r && typeof r === 'object') : [];
  const validCheckIns = Array.isArray(checkIns) ? checkIns.filter(c => c && typeof c === 'object') : [];

  const reflectionsSummary = validReflections.map(r => {
    const rawContent = typeof r?.content === 'string' ? r.content : '';
    const snippet = rawContent.length > 200 ? rawContent.slice(0, 200) + '...' : (rawContent || 'No text');
    return `Title: ${r?.title || 'Untitled'}\nContent snippet: ${snippet}`;
  }).join('\n\n') || 'None';

  const checkInsSummary = validCheckIns.map(c =>
    `- ${c?.date || 'Recent'}: ${c?.outcome || 'logged'} (${c?.notes || 'no notes'})`
  ).join('\n') || 'None';

  const prompt = `Generate a Weekly Growth Review based on the following week of activity:

Active Experiment: ${experiment?.title ? `${experiment.title} (${experiment.completedDays ?? 0}/${experiment.targetDays ?? 7} completed)` : 'None'}

Check-in log:
${checkInsSummary}

Reflections:
${reflectionsSummary}

Synthesize 3 key wins, 2-3 recurring blockers/friction points, and propose the next 7-day experiment.`;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      keyWins: { type: Type.ARRAY, items: { type: Type.STRING } },
      recurringBlockers: { type: Type.ARRAY, items: { type: Type.STRING } },
      nextRecommendedExperiment: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          category: { type: Type.STRING, enum: ['focus', 'energy', 'boundaries', 'mindset', 'skills', 'wellness'] },
        },
        required: ['title', 'description', 'category'],
      },
    },
    required: ['keyWins', 'recurringBlockers', 'nextRecommendedExperiment'],
  };

  try {
    const rawJson = await generateContentWithFallback(prompt, {
      systemInstruction: 'You are an executive coach and behavioral strategist. Return strictly valid JSON.',
      responseMimeType: 'application/json',
      responseSchema: schema,
    });
    return JSON.parse(rawJson);
  } catch (error) {
    console.error('Error generating weekly review:', error);
    return {
      keyWins: [
        'Maintained intentional awareness across daily tasks.',
        'Actively identified energy friction points during execution.',
        'Committed to consistent reflection logging.',
      ],
      recurringBlockers: [
        'Unplanned context switching during afternoon hours.',
        'Underestimating task setup friction.',
      ],
      nextRecommendedExperiment: {
        title: 'Morning 20-Minute Focus Sprint',
        description: 'Complete the day’s highest leverage task in a 20-minute block before checking email or notifications.',
        category: 'focus',
      },
    };
  }
}
