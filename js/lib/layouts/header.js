
define(function(require) {
    var $ = require('zepto');

    var clickEvent = ('ontouchstart' in document.documentElement ?
                      'touchstart' :
                      'click');

    function Header(parent) {
        this.parent = parent;

        var el = $(parent.el).children('header');

        // Wrap the items left and right of the `h1` title
        var h1 = $('h1', el);
        var els = el.children();
        var i = els.get().indexOf(h1.get(0));
        var wrapper = '<div class="navitems"></div>';

        // Position the h1 (not done in css because we don't want a
        // "pop" when the page loads)
        h1.css({
            position: 'absolute',
            top: 0,
            left: 0
        });

        // Yuck, the following is ugly. TODO: figure out a
        // cleaner/dryer way to do this.
        var left = els.slice(0, i);
        var leftWrapper = $(wrapper).addClass('left');
        if(left.length) {
            left.wrapAll(leftWrapper);
        }
        else {
            el.prepend(leftWrapper);
        }
            
        var right = els.slice(i+1, els.length);
        var rightWrapper = $(wrapper).addClass('right');
        if(right.length) {
            right.wrapAll(rightWrapper);
        }
        else {
            el.append(rightWrapper);
        }

        el.find('button').on(clickEvent, function() {
            var btn = $(this);

            if(btn.data('view')) {
                var view = $(btn.data('view')).get(0);
                view.open(parent.model, btn.data('animation'));
            }
        });

        this.text = $(h1).text();
        this.el = el.get(0);
    }

    Header.prototype.addBack = function() {
        var nav = $('.navitems.left', this.el);
        var _this = this;

        if(!nav.children().length) {
            var back = $('<button class="back">Back</button>');
            nav.append(back);

            back.on(clickEvent, function() {
                _this.parent.close();
            });
        }
    };

    Header.prototype.removeBack = function() {
        $('.navitems.left button.back', this.el).remove();
    };

    Header.prototype.setTitle = function(text) {
        this.text = text;

        var el = $(this.el);
        var title  = el.children('h1');

        var leftSize = el.children('.navitems.left').width();
        var rightSize = el.children('.navitems.right').width();
        var margin = Math.max(leftSize, rightSize);
        var width = el.width() - margin*2;

        // DYNAMIC FONT SIZES: Turn off for now.
        // 
        // var fontSize;
        // if(text.length <= 5) {
        //     fontSize = 20;
        // }
        // else if(text.length >= 25) {
        //     fontSize = 11;
        // }
        // else {
        //     var l = text.length - 5;
        //     var i = 1 - l / 20;

        //     fontSize = 11 + (20 - 11) * i;
        // }

        if(text.length > 14) {
            text = text.slice(0, 11) + '...';
        }

        title.text(text);
        title.css({ left: margin,
                    width: width,
                    fontSize: '20pt' });
    };

    Header.prototype.getTitle = function() {
        return this.text;
    };

    return Header;
});