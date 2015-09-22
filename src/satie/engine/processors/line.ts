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

import {reduce, flatten, map, values, pluck, times, max, zipObject, forEach, filter} from "lodash";
import invariant = require("invariant");

import {ILayoutOptions, ILineBounds, ILinesLayoutState, ILineLayoutResult,
    IPart, ISegment, IMeasureLayout, Context } from "../../engine";

import {layoutMeasure} from "./measure";

export function layoutLine$(options: ILayoutOptions, bounds: ILineBounds,
        memo$: ILinesLayoutState): ILineLayoutResult {
    let {measures, attributes} = options;
    let {clean$} = memo$;

    let allModels = reduce(measures, function(memo, measure) {
        let voiceSegments$ = <ISegment[]> flatten(map(values(measure.parts), part => part.voices));

        let staffSegments$ = <ISegment[]> flatten(map(values(measure.parts), part => part.staves));

        let segments = filter(voiceSegments$.concat(staffSegments$), s => !!s);
        return memo.concat(segments);
    }, []);
    let line = Context.ILine.create(allModels, measures.length, options.line, options.lines);

    if (!measures.length) {
        return [];
    }

    let layouts = _layoutDirtyMeasures(options, line, clean$);
    attributes = clean$[measures[measures.length - 1].uuid].attributes; // FIXME: Hack

    let partOrder: string[] = pluck(IPart.scoreParts(options.header.partList), "id");
    let staffIdx = 0;

    let topsInOrder = map(partOrder, partID => {
        invariant(attributes[partID][1].staves >= 1,
                "Expected at least 1 staff, but there are %s",
                attributes[partID][1].staves);

        return [null].concat(times(attributes[partID].length - 1, () => {
            ++staffIdx;
            if (staffIdx > 1) {
                memo$.y$ -= 100;
            }

            let paddingTop = max(layouts, mre =>
                mre.paddingTop[staffIdx] || 0).paddingTop[staffIdx] || 0;

            let paddingBottom = max(layouts, mre =>
                mre.paddingBottom[staffIdx] || 0).paddingBottom[staffIdx] || 0;

            let top = memo$.y$ - paddingTop;
            memo$.y$ = top - paddingBottom;
            return top;
        }));
    });
    let tops: {[part: string]: number[]} = <any> zipObject(partOrder, topsInOrder);
    memo$.y$ -= bounds.systemLayout.systemDistance;

    let left = bounds.left;
    forEach(layouts, layout => {
        layout.originY = tops;
        layout.originX = left;
        left = left + layout.width;
    });

    let key = `${options.page$}_${options.line}`;
    if (!memo$.reduced$[key]) {
        let detachedLayouts: IMeasureLayout[] = map(layouts, IMeasureLayout.detach);
        memo$.reduced$[key] = reduce(options.postprocessors,
            (layouts, filter) => filter(options, bounds, detachedLayouts), layouts);
    }

    return memo$.reduced$[key];
}

function _layoutDirtyMeasures(options: ILayoutOptions, line: Context.ILine,
        clean$: {[key: string]: IMeasureLayout}) {
    let measures = options.measures;
    let attributes = options.attributes;
    return map(measures, (measure, measureIdx) => {
        line.barOnLine$ = measureIdx;
        if (!clean$[measure.uuid]) {
            clean$[measure.uuid] = layoutMeasure({
                attributes: attributes,
                factory: options.modelFactory,
                header: options.header,
                line: line,
                measure: measure,
                padEnd: measureIdx !== measures.length - 1,
                x: 0 // Final offset set recorded in justify(...).
            });
        }
        // Update attributes for next measure
        attributes = clean$[measure.uuid].attributes;
        return clean$[measure.uuid];
    });
}

