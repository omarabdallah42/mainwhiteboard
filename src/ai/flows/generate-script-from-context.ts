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

const prompt = ai.definePrompt({
  name: 'generateScriptFromContextPrompt',
  input: {schema: GenerateScriptFromContextInputSchema},
  output: {schema: GenerateScriptFromContextOutputSchema},
  prompt: `You are an AI assistant that generates scripts based on given context.

  Context: {{{context}}}

  Generate a script based on the context provided. The script should be well-structured and easy to follow.
  `,config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const generateScriptFromContextFlow = ai.defineFlow(
  {
    name: 'generateScriptFromContextFlow',
    inputSchema: GenerateScriptFromContextInputSchema,
    outputSchema: GenerateScriptFromContextOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
