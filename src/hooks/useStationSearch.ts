import { useEffect, useState } from "react";
import { Station } from "../api/station.ts";
import { searchStations } from "../api/searchStations.ts";

interface UseStationSearchResult {
  results: Station[];
  isLoading: boolean;
  error: string | null;
}

export function useStationSearch(term: string): UseStationSearchResult {
  const [results, setResults] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const debounceTimer = setTimeout(async () => {
      if (term.length < 2) {
        setResults([]);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const filteredResults = await searchStations(term, {
          signal: controller.signal,
        });
        setResults(filteredResults);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Error fetching stations:", error);
        setError("Failed to fetch stations. Please try again.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(debounceTimer);
      controller.abort();
    };
  }, [term]);

  return { results, isLoading, error };
}
