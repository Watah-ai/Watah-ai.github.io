'use client';

import { useEffect, useRef, useState } from 'react';

const DEFAULT_VOLUME = 0.55;

export default function HouseAudioControl() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const playRequestRef = useRef<Promise<void> | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUnavailable, setIsUnavailable] = useState(false);
  const [isWaitingForGesture, setIsWaitingForGesture] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = DEFAULT_VOLUME;

    let gestureFallbackActive = false;

    const removeGestureFallback = () => {
      if (!gestureFallbackActive) return;
      gestureFallbackActive = false;
      document.removeEventListener('click', handleFirstInteraction, true);
      document.removeEventListener('keydown', handleFirstInteraction, true);
    };

    const attemptPlayback = async () => {
      if (!audio.paused || playRequestRef.current) return;

      try {
        const request = audio.play();
        playRequestRef.current = request;
        await request;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'NotAllowedError') {
          setIsWaitingForGesture(true);
          return;
        }
        setIsPlaying(false);
      } finally {
        playRequestRef.current = null;
      }
    };

    function handleFirstInteraction(event: MouseEvent | KeyboardEvent) {
      if (event instanceof MouseEvent) {
        const target = event.target;
        if (target instanceof Element && target.closest('.house-audio-control')) return;
      }

      if (event instanceof KeyboardEvent && ['Alt', 'Control', 'Meta', 'Shift', 'Tab'].includes(event.key)) return;
      void attemptPlayback();
    }

    const addGestureFallback = () => {
      if (gestureFallbackActive) return;
      gestureFallbackActive = true;
      document.addEventListener('click', handleFirstInteraction, true);
      document.addEventListener('keydown', handleFirstInteraction, true);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      setIsUnavailable(false);
      setIsWaitingForGesture(false);
      removeGestureFallback();
    };
    const handlePause = () => setIsPlaying(false);
    const handleError = () => {
      setIsPlaying(false);
      setIsUnavailable(true);
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handlePause);
    audio.addEventListener('error', handleError);

    const timer = window.setTimeout(() => {
      void attemptPlayback().then(() => {
        if (audio.paused) addGestureFallback();
      });
    }, 1000);

    return () => {
      window.clearTimeout(timer);
      removeGestureFallback();
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handlePause);
      audio.removeEventListener('error', handleError);
    };
  }, []);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio || isUnavailable || playRequestRef.current) return;

    if (!audio.paused) {
      audio.pause();
      return;
    }

    try {
      const request = audio.play();
      playRequestRef.current = request;
      await request;
      setIsWaitingForGesture(false);
    } catch {
      setIsPlaying(false);
    } finally {
      playRequestRef.current = null;
    }
  };

  const label = isUnavailable
    ? '月光奏鳴曲目前無法播放'
    : isPlaying
      ? '暫停月光奏鳴曲'
      : isWaitingForGesture
        ? '點擊頁面或此按鈕播放月光奏鳴曲'
        : '播放月光奏鳴曲';

  return <>
    <audio
      ref={audioRef}
      src="/moonlight-sonata.mp3"
      preload="metadata"
      loop
      playsInline
    />
    <button
      type="button"
      className="house-audio-control"
      data-playing={isPlaying ? 'true' : 'false'}
      data-waiting={isWaitingForGesture ? 'true' : 'false'}
      aria-label={label}
      aria-pressed={isPlaying}
      title={label}
      disabled={isUnavailable}
      onClick={togglePlayback}
    >
      <span className="house-neon" aria-hidden="true">
        <span className="house-neon-roof" />
        <span className="house-neon-body">
          <span className="house-neon-window house-neon-window-warm" />
          <span className="house-neon-window house-neon-window-cool" />
          <span className="house-neon-door" />
        </span>
      </span>
      <span className="house-audio-label">
        <strong>月光奏鳴曲</strong>
        <small>{isPlaying ? '霓虹亮燈・播放中' : isWaitingForGesture ? '觸碰頁面即可播放' : '一秒後嘗試播放'}</small>
      </span>
    </button>
  </>;
}
