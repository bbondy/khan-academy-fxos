import _ from "underscore";
import React from "react";
import { writeOptions } from "./data/app-options";

/**
 * Renderer used to manage state updates and render the root component.
 * This is used so that we can avoid cursors.
 * The problem with cursors is that they can be read and written to, so it's
 * not obvious whether they should be passed to Omniscient statics or not.
 */

export class ComponentRenderer {
    constructor(component, target, state) {
        this.component = component;
        this.target = target;
        this.state = state;
        this.edit = this.edit.bind(this);
        this.render = this.render.bind(this);
        this.lastOptions = this.state.get("options");
    }

    /**
     * Function used to update the state
     * @param updateStateFn The function to call to update state for this
     *                      root component.
     */
    edit(updateStateFn) {
        this.state = updateStateFn(this.state);
        if (this.lastOptions !== this.state.get("options")) {
            this.lastOptions = this.state.get("options");
            writeOptions(this.state.get("options"));
        }
        this.render();
        return this.state;
    }

    render() {
        React.render(<this.component options={this.state.get("options")}
            navInfo={this.state.get("navInfo")}
            user={this.state.get("user")}
            tempStore={this.state.get("tempStore")}
            statics={{
                edit: this.edit
            }}/>, this.target);
    }
}

export const In = (path) => (edit) => (state) => state.updateIn(path, edit);
export const editorForPath = (edit, path) => _.compose(edit, In(_.isString(path) ? [path] : path));
