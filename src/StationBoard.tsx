import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

export const StationBoard = () => {
  const { label } = useParams<{ label: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [departures, setDepartures] = useState([]);

  useEffect(() => {
    const fetchStationBoard = async () => {
      setLoading(true);
      try {
        // Implement the API call to fetch station board data
        // This will depend on your API endpoint structure
        setLoading(false);
      } catch (err) {
        setError("Failed to load station board");
        setLoading(false);
      }
    };

    fetchStationBoard();
  }, [label]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="page-container">
      <h1>Station Board - {label}</h1>
      {/* Implement your station board UI here */}
    </div>
  );
};
