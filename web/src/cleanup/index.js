import moment from "moment-timezone";

const groupBy = (xs, key) => xs.reduce((rv, x) => {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
}, {});

const extractInfo = (c, boardTime) => {
    const time = moment.tz(c.time, "YYYY-MM-DD HH:mm:ss", "Europe/Zurich");
    const intervalBegin = boardTime.clone().add(90, 'minutes');
    const intervalEnd = boardTime.clone().subtract(90, 'minutes');
    if (time.isAfter(intervalBegin) || time.isBefore(intervalEnd)) {
        return undefined;
    }

    const color = c.color.split("~")[0];

    return {
        time: time,
        arr_delay: c.arr_delay !== "+0" ? c.arr_delay : undefined,
        dep_delay: c.dep_delay !== "+0" ? c.dep_delay : undefined,
        line: c.line,
        number: c.number,
        track: c.track,
        terminals: [{
            name: c.terminal.name,
        }],
        color: color !== "" ? `#${color}` : "#000",
        sourceType: c.sourceType,
    }
};

const merge = (departures) => {
    if (departures.length === 1) {
        return departures[0];
    }
    return {
        ...departures[0],
        terminals: [
            {
                name: departures[0].terminals[0].name
            },
            {
                name: departures[1].terminals[0].name
            }
        ]
    };
};

const isPass = (g) => {
    return g.length === 2
        && g[0].sourceType === 'arrival'
        && g[1].sourceType === 'departure';
};

const isEndOrStart = (g) => {
    return g.length === 1
        && (
            g[0].sourceType === 'arrival'
            || g[0].sourceType === 'departure'
        );
};

const isFluegelung = (g) => {
    return g.length === 3 || g.length === 2;
};

const matchArrivalsAndDepartures = (all) => {
    const withNumber = all.filter(t => t.number);
    const groups = groupBy(withNumber, 'number');
    return Object.values(groups).map((g) => {
        if (isPass(g)) {
            const arr = g[0];
            const dep = g[1];
            return {
                operationType: "pass",
                arr_time: arr.time,
                dep_time: dep.time,
                ...dep
            }
        }
        if (isEndOrStart(g)) {
            const startOrEnd = g[0];
            return {
                operationType: g[0].sourceType === "arrival" ? "end" : "start",
                arr_time: startOrEnd.time,
                dep_time: startOrEnd.time,
                ...startOrEnd
            }
        }
        if (isFluegelung(g)) {
            const bySourceType = groupBy(g, 'sourceType');
            const arrivals = bySourceType.arrival;
            const departures = bySourceType.departure;
            if (departures && (departures.length === 1 || departures.length === 2)) {
                const merged = merge(departures);
                return {
                    operationType: "pass",
                    arr_time: arrivals ? arrivals[0].time : merged.time,
                    dep_time: merged.time,
                    ...merged
                }
            }
            const merged = merge(arrivals);
            return {
                operationType: "end",
                arr_time: arrivals[0].time,
                dep_time: merged.time,
                ...merged
            }
        }
        console.log(g);
        throw Error('group of unexpected size')
    });
};

const matchStartAndEnds = (connections) => {
    const result = connections.filter(c => c.operationType === "pass");
    const startsAndEnds = connections.filter(c => c.operationType === "start" || c.operationType === "end");

    const trackGroups = groupBy(startsAndEnds, 'track');

    Object.values(trackGroups).forEach((trackGroup) => {
        const lineGroups = groupBy(trackGroup, 'line');
        Object.values(lineGroups).forEach((lineGroup) => {
            if (lineGroup.length === 1) {
                return result.push(lineGroup[0]);
            }
            const sorted = lineGroup.sort((left, right) => moment.utc(left.time).diff(moment.utc(right.time)));
            for (let i = 0; i < sorted.length - 1; i++) {
                const current = sorted[i];
                const next = sorted[i + 1];
                if (current.operationType === "end" && next.operationType === "start") {
                    const end = current;
                    const start = next;
                    const turn = {...start};
                    turn.operationType = "turn";
                    turn.arr_time = end.arr_time;
                    turn.arr_delay = end.arr_delay;
                    result.push(turn);
                    ++i; // next has been matched, skip 1
                } else {
                    result.push(current);
                }
            }
        });
    });

    return result;
};

const cleanUp = (arrivals, departures, boardtime = moment()) => {
    const name = arrivals.stop.name;

    arrivals = arrivals.connections.map(c => ({...c, sourceType: "arrival"}));
    departures = departures.connections.map(c => ({...c, sourceType: "departure"}));

    const all = [
        ...arrivals,
        ...departures,
    ];

    const postProcessed = all
        .map(c => extractInfo(c, boardtime))
        .filter(c => c !== undefined);

    const matched = matchArrivalsAndDepartures(postProcessed);
    const matched2 = matchStartAndEnds(matched);

    return {
        name,
        entries: matched2.sort((left, right) => moment.utc(left.dep_time).diff(moment.utc(right.dep_time)))
    };
};

export default cleanUp;