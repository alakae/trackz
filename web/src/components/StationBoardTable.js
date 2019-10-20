import React from 'react';
import {connect} from "react-redux";
import Color from 'color';
import moment from "moment";
import {getEffectiveDeparture} from "../delay";
import {setFilter} from "../actions/stationBoard";

function getPrefix(e) {
    switch (e.operationType) {
        case "turn":
            return "from/to";
        case "end":
            return "from";
        case "start":
        case "pass":
            return "to";
        default:
            return "?";
    }
}

class StationBoardTable extends React.Component {
    handleFilterChanged = (newFilter) => {
        this.props.dispatch(setFilter(newFilter));
    };

    filter = (t) => {
        switch (this.props.filter) {
            case 'notdeparted':
                return getEffectiveDeparture(t).isAfter(moment());
            case 'all':
            default:
                return true;
        }
    };

    render() {
        return (
            <div className="stationBoardTableContainer">
                <form>
                    <label>Show:</label>
                    <input id="all" type="radio" name="filter" value="all"
                           checked={this.props.filter === "all"}
                           onChange={(e) => this.handleFilterChanged(e.target.value)}/>
                    <label htmlFor="all">All</label>
                    <input id="notdeparted" type="radio" name="filter" value="notdeparted"
                           checked={this.props.filter === "notdeparted"}
                           onChange={(e) => this.handleFilterChanged(e.target.value)}/>
                    <label htmlFor="notdeparted">Not Departed</label>
                </form>

                <table className="stationBoardTable">
                    <thead>
                    <tr>
                        <th>Line</th>
                        <th className="additionalInfo">Arr</th>
                        <th className="additionalInfo"></th>
                        <th>Dep</th>
                        <th></th>
                        <th className="additionalInfo">Number</th>
                        <th>Terminal</th>
                        <th>Track</th>
                        <th>Unit</th>
                    </tr>
                    </thead>
                    <tbody>
                    {
                        this.props.data
                            .filter(this.filter)
                            .sort((l, r) => l - r)
                            .map((t, i) =>
                                <tr key={`train-${i}`}>
                                    <td style={{background: t.color}}>
                                        <span style={{color: this.getColor(t.color)}}>
                                            <a
                                                href={`http://fahrplan.sbb.ch/bin/trainsearch.exe/dn?trainname=${t.number}&selectDate=today`}>
                                            {t.line}
                                            </a>
                                        </span>
                                    </td>
                                    <td className="additionalInfo">{t.operationType !== "start" && t.arr_time.format('HH:mm')}</td>
                                    <td className="additionalInfo">{t.arr_delay}</td>
                                    <td>{t.operationType !== "end" && t.dep_time.format('HH:mm')}</td>
                                    <td>{t.dep_delay}</td>
                                    <td className="additionalInfo">
                                        {t.number}
                                    </td>
                                    <td>
                                        {`${getPrefix(t)} `}
                                        {
                                            t.terminals.map((terminal, index) =>
                                                [
                                                    index !== 0 ? ', ' : '',
                                                    <a
                                                        key={index}
                                                        href={`/station/${terminal.name}`}>
                                                        {`${terminal.name}`}
                                                    </a>
                                                ]
                                            )
                                        }

                                    </td>
                                    <td>{t.track}</td>
                                    <td>
                                        <form
                                            action="http://www.reisezuege.ch/index.php"
                                            method="post">
                                            <input name="znummer" type="hidden" value={t.number.split(' ')[1]}/>
                                            <input name="action" type="hidden" value="1"/>
                                            <input className="reisezuegeSubmit" type="submit" value="Lookup"/>
                                        </form>
                                    </td>
                                </tr>
                            )
                    }
                    </tbody>
                </table>
            </div>
        );
    }

    getColor(color) {
        color = Color(color);
        const luminosity = color.luminosity();
        if (luminosity > 0.5) {
            return Color('black').hsl().string(); // bright colors - black font
        }
        return Color('white').hsl().string(); // dark colors - white font
    }
}

export default connect((state) => ({
        filter: state.stationBoard.filter
    })
)(StationBoardTable);