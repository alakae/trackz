import cleanUp from "../"
import moment from "moment";
import {arrivalSimplePassing} from "./fixtures/simplePassing/arrival";
import {departureSimplePassing} from "./fixtures/simplePassing/departure";
import {arrivalDelayedPassing} from "./fixtures/delayedPassing/arrival";
import {departureDelayedPassing} from "./fixtures/delayedPassing/departure";

Date.now = jest.fn(() => 1561833582000); //2019-06-29T18:39:42+0000

it('test simplePassing', () => {
    // act
    const result = cleanUp(arrivalSimplePassing, departureSimplePassing);

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
    // act
    const result = cleanUp(arrivalDelayedPassing, departureDelayedPassing);

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