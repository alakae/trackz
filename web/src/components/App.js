import React from 'react';
import '../css/App.css';
import {BrowserRouter as Router, Route, Link} from "react-router-dom";
import {Home} from "./Home";
import {About} from "./About";
import Stations from "./Stations";
import StationBoards from "./StationBoards";

const App = () => (
    <Router>
        <div className="App">
            <header className="App-header">
                <h1 className="App-title">trackz.ch</h1>
            </header>
            <nav>
                <Link to="/">Home</Link>
                <Link to="/stations">Stations</Link>
                <Link to="/about">About</Link>
            </nav>
            <div className="App-intro">
                <Route exact path="/" component={Home}/>
                <Route path="/stations" component={Stations}/>
                <Route path="/station" component={StationBoards}/>
                <Route path="/about" component={About}/>
            </div>
        </div>
    </Router>
);

export default App;
