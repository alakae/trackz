import React from 'react';
import {connect} from "react-redux";
import {loadStationBoard} from "../actions/stationBoard";
import StationBoardTable from "./StationBoardTable";
import StationBoardCanvas from "./StationBoardCanvas";

class StationBoard extends React.Component {

    componentDidMount() {
        this.props.dispatch(loadStationBoard(this.props.match.params.name));
        window.addEventListener("resize", this.updateDimensions);
    }

    updateDimensions = () => {
        this.setState(() => ({
            innerWidth: window.innerWidth
        }));
    };

    componentWillMount() {
        this.updateDimensions();
    }

    componentWillUnmount = function() {
        window.removeEventListener("resize", this.updateDimensions);
    };

    render() {
        return (
            <div>
                <h1>{this.props.match.params.name}</h1>
                {
                    this.props.hasErrored && <p>An error occurred. We are sorry.</p>
                }
                {
                    this.props.isLoading && <p>Loading...</p>
                }
                {
                    !this.props.isLoading &&
                    !this.props.hasErrored &&
                    <div>
                        <StationBoardCanvas
                            data={this.props.result.entries}
                            innerWidth={this.state.innerWidth}
                        />
                        <StationBoardTable data={this.props.result.entries}/>
                    </div>
                }
            </div>
        )
    }
}

export default connect(
    (state) => (
        {
            ...state.stationBoard
        }
    ))(StationBoard);