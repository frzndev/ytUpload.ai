import 'dotenv/config'
import { OpenAI } from 'openai'

export const openai = new OpenAI({
  organization: "org-fBH0EBj0NPnZx5pGIy4LWxfL",
  apiKey: process.env.OPENAI_KEY,
})