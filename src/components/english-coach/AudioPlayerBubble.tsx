import React, { useCallback, useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface AudioPlayerBubbleProps {
  audioUrl: string;
  autoPlay?: boolean;
  onRetry?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onPlaybackError?: () => void;
}

const AudioPlayerBubble: React.FC<AudioPlayerBubbleProps> = ({
  audioUrl,
  autoPlay = false,
  onRetry,
  onPlay: onPlayCallback,
  onPause: onPauseCallback,
  onEnded: onEndedCallback,
  onPlaybackError,
}) => {
  const { t } = useTranslation();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const callbacksRef = useRef({ onPlayCallback, onPauseCallback, onEndedCallback, onPlaybackError });
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    callbacksRef.current = { onPlayCallback, onPauseCallback, onEndedCallback, onPlaybackError };
  }, [onEndedCallback, onPauseCallback, onPlayCallback, onPlaybackError]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => callbacksRef.current.onPlaybackError?.());
    }
  }, [isPlaying]);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const onPlay = () => {
      setIsPlaying(true);
      callbacksRef.current.onPlayCallback?.();
    };
    const onPause = () => {
      setIsPlaying(false);
      callbacksRef.current.onPauseCallback?.();
    };
    const onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      callbacksRef.current.onEndedCallback?.();
    };
    const onTimeUpdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("timeupdate", onTimeUpdate);
    const onError = () => callbacksRef.current.onPlaybackError?.();
    audio.addEventListener("error", onError);

    if (autoPlay) {
      audio.play().catch(() => {
        // Browser autoplay policy may require a user gesture; manual playback remains available.
      });
    }

    return () => {
      audio.pause();
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("error", onError);
      // removing URL.revokeObjectURL(audioUrl) because it kills the URL
      // if the component unmounts/remounts (Strict Mode) while the parent still holds the ref.
    };
  }, [audioUrl, autoPlay]);

  return (
    <div className="flex items-center gap-2 mt-1">
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        onClick={togglePlay}
        aria-label={isPlaying ? t("englishCoach.audio.pause") : t("englishCoach.audio.play")}
      >
        {isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
      </Button>

      {/* progress bar */}
      <div className="h-1 flex-1 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
      </div>

      {onRetry && (
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={onRetry}
          aria-label={t("englishCoach.audio.retry")}
        >
          <RotateCcw className="size-3.5" />
        </Button>
      )}
    </div>
  );
};

export default AudioPlayerBubble;
