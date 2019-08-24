import {connect} from "react-redux";
import React from "react";
import {Stage, Layer, Line, Group, Text, Rect} from 'react-konva';
import moment from "moment";
import {getEffectiveArrival, getEffectiveDeparture, getIsCancelled} from "../delay";


const trackSpacing = 30;
const trackLabelSpace = 80;
const trainHeight = 8;

class StationBoardCanvas extends React.Component {
    collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});

    getTracks() {
        const tracks = Array.from(new Set(this.props.data.map(c => this.getEffectiveTrack(c.track_numerical))));
        return tracks.sort(this.collator.compare);
    }

    getTrackIndex(track) {
        return this.getTracks().indexOf(this.getEffectiveTrack(track));
    }

    getEffectiveTrack(track) {
        return track ? track.replace("!", "") : undefined;
    }

    getY(time) {
        return ((moment.duration(time.diff(moment())).asSeconds() / (60 * 60)) * (this.props.innerWidth - trackLabelSpace)) + trackLabelSpace;
    }

    getWidth(time_arr, time_dep) {
        if (time_arr.isSame(time_dep)) {
            return (0.5 / 60) * (this.props.innerWidth - trackLabelSpace);
        }

        return (moment.duration(time_arr.diff(time_dep)).asMinutes() / 60) * (this.props.innerWidth - trackLabelSpace);
    }

    getIntervals() {
        const result = [];
        for (let i = -2; i < 6; ++i) {
            const m = moment().seconds(0).milliseconds(0).add(i * 10, 'minutes');
            const remainder = 15 - (m.minute() % 15);
            result.push(m.add(remainder, 'minutes'));
        }
        return result;
    }


    render() {
        const tracks = this.getTracks();
        const canvasHeight = tracks.length * trackSpacing + 20;

        return <Stage width={this.props.innerWidth} height={canvasHeight}>
            <Layer>
                <Group>
                    {/* now */}
                    <Line
                        x={this.getY(moment())}
                        y={0}
                        points={[0, 0, 0, canvasHeight]}
                        tension={0.1}
                        stroke="silver"
                    />
                </Group>
                <Group>
                    {
                        this.getIntervals().map((intervall, index) =>
                            <Line
                                key={`interval-${index}`}
                                x={this.getY(intervall)}
                                y={0}
                                points={[0, 0, 0, canvasHeight]}
                                tension={0.1}
                                stroke="silver"
                                dash={[2, 8]}
                            />
                        )
                    }
                </Group>
                <Group>
                    {
                        tracks.map((track, index) =>
                            <Line
                                key={`track-${index}`}
                                x={0}
                                y={trackSpacing + index * trackSpacing}
                                points={[0, 0, this.props.innerWidth, 0]}
                                tension={0.5}
                                stroke="white"
                            />
                        )
                    }
                </Group>
                <Group>
                    {
                        tracks.map((track, index) =>
                            <Text
                                key={`track-label-${index}`}
                                x={0}
                                y={trackSpacing / 3 + index * trackSpacing}
                                text={track ? track : "?"}
                                fontSize={15}
                                fill="white"
                                fontStyle="bold"
                            />
                        )
                    }
                </Group>
                <Group>
                    {
                        this.props.data.map((train, index) => {
                                return <Rect
                                    key={`train-${index}`}
                                    x={this.getY(train.arr_time)}
                                    y={trackSpacing + this.getTrackIndex(train.track_numerical) * trackSpacing - trainHeight / 2}
                                    height={trainHeight}
                                    width={this.getWidth(train.dep_time, train.arr_time)}
                                    fill={train.color}
                                    stroke="silver"
                                />;
                            }
                        )
                    }
                </Group>
                <Group>
                    {
                        this.props.data.filter(t => t.dep_delay || t.arr_delay).map((train, index) => {
                                const effectiveArrival = getEffectiveArrival(train);
                                const effectiveDeparture = getEffectiveDeparture(train);
                                return <Rect
                                    key={`train-delay-${index}`}
                                    x={this.getY(effectiveArrival)}
                                    y={trackSpacing + this.getTrackIndex(train.track_numerical) * trackSpacing - trainHeight / 2}
                                    height={trainHeight}
                                    width={this.getWidth(effectiveDeparture, effectiveArrival)}
                                    stroke={getIsCancelled(train) ? "black" : "orange"}
                                />;
                            }
                        )
                    }
                </Group>
                <Group>
                    {
                        this.props.data.filter(t => this.hasTrackChange(t.track_numerical)).map((train, index) => {
                                return <Rect
                                    key={`train-delay-${index}`}
                                    x={this.getY(train.arr_time) - 2}
                                    y={(trackSpacing + this.getTrackIndex(train.track_numerical) * trackSpacing - trainHeight / 2) - 2}
                                    height={trainHeight + 4}
                                    width={this.getWidth(train.dep_time, train.arr_time) + 4}
                                    stroke="green"
                                />;
                            }
                        )
                    }
                </Group>
                <Group>
                    {
                        this.props.data.map((train, index) =>
                            <Text
                                key={`train-label-${index}`}
                                x={this.getY(train.arr_time)}
                                y={trackSpacing + this.getTrackIndex(train.track_numerical) * trackSpacing + 4}
                                text={train.line}
                                fontSize={10}
                                fill="white"
                                fontStyle="bold"
                                strokeWidth={0.1}
                            />
                        )
                    }
                </Group>
            </Layer>
        </Stage>;
    }

    hasTrackChange(track) {
        return track ? track.endsWith("!") : false;
    }
}

export default connect()(StationBoardCanvas);