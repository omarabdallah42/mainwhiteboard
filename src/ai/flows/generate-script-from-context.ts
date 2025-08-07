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
    .optional()
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

const prompt = ai.definePrompt({
  name: 'generateScriptPrompt',
  input: {schema: GenerateScriptFromContextInputSchema},
  output: {schema: GenerateScriptFromContextOutputSchema},
  prompt: `You are an expert scriptwriter and creative assistant named Meedro. Your goal is to help content creators, marketers, and creative agencies.

The user has provided a prompt and may have provided some context from their whiteboard. Use this information to generate a helpful response.

If context is provided, use it as the primary source of information.

User Prompt:
{{{prompt}}}

{{#if context}}
Context from Whiteboard:
---
{{{context}}}
---
{{/if}}
`,
});

const generateScriptFromContextFlow = ai.defineFlow(
  {
    name: 'generateScriptFromContextFlow',
    inputSchema: GenerateScriptFromContextInputSchema,
    outputSchema: GenerateScriptFromContextOutputSchema,
  },
  async (input) => {
    try {
        // Since no model is configured, we will return a placeholder response.
        // In the next step, we will configure the OpenAI model.
        if (!process.env.OPENAI_API_KEY) {
            return { script: "I'm not configured to work without an AI model. Please add the OpenAI plugin and API key to continue." };
        }
        
        // This part will be enabled once the OpenAI plugin is correctly installed.
        // const {output} = await prompt(input, { model: gpt4o });
        // if (!output) {
        //   throw new Error('The AI model did not return a valid response.');
        // }
        // return output;

        return { script: `I received your prompt: "${input.prompt}". The OpenAI integration is pending the correct package installation.` };

    } catch (error: any) {
        console.error("Error calling AI model:", error);
        return { script: `I'm sorry, I encountered an error and couldn't process your request. Please check the server logs for details.\n\nError: ${error.message}` };
    }
  }
);
