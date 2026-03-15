import { Link } from "react-router-dom";
import "../css/Home.css";

export const Home = () => (
  <div className="home-hero">
    <span className="home-overline">Swiss Railway Departures</span>
    <h1>Trackz</h1>
    <p className="home-tagline">
      Graphical departure boards for railway stations across Switzerland.
    </p>
    <Link to="/stations" className="home-cta-button">
      Search stations
    </Link>
  </div>
);
