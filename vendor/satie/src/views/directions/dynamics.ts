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

import {Dynamics} from "musicxml-interfaces";
import {createFactory as $, Component, PropTypes} from "react";
import {filter} from "lodash";
import invariant = require("invariant");

import DirectionModel from "../../models/direction";
import Glyph from "../primitives/glyph";

class DynamicsView extends Component<{layout: DirectionModel.ILayout, key?: string | number}, {}> {
    render() {
        let layout = this.props.layout;
        let model = layout.model;
        let dynamicsContainer = filter(model.directionTypes, dt => dt.dynamics)[0];
        invariant(!!dynamicsContainer, "No dynamics found!");
        let dynamics = dynamicsContainer.dynamics;

        let initX = this.context.originX + dynamics.defaultX + (dynamics.relativeX || 0);
        let initY = this.context.originY - dynamics.defaultY - (dynamics.relativeY || 0);

        let glyphName = this.getGlyphName(dynamics);
        if (!glyphName) {
            return null;
        }

        return $(Glyph)({
            fill: "black",
            glyphName: glyphName,
            x: initX,
            y: initY
        });
    }

    getGlyphName(dynamics: Dynamics) {
        /* Not included in MusicXML:

          "dynamicMessaDiVoce": "U+E540",
          "dynamicMezzo": "U+E521",
          "dynamicNiente": "U+E526",
          "dynamicNienteForHairpin": "U+E541",
          "dynamicPF": "U+E52E",
          "dynamicRinforzando": "U+E523",
          "dynamicSforzando": "U+E524",
          "dynamicSforzatoPiano": "U+E53A",
          "dynamicZ": "U+E525",
        */
        switch (true) {
            case dynamics.f:
                return "dynamicForte";
            case dynamics.ff:
                return "dynamicFF";
            case dynamics.fff:
                return "dynamicFFF";
            case dynamics.ffff:
                return "dynamicFFFF";
            case dynamics.fffff:
                return "dynamicFFFFF";
            case dynamics.ffffff:
                return "dynamicFFFFFF";

            case dynamics.fp:
                return "dynamicFortePiano";
            case dynamics.fz:
                return "dynamicForzando";

            case dynamics.mf:
                return "dynamicMF";
            case dynamics.mp:
                return "dynamicMP";

            case dynamics.p:
                return "dynamicPiano";
            case dynamics.pp:
                return "dynamicPP";
            case dynamics.ppp:
                return "dynamicPPP";
            case dynamics.pppp:
                return "dynamicPPPP";
            case dynamics.ppppp:
                return "dynamicPPPPP";
            case dynamics.pppppp:
                return "dynamicPPPPPP";

            case dynamics.rf:
                return "dynamicRinforzando1";
            case dynamics.rfz:
                return "dynamicRinforzando2";

            case dynamics.sf:
                return "dynamicSforzando1";
            case dynamics.sffz:
                return "dynamicSforzatoFF";
            case dynamics.sfp:
                return "dynamicSforzandoPiano";
            case dynamics.sfpp:
                return "dynamicSforzandoPianissimo";
            case dynamics.sfz:
                return "dynamicSforzato";

            default:
                console.warn("Found unknown dynamic!");
                return null;
        }
    }
}

module DynamicsView {
    export let contextTypes = <any> {
        originX: PropTypes.number.isRequired,
        originY: PropTypes.number.isRequired
    };
}

export default DynamicsView;
