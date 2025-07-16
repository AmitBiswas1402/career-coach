import { useState } from "react";
import { toast } from "sonner";

function useFetch<T = any, A extends any[] = any[]>(
  cb: (...args: A) => Promise<T>
) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false); 
  const [error, setError] = useState<Error | null>(null);

  const fn = async (...args: A): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const response = await cb(...args);
      setData(response);
    } catch (err: any) {
      setError(err);
      toast.error(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, fn, setData };
}

export default useFetch;
