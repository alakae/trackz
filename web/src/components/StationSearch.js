import React, {Component} from 'react';
import {search} from "../actions/stationSearch";
import {connect} from "react-redux";

class StationSearch extends Component {

    componentDidMount() {
        this.props.dispatch(search(""));
    }

    handleChanged = (e) => {
        this.props.dispatch(search(e.target.value));
    };

    render() {
        return (
            <input
                type="text"
                placeholder="Type a station name"
                onChange={this.handleChanged}
            />
        )
    }
}

export default connect()(StationSearch);