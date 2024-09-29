"use server";

import { z } from "zod";
import OpenAI from "openai";

const systemPrompt = `You are generating a shopping list from data extracted for a recipe site.
Use generic names if there are any brand-specific ones and leave out amounts.
Do not translate anything, keep the same language as the provided text. Do not use punctuation`;
const openAiResponseFormat = {
  name: "recepe_items_response",
  strict: true,
  schema: {
    additionalProperties: false,
    type: "object",
    properties: {
      name: {
        type: "string",
      },
      items: {
        type: "array",
        items: {
          type: "string",
        },
      },
    },
    required: ["name", "items"],
  },
};

const openAISchema = z.object({
  input: z.string().min(1),
});

export interface RecepeScrapeResponse {
  name: string;
  items: string[];
}

export async function scrapeRecepeAction(
  formData: FormData,
): Promise<{ message: RecepeScrapeResponse } | { error: string }> {
  const result = openAISchema.safeParse({
    input: formData.get("input"),
  });

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_API_PROXY,
  });

  try {
    const response = await openai.beta.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Recepe:\n${result.data?.input}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: openAiResponseFormat,
      },
    });

    const parsedResponse = JSON.parse(
      response.choices[0].message.content || "{}",
    ) as RecepeScrapeResponse;

    return {
      message: parsedResponse,
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    return { error: "Failed to process request" };
  }
}
