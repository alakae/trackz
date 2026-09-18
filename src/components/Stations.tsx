import "../css/Stations.css";
import { StationSearch } from "./StationSearch.tsx";
import { TopStations } from "./TopStations.tsx";

export const Stations = () => (
  <div className="page-container">
    <h1>Stations</h1>
    <p>Search for stations in Switzerland</p>

    <StationSearch />

    <TopStations />
  </div>
);
