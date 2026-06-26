import { useCallback, useEffect, useRef } from 'react';

export function useAudioContext() {
  const contextRef = useRef<AudioContext | null>(null);

  const getContext = useCallback(async () => {
    if (!contextRef.current) {
      contextRef.current = new AudioContext();
    }
    if (contextRef.current.state === 'suspended') {
      await contextRef.current.resume();
    }
    return contextRef.current;
  }, []);

  useEffect(() => {
    return () => {
      void contextRef.current?.close();
      contextRef.current = null;
    };
  }, []);

  return { getContext };
}
