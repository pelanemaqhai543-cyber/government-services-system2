
require('dotenv').config();

const AI_API_KEY = process.env.AI_API_KEY;
const AI_BASE_URL = (
  process.env.AI_BASE_URL || 'https://api.openai.com/v1'
).replace(/\/+$/, '');

const AI_MODEL = process.env.AI_MODEL || 'gpt-4o-mini';
const AI_TIMEOUT_MS = 25000;

async function callModel({
  system,
  user,
  responseSchema,
  temperature = 0.1,
}) {
  if (!AI_API_KEY) {
    throw new Error('AI_API_KEY is not configured');
  }

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    AI_TIMEOUT_MS
  );

  try {
    const body = {
      model: AI_MODEL,
      temperature,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    };

    if (responseSchema) {
      body.response_format = {
        type: 'json_schema',
        json_schema: responseSchema,
      };
    } else {
      body.response_format = { type: 'json_object' };
    }

    const response = await fetch(
      `${AI_BASE_URL}/chat/completions`,
      {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${AI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const message = await response.text();
      throw new Error(
        `AI request failed (${response.status}): ${message.slice(0, 300)}`
      );
    }

    const data = await response.json();
    const choice = data.choices?.[0];

    if (!choice || choice.finish_reason === 'length') {
      throw new Error('AI returned an incomplete response');
    }

    const content = choice.message?.content;

    if (typeof content !== 'string' || !content.trim()) {
      throw new Error('AI returned an empty response');
    }

    try {
      return JSON.parse(content);
    } catch {
      throw new Error('AI returned invalid JSON');
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('AI request timed out');
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { callModel };
