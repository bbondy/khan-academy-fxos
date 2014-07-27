
define(function(require) {
    var $ = require('zepto');
    var xtag = require('x-tag');
    var BasicView = require('./view');
    var ListView = require('./list');

    function initTag(tag) {
        var view = tag.view;

        if($(tag).data('first') == 'true') {
            view.parent.clearStack();
            view.open(null, 'instant');
        }
        else if(!view.parent.stackSize()) {
            view.open(null, 'instant');
        }
    }

    // Force all of the tags to be expanded at the same time
    xtag.domready = false;

    xtag.register('x-view', {
        onCreate: function() {
            this.view = new BasicView({ el: this });
            initTag(this);
        },

        getters: {
            model: function() {
                return this.view.model;
            }
        },
        setters: {
            titleField: function(name) {
                this.view.options.titleField = name;
            },
            render: function(func) {
                this.view.options.render = func;
            },
            getTitle: function(func) {
                this.view.getTitle = function(item) {
                    // It should be called with "this" as the element,
                    // not the view, since that's what it looks like
                    // from the user perspective
                    return func.call(this.el, item);
                };
            },
            model: function(model) {
                this.view.model = model;
            },
            onOpen: function(func) {
                this.view.onOpen = func;
            }
        },
        methods: {
            open: function(model, anim) {
                this.view.open(model, anim);
            },
            close: function(anim) {
                this.view.close(anim);
            }
        }
    });

    xtag.register('x-listview', {
        onCreate: function() {
            this.view = new ListView({
                el: this,
                collection: new ListView.defaultListType()
            });
            initTag(this);
        },
        getters: {
            collection: function() {
                return this.view.collection;
            }
        },
        setters: {
            titleField: function(name) {
                this.view.options.titleField = name;
            },
            renderRow: function(func) {
                this.view.options.renderRow = func;
            },
            nextView: function(sel) {
                this.view.options.nextView = sel;
            },
            collection: function(col) {
                this.view.collection = col;
            },
            onOpen: function(func) {
                this.view.onOpen = func;
            }
        },
        methods: {
            add: function(item) {
                this.view.collection.add(item);
            },
            open: function(model, anim) {
                this.view.open(model, anim);
            },
            close: function(anim) {
                this.view.close(anim);
            }
        }
    });

    // Force all the tags to be expanded at the same time (hack)
    xtag.domready = true;
    xtag.query(document, xtag.tagList).forEach(function(element){
        if(xtag.tagCheck(element)){
            xtag.extendElement(element);
            if(document.documentElement.contains(element)){
                xtag.getOptions(element).onInsert.call(element);
            } 
        }
    });

    window.onresize = function() {
        var els = 'x-view, x-listview';
        $(els).each(function() {
            this.view.onResize();
        });
    };

    return {
        BasicView: BasicView,
        ListView: ListView
    };
});
