import { fastifyCors } from '@fastify/cors'
import { fastify } from 'fastify'
import {
  createTranscriptionRoute,
  generateAICompletionRoute,
  getAllPromptsRoute,
  uploadVideoRoute
} from './routes'

const app = fastify()

app.register(fastifyCors, {
  origin: '*',
})

app.register(getAllPromptsRoute)
app.register(uploadVideoRoute)
app.register(createTranscriptionRoute)
app.register(generateAICompletionRoute)

app.listen({
  port: 3333,
}).then(() => console.log('HTTP Server Running!'))
 