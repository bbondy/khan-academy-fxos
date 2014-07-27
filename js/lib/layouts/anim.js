
define(function(require) {
    var $ = require('zepto');
    var animations = require('./css-animations');

    var zindex = 100;

    // Utility

    function vendorized(prop, val, obj) {
        obj = obj || {};
        obj['-webkit-' + prop] = val;
        obj['-moz-' + prop] = val;
        obj['-ms-' + prop] = val;
        obj['-o-' + prop] = val;
        obj[prop] = val;
        return obj;
    }

    function onAnimationEnd(node, func) {
        node = $(node);
        var props = ['animationend', 
                     'webkitAnimationEnd', 
                     'mozanimationend',
                     'MSAnimationEnd',
                     'oanimationend'];

        for(var k in props) {
            node.on(props[k], func);
        }
    }

    function onAnimationEndOnce(node, func) {
        function callback() {
            func();
            node.off(null, callback);
        }

        onAnimationEnd(node, callback);
    }

    function animateX(node, start, end, duration, bury) {
        animate(node,
                vendorized('transform', 'translateX(' + Math.floor(start) + 'px)'),
                vendorized('transform', 'translateX(' + Math.floor(end) + 'px)'),
                duration,
                bury);
    }

    function animateY(node, start, end, duration, bury) {
        animate(node,
                vendorized('transform', 'translateY(' + Math.floor(start) + 'px)'),
                vendorized('transform', 'translateY(' + Math.floor(end) + 'px)'),
                duration,
                bury);
    }

    function animate(node, start, end, duration, bury) {
        node = $(node);
        var anim = animations.create();

        anim.setKeyframe('0%', start);
        anim.setKeyframe('100%', end);

        node.css(
            vendorized('animation-duration', duration,
                vendorized('animation-name', anim.name, {
                    'z-index': zindex++
                })
            )
        );

        onAnimationEndOnce(node, function() {
            if(bury) {
                node.css({ zIndex: 0 });
            }

            animations.remove(anim);
            console.log('ending');
        });
    }

    // Animations

    function instant(srcNode, destNode) {
        $(destNode).css(vendorized('transition', 'none', {
            zIndex: zindex++
        }));
    }

    function instantOut(srcNode, destNode) {
        $(destNode).css(vendorized('transition', 'none', {
            zIndex: 0
        }));
    }

    function slideLeft(srcNode, destNode) {
        var srcW = $(srcNode).width();
        var destW = $(destNode).width();

        setTimeout(function() {
            animateX(srcNode, 0, -srcW, '500ms');
            animateX(destNode, destW, 0, '500ms');
        }, 0);
    }

    function slideLeftOut(srcNode, destNode) {
        slideLeft(destNode, srcNode);
    }

    function slideRight(srcNode, destNode) {
        var srcW = $(srcNode).width();
        var destW = $(destNode).width();

        setTimeout(function() {
            animateX(srcNode, 0, srcW, '500ms');
            animateX(destNode, -destW, 0, '500ms');
        }, 0);
    }

    function slideRightOut(srcNode, destNode) {
        slideRight(destNode, srcNode);
    }

    function slideDown(srcNode, destNode) {
        setTimeout(function() {
            animateY(destNode, -$(destNode).height(), 0, '500ms');
        }, 0);
    }

    function slideDownOut(srcNode, destNode) {
        setTimeout(function() {
            animateY(destNode, 0, $(destNode).height(), '500ms', true);
        }, 0);
    }

    function slideUp(srcNode, destNode) {
        setTimeout(function() {
            animateY(destNode, $(destNode).height(), 0, '500ms');
        }, 0);
    }

    function slideUpOut(srcNode, destNode) {
        setTimeout(function() {
            animateY(destNode, 0, -$(destNode).height(), '500ms', true);
        }, 0);
    }

    function flip(srcNode, destNode) {
        var bg = $('<div class="anim-background"></div>');
        bg.css({ zIndex: zindex++ });
        bg.insertBefore(destNode);

        setTimeout(function() {
            animate(srcNode,
                    vendorized('transform', 'rotate3d(0, 1, 0, 0deg)'),
                    vendorized('transform', 'rotate3d(0, 1, 0, 180deg)'),
                    '1s');

            animate(destNode,
                    vendorized('transform', 'rotate3d(0, 1, 0, 180deg)'),
                    vendorized('transform', 'rotate3d(0, 1, 0, 0deg)'),
                    '1s');
        }, 0);

        onAnimationEndOnce(destNode, function() {
            bg.remove();
        });
    }

    function flipOut(srcNode, destNode) {
        flip(destNode, srcNode);
    }

    return {
        instant: instant,
        instantOut: instantOut,
        slideLeft: slideLeft,
        slideLeftOut: slideLeftOut,
        slideRight: slideRight,
        slideRightOut: slideRightOut,
        slideDown: slideDown,
        slideDownOut: slideDownOut,
        slideUp: slideUp,
        slideUpOut: slideUpOut,
        flip: flip,
        flipOut: flipOut,

        onAnimationEnd: onAnimationEnd,
        onAnimationEndOnce: onAnimationEndOnce
    };
});