import React, { Component } from 'react';
import { connect } from 'react-redux';
import StationSearch from "./StationSearch";
import StationSearchResults from "./StationSearchResults";

class ItemList extends Component {
    render() {
        return (
            <div>
                <h2>Stations</h2>
                <StationSearch/>
                <StationSearchResults/>
            </div>
        );
    }
}

export default connect()(ItemList);