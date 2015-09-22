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
 * @file part of Satie test suite
 */

"use strict";

import IModel from "../imodel";

import {times, reduce} from "lodash";
import {expect} from "chai";

import {createFakeLayout} from "./etestutil";

describe("[engine/imodel.ts]", function() {
    describe("merge$", function() {
        it("handles multiple segments", function() {
            let layout1 = times(5, idx => createFakeLayout(idx, 0, true));
            let layout2 = times(5, idx => createFakeLayout(idx, idx ? 2 : 0, true));
            let combinedLayout: IModel.ICombinedLayout[] = [];

            combinedLayout = reduce([layout1, layout2], IModel.merge$, combinedLayout);
            combinedLayout = reduce([layout1, layout2], IModel.merge$, combinedLayout);

            expect(combinedLayout).to.deep.equal([
                {
                    renderClass: IModel.Type.Attributes,
                    x: 0,
                    division: 0
                },
                {
                    renderClass: IModel.Type.Attributes,
                    x: 100,
                    division: 4
                },
                {
                    renderClass: IModel.Type.Attributes,
                    x: 100 + 10 * Math.log(3) / Math.log(2),
                    division: 6
                },
                {
                    renderClass: IModel.Type.Attributes,
                    x: 200,
                    division: 8
                },
                {
                    renderClass: IModel.Type.Attributes,
                    x: 200 + 10 * Math.log(3) / Math.log(2),
                    division: 10
                },
                {
                    renderClass: IModel.Type.Attributes,
                    x: 300,
                    division: 12
                },
                {
                    renderClass: IModel.Type.Attributes,
                    x: 300 + 10 * Math.log(3) / Math.log(2),
                    division: 14
                },
                {
                    renderClass: IModel.Type.Attributes,
                    x: 400,
                    division: 16
                },
                {
                    renderClass: IModel.Type.Attributes,
                    x: 400 + 10 * Math.log(3) / Math.log(2),
                    division: 18
                },
            ]);
            expect(layout1).to.have.length(9);
            expect(layout2).to.have.length(9);
            expect(layout1.slice(0, 3)).to.be.deep.equal([
               {
                    boundingBoxes$: [],
                    division: 0,
                    renderClass: IModel.Type.Attributes,
                    model: {},
                    x$: 0
               },
               {
                    boundingBoxes$: [],
                    division: 4,
                    renderClass: IModel.Type.Attributes,
                    model: {},
                    x$: 100
               },
               {
                    division: 6,
                    renderClass: IModel.Type.Attributes,
                    model: null,
                    x$: 100 + 10 * Math.log(3) / Math.log(2)
               }
            ]);
        });
    });
});
