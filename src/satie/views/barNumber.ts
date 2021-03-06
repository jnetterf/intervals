/**
 * (C) Josh Netterfield <joshua@nettek.ca> 2015.
 * Part of the Satie music engraver <https://github.com/jnetterf/satie>.
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

import {Position} from "musicxml-interfaces";
import {Component, DOM, PropTypes} from "react";

class BarNumber extends Component<{spec: Position, barNumber: string, key?: string | number}, void> {
    render(): any {
        const spec = this.props.spec;
        return DOM.text({
            className: "bn_",
            fontSize: 24,
            x: this.context.originX + spec.defaultX + (spec.relativeX || 0),
            y: this.context.originY - spec.defaultY - (spec.relativeY || 0)
        }, this.props.barNumber);
    }
};

module BarNumber {
    export let contextTypes = <any> {
        originX: PropTypes.number.isRequired,
        originY: PropTypes.number.isRequired
    };
}

export default BarNumber;
