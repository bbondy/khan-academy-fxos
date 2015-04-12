var _ = require("underscore");

/**
 * Renderer used to manage state updates and render the root component.
 * This is used so that we can avoid cursors.
 * The problem with cursors is that they can be read and written to, so it's
 * not obvious whether they should be passed to Omniscient statics or not.
 */

class Renderer {
    constructor(component, target, state) {
        this.component = component;
        this.target = target;
        this.state = state;
        this.edit = this.edit.bind(this);
        this.render = this.render.bind(this);
    }

    /**
     * Function used to update the state
     * @param updateStateFn The function to call to update state for this
     *                      root component.
     */
    edit(updateStateFn) {
        this.state = updateStateFn(this.state);
        this.render();
        return this.state;
    }

    render() {
        React.render(<this.component options={this.state.get("options")}
            navInfo={this.state.get("navInfo")}
            tempStore={this.state.get("tempStore")}
            statics={{
                edit: this.edit
            }}/>, this.target);
    }
}

const In = (path) => (edit) => (state) => state.updateIn(path, edit);
const editorForPath = (edit, path) => _.compose(edit, In(_.isString(path) ? [path] : path));

module.exports = {
    Renderer,
    editorForPath,
    In,
};
