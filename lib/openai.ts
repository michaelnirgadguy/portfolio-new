// /lib/openai.ts
import OpenAI from "openai";

// Support both the standard OPENAI_API_KEY and your custom openai_test_key
export const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? process.env.openai_test_key,
});
