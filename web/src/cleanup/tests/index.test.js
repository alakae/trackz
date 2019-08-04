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

//Date.now = jest.fn(() => 1561833582000); //2019-06-29T18:39:42+0000

it('test simplePassing', () => {
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

it('test delayedPassing', () => {
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

it('test startingAndEnding', () => {
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

it('test fluegelungBefore', () => {
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