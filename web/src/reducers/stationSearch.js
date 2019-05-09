export const PREFIX = 'STATION_SEARCH';

const initial = {
    hasErrored: false,
    isLoading: false,
    result: []};

export function stationSearch(state = initial, action) {
    switch (action.type) {
        case `${PREFIX}.SET_HAS_ERRORED`:
            return {
                ...state,
                hasErrored: action.hasErrored
            };
        case `${PREFIX}.SET_IS_LOADING`:
            return {
                ...state,
                isLoading: action.isLoading
            };
        case `${PREFIX}.SET_RESULT`:
            return {
                ...state,
                result: action.items
            };
        default:
            return state;
    }
}