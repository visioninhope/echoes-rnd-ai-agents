"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useMicVAD, utils } from "@ricky0123/vad-react";
import { Microphone, StopCircle } from "@phosphor-icons/react";
import { Button } from "@/components/button";
import { cn } from "@/lib/utils";

import useWakeLock from "react-use-wake-lock";
interface VadAudioProps {
  onAudioCapture: (audioFile: File) => void;
  onStartListening: () => void;
  onStopListening: () => void;
  isHome?: boolean;
}

export default function VadAudio({
  onAudioCapture,
  onStartListening,
  onStopListening,
  isHome = false,
}: VadAudioProps) {
  const [isListening, setIsListening] = useState(false);
  const [duration, setDuration] = useState("00:00");
  const audioChunks = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const { isSupported, isLocked, request, release } = useWakeLock({
    onError: () => {
      console.error("Error requesting wake lock");
    },
    onRelease: () => {},
  });

  const vad = useMicVAD({
    onSpeechEnd: (audio: Float32Array) => {
      const wavBuffer = utils.encodeWAV(audio);
      const audioBlob = new Blob([wavBuffer], { type: "audio/wav" });
      const audioFile = new File([audioBlob], "audio.wav", {
        type: "audio/wav",
      });
      console.log("audioFile", audioFile);

      onAudioCapture(audioFile);
    },
    onSpeechStart: () => {
      console.log("onSpeechStart");
    },
    workletURL: "/vad/vad.worklet.bundle.min.js",
    modelURL: "/vad/silero_vad.onnx",
    ortConfig: (ort) => {
      ort.env.wasm.wasmPaths = "/vad/";
    },
    startOnLoad: false,
    submitUserSpeechOnPause: true,
  });

  const handleStartListening = useCallback(() => {
    vad.start();
    startTimer();
    if (isSupported) {
      request();
    }
    onStartListening();
    setIsListening(true);
    audioChunks.current = [];
  }, [vad]);

  const handleStopListening = useCallback(() => {
    setIsListening(false);
    onStopListening();
    vad.pause();
    resetDuration();
    clearTimer();
    if (isSupported) {
      release();
    }
  }, [vad]);

  const startTimer = () => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = Date.now() - startTimeRef.current;
        console.log("elapsed", elapsed);
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        setDuration(
          `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
            2,
            "0",
          )}`,
        );
      }
    }, 1000);
  };

  const resetDuration = () => {
    setDuration("00:00");
    clearTimer();
  };

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    startTimeRef.current = null;
  };

  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, []);

  return (
    <div
      className={cn(
        "flex items-center gap-2",
        !isHome ? "flex-col-reverse sm:flex-row" : "",
      )}
    >
      <Button
        onClick={vad.listening ? handleStopListening : handleStartListening}
        size="icon"
        variant={vad.listening ? "destructive" : "secondary"}
        type="button"
        className="disabled:text-muted"
      >
        {vad.listening ? (
          <StopCircle
            className="h-4 w-4 fill-current"
            color="#618a9e"
            weight="bold"
          />
        ) : (
          <Microphone
            className="h-4 w-4 fill-current"
            color="#618a9e"
            weight="bold"
          />
        )}
      </Button>
      {isListening ? <span>{duration}</span> : null}
    </div>
  );
}
