import OpenAI from "openai";

export const client = new OpenAI({
  apiKey: process.env.openai_test_key, // matches your Vercel env var
});
