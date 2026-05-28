import OpenAI from 'openai';

const DEFAULT_GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

export type Flashcard = { question: string; answer: string };

type FlashcardsResponse = { flashcards: Flashcard[] };

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY environment variable is not set');
  }

  return new OpenAI({
    apiKey,
    baseURL: DEFAULT_GROQ_BASE_URL,
  });
}

function chunkText(text: string, maxChars: number): string[] {
  if (!text) return [''];
  const normalized = text.trim();
  if (normalized.length <= maxChars) return [normalized];

  const chunks: string[] = [];
  let i = 0;
  while (i < normalized.length) {
    chunks.push(normalized.slice(i, i + maxChars));
    i += maxChars;
  }
  return chunks;
}

function parseJsonFromModelText(text: string): any {
  const firstObj = text.indexOf('{');
  const firstArr = text.indexOf('[');

  if (firstObj === -1 && firstArr === -1) {
    throw new Error('AI returned no JSON-like content');
  }

  const start =
    firstObj !== -1 && (firstArr === -1 || firstObj < firstArr)
      ? firstObj
      : firstArr;

  const candidate = text.slice(start).trim();

  const tryParse = (s: string) => {
    try {
      return JSON.parse(s);
    } catch {
      return undefined;
    }
  };

  // 1) direct parse
  const direct = tryParse(candidate);
  if (direct !== undefined) return direct;

  // 2) strip code fences and retry
  const cleaned = text
    .replace(/```json\s*/g, '')
    .replace(/```/g, '')
    .trim();

  const cleanedParsed = tryParse(cleaned);
  if (cleanedParsed !== undefined) return cleanedParsed;

  throw new Error('AI returned invalid JSON');
}

function normalizeFlashcardsOutput(parsed: any): FlashcardsResponse {
  // Expected output: { flashcards: [ {question, answer}, ... ] }
  const rawCards = Array.isArray(parsed?.flashcards)
    ? parsed.flashcards
    : Array.isArray(parsed)
      ? parsed
      : undefined;

  if (!Array.isArray(rawCards)) {
    throw new Error('AI returned invalid flashcards structure');
  }

  const flashcards: Flashcard[] = [];

  for (const card of rawCards) {
    if (!card || typeof card !== 'object') continue;

    const q = (card as any).question;
    const a = (card as any).answer;

    if (typeof q !== 'string' || typeof a !== 'string') continue;

    const question = q.trim();
    const answer = a.trim();

    if (!question || !answer) continue;

    flashcards.push({ question, answer });
  }

  return { flashcards };
}

export async function generateFlashcardsFromNoteText(noteText: string) {
  const client = getGroqClient();

  // Chunking improves reliability vs pure truncation.
  const chunks = chunkText(noteText, 5000);

  // Ask model once per chunk and then consolidate.
  const perChunkFlashcards: Flashcard[] = [];

  for (const [idx, chunk] of chunks.entries()) {
    const prompt = `Act as an expert educational content creator for students.
Create flashcards from the provided note excerpt.
Return ONLY valid JSON in this exact shape:
{
  "flashcards": [
    {
      "question": "...",
      "answer": "..."
    }
  ]
}
Constraints:
- 5-8 flashcards per excerpt
- questions progressively more challenging
- prioritize understanding; include explanations in the answer
- no markdown

EXCERPT ${idx + 1}/${chunks.length}:
${chunk}`;

    const completion = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'Return ONLY valid JSON. No markdown. No explanations.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 1200,
    });

    const raw = completion.choices?.[0]?.message?.content ?? '';
    const parsed = parseJsonFromModelText(raw);
    const { flashcards } = normalizeFlashcardsOutput(parsed);

    perChunkFlashcards.push(...flashcards);
  }

  // Consolidate and limit to 8-12 cards total for UX.
  const consolidationPrompt = `You are an expert study coach.
You will receive a list of flashcards.
Deduplicate by question meaning and keep the highest-quality cards.
Return ONLY valid JSON in this exact shape:
{
  "flashcards": [
    {
      "question": "...",
      "answer": "..."
    }
  ]
}
Return between 8 and 12 flashcards.

FLASHCARDS:
${JSON.stringify(perChunkFlashcards).slice(0, 25000)}`;

  const consolidation = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: 'Return ONLY valid JSON. No markdown. No explanations.',
      },
      { role: 'user', content: consolidationPrompt },
    ],
    temperature: 0.15,
    max_tokens: 1200,
  });

  const raw = consolidation.choices?.[0]?.message?.content ?? '';
  const parsed = parseJsonFromModelText(raw);
  const { flashcards } = normalizeFlashcardsOutput(parsed);

  // Final safety: ensure at least 8 cards if possible, else return what we have.
  return flashcards;
}

