/// <reference path="github-electron/github-electron.d.ts" />
/// <reference path="github-electron/github-electron-renderer.d.ts" />
/// <reference path="node/node.d.ts" />
/// <reference path="react/react.d.ts" />
/// <reference path="react/react-dom.d.ts" />
/// <reference path="react-bootstrap/react-bootstrap.d.ts" />
/// <reference path="lodash/lodash.d.ts" />
/// <reference path="chai/chai.d.ts" />
/// <reference path="mocha/mocha.d.ts" />
/// <reference path="jsdom/jsdom.d.ts" />
/// <reference path="webmidi/webmidi.d.ts" />
/// <reference path="es6-promise/es6-promise.d.ts" />
declare module 'react/lib/invariant' {
    function invariant(condition: boolean, format: string, ...params: any[]): void;
    export = invariant;
}
