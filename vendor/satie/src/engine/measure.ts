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

/**
 * @file engine/measure.ts Structures for a measure
 */

"use strict";

import {reduce, forEach, map, mapValues} from "lodash";

import IModel from "./imodel"; // @circular
import IAttributes from "./iattributes";
import {lcm} from "./util";

/**
 * Based on Measure, but with additional information, and with a staff/voice-seperated and
 * monotonic parts element.
 */
export interface IMutableMeasure {
    idx: number; // 0-indexed, can change
    uuid: number;
    number: string; // 1-indexed
    implicit?: boolean;
    width?: number;
    nonControlling?: boolean;
    parts: {
        [id: string]: IMeasurePart;
    };

    /**
     * Incremented whenever anything in the measure changes.
     * Local only and monotonic.
     */
    version: number;
}

export interface IMeasurePart {
    voices: ISegment[];
    staves: ISegment[];
}

export interface ISegment extends Array<IModel> {
    owner: number;
    ownerType: OwnerType;
    divisions: number;
    part?: string;
}

export enum OwnerType {
    Voice = 0,
    Staff = 1
}

/** 
 * Given a set of segments, scales divisions so that they are compatible.
 * 
 * Returns the division count.
 */
export function normalizeDivisions$(segments$: ISegment[], factor: number = 0): number {
    let divisions = reduce(segments$, (div1, seg) => div1 ? lcm(div1, seg.divisions) : 1, factor);

    forEach(segments$, segment => {
        if (!segment) {
            return;
        }

        let ratio = divisions / segment.divisions;
        segment.divisions = divisions;

        forEach(segment, (model: IModel) => {
            if (model.divCount) {
                model.divCount *= ratio;
            }

            if ((<any>model).divisions) {
                ratio = divisions / (<any>model).divisions;
                (<any>model).divisions = divisions;
            }
        });
    });

    return divisions;
};

export interface IMeasureLayout {
    attributes: {[part: string]: IAttributes.ISnapshot[]};
    elements: IModel.ILayout[][];
    width: number;
    maxDivisions: number;
    uuid: number;
    originX: number;
    /**
     * Topmost (i.e., lowest) y-coordinates of each staff in tenths. One part may have more
     * than one staff.
     */
    originY: {[part: string]: number[]};
    /**
     * Positive integer in tenths. Required space above each staff beyond default 15 tenths,
     * indexed by staff index.
     */
    paddingTop: number[];
    /**
     * Postivie integer in tenths. Required space below each staff beyond default 15 tenths,
     * indexed by staff index.
     */
    paddingBottom: number[];

    getVersion: () => number;
}

export module IMeasureLayout {
    export function detach(layout: IMeasureLayout) {
        let clone: IMeasureLayout = {
            attributes: layout.attributes,
            elements: map(layout.elements, v => map(v, IModel.ILayout.detach)),
            width: layout.width,
            maxDivisions: layout.maxDivisions,
            originX: layout.originX,
            originY: mapValues(layout.originY, origins => origins.slice()),
            paddingTop: layout.paddingTop.slice(),
            paddingBottom: layout.paddingBottom.slice(),
            getVersion: layout.getVersion,
            uuid: layout.uuid
        };
        return clone;
    };
}
