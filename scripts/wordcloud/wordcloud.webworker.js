importScripts('../helper.js');
importScripts('../obb.js');
importScripts('../quadtree.js');

var rotationMode = 0;
var sizeW = 1600;
var sizeH = 1200;
var numSpiralRevolutions = 160;
var maxTheta = numSpiralRevolutions * (2 * Math.PI);
var delta = sizeW / (2 * maxTheta);
var chord = 1;
var t = chord / delta;
var masks = [];
var items = [];
var currentMask;
var collisionTree = OBBQuadtree(obb({ x: sizeW / 2, y: sizeH / 2 }, sizeW, sizeH, 0.0));

function hitTest(shape, collection) {
    collection = collisionTree.query(shape);
    for (var i = 0; i < collection.length; i++) {
        if (obb.hitTest(shape, collection[i])) {
            return true;
        }
    }
    return false;
}

function spiral(t) {
    var ox = sizeW / 2;
    var oy = sizeH / 2;

    var r = delta * t;

    return { x: ox + Math.cos(t) * r, y: oy + Math.sin(t) * r };
}

function fitCollisionShape(collisionShape) {
    var travelled = 0;
    while (travelled < maxTheta) {
        if (t > maxTheta)
            t = chord / delta;
        var p = spiral(t);
        if (canvasBoundaryTest(p, sizeW, sizeH)) {
            collisionShape.setPosition(p);
            if (rotationMode > 1)
                collisionShape.setRotation(degToRad(randomRotation()));
//            for (var i = 0; i < 2; i++) {
                //collisionShape.setRotation(-Math.PI / 2 + (Math.PI / 2) * i);
                collisionShape.update();
                if (boundaryTest(collisionShape, masks[currentMask]) && !hitTest(collisionShape, items)) {
                    return true;
                }
//            }
        }
        t += chord / (delta * t);
        travelled += chord / (delta * t);
    }
    return false;
}

self.onmessage = function (e) {
    if (!e.data) {
        return;
    }
    
    if (e.data.action == 'addMask') {
        masks.push(e.data.data);
        self.postMessage({ action: 'return', pid: e.data.pid, data: false });
    }
    else if (e.data.action == 'setRotation') {
        rotationMode = e.data.data;
        self.postMessage({ action: 'return', pid: e.data.pid, data: false });
    }
    else if (e.data.action == 'setSize') {
        sizeW = e.data.data.w;
        sizeH = e.data.data.h;
        self.postMessage({ action: 'return', pid: e.data.pid, data: false });
    }
    else if (e.data.action == 'chooseMask') {
        currentMask = e.data.data;
        self.postMessage({ action: 'return', pid: e.data.pid, data: false });
    }
    else if (e.data.action == 'insertShape') {
        var o = obb(e.data.data.position, e.data.data.w, e.data.data.h, e.data.data.rotation);
        items[e.data.id] = o;
        collisionTree.insert(e.data.id, o);
        self.postMessage({ action: 'return', pid: e.data.pid, data: false });
    }
    else if (e.data.action == 'removeShape') {
        items[e.data.id] = undefined;
        t = chord / delta;
        collisionTree.remove(e.data.id);
        self.postMessage({ action: 'return', pid: e.data.pid, data: false });
    }
    else if (e.data.action == 'clearShapes') {
        items = [];
        t = chord / delta;
        self.postMessage({ action: 'return', pid: e.data.pid, data: false });
    }
    else if (e.data.action == 'fitCollisionShape') {
        var data = obb(e.data.data.position, e.data.data.w, e.data.data.h, e.data.data.rotation);
        var result = fitCollisionShape(data);
        if (result)
            self.postMessage({ action: 'return', pid: e.data.pid, data: { position: data.position, w: data.w, h: data.h, rotation: data.rotation } });
        else {
            self.postMessage({ action: 'return', pid: e.data.pid, data: false });
        }
    }
};