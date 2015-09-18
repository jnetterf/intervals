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

import {Stem, StemType, Tremolo} from "musicxml-interfaces";
import {createFactory as $, Component, DOM, PropTypes} from "react";
import invariant = require("invariant");

import Line from "./primitives/line";
import Glyph from "./primitives/glyph";
import {getFontOffset} from "../models/smufl";

/**
 * Renders a stem based on a height decided in Note.
 */
class StemView extends Component<StemView.IProps, void> {
    render(): any {
        const {spec, notehead, tremolo, width} = this.props;
        const {defaultX, relativeX, defaultY, relativeY, color} = spec;
        if (spec.type === StemType.Double) {
            return null;
        }
        const direction = spec.type === StemType.Up ? 1 : -1; // TODO: StemType.Double
        const lineXOffset = direction * - width / 2;
        const offset = getFontOffset(notehead, direction);
        const x = this.context.originX + defaultX + (relativeX || (offset[0] * 10 + lineXOffset));
        invariant(isFinite(x), "Invalid x offset %s", x);

        const dY = this.props.bestHeight * direction;

        let elements: any[] = [];
        elements.push($(Line)({
            key: "s",
            stroke: color,
            strokeWidth: width,
            x1: x,
            x2: x,
            y1: this.context.originY - defaultY - (relativeY || 0) - offset[1] * 10,
            y2: this.context.originY - defaultY - (relativeY || 0) - offset[1] * 10 - dY
        }));

        if (tremolo) {
            elements.push($(Glyph)({
                key: "t",
                glyphName: `tremolo${tremolo.data || "1"}`,
                x: x,
                fill: "black",
                y: this.context.originY - defaultY - (relativeY || 0) - dY * 4 / 5
            }));
        }

        if (elements.length === 1) {
            return elements[0];
        } else {
            return DOM.g(null, elements);
        }
    }
}

module StemView {
    export interface IProps {
        key?: string | number;
        spec: Stem;
        notehead: string;
        bestHeight: number;
        width: number;
        tremolo: Tremolo;
    }
    export let contextTypes = <any> {
        originX: PropTypes.number.isRequired,
        originY: PropTypes.number.isRequired
    };
}

export default StemView;
