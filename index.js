import "dotenv/config";
import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const res = await openai.chat.completions.create({
  model: "gpt-3.5-turbo",
  messages: [
    {
      role: "system",
      content:
        "You are an AI assistant, answer any questions to the best of your ability.",
    },
    {
      role: "user",
      content: "Hi! can you tell me what is the best way to learn maths?",
    },
  ],
});
console.log(res.choices[0].message.content);
