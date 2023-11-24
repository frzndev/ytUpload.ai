import { fastifyMultipart } from "@fastify/multipart";
import { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream";
import { promisify } from "node:util";
import { prisma } from "../lib/prisma";

const pump = promisify(pipeline)

export async function uploadVideoRoute(app: FastifyInstance) {
  app.register(fastifyMultipart,{
    limits:{
      fileSize: 1048576 * 25 // 25 mb
    }
  })
   
  app.post('/upload', async (request, reply) => {
    const data = await request.file()

    if (!data){
      return reply.status(400).send({error: 'Missing file.'})
    }

    const extension = path.extname(data.filename)

    if (extension !== '.mp3'){
      return reply.status(400).send({error: 'Invalid file type, please upload a MP3.'})
    }

    const fileBaseName = path.basename(data.filename, extension)
    const fileUploadName = `${fileBaseName}-${randomUUID()}${extension}`
    const uploadDir = path.resolve(__dirname, '../../tmp', fileUploadName)

    await pump(data.file, fs.createWriteStream(uploadDir))

    const video = await prisma.video.create({
      data: {
        name: data.filename,
        path: uploadDir
      }
    })

    return {video}
  })
}
