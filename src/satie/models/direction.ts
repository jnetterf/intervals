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

import {AboveBelow, DirectionType, Offset, Sound, Footnote, Level, Direction,
    NormalBold, Segno, serialize as serializeToXML} from "musicxml-interfaces";
import {forEach} from "lodash";

import {ICursor, IModel, ISegment} from "../engine";
import {mmToTenths, ptPerMM} from "../engine/renderUtil";
import {getTextBB} from "./fontManager";
import {bboxes as glyphBoxes} from "./smufl";

class DirectionModel implements Export.IDirectionModel {

    /*---- I.1 IModel ---------------------------------------------------------------------------*/

    /** @prototype only */
    divCount: number;

    /** defined externally */
    staffIdx: number;

    /** @prototype */
    frozenness: IModel.FrozenLevel;

    /*---- I.2 Direction ------------------------------------------------------------------------*/

    directionTypes: DirectionType[];
    staff: number;
    offset: Offset;
    sound: Sound;

    /*---- I.2.1 Placement ----------------------------------------------------------------------*/

    placement: AboveBelow;

    /*---- I.2.2 EditorialVoice -----------------------------------------------------------------*/

    voice: number;
    footnote: Footnote;
    level: Level;

    /*---- I.2.3 Directive ----------------------------------------------------------------------*/

    data: string;

    /*---- Implementation -----------------------------------------------------------------------*/

    constructor(spec: Direction) {
        forEach(spec, (value, key) => {
            (<any>this)[key] = value;
        });
    }

    modelDidLoad$(segment$: ISegment): void {
        // todo
    }

    validate$(cursor$: ICursor): void {
        forEach(this.directionTypes, type => {
            if (type.dynamics && this.placement === AboveBelow.Unspecified) {
                this.placement = AboveBelow.Below;
            }
        });
    }

    layout(cursor$: ICursor): Export.ILayout {
        return new DirectionModel.Layout(this, cursor$);
    }

    toXML(): string {
        return serializeToXML.direction(this);
    }

    inspect() {
        return this.toXML();
    }
}

DirectionModel.prototype.divCount = 0;
DirectionModel.prototype.frozenness = IModel.FrozenLevel.Warm;

module DirectionModel {
    export class Layout implements Export.ILayout {
        constructor(model: DirectionModel, cursor$: ICursor) {
            model = Object.create(model);

            this.model = model;
            this.x$ = cursor$.x$;
            this.division = cursor$.division$;

            let defaultY = 0;
            switch (model.placement) {
                case AboveBelow.Below:
                    defaultY = -60;
                    break;
                case AboveBelow.Above:
                case AboveBelow.Unspecified:
                    defaultY = 60;
                    break;
                default:
                    defaultY = 60;
                    break;
            }

            this.boundingBoxes$ = [];

            forEach(model.directionTypes, (type, idx) => {
                model.directionTypes[idx] = Object.create(model.directionTypes[idx]);
                forEach(type.words, (word, idx) => {
                    let origModel = type.words[idx];
                    let defaults = cursor$.header.defaults;
                    type.words[idx] = Object.create(origModel);
                    type.words[idx].fontSize = type.words[idx].fontSize || "18";
                    type.words[idx].defaultX = 0;
                    type.words[idx].defaultY = defaultY;
                    let fontBox = getTextBB(type.words[idx].fontFamily || "Alegreya",
                        type.words[idx].data,
                        parseInt(type.words[idx].fontSize, 10),
                        type.words[idx].fontWeight === NormalBold.Normal ? null : "bold");
                    const scale40 = defaults.scaling.millimeters / defaults.scaling.tenths * 40;
                    let boundingBox: IModel.IBoundingRect = <any> type.words[idx];

                    // Vertical coordinates are flipped (argh!)
                    // We give 10% padding because elements touching isn't ideal.
                    boundingBox.top = -mmToTenths(scale40,
                            fontBox.bottom / ptPerMM) * 1.1;
                    boundingBox.bottom = -mmToTenths(scale40,
                            fontBox.top / ptPerMM) * 1.1;

                    boundingBox.left = mmToTenths(scale40,
                            fontBox.left / ptPerMM) * 1.1;
                    boundingBox.right = mmToTenths(scale40,
                            fontBox.right / ptPerMM) * 1.1;
                    this.boundingBoxes$.push(boundingBox);
                });
                if (type.dynamics) {
                    let origDynamics = type.dynamics;
                    type.dynamics = Object.create(origDynamics);
                    type.dynamics.defaultX = 0;
                    type.dynamics.defaultY = defaultY;
                    let boundingBox: IModel.IBoundingRect = <any> type.dynamics;
                    boundingBox.left = -10;
                    boundingBox.right = 30;
                    boundingBox.top = -10;
                    boundingBox.bottom = 30; // TODO
                    this.boundingBoxes$.push(boundingBox);
                }
                forEach(type.segnos, (origSegno, idx) => {
                    let segno: Segno = Object.create(origSegno);
                    type.segnos[idx] = segno;
                    segno.defaultX = segno.defaultX || -30;
                    segno.defaultY = (segno.defaultY || defaultY);
                    segno.color = segno.color || "black";
                    let boundingBox: IModel.IBoundingRect = <any> segno;
                    boundingBox.right = glyphBoxes["segno"][0] * 10 + 10;
                    boundingBox.top = -glyphBoxes["segno"][1] * 10 - 10;
                    boundingBox.left = glyphBoxes["segno"][2] * 10 - 10;
                    boundingBox.bottom = -glyphBoxes["segno"][3] * 10 + 10;
                    this.boundingBoxes$.push(boundingBox);
                });
            });
        }

        /*---- ILayout ------------------------------------------------------*/

        // Constructed:

        model: DirectionModel;
        x$: number;
        division: number;

        // Prototype:

        boundingBoxes$: IModel.IBoundingRect[];
        renderClass: IModel.Type;
        expandPolicy: IModel.ExpandPolicy;
    }

    Layout.prototype.expandPolicy = IModel.ExpandPolicy.None;
    Layout.prototype.renderClass = IModel.Type.Direction;
    Layout.prototype.boundingBoxes$ = [];
    Object.freeze(Layout.prototype.boundingBoxes$);
};

function Export(constructors: { [key: number]: any }) {
    constructors[IModel.Type.Direction] = DirectionModel;
}

module Export {
    export interface IDirectionModel extends IModel, Direction {
    }

    export interface ILayout extends IModel.ILayout {
        model: IDirectionModel;
    }
}

export default Export;
