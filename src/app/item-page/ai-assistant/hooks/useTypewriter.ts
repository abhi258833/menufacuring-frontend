import { useEffect, useRef, useState } from 'react';

interface UseTypewriterOptions {
  text: string;
  speed?: number;
  enabled?: boolean;
  immediate?: boolean;
  preserveOnDisable?: boolean;
  onComplete?: () => void;
}

interface UseTypewriterResult {
  displayedText: string;
  isComplete: boolean;
  showCursor: boolean;
}

const useTypewriter = ({
  text,
  speed = 18,
  enabled = true,
  immediate = false,
  preserveOnDisable = false,
  onComplete,
}: UseTypewriterOptions): UseTypewriterResult => {
  const [displayedText, setDisplayedText] = useState(immediate ? text : '');
  const [isComplete, setIsComplete] = useState(immediate || text.length === 0);
  const completionRef = useRef(onComplete);

  useEffect(() => {
    completionRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!enabled) {
      if (!preserveOnDisable) {
        setDisplayedText('');
      }
      setIsComplete(false);
      return;
    }

    if (immediate || text.length === 0) {
      setDisplayedText(text);
      setIsComplete(true);
      completionRef.current?.();
      return;
    }

    let frameId = 0;
    let cancelled = false;
    let completionSent = false;
    const durationPerCharacter = Math.max(speed, 1);
    const startedAt = performance.now();

    setDisplayedText('');
    setIsComplete(false);

    const tick = (now: number) => {
      if (cancelled) {
        return;
      }

      const nextLength = Math.min(text.length, Math.floor((now - startedAt) / durationPerCharacter) + 1);
      setDisplayedText(text.slice(0, nextLength));

      if (nextLength >= text.length) {
        setIsComplete(true);
        if (!completionSent) {
          completionSent = true;
          completionRef.current?.();
        }
        return;
      }

      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);
    };
  }, [enabled, immediate, preserveOnDisable, speed, text]);

  return {
    displayedText,
    isComplete,
    showCursor: enabled && !isComplete,
  };
};

export default useTypewriter;
