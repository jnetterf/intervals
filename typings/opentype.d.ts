declare module 'opentype.js' {
    /**
     * Parse the OpenType file data (as an ArrayBuffer) and return a Font object.
     * If the file could not be parsed (most likely because it contains Postscript outlines)
     * we return an empty Font object with the `supported` flag set to `false`.
     */
    function parse(buffer: ArrayBuffer): Font;

    /**
     * Asynchronously load the font from a URL or a filesystem. When done, call the callback
     * with two arguments `(err, font)`. The `err` will be null on success,
     * the `font` is a Font object.
     *
     * We use the node.js callback convention so that
     * opentype.js can integrate with frameworks like async.js.
     */
    function load(url: string, callback: (err: Error, font: Font) => void): void;

    /**
     * A Font represents a loaded OpenType font file.
     * It contains a set of glyphs and methods to draw text on a drawing context,
     * or to get a path representing the text.
     */
    interface Font {
        familyName: string;
        styleName: string;
        designer: string;
        designerURL: string;
        manufacturer: string;
        manufacturerURL: string;
        license: string;
        licenseURL: string;
        version: string;
        description: string;
        copyright: string;
        trademark: string;
        unitsPerEm: number;
        ascender: number;
        descender: number;
        supported: boolean;
        glyphs: Glyph[]

        tables: any; // TODO
        encoding: any; // TODO

        /**
         * Check if the font has a glyph for the given character.
         */
        hasChar: (c: string) => boolean;

        /**
         * Convert the given character to a single glyph index.
         * Note that this function assumes that there is a one-to-one mapping between
         * the given character and a glyph; for complex scripts this might not be the case.
         */
        charToGlyphIndex: (c: string) => number;

        /**
         * Convert the given character to a single Glyph object.
         * Note that this function assumes that there is a one-to-one mapping between
         * the given character and a glyph; for complex scripts this might not be the case.
         */
        charToGlyph: (c: string) => Glyph;

        /**
         * Convert the given text to a list of Glyph objects.
         * Note that there is no strict one-to-one mapping between characters and
         * glyphs, so the list of returned glyphs can be larger or smaller than the
         * length of the given string.
         */
        stringToGlyphs: (s: string) => Glyph[];

        nameToGlyphIndex: (name: string) => number;

        nameToGlyph: (name: string) => Glyph;

        glyphIndexToName: (gid: number) => string;

        /**
         * Retrieve the value of the kerning pair between the left glyph (or its index)
         * and the right glyph (or its index). If no kerning pair is found, return 0.
         * The kerning value gets added to the advance width when calculating the spacing
         * between glyphs.
         */
        getKerningValue: (leftGlyph: Glyph, rightGlyph: Glyph) => number;

        /**
         * Helper function that invokes the given callback for each glyph in the given text.
         * The callback gets `(glyph, x, y, fontSize, options)`.
         */
        forEachGlyph: (text: string, x: number, y: number, fontSize: number, options: Options,
                callback: (glyph: Glyph, x: number, y: number, fontSize: number, options: Options) => void) =>
                    void;

        /**
         * Create a Path object that represents the given text.
         *
         * text - The text to create.
         * x - Horizontal position of the beginning of the text. (default: 0)
         * y - Vertical position of the *baseline* of the text. (default: 0)
         * fontSize - Font size in pixels. We scale the glyph units by `1 / unitsPerEm * fontSize`. (default: 72)
         * Options is an optional object that contains:
         * - kerning - Whether to take kerning information into account. (default: true)
         *
         * Returns a Path object.
         */
        getPath: (text: string, x: number, y: number, fontSize: number, options: Options) => Path;

        /**
         * Draw the text on the given drawing context.
         *
         * ctx - A 2D drawing context, like Canvas.
         * text - The text to create.
         * x - Horizontal position of the beginning of the text. (default: 0)
         * y - Vertical position of the *baseline* of the text. (default: 0)
         * fontSize - Font size in pixels. We scale the glyph units by `1 / unitsPerEm * fontSize`. (default: 72)
         * Options is an optional object that contains:
         * - kerning - Whether to take kerning information into account. (default: true)
         */
        draw: (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, fontSize: number, options: Options) => void;

        /**
         * Draw the points of all glyphs in the text.
         * On-curve points will be drawn in blue, off-curve points will be drawn in red.
         *
         * ctx - A 2D drawing context, like Canvas.
         * text - The text to create.
         * x - Horizontal position of the beginning of the text. (default: 0)
         * y - Vertical position of the *baseline* of the text. (default: 0)
         * fontSize - Font size in pixels. We scale the glyph units by `1 / unitsPerEm * fontSize`. (default: 72)
         * Options is an optional object that contains:
         * - kerning - Whether to take kerning information into account. (default: true)
         */
        drawPoints: (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, fontSize: number, options: Options) => void;

        /**
         * Draw lines indicating important font measurements for all glyphs in the text.
         * Black lines indicate the origin of the coordinate system (point 0,0).
         * Blue lines indicate the glyph bounding box.
         * Green line indicates the advance width of the glyph.
         *
         * ctx - A 2D drawing context, like Canvas.
         * text - The text to create.
         * x - Horizontal position of the beginning of the text. (default: 0)
         * y - Vertical position of the *baseline* of the text. (default: 0)
         * fontSize - Font size in pixels. We scale the glyph units by `1 / unitsPerEm * fontSize`. (default: 72)
         * Options is an optional object that contains:
         * - kerning - Whether to take kerning information into account. (default: true)
         */
        drawMetrics: (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, fontSize: number, options: Options) => void;

        /**
         * Validate
         */
        validate: () => void;

        /**
         * Convert the font object to a SFNT data structure.
         * This structure contains all the necessary tables and metadata to create a binary OTF file.
         */
        toTables: () => any;

        toBuffer: () => ArrayBuffer;

        /**
         * Initiate a download of the OpenType font.
         */
        download: () => void;
    }

    interface Options {
        kerning: boolean;
    }

    /**
     * A Glyph is an individual mark that often corresponds to a character.
     * Some glyphs, such as ligatures, are a combination of many characters.
     * Glyphs are the basic building blocks of a font.
     *
     * The `Glyph` class contains utility methods for drawing the path and its points.
     */
    interface Glyph {
        font: Font;
        index: number;
        name: string;
        unicode: number;
        unicodes: number[];
        xMin: number;
        yMin: number;
        xMax: number;
        yMax: number;
        advanceWidth: number;
        path: Path;

        addUnicode: (unicode: number) => void;

        /**
         * Convert the glyph to a Path we can draw on a drawing context.
         *
         * x - Horizontal position of the glyph. (default: 0)
         * y - Vertical position of the *baseline* of the glyph. (default: 0)
         * fontSize - Font size, in pixels (default: 72).
         */
        getPath: (x: number, y: number, fontSize: number) => Path;

        /**
         * Split the glyph into contours.
         * This function is here for backwards compatibility, and to
         * provide raw access to the TrueType glyph outlines.
         */
        getContours: () => any[];

        /**
         * Calculate the xMin/yMin/xMax/yMax/lsb/rsb for a Glyph.
         */
        getMetrics: () => Metrics;

        /**
         * Draw the glyph on the given context.
         *
         * ctx - The drawing context.
         * x - Horizontal position of the glyph. (default: 0)
         * y - Vertical position of the *baseline* of the glyph. (default: 0)
         * fontSize - Font size, in pixels (default: 72).
         */
        draw: (ctx: CanvasRenderingContext2D, x: number, y: number, fontSize: number) => void;

        /**
         * Draw the points of the glyph.
         * On-curve points will be drawn in blue, off-curve points will be drawn in red.
         *
         * ctx - The drawing context.
         * x - Horizontal position of the glyph. (default: 0)
         * y - Vertical position of the *baseline* of the glyph. (default: 0)
         * fontSize - Font size, in pixels (default: 72).
         */
        drawPoints: (ctx: CanvasRenderingContext2D, x: number, y: number, fontSize: number) => void;

        /**
         * Draw lines indicating important font measurements.
         * Black lines indicate the origin of the coordinate system (point 0,0).
         * Blue lines indicate the glyph bounding box.
         * Green line indicates the advance width of the glyph.
         *
         * ctx - The drawing context.
         * x - Horizontal position of the glyph. (default: 0)
         * y - Vertical position of the *baseline* of the glyph. (default: 0)
         * fontSize - Font size, in pixels (default: 72).
         */
        drawMetrics: (ctx: CanvasRenderingContext2D, x: number, y: number, fontSize: number) => void;
    }

    interface Metrics {
        xMin: number;
        yMin: number;
        xMax: number;
        yMax: number;
        leftSideBearing: number;
        rightSideBearing: number;
    }

    interface Command {
        type: string;
        x: number;
        y: number;
        x1?: number;
        x2?: number;
        y1?: number;
        y2?: number;
    }

    /**
     * A bézier path containing a set of path commands similar to a SVG path.
     * Paths can be drawn on a context using `draw`.
     */
    interface Path {
        commands: Command[];
        fill: string;
        stroke: string;
        strokeWidth: number;

        moveTo: (x: number, y: number) => void;
        lineTo: (x: number, y: number) => void;
        curveTo: (x1: number, y1: number, x2: number, y2: number, x: number, y: number) => void;
        bezierCurveTo: (x1: number, y1: number, x2: number, y2: number, x: number, y: number) => void;
        quadTo: (x1: number, y1: number, x: number, y: number) => void;
        close: () => void;
        closePath: () => void;

        /**
         * Add the given path or list of commands to the commands of this path.
         */
        extend: (pathOrCommands: Path | Command[]) => void;

        /**
         * Draw the path to a 2D context.
         */
        draw: (ctx: CanvasRenderingContext2D) => void;

        /**
         * Convert the Path to a string of path data instructions
         * See http://www.w3.org/TR/SVG/paths.html#PathData
         * Parameters:
         * - decimalPlaces: The amount of decimal places for floating-point values (default: 2)
         */
        toPathData: (decimalPlaces: number) => string;

        /**
         * Convert the path to a SVG <path> element, as a string.
         * Parameters:
         * - decimalPlaces: The amount of decimal places for floating-point values (default: 2)
         */
        toSVG: (decimalPlaces: number) => string;
    }
}
