import OpenAI from 'openai';

const DEFAULT_GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

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

export async function askQuestionWithNotes(args: {
  noteText: string;
  question: string;
}) {
  const { noteText, question } = args;
  const client = getGroqClient();

  const truncatedContent =
    noteText.length > 12000 ? noteText.slice(0, 12000) + '...' : noteText;

  const prompt = `You are NotesByJilu AI, an intelligent educational assistant designed to help students study effectively.

Your role:
- Answer academic and study-related questions clearly and accurately
- Explain difficult concepts in simple language
- Help students understand topics step-by-step
- Use examples when useful
- Prioritize information from the uploaded notes
- If notes do not contain enough information, use your own educational knowledge to help
- Keep responses focused on learning and education only

Rules:
- Only answer study-related or educational questions
- Refuse unrelated topics politely
- Do not generate harmful, illegal, or inappropriate content
- Be concise but helpful
- Use bullet points when useful
- Explain technical terms simply

UPLOADED NOTES:
${truncatedContent}

STUDENT QUESTION:
${question}

Provide the best educational answer possible.`;

  const completion = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful educational AI assistant for students.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 700,
  });

  return completion.choices?.[0]?.message?.content?.trim() || 'No answer generated.';
}

