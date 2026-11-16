import { useEffect, useRef, useState } from 'react';
import { TreasureAudio } from './TreasureAudio';

export function useTreasureAudio(scene) {
  const engine = useRef(null);
  const [enabled, setEnabled] = useState(false);
  const sceneRef = useRef(scene);
  sceneRef.current = scene;

  function getEngine() {
    if (!engine.current) {
      engine.current = new TreasureAudio();
      engine.current.setScene(sceneRef.current);
    }
    return engine.current;
  }

  useEffect(() => { engine.current?.setScene(scene); }, [scene]);
  useEffect(() => {
    const visibility = () => engine.current?.visibilityChanged();
    const hide = () => { if (engine.current) void engine.current.silence(); };
    const show = () => engine.current?.visibilityChanged();
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('pagehide', hide);
    window.addEventListener('pageshow', show);
    return () => {
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('pagehide', hide);
      window.removeEventListener('pageshow', show);
      engine.current?.dispose();
      engine.current = null;
    };
  }, []);

  async function toggle() {
    const audio = getEngine();
    if (audio.enabled) {
      setEnabled(false);
      await audio.disable();
    } else {
      setEnabled(true);
      await audio.enable();
      setEnabled(audio.enabled);
    }
  }

  return { enabled, toggle, play: name => engine.current?.play(name) };
}
