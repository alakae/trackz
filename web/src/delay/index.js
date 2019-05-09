import moment from "moment/moment";

export const getIsCancelled = (train) => {
    if (train.arr_delay) {
        return train.arr_delay.endsWith("X");
    }
    if (train.dep_delay) {
        return train.dep_delay.endsWith("X");
    }
    return false;
};

export const getEffectiveArrival = (train) => {
    return moment(train.arr_time).add(parseDelay(train.arr_delay), 'minutes');
};

export const getEffectiveDeparture = (train) => {
    return moment(train.dep_time).add(parseDelay(train.dep_delay), 'minutes');
};

const parseDelay = (delay) => {
    if (!delay) {
        return 0;
    }
    return Number.parseInt(delay.replace("+", ""), 10);
};