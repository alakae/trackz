import {PREFIX} from "../reducers/stationSearch";

const setHasErrored = (bool) => {
    return {
        type:  `${PREFIX}.SET_HAS_ERRORED`,
        hasErrored: bool
    };
};

const setIsLoading = (bool) => {
    return {
        type: `${PREFIX}.SET_IS_LOADING`,
        isLoading: bool
    };
};

const setResult = (items) => {
    return {
        type: `${PREFIX}.SET_RESULT`,
        items
    };
};

export const search = (searchString) => {
    return (dispatch) => {
        dispatch(setIsLoading(true));

        const url = `https://timetable.search.ch/api/completion.json?term=${searchString}`;
        fetch(url)
            .then((response) => {
                if (!response.ok) {
                    throw Error(response.statusText);
                }
                return response;
            })
            .then((response) => response.json())
            .then((result) => {
                const filtered = result
                    .filter((r) => r.iconclass === "sl-icon-type-train");
                if (searchString.length >= 0 && !filtered.map(e => e.label.toLowerCase()).includes(searchString.toLowerCase())) {
                    filtered.unshift({label: searchString})
                }
                dispatch(setResult(filtered));
            })
            .catch(() => dispatch(setHasErrored(true)))
            .finally(() => dispatch(setIsLoading(false)));
    };
};