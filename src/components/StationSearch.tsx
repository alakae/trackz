import { ChangeEvent, useState } from "react";
import { useStationSearch } from "../hooks/useStationSearch.ts";
import { useDelaySeverities } from "../hooks/useDelaySeverities.ts";
import { StationResultRow } from "./StationResultRow.tsx";

export const StationSearch = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { results, isLoading, error } = useStationSearch(searchTerm);
  const severityByStationId = useDelaySeverities(results);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="search-container">
      <input
        type="text"
        value={searchTerm}
        onChange={handleSearchChange}
        placeholder="Type to search stations..."
        className="search-input"
      />

      {isLoading && <div className="loading">Loading...</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="results-container">
        {results.map((station, index) => (
          <StationResultRow
            key={index}
            station={station}
            severity={severityByStationId[station.id]}
          />
        ))}
      </div>
    </div>
  );
};
