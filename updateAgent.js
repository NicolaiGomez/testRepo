import OpenAI from 'openai';
import { getSimilarAuditEntries } from './utils/ragHelper.js';
import { updateUserData } from './utils/fileOps.js';
import { createPullRequest } from './utils/github.js';


globalThis.fetch = fetch;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function parseUserCommand(command) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: command }],
    tools: [{
      type: 'function',
      function: {
        name: 'update_user',
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            field: { type: 'string' },
            value: { type: 'string' },
            reason: { type: 'string' }
          },
          required: ['name', 'field', 'value', 'reason']
        }
      }
    }],
    tool_choice: 'auto'
  });

  const toolCall = completion.choices[0].message.tool_calls?.[0];
  if (!toolCall) throw new Error('No function call returned by OpenAI');

  const args = JSON.parse(toolCall.function.arguments);
  return args;
}

export async function handleUserUpdate(text) {
  try {
    const parsed = await parseUserCommand(text);
    const context = await getSimilarAuditEntries(parsed.reason);
    await updateUserData(parsed, context);
    const prUrl = await createPullRequest(parsed.name);
    return { success: true, message: `✅ Updated ${parsed.name}.\n🔗 PR: ${prUrl}` };
  } catch (err) {
    return { success: false, message: `❌ Failed: ${err.message}` };
  }
}
