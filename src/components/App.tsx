import { BrowserRouter as Router, Link, Route, Routes } from "react-router-dom";
import "../css/App.css";
import { Home } from "./Home.tsx";
import { Stations } from "./Stations.tsx";
import { About } from "./About.tsx";
import { StationBoard } from "./StationBoard.tsx";
import { PageTitle } from "./PageTitle.tsx";

function App() {
  return (
    <Router basename={import.meta.env.BASE_URL}>
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
          <Route
            path="/"
            element={
              <PageTitle title="Home">
                <Home />
              </PageTitle>
            }
          />
          <Route
            path="/stations"
            element={
              <PageTitle title="Stations">
                <Stations />
              </PageTitle>
            }
          />
          <Route
            path="/station/:label"
            element={
              <PageTitle title="Station">
                <StationBoard />
              </PageTitle>
            }
          />
          <Route
            path="/about"
            element={
              <PageTitle title="About">
                <About />
              </PageTitle>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
