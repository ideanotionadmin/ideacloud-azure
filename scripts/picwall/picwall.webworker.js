importScripts('../helper.js');
importScripts('../obb.js');
importScripts('../quadtree.js');

var sizeW = 1600;
var sizeH = 1200;
var sizeI = 260;

var numSpiralRevolutions = 200;
var maxTheta = numSpiralRevolutions * (2 * Math.PI);
var delta = sizeW / (2 * maxTheta);
var chord = 1;
var t = chord / delta;

var masks = [];
var items = [];
var currentMask;
var grids = [];
var maxX = Math.ceil(sizeW / sizeI);
var maxY = Math.ceil(sizeH / sizeI);
var offsetX = (sizeW % sizeI);
var offsetY = (sizeH % sizeI);


(function () {
    for (var i = 0; i < maxX; i++) {
        grids[i] = [];
        for (var j = 0; j < maxY; j++) {
            grids[i][j] = null;
        }
    }
})();

function getNextDir(x, y, dx, dy) {
    if (dx != 0 && dy != 0 && Math.random() > 1.5) {
        return { dx: dx, dy: dy };
    }
    else {
        if (x == Math.round(maxX / 2) - 1) {
            if (Math.random() > 0.5) {
                dx = 1;
            } else {
                dx = -1;
            }
        }
        else {
            if (x < Math.round(maxX / 2) - 1) {
                dx = -1;
            } else {
                dx = 1;
            }
        }
        if (y == Math.round(maxY / 2) - 1) {
            if (Math.random() > 0.5) {
                dy = 1;
            } else {
                dy = -1;
            }
        }
        else {
            if (y < Math.round(maxY / 2) - 1) {
                dy = -1;
            } else {
                dy = 1;
            }
        }
        if (Math.random() > 0.4) {
            return { dx: dx, dy: 0 };
        } else {
            return { dx: 0, dy: dy };
        }
    }

}

function moveTile(id, x, y, dx, dy) {
    if (x < 0 || y < 0 || x >= maxX || y >= maxY) {
        return [{ id: id, x: -1, y: -1 }];
    }

    if (!grids[x][y]) {
        grids[x][y] = id;
        return [{ id: id, x: x * sizeI + offsetX, y: y * sizeI + offsetY }];
    }
    else {
        var c = getNextDir(x, y, dx, dy);

        var cx = x + c.dx;
        var cy = y + c.dy;

        var moves = moveTile(grids[x][y], cx, cy, c.dx, c.dy);
        grids[x][y] = id;
        moves.push({ id: id, x: x * sizeI + offsetX, y: y * sizeI + offsetY });

        return moves;
    }
}

function insertShape(id) {
    var sx = Math.round(maxX / 2 - 1);
    var sy = Math.round(maxY / 2 - 1);
    var moves = moveTile(id, sx, sy, 0, 0);
    return moves;
}

self.onmessage = function (e) {
    if (!e.data) {
        return;
    }

    if (e.data.action == 'addMask') {
        //masks.push(e.data.data);
        self.postMessage({ action: 'return', pid: e.data.pid, data: false });
    }
    else if (e.data.action == 'setRotation') {
        rotationMode = e.data.data;
        self.postMessage({ action: 'return', pid: e.data.pid, data: false });
    }
    else if (e.data.action == 'setSize') {
        sizeW = e.data.data.w;
        sizeH = e.data.data.h;
        sizeI = e.data.data.i;
        self.postMessage({ action: 'return', pid: e.data.pid, data: false });
    }
    else if (e.data.action == 'chooseMask') {
        currentMask = e.data.data;
        self.postMessage({ action: 'return', pid: e.data.pid, data: false });
    }
    else if (e.data.action == 'insertShape') {
        var results = insertShape(e.data.id);
        self.postMessage({ action: 'return', pid: e.data.pid, data: results });
    }
    else if (e.data.action == 'removeShape') {
        items[e.data.id] = undefined;
        t = chord / delta;
        self.postMessage({ action: 'return', pid: e.data.pid, data: false });
    }
    else if (e.data.action == 'clearShapes') {
        items = [];
        t = chord / delta;
        self.postMessage({ action: 'return', pid: e.data.pid, data: false });
    }
};