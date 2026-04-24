import { GoogleGenerativeAI } from '@google/generative-ai'
import { curriculumPrompts, type Subject } from './curriculum-prompts'

const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY
const genAI = GOOGLE_AI_API_KEY ? new GoogleGenerativeAI(GOOGLE_AI_API_KEY) : null
const DEFAULT_MODEL = 'gemini-1.5-flash'
const FALLBACK_MODELS = ['gemini-1.5-flash', 'gemini-1.5-flash-8b']
const DEFAULT_GROQ_MODEL = 'llama-3.1-8b-instant'
const DEFAULT_PROVIDER_PRIORITY = 'gemini'

export interface Message {
  role: 'user' | 'model'
  parts: string
}

interface GroqMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

async function callGroqFallback(subject: Subject, messages: Message[]): Promise<string> {
  const groqKey = process.env.GROQ_API_KEY
  if (!groqKey) {
    throw new Error('GROQ_API_KEY is not configured')
  }

  const groqModel = process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL
  const groqMessages: GroqMessage[] = [
    {
      role: 'system',
      content: curriculumPrompts[subject],
    },
    ...messages.map(
      (message): GroqMessage => ({
        role: message.role === 'model' ? 'assistant' : 'user',
        content: message.parts,
      })
    ),
  ]

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${groqKey}`,
    },
    body: JSON.stringify({
      model: groqModel,
      messages: groqMessages,
      temperature: 0.3,
      max_tokens: 700,
    }),
  })

  if (!response.ok) {
    const errorPayload = await response.text()
    throw new Error(`Groq fallback failed: ${response.status} ${errorPayload}`)
  }

  const data = await response.json()
  const content = data?.choices?.[0]?.message?.content

  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('Groq fallback returned an empty response')
  }

  return content
}

export async function chat(subject: Subject, messages: Message[]): Promise<string> {
  const preferredModel = process.env.GOOGLE_AI_MODEL || DEFAULT_MODEL
  const modelCandidates = [preferredModel, ...FALLBACK_MODELS].filter(
    (value, index, self) => value && self.indexOf(value) === index
  )

  const chatHistory = messages.slice(0, -1).map((msg) => ({
    role: msg.role,
    parts: [{ text: msg.parts }],
  }))

  const lastMessage = messages[messages.length - 1]
  let lastError: unknown

  const providerPriority = (process.env.AI_PROVIDER_PRIORITY || DEFAULT_PROVIDER_PRIORITY).toLowerCase()
  const providerOrder: Array<'gemini' | 'groq'> =
    providerPriority === 'groq' ? ['groq', 'gemini'] : ['gemini', 'groq']

  for (const provider of providerOrder) {
    if (provider === 'gemini') {
      if (!genAI) {
        lastError = new Error('GOOGLE_AI_API_KEY is not configured')
        continue
      }

      for (const modelName of modelCandidates) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: curriculumPrompts[subject],
          })

          const chatSession = model.startChat({
            history: chatHistory,
          })

          const result = await chatSession.sendMessage(lastMessage.parts)
          const response = result.response
          return response.text()
        } catch (error) {
          lastError = error
        }
      }
      continue
    }

    try {
      return await callGroqFallback(subject, messages)
    } catch (groqError) {
      lastError = groqError
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('AI service is temporarily unavailable')
}
