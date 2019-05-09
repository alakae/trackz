import React from 'react';
import {Route} from "react-router-dom";
import StationBoard from "./StationBoard";

class StationBoards extends React.Component {
    render() {
        return (
            <div>
                <Route path={`${this.props.match.url}/:name`} component={StationBoard}/>
                <Route
                    exact
                    path={`${this.props.match}`}
                    render={() => <h3>Please select a topic.</h3>}
                />
            </div>
        )
    }
}

export default StationBoards;