
define(function(require) {
    var $ = require('zepto');
    var _ = require('underscore');
    var Backbone = require('backbone');
    var anims = require('./anim');
    var BasicView = require('./view');

    var Item = Backbone.Model.extend({});
    var ItemList = Backbone.Collection.extend({
        model: Item
    });

    var ListView = BasicView.extend({
        initialize: function() {
            this.initView();

            this.collection.bind('add', _.bind(this.appendItem, this));
            this.collection.bind('reset', _.bind(this.render, this));

            // We unhighlight things at animation end because it's
            // better visually to keep things highlighted during the
            // when the view is going away
            var el = this.el;
            anims.onAnimationEnd(el, function() {
                console.log('unhighlighting');
                $('ul._list > li', el).removeClass('highlighted');
            });

            $('.contents', this.el).append('<ul class="_list"></ul>');
            this.render();
        },

        render: function() {
            $('._list', this.el).html('');

            _.each(this.collection.models, function(item) {
                this.appendItem(item);
            }, this);
        },

        appendItem: function(item) {
            var row = new ListViewRow({ model: item,
                                        titleField: this.options.titleField,
                                        render: this.options.renderRow,
                                        nextView: this.options.nextView,
                                        parent: this });
            $('._list', this.el).append(row.render().el);
        }
    });

    var ListViewRow = Backbone.View.extend({
        tagName: 'li',

        events: function() {
            if('ontouchstart' in document.documentElement) {
                 return { 'touchstart': 'touchMouseStart',
                          'touchmove': 'touchMove',
                          'touchend': 'touchMouseEnd'};
            }
            else {
                return { 'mousedown': 'touchMouseStart',
                         'mouseleave': 'mouseLeave',
                         'mouseup': 'touchMouseEnd'};
            }
        },

        initialize: function() {
            this.model.on('change', _.bind(this.render, this));
        },

        touchMouseStart: function(e) {
            // TODO: generalize this
            var touch = e.changedTouches ? e.changedTouches[0] : e;
            this.touchPos = [touch.pageX, touch.pageY];

            var _this = this;
            this.highlightTimer = setTimeout(function() {
                $(_this.el).addClass('highlighted');
                _this.highlightTimer = null;
            }, 120);
        },

        mouseLeave: function(e) {
            // Only called when there is a mouse
            // involved, needed because 'mousemove' is not always
            // called on the same element like 'touchmove' is

            $(this.el).removeClass('highlighted');
            this.touchPos = null;
        },

        touchMove: function(e) {
            // Only called for touches, need to differentiate drags
            // and taps

            var touch = e.changedTouches ? e.changedTouches[0] : e;
            var dx = this.touchPos[0] - touch.pageX;
            var dy = this.touchPos[1] - touch.pageY;

            // If it travels too far outside the original point,
            // it's a drag
            if(dx >= 10 || dx <= -10 || dy >= 10 || dy <= -10) {
                if(this.highlightTimer) {
                    clearTimeout(this.highlightTimer);
                }

                $(this.el).removeClass('highlighted');
                this.touchPos = null;
            }
        },

        touchMouseEnd: function(e) {
            if(this.touchPos) {
                $(this.el).addClass('highlighted');
                this.open();
            }
        },

        render: function() {
            var model = this.model;
            var titleField = this.options.titleField || 'title';

            if(this.options.render) {
                this.options.render.call(this.el, model);
            }
            else if(model.get(titleField)) {
                this.el.innerHTML = model.get(titleField);
            }
            else {
                console.log('[ListViewRow] WARNING: item does not have ' +
                            'a "title" field, the titleField property ' +
                            'is not set, and no custom ' +
                            'render function is set');
            }

            return this;
        },

        open: function() {
            var opts = this.options;
            var sel = opts.nextView || 'x-view.detail';

            var viewElement = $(sel).get(0);

            if(viewElement) {
                viewElement.open(this.model);
            }
        }
    });

    ListView.defaultListType = ItemList;

    return ListView;
});