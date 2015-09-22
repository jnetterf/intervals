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

import {Position, Notehead} from "musicxml-interfaces";
import {createFactory as $, Component, PropTypes} from "react";

import Glyph from "./primitives/glyph";

/**
 * Renders a notehead.
 */
class NoteheadView extends Component<NoteheadView.IProps, void> {
    render(): any {
        let spec = this.props.spec;
        let pos = <Position> spec;
        let head = <Notehead> spec;

        return $(Glyph)({
            fill: head.color,
            glyphName: this.props.notehead,
            // scale: this.props.grace ? 0.6 : 1.0,
            x: this.context.originX + pos.defaultX + (pos.relativeX || 0),
            y: this.context.originY - pos.defaultY - (pos.relativeY || 0)
        });
    }
}

module NoteheadView {
    export interface IProps {
        key?: string | number;
        spec: Notehead | Position;
        notehead: string;
    }
    export let contextTypes = <any> {
        originX: PropTypes.number.isRequired,
        originY: PropTypes.number.isRequired
    };
}

export default NoteheadView;
