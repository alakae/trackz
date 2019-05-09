import React, {Component} from 'react';
import {connect} from "react-redux";

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
                            <a href={`/station/${e.label}`}>
                                {e.label}
                            </a>
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