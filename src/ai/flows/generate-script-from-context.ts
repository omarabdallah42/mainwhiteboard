'use server';

/**
 * @fileOverview An AI agent that generates a script based on the context of the open windows on the whiteboard.
 *
 * - generateScriptFromContext - A function that handles the script generation process.
 * - GenerateScriptFromContextInput - The input type for the generateScriptFromContext function.
 * - GenerateScriptFromContextOutput - The return type for the generateScriptFromContext function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateScriptFromContextInputSchema = z.object({
  prompt: z.string().describe("The user's request."),
  context: z
    .string()
    .describe("The content of the open windows on the whiteboard."),
});
export type GenerateScriptFromContextInput = z.infer<typeof GenerateScriptFromContextInputSchema>;

const GenerateScriptFromContextOutputSchema = z.object({
  script: z.string().describe('The generated script based on the context.'),
});
export type GenerateScriptFromContextOutput = z.infer<typeof GenerateScriptFromContextOutputSchema>;

export async function generateScriptFromContext(input: GenerateScriptFromContextInput): Promise<GenerateScriptFromContextOutput> {
  return generateScriptFromContextFlow(input);
}

const generateScriptFromContextFlow = ai.defineFlow(
  {
    name: 'generateScriptFromContextFlow',
    inputSchema: GenerateScriptFromContextInputSchema,
    outputSchema: GenerateScriptFromContextOutputSchema,
  },
  async (input) => {
    const webhookUrl = 'https://n8n.tabtix.com/webhook-test/33d16a65-ac59-4c8b-a2b7-0d676a0f5b26';

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: input.prompt,
          context: input.context,
        }),
      });

      if (!response.ok) {
        throw new Error(`Webhook failed with status: ${response.status}`);
      }
      
      const responseData = await response.json();

      // Assuming the webhook returns a JSON object with a "script" field.
      // Adjust if your webhook's response structure is different.
      const script = responseData.script || JSON.stringify(responseData);
      
      return { script };

    } catch (error) {
      console.error("Error calling webhook:", error);
      // Let the user know something went wrong.
      return { script: "I'm sorry, I was unable to connect to the script generator. Please check the webhook configuration." };
    }
  }
);
