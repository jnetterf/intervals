import "./globals";

/* tslint:disable */
import React = require("react");
/* tslint:enable */

import {render} from "react-dom";
import {Router, Route, Redirect} from "react-router";
import {Provider} from "react-redux";
const createBrowserHistory = require("history/lib/createBrowserHistory");

import Store from "./data/store";

import Chrome from "./views/chrome";
import Home from "./views/home";
import About from "./views/about";

(function main() {
    let history = createBrowserHistory();

    render(<Provider store={Store}>
        <Router history={history}>
            <Route component={Chrome}>
                <Route path="/" component={Home} />
                <Route path="/about" component={About} />
            </Route>
        </Router>
    </Provider>, document.getElementById("root"));
}());

