import cleanUp from "../"
import moment from "moment-timezone";
import {arrivalSimplePassing} from "./fixtures/simplePassing/arrival";
import {departureSimplePassing} from "./fixtures/simplePassing/departure";
import {arrivalDelayedPassing} from "./fixtures/delayedPassing/arrival";
import {departureDelayedPassing} from "./fixtures/delayedPassing/departure";
import {arrivalStartingAndEnding} from "./fixtures/startingAndEnding/arrival";
import {departureStartingAndEnding} from "./fixtures/startingAndEnding/departure";
import {arrivalFluegelungBefore} from "./fixtures/fluegelungBefore/arrival";
import {departureFluegelungBefore} from "./fixtures/fluegelungBefore/departure";
import {departureFluegelungAt} from "./fixtures/fluegelungAt/departure";
import {arrivalFluegelungAt} from "./fixtures/fluegelungAt/arrival";
import {departureStarting} from "./fixtures/starting/departure";
import {arrivalStarting} from "./fixtures/starting/arrival";
import {arrivalTrackNumber} from "./fixtures/trackNumber/arrival";
import {departureTrackNumber} from "./fixtures/trackNumber/departure";
import {arrivalStartingAndEndingTrackNumberMissing} from "./fixtures/startingAndEndingTrackNumberMissing/arrival";
import {departureStartingAndEndingTrackNumberMissing} from "./fixtures/startingAndEndingTrackNumberMissing/departure";

//Date.now = jest.fn(() => 1561833582000); //2019-06-29T18:39:42+0000

test('test simplePassing', () => {
    // arrange
    const boardTime = moment("2019-06-29 19:19:00", "Europe/Zurich");

    // act
    const result = cleanUp(arrivalSimplePassing, departureSimplePassing, boardTime);

    // assert
    expect(result.name).toEqual("Courgenay");
    expect(result.entries.length).toEqual(1);

    const [train] = result.entries;
    expect(train.color).toEqual("#039");
    expect(train.line).toEqual("S3");
    expect(train.operationType).toEqual("pass");
    expect(train.arr_time.diff(moment("2019-06-29T19:43:00.000+0200"))).toEqual(0);
    expect(train.arr_delay).toEqual(undefined);
    expect(train.dep_time.diff(moment("2019-06-29T19:44:00.000+0200"))).toEqual(0);
    expect(train.dep_delay).toEqual(undefined);
    expect(train.number).toEqual("S3 17366");
    expect(train.terminals).toEqual([{"name": "Porrentruy"}]);
    expect(train.track).toEqual("1");
});

test('test delayedPassing', () => {
    // arrange
    const boardTime = moment("2019-06-29 21:22:00", "Europe/Zurich");

    // act
    const result = cleanUp(arrivalDelayedPassing, departureDelayedPassing, boardTime);

    // assert
    expect(result.name).toEqual("Lugano");
    expect(result.entries.length).toEqual(1);

    const [train] = result.entries;
    expect(train.color).toEqual("#039");
    expect(train.line).toEqual("S10");
    expect(train.operationType).toEqual("pass");
    expect(train.arr_time.diff(moment("2019-06-29T21:24:00.000+0200"))).toEqual(0);
    expect(train.arr_delay).toEqual("+13");
    expect(train.dep_time.diff(moment("2019-06-29T21:25:00.000+0200"))).toEqual(0);
    expect(train.dep_delay).toEqual("+12");
    expect(train.number).toEqual("S10 25138");
    expect(train.terminals).toEqual([{"name": "Bellinzona"}]);
    expect(train.track).toEqual("4");
});

test('test startingAndEnding', () => {
    // arrange
    const boardTime = moment("2019-06-29 19:00:00", "Europe/Zurich");

    // act
    const result = cleanUp(arrivalStartingAndEnding, departureStartingAndEnding, boardTime);

    // assert
    expect(result.name).toEqual("Uster");
    expect(result.entries.length).toEqual(1);

    const [train] = result.entries;
    expect(train.color).toEqual("#039");
    expect(train.line).toEqual("S9");
    expect(train.operationType).toEqual("turn");
    expect(train.arr_time.diff(moment("2019-06-29T19:20:00.000+0200"))).toEqual(0);
    expect(train.arr_delay).toEqual(undefined);
    expect(train.dep_time.diff(moment("2019-06-29T19:40:00.000+0200"))).toEqual(0);
    expect(train.dep_delay).toEqual(undefined);
    expect(train.number).toEqual("S9 18976");
    expect(train.terminals).toEqual([{"name": "Schaffhausen"}]);
    expect(train.track).toEqual("3");
});

test('test fluegelungBefore', () => {
    // arrange
    const boardTime = moment("2019-08-04 16:49:00", "Europe/Zurich");

    // act
    const result = cleanUp(arrivalFluegelungBefore, departureFluegelungBefore, boardTime);

    // assert
    expect(result.name).toEqual("Münsingen");
    expect(result.entries.length).toEqual(1);

    const [train] = result.entries;
    expect(train.color).toEqual("#f00");
    expect(train.line).toEqual("RE");
    expect(train.operationType).toEqual("pass");
    expect(train.arr_time.diff(moment("2019-08-04T17:49:00.000+0200"))).toEqual(0);
    expect(train.arr_delay).toEqual(undefined);
    expect(train.dep_time.diff(moment("2019-08-04T17:50:00.000+0200"))).toEqual(0);
    expect(train.dep_delay).toEqual(undefined);
    expect(train.number).toEqual("RE 4181");
    expect(train.terminals).toEqual([{"name": "Zweisimmen"}, {"name": "Domodossola (I)"}]);
    expect(train.track).toEqual("1");
});

test.skip('test fluegelungAt', () => {
    // arrange
    const boardTime = moment("2019-08-04 18:00:00", "Europe/Zurich");

    // act
    const result = cleanUp(arrivalFluegelungAt, departureFluegelungAt, boardTime);

    // assert
    expect(result.name).toEqual("Spiez");
    expect(result.entries.length).toEqual(1);

    const [train] = result.entries;
    expect(train.color).toEqual("#f00");
    expect(train.line).toEqual("RE");
    expect(train.operationType).toEqual("pass");
    expect(train.arr_time.diff(moment("2019-08-04T17:49:00.000+0200"))).toEqual(0);
    expect(train.arr_delay).toEqual(undefined);
    expect(train.dep_time.diff(moment("2019-08-04T17:50:00.000+0200"))).toEqual(0);
    expect(train.dep_delay).toEqual(undefined);
    expect(train.number).toEqual("RE 4181");
    expect(train.terminals).toEqual([{"name": "Zweisimmen"}, {"name": "Domodossola (I)"}]);
    expect(train.track).toEqual("1");
});

test('test starting', () => {
    // arrange
    const boardTime = moment("2019-08-24 15:50:00", "Europe/Zurich");

    // act
    const result = cleanUp(arrivalStarting, departureStarting, boardTime);

    // assert
    expect(result.name).toEqual("Zürich HB");
    expect(result.entries.length).toEqual(1);

    const [train] = result.entries;
    expect(train.color).toEqual("#f00");
    expect(train.line).toEqual("IR 17");
    expect(train.operationType).toEqual("start");
    //expect(train.arr_time.diff(moment("2019-08-24T19:20:00.000+0200"))).toEqual(0);
    //expect(train.arr_delay).toEqual(undefined);
    expect(train.dep_time.diff(moment("2019-08-24T15:53:00.000+0200"))).toEqual(0);
    expect(train.dep_delay).toEqual(undefined);
    expect(train.number).toEqual("IR 2376");
    expect(train.terminals).toEqual([{"name": "Bern"}]);
    expect(train.track).toEqual("17");
});

test('test trackNumber with letters', () => {
    // arrange
    const boardTime = moment("2019-08-24 17:30:00", "Europe/Zurich");

    // act
    const result = cleanUp(arrivalTrackNumber, departureTrackNumber, boardTime);

    // assert
    expect(result.name).toEqual("Bern");
    expect(result.entries.length).toEqual(1);

    const [train] = result.entries;
    expect(train.color).toEqual("#039");
    expect(train.line).toEqual("S3");
    expect(train.operationType).toEqual("pass");
    expect(train.arr_time.diff(moment("2019-08-24T18:00:00.000+0200"))).toEqual(0);
    expect(train.arr_delay).toEqual(undefined);
    expect(train.dep_time.diff(moment("2019-08-24T18:02:00.000+0200"))).toEqual(0);
    expect(train.dep_delay).toEqual(undefined);
    expect(train.number).toEqual("S3 15366");
    expect(train.terminals).toEqual([{"name": "Belp"}]);
    expect(train.track).toEqual("1AB");
    expect(train.track_numerical).toEqual("1");
});

test('test trackNumber missing in arrival data', () => {
    // arrange
    const boardTime = moment("2019-10-15 20:00:00", "Europe/Zurich");

    // act
    const result = cleanUp(
        arrivalStartingAndEndingTrackNumberMissing,
        departureStartingAndEndingTrackNumberMissing,
        boardTime
    );

    // assert
    expect(result.name).toEqual("Zürich Oerlikon");
    expect(result.entries.length).toEqual(1);

    const [train] = result.entries;
    expect(train.color).toEqual("#f00");
    expect(train.line).toEqual("IR 36");
    expect(train.operationType).toEqual("turn");
    expect(train.arr_time.diff(moment("2019-11-15T19:57:00.000+0100"))).toEqual(0);
    expect(train.arr_delay).toEqual(undefined);
    expect(train.dep_time.diff(moment("2019-11-15T20:02:00.000+0100"))).toEqual(0);
    expect(train.dep_delay).toEqual(undefined);
    expect(train.number).toEqual("IR 2086");
    expect(train.terminals).toEqual([{"name": "Basel SBB"}]);
    expect(train.track).toEqual("3");
    expect(train.track_numerical).toEqual("3");
});