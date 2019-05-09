import {createStore, applyMiddleware, combineReducers} from 'redux';
import thunk from 'redux-thunk';
import {stationSearch} from "../reducers/stationSearch";
import {initial, stationBoard} from "../reducers/stationBoard";

export default function configureStore(initialState) {
    return createStore(
        combineReducers({
                stationSearch,
                stationBoard,
            },
            {
                stationBoard: initial
            }),
        applyMiddleware(thunk)
    );
}