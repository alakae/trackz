import { BrowserRouter as Router, Route, Link, Routes } from "react-router-dom";
import "./App.css";

const Home = () => (
  <div className="page-container">
    <h1>Welcome to Trackz</h1>
    <p>Discover your next favorite station</p>
  </div>
);

const Stations = () => (
  <div className="page-container">
    <h1>Stations</h1>
    <p>Browse through our collection of stations</p>
  </div>
);

const About = () => (
  <div className="page-container">
    <h1>About Us</h1>
    <p>Learn more about our mission and story</p>
  </div>
);

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
          <Route path="/about" element={<About />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
