function randomRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    var count = 0;
    while (count == 0 || count == 3) {
        color = '#';
        count = 0;
        for (var i = 0; i < 3; i++) {
            var r = randomRange(0, letters.length - 1);
            var digit = letters[r];
            color += digit;
            color += digit;
            if (r < 4)
                count++;
        }
    }
    return color;
}

function randomRotation(rotationMode) {
    var rotation;
    var p = Math.random();

    if (rotationMode == 0)
        return 0;
    else if (rotationMode == 1) {
        if (p > 0.66) {
            rotation = 90;
        } else if (p > 0.33) {
            rotation = 0;
        } else {
            rotation = -90;
        }
        return rotation;
    }
    else {
        if (p > 0.80) {
            rotation = 90;
        } else if (p > 0.60) {
            rotation = 45;
        } else if (p > 0.40) {
            rotation = 0;
        } else if (p > 0.20) {
            rotation = -45;
        } else {
            rotation = -90;
        }
        return rotation;
    }
}


function degToRad(deg) {
    return deg * (Math.PI / 180);
}

function radToDeg(rad) {
    return rad * (180 / Math.PI);
}

function getTintedColor(color, v) {
    if (color.length > 6) {
        color = color.substring(1, color.length);
    }
    var rgb = parseInt(color, 16);
    var r = Math.abs(((rgb >> 16) & 0xFF) + v);
    if (r > 255) r = r - (r - 255);
    var g = Math.abs(((rgb >> 8) & 0xFF) + v);
    if (g > 255) g = g - (g - 255);
    var b = Math.abs((rgb & 0xFF) + v);
    if (b > 255) b = b - (b - 255);
    r = Number(r < 0 || isNaN(r)) ? 0 : ((r > 255) ? 255 : r).toString(16);
    if (r.length == 1) r = '0' + r;
    g = Number(g < 0 || isNaN(g)) ? 0 : ((g > 255) ? 255 : g).toString(16);
    if (g.length == 1) g = '0' + g;
    b = Number(b < 0 || isNaN(b)) ? 0 : ((b > 255) ? 255 : b).toString(16);
    if (b.length == 1) b = '0' + b;
    return "#" + r + g + b;
}

function isPointInBoundary(p, m) {
    return m[Math.round(p.y) * sizeW + Math.round(p.x)];
}

function boundaryTest(s, m) {
    var corner0 = isPointInBoundary(s.corners[0], m);
    var corner1 = isPointInBoundary(s.corners[1], m);
    var corner2 = isPointInBoundary(s.corners[2], m);
    var corner3 = isPointInBoundary(s.corners[3], m);
    var pos = isPointInBoundary(s.position, m);

    var count = 0;

    if (!corner0) count++;
    if (!corner1) count++;
    if (!corner2) count++;
    if (!corner3) count++;

    return pos && count <= 0;
}

function circleBoundaryTest(s) {
    var r0 = Math.sqrt(Math.pow(s.corners[0].x - sizeW / 2, 2) + Math.pow(s.corners[0].y - sizeH / 2, 2));
    var r1 = Math.sqrt(Math.pow(s.corners[1].x - sizeW / 2, 2) + Math.pow(s.corners[1].y - sizeH / 2, 2));
    var r2 = Math.sqrt(Math.pow(s.corners[2].x - sizeW / 2, 2) + Math.pow(s.corners[2].y - sizeH / 2, 2));
    var r3 = Math.sqrt(Math.pow(s.corners[3].x - sizeW / 2, 2) + Math.pow(s.corners[3].y - sizeH / 2, 2));
    var r4 = Math.sqrt(Math.pow(s.position.x - sizeW / 2, 2) + Math.pow(s.position.y - sizeH / 2, 2));
    var r = sizeH / 2.2;
    var count = 0;
    if (r0 > r) count++;
    if (r1 > r) count++;
    if (r2 > r) count++;
    if (r3 > r) count++;
    if (r4 < r && count <= 1)
        return true;
    return false;
}

function canvasBoundaryTest(p, sw, sh) {
    return p.x > 0 && p.x < sw && p.y > 0 && p.y < sh;
}

function prettyDate(time) {
    var date = time,
		diff = (((new Date()).getTime() - date.getTime()) / 1000),
		dayDiff = Math.floor(diff / 86400);

    if (isNaN(dayDiff) || dayDiff < 0 || dayDiff >= 31)
        return "";

    return dayDiff == 0 && (
			diff < 60 && "just now" ||
			diff < 120 && "1 min ago" ||
			diff < 3600 && Math.floor(diff / 60) + " min ago" ||
			diff < 7200 && "1 hour ago" ||
			diff < 86400 && Math.floor(diff / 3600) + " hours ago") ||
		dayDiff == 1 && "Yesterday" ||
		dayDiff < 7 && dayDiff + " days ago" ||
		dayDiff < 31 && Math.ceil(dayDiff / 7) + " weeks ago";
}

function cleanText(s) {
    var div = document.createElement('div');
    div.innerHTML = s.replace(/\\/g, '');
    return div.firstChild.nodeValue;
}


function fragmentText(text, maxWidth, ctx) {
    var words = text.split(' '),
        lines = [],
        line = "";
    if (ctx.measureText(text).width < maxWidth) {
        return [text];
    }
    while (words.length > 0) {
        while (ctx.measureText(words[0]).width >= maxWidth) {
            var tmp = words[0];
            words[0] = tmp.slice(0, -1);
            if (words.length > 1) {
                words[1] = tmp.slice(-1) + words[1];
            } else {
                words.push(tmp.slice(-1));
            }
        }
        if (ctx.measureText(line + words[0]).width < maxWidth) {
            line += words.shift() + " ";
        } else {
            lines.push(line);
            line = "";
        }
        if (words.length === 0) {
            lines.push(line);
        }
    }
    return lines;
}


function trace(t) {
    if ($('#output').length > 0) {
        var text = $('#output').val();
        if (text.length > 10000)
            text = text.substring(5000);

        $('#output').val(text + t);
        $('#output')[0].scrollTop = $('#output')[0].scrollHeight;
    }
    console.log(t);
}

function isAlphaOrParen(str) {
    return /^[a-zA-Z()]+$/.test(str);
}
