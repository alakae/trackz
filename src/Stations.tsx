import { useState, useEffect, ChangeEvent } from "react";
import { Link } from "react-router-dom";
import "./css/Stations.css";
import { Station } from "./api/station.ts";
import DOMPurify from "dompurify";

export const Stations = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStations = async () => {
      if (searchTerm.length < 2) {
        setResults([]);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `https://search.ch/timetable/api/completion.json?show_ids=1&term=${encodeURIComponent(searchTerm)}`,
        );
        const data = await response.json();
        const filteredResults = data.filter((r: Station) => {
          return (
            r.iconclass === "sl-icon-type-train" ||
            r.iconclass === "sl-icon-type-strain"
          );
        });
        setResults(filteredResults);
      } catch (error) {
        console.error("Error fetching stations:", error);
        setError("Failed to fetch stations. Please try again.");
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
        {error && <div className="error-message">{error}</div>}

        <div className="results-container">
          {results.map((station, index) => (
            <Link
              to={`/station/${station.id}`}
              key={index}
              className="station-item"
              style={{
                cursor: "pointer",
                display: "block",
                textDecoration: "none",
              }}
            >
              <i className={station.iconclass}></i>
              <span
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(station.html),
                }}
              ></span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
