"use server";

import { z } from "zod";
import OpenAI from "openai";

const systemPrompt = `You are generating hints for a shopping list app aimed at gradually improving meal planning for healthier eating.
Be concise in your responses but include your reasons.
Only suggest alternatives for clearly unhealthy items or when specifically requested. Leave the message empty for moderately healthy or neutral foods.
Focus on major dietary improvements rather than minor changes. Avoid flagging items like granola bars or occasional treats.
Use generic, non-specific names for suggestions.
Base recommendations on established nutritional science, not fad diets or myths.
Aim for a balanced approach that encourages sustainable, long-term dietary improvements.`;

const analizePrompt = (
  name: string,
  alergies: string[],
  healthLevel: 0 | 1 | 2,
  suggestVegan: boolean,
) => `Does "${name}" :
${alergies.length > 0 ? `interfere with one of those allergies: \n${alergies.map((e) => `- ${e}\n`)}` : "user has no alergy\n"}
Also ${healthLevel == 2 ? "If the item is somewhat unhealthy" : healthLevel == 1 ? "If the item is **really really** unhealthy" : "do not"} include suggestions for healthier alternatives that serve the same purpose
${suggestVegan ? "Also suggest some vegan options if possible" : ""}`;

const openAiResponseFormat = {
  name: "health_response",
  strict: true,
  schema: {
    additionalProperties: false,
    type: "object",
    properties: {
      isAllergy: {
        type: "boolean",
        description:
          "Indicates whether the food item interferes with an allergy. The message will be shown more prominently if set to true",
      },
      message: {
        type: "string",
        description:
          "Explanation or reason about the suggestions given. Displayed as gray text above the suggestions",
      },
      alternatives: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            isVegan: { type: "boolean" },
          },
          additionalProperties: false,
          required: ["name", "isVegan"],
        },
        description: "List of alternative food items that can be used instead.",
      },
    },
    required: ["isAllergy", "message", "alternatives"],
  },
};

export interface HealthResponse {
  isAllergy: boolean;
  message: string;
  alternatives: Array<{
    name: string;
    isVegan: boolean;
  }>;
}

const openAISchema = z.object({
  input: z.string().min(1),
});

export async function analizeFoodItemAction(
  formData: FormData,
  healthLevel: 0 | 1 | 2,
  allergies: string[],
  suggestVegan: boolean,
): Promise<{ message: HealthResponse } | { error: string }> {
  if (healthLevel === 0 && allergies.length === 0 && !suggestVegan) {
    // Return an empty HealthResponse
    return {
      message: {
        alternatives: [],
        message: "",
        isAllergy: false,
      },
    };
  }
  const result = openAISchema.safeParse({
    input: formData.get("input"),
  });

  if (!result.success) {
    return { error: "Invalid input" };
  }

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
          content: analizePrompt(
            result.data.input,
            allergies,
            healthLevel,
            suggestVegan,
          ),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: openAiResponseFormat,
      },
    });

    const parsedResponse = JSON.parse(
      response.choices[0].message.content || "{}",
    ) as HealthResponse;

    return {
      message: parsedResponse,
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    return { error: "Failed to process request" };
  }
}
