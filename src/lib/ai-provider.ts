import 'server-only'

const OPENMODEL_URL = 'https://api.openmodel.ai/v1/chat/completions'
const OPENMODEL_MODEL = 'deepseek-v4-flash'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

type Message = { role: 'system' | 'user' | 'assistant'; content: string }

export type ChatParams = {
  messages: Message[]
  temperature?: number
  max_tokens?: number
  response_format?: { type: 'json_object' | 'text' }
}

async function fetchChat(
  url: string,
  apiKey: string,
  model: string,
  params: ChatParams
): Promise<string> {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, ...params }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`)
  }

  const data = (await res.json()) as {
    choices: Array<{ message: { content: string } }>
  }
  return data.choices[0]?.message?.content ?? ''
}

// Tries OpenModel (DeepSeek V4 Flash) first, falls back to Groq on any error.
export async function chatCompletion(params: ChatParams): Promise<string> {
  const openmodelKey = process.env.OPENMODEL_API_KEY

  if (openmodelKey) {
    try {
      return await fetchChat(OPENMODEL_URL, openmodelKey, OPENMODEL_MODEL, params)
    } catch (err) {
      console.warn('[ai-provider] OpenModel failed, falling back to Groq:', err)
    }
  }

  const groqKey = process.env.GROQ_API_KEY
  if (!groqKey) throw new Error('No AI provider configured')

  return fetchChat(GROQ_URL, groqKey, GROQ_MODEL, params)
}
