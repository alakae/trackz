import {PREFIX} from "../reducers/stationBoard";
import cleanUp from "../cleanup";
import moment from "moment";

export const setFilter = (newFilter) => {
    return {
        type: `${PREFIX}.SET_FILTER`,
        newFilter
    };
};

const setHasErrored = (bool) => {
    return {
        type: `${PREFIX}.SET_HAS_ERRORED`,
        hasErrored: bool
    };
};

const setIsLoading = (bool) => {
    return {
        type: `${PREFIX}.SET_IS_LOADING`,
        isLoading: bool
    };
};

const setResult = (result) => {
    return {
        type: `${PREFIX}.SET_RESULT`,
        result
    };
};

const checkSuccess = (response) => {
    if (!response.ok) {
        throw Error(response.statusText);
    }
    return response;
};

export const loadStationBoard = (name) => {
    return (dispatch) => {
        dispatch(setIsLoading(true));
        const boardTime = moment();
        const t = boardTime.clone().subtract(1, 'hours').format("HH:mm");
        const departureUrl = `https://timetable.search.ch/api/stationboard.json?stop=${name}&&show_tracks=true&&show_delays=true&&show_trackchanges=true&&mode=depart&time=${t}`;
        const arrivalUrl = `https://timetable.search.ch/api/stationboard.json?stop=${name}&&show_tracks=true&&show_delays=true&&show_trackchanges=true&&mode=arrival&time=${t}`;


        const arrivalPromise = fetch(arrivalUrl)
            .then(checkSuccess)
            .then((response) => response.json());
        const departurePromise = fetch(departureUrl)
            .then(checkSuccess)
            .then((response) => response.json());

        Promise.all([arrivalPromise, departurePromise])
            .then(([arrivals, departures]) => {
                dispatch(setResult(cleanUp(arrivals, departures, boardTime)));
            })
            .catch((e) => {
                console.log(e);
                return dispatch(setHasErrored(true));
            })
            .finally(() => dispatch(setIsLoading(false)));
    };
};