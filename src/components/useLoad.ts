import { useCallback, useEffect, useRef, useState } from "react";
import { errorMessage } from "../services/http";

interface Loaded<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload(): Promise<void>;
  setData(value: T): void;
}

/** Carrega dados ao montar (e quando `key` muda); respostas antigas são descartadas. */
export function useLoad<T>(loader: () => Promise<T>, key: string = ""): Loaded<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const loaderRef = useRef(loader);
  const requestId = useRef(0);

  useEffect(() => {
    loaderRef.current = loader;
  });

  const reload = useCallback(async () => {
    const id = ++requestId.current;
    try {
      const value = await loaderRef.current();
      if (id !== requestId.current) return;
      setData(value);
      setError(null);
    } catch (failure) {
      if (id === requestId.current) setError(errorMessage(failure));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    void reload();
  }, [reload, key]);

  return { data, error, loading, reload, setData };
}
