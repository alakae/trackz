import { useState, useEffect, ChangeEvent } from "react";
import "./Stations.css";
import { Station } from "./api/station.ts";

export const Stations = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchStations = async () => {
      if (searchTerm.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `https://search.ch/timetable/api/completion.json?term=${encodeURIComponent(searchTerm)}`,
        );
        const data = await response.json();
        const filteredResults = data.filter(
          (r: Station) => r.iconclass === "sl-icon-type-train",
        );
        setResults(filteredResults);
      } catch (error) {
        console.error("Error fetching stations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchStations, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="page-container">
      <h1>Stations</h1>
      <p>Search for stations in Switzerland</p>

      <div className="search-container">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Type to search stations..."
          className="search-input"
        />

        {isLoading && <div className="loading">Loading...</div>}

        <div className="results-container">
          {results.map((station, index) => (
            <div key={index} className="station-item">
              <i className={station.iconclass}></i>
              <span dangerouslySetInnerHTML={{ __html: station.html }}></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
