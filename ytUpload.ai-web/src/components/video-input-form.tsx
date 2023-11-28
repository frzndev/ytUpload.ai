import { api } from "@/lib/axios";
import { getFFmpeg } from "@/lib/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { FileVideo, Upload } from "lucide-react";
import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Textarea } from "./ui/textarea";

type Status =
  | "waiting"
  | "asking"
  | "converting"
  | "uploading"
  | "generating"
  | "success";

const statusMessage = {
  asking: "Please select video",
  converting: "Converting...",
  generating: "Generating...",
  uploading: "Uploading...",
  success: "Success!",
};

interface VideoInputFormProps {
  onVideoUploaded: (id: string) => void;
}

export function VideoInputForm(props: VideoInputFormProps) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("waiting");
  const promptInputRef = useRef<HTMLTextAreaElement>(null);

  function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const { files } = event.currentTarget;
    setStatus("waiting");

    if (!files) {
      return;
    }

    const selectedFile = files[0];

    setVideoFile(selectedFile);
  }

  async function convertVideoToAudio(video: File) {
    console.log("Convert started");

    const ffmpeg = await getFFmpeg();

    await ffmpeg.writeFile("inputVideo.mp4", await fetchFile(video));

    // Only if u get error when u try convert video to audio
    // ffmpeg.on('log', log => {
    //   console.log(log)
    // })

    ffmpeg.on("progress", (progress) => {
      console.log("Convert progress: " + Math.round(progress.progress * 100));
    });

    await ffmpeg.exec([
      "-i",
      "inputVideo.mp4",
      "-map",
      "0:a",
      "-b:a",
      "20k",
      "-acodec",
      "libmp3lame",
      "outputVideo.mp3",
    ]);

    const data = await ffmpeg.readFile("outputVideo.mp3");

    const audioFileBlob = new Blob([data], { type: "audio/mpeg" });
    const audioFile = new File([audioFileBlob], "audio.mp3", {
      type: "audio/mpeg",
    });

    console.log("Convert finish");

    return audioFile;
  }

  async function handleUploadVideo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const prompt = promptInputRef.current?.value;

    if (!videoFile) {
      setStatus("asking");
      return;
    }

    setStatus("converting");

    const audioFile = await convertVideoToAudio(videoFile);

    console.log(audioFile, prompt);

    const data = new FormData();

    data.append("file", audioFile);

    setStatus("uploading");

    const response = await api.post("/upload", data);

    const videoId = response.data.video.id;

    setStatus("generating");

    await api.post(`/upload/${videoId}/transcription`, {
      prompt,
    });

    setStatus("success");

    props.onVideoUploaded(videoId);
  }

  const previewURL = useMemo(() => {
    if (!videoFile) {
      return null;
    }

    return URL.createObjectURL(videoFile);
  }, [videoFile]);

  return (
    <form onSubmit={handleUploadVideo} className="space-y-6">
      <label
        htmlFor="video"
        className="relative border flex rounded-md aspect-video cursor-pointer border-dashed text-sm flex-col gap-2 items-center justify-center text-muted-foreground hover: bg-primary/5"
      >
        {previewURL ? (
          <video
            src={previewURL}
            controls={false}
            className="pointer-events-none absolute inset-0 max-h-[11rem] w-full rounded-md"
          />
        ) : (
          <>
            <FileVideo className="w-4 h-4" />
            Upload video
          </>
        )}
      </label>
      <input
        type="file"
        id="video"
        accept="video/mp4"
        className="sr-only"
        onChange={handleFileSelected}
      />

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="transcription_prompt">Transcription prompt</Label>
        <Textarea
          ref={promptInputRef}
          id="transcription_prompt"
          disabled={status !== "waiting"}
          className="h-20 leading-relaxed resize-none"
          placeholder="Type video keywords separated by commas ( , )"
        />
      </div>

      <Button
        data-success={status === "success"}
        disabled={status !== "waiting"}
        type="submit"
        className="w-full data-[success=true]:bg-green-400 bg-white"
      >
        {status === "waiting" ? (
          <>
            Upload video
            <Upload className="w-4 h-4 ml-2" />
          </>
        ) : (
          statusMessage[status]
        )}
      </Button>
    </form>
  );
}
