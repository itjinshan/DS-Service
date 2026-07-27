import OpenAI from 'openai';
require('dotenv').config();

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPEN_ROUTER_DEEPSEEK_API_KEY,
});

export interface DeepseekOptions {
  jsonMode?: boolean;
}

export default async function deepseek(request: string, options: DeepseekOptions = {}) {
  const completion = await openai.chat.completions.create({
    model: "deepseek/deepseek-v3.2",
    messages: [
      {
        role: "user",
        content: request
      }
    ],
    ...(options.jsonMode ? { response_format: { type: "json_object" as const } } : {})
  });

  const message = completion.choices[0]?.message;
  if (!message || !message.content) {
    throw new Error("Deepseek returned an empty response");
  }

  return message;
}
