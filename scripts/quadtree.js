var OBBQuadtree = function (bounds) {
    var children = [];
    var bbs = {};

    var split = function () {
        var w = bounds.w / 2;
        var h = bounds.h / 2;
        for (var j = 0; j < 2; j++) {
            for (var i = 0; i < 2; i++) {
                var dx = w * i - (w / 2);
                var dy = h * j - (h / 2);
                children.push(OBBQuadtree(obb({ x: bounds.position.x + dx, y: bounds.position.y + dy }, w, h, 0.0)));
            }
        }
    }

    return {
        bounds: bounds,
        insert: function (id, bb, curDepth) {
            curDepth = curDepth || 0;

            if (!obb.hitTest(bounds, bb))
                return;

            if (children.length == 0 && curDepth <= OBBQuadtree.MaxDepth)
                split();

            var child = 0;
            var intersections = 0;

            for (var i = 0; i < children.length; i++) {
                if (obb.hitTest(children[i].bounds, bb)) {
                    child = i;
                    intersections++;
                }
            }

            if (intersections == 1) {
                children[child].insert(id, bb, curDepth + 1);
                return;
            }

            bbs[id] = bb;
        },
        remove: function (k) {
            if (k in bbs) {
                delete bbs[k];
                return;
            }
            for (var i = 0; i < children.length; i++) {
                children[i].remove(k);
            }
        },
        query: function (bb) {
            var results = [];
            if (!obb.hitTest(bounds, bb))
                return results;
            for (var k in bbs) {
                results.push(bbs[k]);
            }
            for (var i = 0; i < children.length; i++) {
                results.push.apply(results, children[i].query(bb));
            }
            return results;
        },
        render: function (g) {
            for (var i = 0; i < children.length; i++) {
                children[i].render(g);
            }
            for (k in bbs) {
                obb.render(g, bbs[k]);
            }
            obb.render(g, bounds);
        }
    };
};
OBBQuadtree.MaxDepth = 5;