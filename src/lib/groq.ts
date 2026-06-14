import Groq from 'groq-sdk';

if (!process.env.GROQ_API_KEY) {
  console.warn('[Groq] GROQ_API_KEY is not set — LLM calls will fail');
}

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

export const GROQ_MODEL = 'llama-3.3-70b-versatile'; // Using Llama 3 70B as default reliable model

/**
 * Safely requests a JSON completion from Groq.
 * Implements a 15-second timeout and catches malformed JSON.
 */
export async function safeGroqJsonCompletion<T>(
  systemPrompt: string,
  userPrompt: string,
  fallback: T,
  temperature = 0.2
): Promise<T> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature,
      response_format: { type: 'json_object' },
    }, { signal: controller.signal });

    clearTimeout(timeout);

    const content = completion.choices[0]?.message?.content;
    if (!content) return fallback;

    return JSON.parse(content) as T;
  } catch (error) {
    console.error('[Groq] JSON Completion failed:', error);
    return fallback;
  }
}

/**
 * Safely requests a text completion from Groq.
 * Implements a 15-second timeout.
 */
export async function safeGroqTextCompletion(
  systemPrompt: string,
  userPrompt: string,
  fallback: string,
  temperature = 0.3,
  maxTokens = 800
): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature,
      max_tokens: maxTokens,
      stream: false,
    }, { signal: controller.signal });

    clearTimeout(timeout);

    let content = completion.choices[0]?.message?.content || '';
    content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    
    if (!content) return fallback;
    return content;
  } catch (error) {
    console.error('[Groq] Text Completion failed:', error);
    return fallback;
  }
}
