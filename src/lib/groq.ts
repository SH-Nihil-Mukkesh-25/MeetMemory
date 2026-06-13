import Groq from 'groq-sdk';

if (!process.env.GROQ_API_KEY) {
  console.warn('[Groq] GROQ_API_KEY is not set — LLM calls will fail');
}

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

export const GROQ_MODEL = 'qwen/qwen3-32b';
