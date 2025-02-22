import { BrowserRouter as Router, Link, Route, Routes } from "react-router-dom";
import "./App.css";
import { Home } from "./Home.tsx";
import { Stations } from "./Stations.tsx";
import { About } from "./About.tsx";
import { StationBoard } from "./StationBoard.tsx";

function App() {
  return (
    <Router>
      <div className="app-container">
        <nav className="navbar">
          <ul className="nav-list">
            <li>
              <Link to="/" className="nav-item">
                Home
              </Link>
            </li>
            <li>
              <Link to="/stations" className="nav-item">
                Stations
              </Link>
            </li>
            <li>
              <Link to="/about" className="nav-item">
                About
              </Link>
            </li>
          </ul>
        </nav>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/stations" element={<Stations />} />
          <Route path="/station/:label" element={<StationBoard />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
