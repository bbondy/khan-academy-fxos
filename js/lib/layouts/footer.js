
define(function(require) {
    var $ = require('zepto');

    var clickEvent = ('ontouchstart' in document.documentElement ?
                      'touchstart' :
                      'click');

    function Footer(parent) {
        this.parent = parent;

        var el = $(parent.el).children('footer');
        var _this = this;

        // Add click handlers to each button
        $('button', el).each(function() {
            var btn = $(this);

            // If it has a `data-view` attribute, call `openView` with
            // the value when pressed
            var view = btn.data('view');
            if(view) {
                btn.on(clickEvent, function() {
                    _this.openView(view,
                                   btn.data('push') == 'true',
                                   btn.data('animation'));
                });
            }
        });

        this.el = el.get(0);
    }

    Footer.prototype.openView = function(viewSelector, forcePush, anim) {
        var viewDOM = $(viewSelector).get(0);

        if(viewDOM) {
            var view = viewDOM.view;
            var parentDOM = view.parent && view.parent.el;

            // If the target view is going to cover up this view, we
            // want to push it on the stack. Otherwise, simply open it.
            // Also, if there is no parent, push it onto the global stack.
            if(!view.parent.manualLayout) {
                if(forcePush || !parentDOM ||
                   (parentDOM.contains(this.parent.el) &&
                    parentDOM != this.parent.el)) {
                    view.open(null, anim);
                }
                else {
                    view.openAlone();                            
                }
            }
        }
    };

    return Footer;
});
