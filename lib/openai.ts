import OpenAI from 'openai'
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export type AskOptions = {
  question: string
  maxTokens: number
  system?: string
  context?: string
}

export async function askLLM({ question, maxTokens, system, context }: AskOptions) {
  // prompt constructed via messages API below

  // 10s timeout guard
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10_000)
  try {
    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: system || 'You are an NFL expert. Answer concisely.' },
    ]
    if (context) messages.push({ role: 'system', content: `Context:\n${context}` })
    messages.push({ role: 'user', content: question })

    const res = await client.chat.completions.create(
      {
        model: 'gpt-5-nano',
        messages,
        max_tokens: maxTokens,
        temperature: 0.3,
      },
      { signal: controller.signal }
    )
    const answer = res.choices[0]?.message?.content?.trim() || 'Sorry, I could not generate an answer.'
    const usage = res.usage || { prompt_tokens: null, completion_tokens: null, total_tokens: null }
    return {
      answer,
      inputTokens: usage.prompt_tokens ?? undefined,
      outputTokens: usage.completion_tokens ?? undefined,
    }
  } finally {
    clearTimeout(timer)
  }
}
