import React, {Component} from 'react';
import {connect} from "react-redux";
import {Link} from "react-router-dom";

class StationSearchResults extends Component {
    render() {
        if (this.props.hasErrored) {
            return (
                <div>
                    <p>An error occurred. We are sorry.</p>
                </div>
            );
        }

        if (this.props.isLoading) {
            return (
                <div>
                    <p>Loading...</p>
                </div>
            );
        }

        return (
            <div>
                {
                    this.props.result.map((e, i) =>
                        <p key={`result-${i}`}>
                            <Link to={`station/${e.label}`}>
                                {e.label}
                            </Link>
                        </p>
                    )
                }
            </div>
        )
    }
}

export default connect((state) => ({
        ...state.stationSearch
    }
))(StationSearchResults);
