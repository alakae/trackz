export const PREFIX = 'STATION_BOARD';

export const initial = {
    hasErrored: false,
    isLoading: false,
    result: {name: "", entries: []},
    filter: "notdeparted"
};

export function stationBoard(state = initial, action) {
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
                result: action.result
            };
        case `${PREFIX}.SET_FILTER`:
            return {
                ...state,
                filter: action.newFilter
            };
        default:
            return state;
    }
}