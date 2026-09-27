import { useCallback, useEffect, useRef, useState } from "react";

interface Options {
  audioUrl: string | null;
  autoPlay: boolean;
  visible: boolean;
  onSpeakingChange: (speaking: boolean) => void;
  onError: () => void;
}

// The session belongs to the coach, not either of its response presentations.
export function useTaskCoachAudio(options: Options) {
  const optionsRef = useRef(options);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    optionsRef.current = options;
  });

  useEffect(() => {
    setPlaying(false);
    setProgress(0);
    if (!options.audioUrl) return;
    const audio = new Audio(options.audioUrl);
    audioRef.current = audio;
    const play = () => {
      setPlaying(true);
      optionsRef.current.onSpeakingChange(true);
    };
    const pause = () => {
      setPlaying(false);
      optionsRef.current.onSpeakingChange(false);
    };
    const ended = () => {
      pause();
      setProgress(0);
    };
    const time = () =>
      setProgress(Number.isFinite(audio.duration) && audio.duration > 0 ? audio.currentTime / audio.duration : 0);
    const error = () => {
      pause();
      optionsRef.current.onError();
    };
    audio.addEventListener("play", play);
    audio.addEventListener("pause", pause);
    audio.addEventListener("ended", ended);
    audio.addEventListener("timeupdate", time);
    audio.addEventListener("error", error);
    if (optionsRef.current.autoPlay && optionsRef.current.visible) {
      // A rejected autoplay attempt leaves manual playback available.
      void audio.play().catch(() => {});
    }
    return () => {
      audio.removeEventListener("play", play);
      audio.removeEventListener("pause", pause);
      audio.removeEventListener("ended", ended);
      audio.removeEventListener("timeupdate", time);
      audio.removeEventListener("error", error);
      audio.pause();
      audioRef.current = null;
    };
  }, [options.audioUrl]);

  useEffect(() => {
    if (!options.visible) audioRef.current?.pause();
  }, [options.visible]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) audio.pause();
    else void audio.play().catch(() => optionsRef.current.onError());
  }, []);
  return { playing, progress, toggle };
}
