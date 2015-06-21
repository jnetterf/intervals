/**
 * (C) Josh Netterfield <joshua@nettek.ca> 2015.
 * Part of the Satie music engraver <https://github.com/ripieno/satie>.
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

import MusicXML = require("musicxml-interfaces");
import _ = require("lodash");
import invariant = require("react/lib/invariant");

import Attributes from "./attributes";
import {getCurrentMeasureList, IAttributes, ICursor, IModel, IPart, ISegment} from "../engine";
import {bravura} from "./smufl";

class BarlineModel implements Export.IBarlineModel {

    /*---- I.1 IModel ---------------------------------------------------------------------------*/

    /** @prototype only */
    divCount: number;

    /** defined externally */
    staffIdx: number;

    /** @prototype */
    frozenness: IModel.FrozenLevel;

    modelDidLoad$(segment$: ISegment): void {
        // todo
    }

    validate$(cursor$: ICursor): void {
        if (!this.barStyle) {
            this.barStyle = {
                data: NaN
            };
        }
        if (!this.barStyle.color) {
            this.barStyle.color = "black";
        }
    }

    layout(cursor$: ICursor): Export.ILayout {
        // mutates cursor$ as required.
        return new BarlineModel.Layout(this, cursor$);
    }

    /*---- I.2 C.MusicXML.Barline ---------------------------------------------------------------*/

    segno: MusicXML.Segno;
    coda: MusicXML.Coda;
    location: MusicXML.BarlineLocation;
    codaAttrib: string;
    wavyLine: MusicXML.WavyLine;
    fermatas: MusicXML.Fermata[];
    segnoAttrib: string;
    divisions: string;
    barStyle: MusicXML.BarStyle;
    ending: MusicXML.Ending;
    repeat: MusicXML.Repeat;

    /*---- I.3 C.MusicXML.Editorial -------------------------------------------------------------*/

    footnote: MusicXML.Footnote;
    level: MusicXML.Level;

    /*---- II. BarlineModel (extension) ---------------------------------------------------------*/

    defaultX: number;
    defaultY: number;
    satieAttributes: Attributes.ILayout;
    satieAttribsOffset: number;

    /*---- Validation Implementations -----------------------------------------------------------*/

    constructor(spec: MusicXML.Barline) {
        _.forEach(spec, (value, key) => {
            (<any>this)[key] = value;
        });
    }

    toXML(): string {
        return MusicXML.serialize.barline(this);
    }

    inspect() {
        return this.toXML();
    }
}

BarlineModel.prototype.divCount = 0;
BarlineModel.prototype.frozenness = IModel.FrozenLevel.Warm;

module BarlineModel {
    export class Layout implements Export.ILayout {
        constructor(origModel: BarlineModel, cursor$: ICursor) {
            this.division = cursor$.division$;
            if (cursor$.staff.hiddenMeasuresRemaining > 1) {
                return;
            }

            this.partGroups = IPart.groupsForPart(cursor$.header.partList, cursor$.segment.part);
            this.partSymbol = cursor$.staff.attributes[cursor$.segment.part].partSymbol;

            this.model = Object.create(origModel, {
                defaultX: {
                    get: () => this.overrideX
                }
            });

            this.x$ = cursor$.x$;
            let clefOffset = 0;

            if (!cursor$.approximate && cursor$.line.barsOnLine === cursor$.line.barOnLine$ + 1) {
                // TODO: Figure out a way to get this to work when the attributes on the next
                // line change
                let nextMeasure = getCurrentMeasureList()[cursor$.measure.idx + 1];
                let part = nextMeasure && nextMeasure.parts[cursor$.segment.part];
                let segment = part && part.staves[cursor$.staff.idx];
                let nextAttributes = segment && cursor$.factory.search(
                    segment, 0, IModel.Type.Attributes)[0];
                let attributes = cursor$.staff.attributes[cursor$.segment.part];
                let needsWarning = nextAttributes && IAttributes.needsWarning(
                    attributes, nextAttributes, cursor$.staff.idx);

                if (needsWarning) {
                    let clefsAreEqual = IAttributes.clefsEqual(
                        attributes, nextAttributes, cursor$.staff.idx);
                    clefOffset = clefsAreEqual ? 0 : IAttributes.CLEF_INDENTATION;
                    let warningLayout = Attributes.createWarningLayout$(cursor$, nextAttributes);
                    this.model.satieAttributes = warningLayout;
                }
            }

            this.model.barStyle = Object.create(this.model.barStyle) || {};
            if (!isFinite(this.model.barStyle.data) || this.model.barStyle.data === null) {
                let lastBarlineInSegment = !_.any(cursor$.segment.slice(cursor$.idx$ + 1),
                        model => cursor$.factory.modelHasType(model, IModel.Type.Barline));

                if(cursor$.line.barOnLine$ + 1 === cursor$.line.barsOnLine &&
                        cursor$.line.line + 1 === cursor$.line.lines &&
                        lastBarlineInSegment) {
                    this.model.barStyle.data = MusicXML.BarStyleType.LightHeavy;
                } else {
                    this.model.barStyle.data = MusicXML.BarStyleType.Regular;
                }
            }
            this.model.defaultY = 0;

            this.yOffset = 0;   // TODO
            this.height = 20;   // TODO

            /*---- Geometry ---------------------------------------*/

            const lineWidths = cursor$.header.defaults.appearance.lineWidths;

            const barlineSep = bravura.engravingDefaults.barlineSeparation;

            let setLines$ = (lines: string[]) => {
                let x = 0;
                this.lineStarts = [];
                this.lineWidths = [];
                _.forEach(lines, (line, idx) => {
                    if (idx > 0) {
                        x += barlineSep*10;
                    }
                    this.lineStarts.push(x);
                    const width = lineWidths[line].tenths;
                    this.lineWidths.push(width);
                    x += width;
                });
                this.model.satieAttribsOffset = x + 8 + clefOffset;
                cursor$.x$ += x;
            };

            switch(this.model.barStyle.data) {
                case MusicXML.BarStyleType.LightHeavy:
                    setLines$(["light barline", "heavy barline"]);
                    break;
                case MusicXML.BarStyleType.LightLight:
                    setLines$(["light barline", "light barline"]);
                    break;
                case MusicXML.BarStyleType.HeavyHeavy:
                    setLines$(["heavy barline", "heavy barline"]);
                    break;
                case MusicXML.BarStyleType.HeavyLight:
                    setLines$(["heavy barline", "light barline"]);
                    break;
                case MusicXML.BarStyleType.Regular:
                case MusicXML.BarStyleType.Dashed:
                case MusicXML.BarStyleType.Dotted:
                case MusicXML.BarStyleType.Short:
                case MusicXML.BarStyleType.Tick:
                    setLines$(["light barline"]);
                    break;
                case MusicXML.BarStyleType.Heavy:
                    setLines$(["heavy barline"]);
                    break;
                case MusicXML.BarStyleType.None:
                    setLines$([]);
                    break;
                default:
                    invariant(false, "Not implemented");
            }
        }

        /*---- ILayout ------------------------------------------------------*/

        // Constructed:

        model: BarlineModel;
        x$: number;
        division: number;
        height: number;
        yOffset: number;

        /**
         * Set by layout engine.
         */
        overrideX: number;

        // Prototype:

        mergePolicy: IModel.HMergePolicy;
        boundingBoxes$: IModel.IBoundingRect[];
        renderClass: IModel.Type;
        expandPolicy: IModel.ExpandPolicy;

        /*---- Extensions ---------------------------------------------------*/

        lineStarts: number[];
        lineWidths: number[];

        partGroups: MusicXML.PartGroup[];
        partSymbol: MusicXML.PartSymbol;
    }

    Layout.prototype.mergePolicy = IModel.HMergePolicy.Max;
    Layout.prototype.expandPolicy = IModel.ExpandPolicy.None;
    Layout.prototype.renderClass = IModel.Type.Barline;
    Layout.prototype.boundingBoxes$ = [];
    Object.freeze(Layout.prototype.boundingBoxes$);
};

/**
 * Registers Barline in the factory structure passed in.
 */
function Export(constructors: { [key: number]: any }) {
    constructors[IModel.Type.Barline] = BarlineModel;
}

module Export {
    export interface IBarlineModel extends IModel, MusicXML.Barline {
        defaultX: number;
        defaultY: number;
        satieAttributes: Attributes.ILayout;
        satieAttribsOffset: number;
    }

    export interface ILayout extends IModel.ILayout {
        model: IBarlineModel;
        height: number;
        yOffset: number;

        lineStarts: number[];
        lineWidths: number[];

        partSymbol: MusicXML.PartSymbol;
        partGroups: MusicXML.PartGroup[];
    }
}

export default Export;
