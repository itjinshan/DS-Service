import OpenAI from 'openai';
require('dotenv').config();

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.Open_Router_DeepSeek_API_KEY,
//   defaultHeaders: {
//     "HTTP-Referer": "<YOUR_SITE_URL>", // Optional. Site URL for rankings on openrouter.ai.
//     "X-Title": "<YOUR_SITE_NAME>", // Optional. Site title for rankings on openrouter.ai.
//   },
});
module.exports = async function main(request: string) {
  const completion = await openai.chat.completions.create({
    model: "deepseek/deepseek-chat-v3-0324:free",
    messages: [
      {
        "role": "user",
        "content": request
      }
    ],
    
  });

  return completion.choices[0].message;
}