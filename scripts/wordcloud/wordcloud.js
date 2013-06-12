var wordCloud = function (stg, createjs, options) {
    var cjs = createjs;
    var factor = 1;
    var percision = 1; // higher = less precise
    var bg;
    var stage = stg;
    var promise = [];
    var items = [];
    var promiseCounter = 0;
    var pause = false;
    var defaultImageSize = 180;
    var defaultTweetSize = 18;
    var defaultWordSize = 30;
    var insertCount = 0;
    var idleCount = 0;
    var effectAfterNIdles = -1;
    var effectAfterNInserts = -1;
    var insertEffect = { tweet: true, word: true, image: true };
    var gotoEffect = { tweet: true, word: true, image: true };
    var useSizeAlpha = { tweet: false, word: true, image: false };
    var resetShadowAfterInsert = { tweet: true, word: false, image: true };
    var resetShadowColor = { tweet: "#999", word: "#999", image: "#999" };
    var shadowColor = { tweet: "#fff", word: "#fff", image: "#fff" };
    var fontColor = { tweet: "#fff", word: "#fff", image: "#fff" };
    var shadowSize = { tweet: 35, word: 25, image: 15 };
    var lastMax = 30;
    var sizeH = 1600;
    var sizeW = 1200;
    var removeCount = 15;
    var concurrentRemoveCount = 1;
    var rotationMode = 0;
    var speed = 1000;
    var randomizeColor = { tweet: false, word: false, image: false };
    var useCache = true;
    var effectSpeedRatio = 1;
    var preload = 0;
    var preloadComplete = null;
    var tweetFrame = false;
    
    var lastRotation = Math.PI;
    lastMax = options.defaultMaxSize;
    sizeH = options.sizeH;
    sizeW = options.sizeW;
    removeCount = options.removeCount;
    concurrentRemoveCount = options.concurrentRemoveCount;
    var osX = 1;
    var osY = 1;

    var setOptions = function (opts) {
        // opts;
        if (opts.rotationMode != undefined)
            rotationMode = opts.rotationMode;
        if (opts.speed != undefined)
            speed = opts.speed;

        if (opts.useCache != undefined)
            useCache = opts.useCache;
        if (opts.effectAfterNInserts)
            effectAfterNInserts = opts.effectAfterNInserts;
        if (opts.effectAfterNIdles)
            effectAfterNIdles = opts.effectAfterNIdles;
        if (opts.defaultTweetSize)
            defaultTweetSize = opts.defaultTweetSize;
        if (opts.defaultImageSize)
            defaultImageSize = opts.defaultImageSize;
        if (opts.defaultWordSize)
            defaultWordSize = opts.defaultWordSize;
        if (opts.resetShadowAfterInsert)
            resetShadowAfterInsert = opts.resetShadowAfterInsert;
        if (opts.insertEffect)
            insertEffect = opts.insertEffect;
        if (opts.gotoEffect)
            gotoEffect = opts.gotoEffect;
        if (opts.useSizeAlpha)
            useSizeAlpha = opts.useSizeAlpha;
        if (opts.resetShadowColor)
            resetShadowColor = opts.resetShadowColor;
        if (opts.shadowColor)
            shadowColor = opts.shadowColor;
        if (opts.shadowSize)
            shadowSize = opts.shadowSize;
        if (opts.fontColor)
            fontColor = opts.fontColor;
        if (opts.effectSpeedRatio)
            effectSpeedRatio = opts.effectSpeedRatio;
        if (opts.preload)
            preload = opts.preload;
        if (opts.preloadComplete)
            preloadComplete = opts.preloadComplete;
        if (opts.factor)
            factor = opts.factor;
        if (opts.randomizeColor)
            randomizeColor = opts.randomizeColor;
        if (opts.tweetFrame)
            tweetFrame = opts.tweetFrame;
        
        sizeW = sizeW * factor;
        sizeH = sizeH * factor;
        updateOptions();
    };

    var updateOptions = function () {
        // colors
        for (var itemIndex in items) {
            for (var i in items[itemIndex].content.children) {
                if (items[itemIndex].content.children[i].color) {
                    if (randomizeColor[items[itemIndex].type]) {
                        items[itemIndex].content.children[i].color = randomColor();
                    }
                    else {
                        items[itemIndex].content.children[i].color = fontColor[items[itemIndex].type];
                    }
                }
                if (items[itemIndex].content.children[i].shadow) {
                    items[itemIndex].content.children[i].shadow.color = items[itemIndex].content.children[i].color;
                }

                if (useCache)
                    items[itemIndex].content.updateCache();
            }
        }
    };

    setOptions(options);


    var worker = new Worker('scripts/wordcloud/wordcloud.webworker.js');
    worker.postMessage("");
    worker.onmessage = function (e) {
        if (!e.data || !e.data.pid)
            return;
        if (e.data.action == 'return') {
            promise[e.data.pid].resolve(e.data.data);
            promise[e.data.pid] = null;
        }
    };
    var w = {
        setRotation: function (d) {
            promise[promiseCounter] = new $.Deferred();
            worker.postMessage({ action: "setRotation", data: d, pid: promiseCounter });
            return promise[promiseCounter++].promise();
        },
        addMask: function (event) {
            var sw = sizeW /( factor * percision);
            var sh = sizeH / (factor * percision);
            var canvas = $("<canvas width='" + sw + "' height='" + sh + "'></canvas>");
            var ctx = canvas[0].getContext("2d");
            var image = new Image();
            image.src = event.item.src;
            var bitmap = new cjs.Bitmap(event.result);
            ctx.drawImage(bitmap.image, 0, 0, sw, sh);
            var imageData = ctx.getImageData(0, 0, sw, sh);
            var maskbits = [];
            for (var i = 0; i < imageData.data.length; i += 4) {
                maskbits.push(imageData.data[i] / 255);
            }
            
            promise[promiseCounter] = new $.Deferred();
            worker.postMessage({ action: "addMask", data: maskbits, pid: promiseCounter });
            return promise[promiseCounter++].promise();
        },
        chooseMask: function (d) {
            promise[promiseCounter] = new $.Deferred();
            worker.postMessage({ action: "chooseMask", data: d, pid: promiseCounter });
            return promise[promiseCounter++].promise();
        },
        insertShape: function (id, p) {
            promise[promiseCounter] = new $.Deferred();
            worker.postMessage({ action: "insertShape", data: { position: p.position, w: p.w, h: p.h, rotation: p.rotation }, id: id, pid: promiseCounter });
            return promise[promiseCounter++].promise();
        },
        removeShape: function (id) {
            promise[promiseCounter] = new $.Deferred();
            worker.postMessage({ action: "removeShape", id: id, pid: promiseCounter });
            return promise[promiseCounter++].promise();
        },
        clearShapes: function () {
            promise[promiseCounter] = new $.Deferred();
            worker.postMessage({ action: "clearShapes", pid: promiseCounter });
            return promise[promiseCounter++].promise();
        },
        fitCollisionShape: function (p) {
            promise[promiseCounter] = new $.Deferred();
            worker.postMessage({ action: "fitCollisionShape", data: { position: p.position, w: p.w, h: p.h, rotation: p.rotation }, pid: promiseCounter });
            return promise[promiseCounter++].promise();
        },
        setSize: function (p) {
            promise[promiseCounter] = new $.Deferred();
            worker.postMessage({ action: "setSize", data: { w: p.w, h: p.h, f: p.f }, pid: promiseCounter });
            return promise[promiseCounter++].promise();
        },
    };
    w.setSize({ w: sizeW, h: sizeH, f: factor * percision });
    w.setRotation(rotationMode);

    var effFly = function (item, defer) {
        var content = item.content;
        var tween = cjs.Tween.get(item.content);

        var flyinDistance = Math.random() * sizeW / 16;
        var flyinAngle = Math.random() * Math.PI * 2;

        content.x = item.collisionShape.position.x + Math.sin(flyinAngle) * flyinDistance;
        content.y = item.collisionShape.position.y + Math.cos(flyinAngle) * flyinDistance;
        tween.to({ alpha: 1, x: item.collisionShape.position.x, y: item.collisionShape.position.y }, 1200 * effectSpeedRatio, cjs.Ease.cubicOut).wait(2000 * effectSpeedRatio).call(function () {
            defer.resolve();
        });
    };
    var effFade = function (item, defer) {
        var content = item.content;
        var tween = cjs.Tween.get(content);
        var osx = item.content.scaleX;
        var osy = item.content.scaleY;
        tween.scaleX = 1.2 * osx;
        tween.scaleY = 1.2 * osy;
        tween.to({ alpha: 1, scaleX: osx, scaleY: osy, x: item.collisionShape.position.x, y: item.collisionShape.position.y }, 1200 * effectSpeedRatio, cjs.Ease.cubicOut).call(function () {
            defer.resolve();
        });
    };
    var effGrow = function (item, defer) {
        var content = item.content;
        var tween = cjs.Tween.get(content);
        var osx = item.content.scaleX;
        var osy = item.content.scaleY;
        tween.alpha = 1;
        item.content.scaleX = 0.5 * osx;
        item.content.scaleY = 0.5 * osy;
        tween.to({ alpha: 1, scaleX: osx, scaleY: osy, x: item.collisionShape.position.x, y: item.collisionShape.position.y }, 2000 * effectSpeedRatio, cjs.Ease.backInOut).call(function () {
            defer.resolve();
        });
    };
    var effGoto = function (item, defer, gotoEff, insertEff) {
        var content = item.content;
        var effects = [];
        if (insertEff) {
            effects.push(effFade);
            effects.push(effFly);
            effects.push(effGrow);
        }
        pause = true;

        var s = cjs.Tween.get(stage);

        var sX = (sizeW / factor) / 2 + randomRange(-10, 10);
        var sY = (sizeH / factor) / 2 + randomRange(-10, 10);
        var p = Math.random() * 0;
        if (gotoEff) {
            s.to({ regX: item.collisionShape.position.x, regY: item.collisionShape.position.y, x: sX, y: sY, scaleX: 1, scaleY: 1, rotation: -content.rotation }, 4000 * effectSpeedRatio, cjs.Ease.backOut).call(function () {
                //s.to({ regX: (sizeW) / 2, regY: (sizeH) / 2, x: (sizeW/factor) / 2, y: (sizeH/factor) / 2, scaleX: 1, scaleY: 1, rotation: 0 }, 4000 * effectSpeedRatio, cjs.Ease.backOut).call(function () {
                var d = new $.Deferred();
                if (effects.length > 0)
                    effects[randomRange(0, effects.length - 1)](item, d);
            }).wait(6000 * effectSpeedRatio).call(function () {
                pause = false;
                defer.resolve();
            });
        }
        else {
            s.to({ regX: sizeW / 2, regY: sizeH / 2, x: (sizeW / factor) / 2, y: (sizeH / factor) / 2, scaleX: 1 / factor, scaleY: 1 / factor, rotation: 0 });
                
            if (effects.length > 0) {
                var d = new $.Deferred();
                effects[randomRange(0, effects.length - 1)](item, d);
                $.when(d).done(function () {
                    pause = false;
                    defer.resolve();
                });

            } else {
                pause = false;
                defer.resolve();
            }
        }
    };
    var effZoomOut = function (defer) {
        var s = cjs.Tween.get(stage);
        pause = true;
        s.to({ regX: sizeW / 2, regY: sizeH / 2, x: (sizeW / factor) / 2, y: (sizeH / factor) / 2, scaleX: 1 / factor * 0.8, scaleY: 1 / factor * 0.8, rotation: 0 }, 3000 * effectSpeedRatio, cjs.Ease.backInOut)
            .wait(4000 * effectSpeedRatio).call(function () {
                pause = false;
                defer.resolve();
            });
    };
    var effZoomInOut = function (defer) {
        var s = cjs.Tween.get(stage);
        if (items.length == 0) {
            defer.resolve();
            return;
        }
        var sX = (sizeW / factor) / 2;
        var sY = (sizeH / factor) / 2;
        var item = items[randomRange(0, items.length - 1)];

        for (var i in item.content.children) {
            item.content.children[i].color = fontColor[item.type];
            item.content.children[i].shadow = new cjs.Shadow(shadowColor[item.type], 2, 2, shadowSize[item.type]);
            if (useCache)
                item.content.updateCache();
        }

        pause = true;
        s.to({ regX: item.collisionShape.position.x, regY: item.collisionShape.position.y, x: sX, y: sY, scaleX: 1, scaleY: 1, rotation: -item.content.rotation }, 4000 * effectSpeedRatio, cjs.Ease.backInOut)
            .wait(8000 * effectSpeedRatio).to({ regX: sizeW / 2, regY: sizeH / 2, x: sizeW / factor / 2, y: sizeH / factor / 2, scaleX: 1 / factor * 0.8, scaleY: 1 / factor * 0.8, rotation: 0 }, 4000 * effectSpeedRatio, cjs.Ease.backInOut)
            .wait(6000 * effectSpeedRatio).call(function () {
                pause = false;
                defer.resolve();

                for (var i in item.content.children) {
                    if (item.content.children[i].color) {
                        item.content.children[i].color = resetShadowColor[items[itemIndex].type];
                    }
                    if (item.content.children[i].shadow)
                        item.content.children[i].shadow = null;
                    if (useCache)
                        item.content.updateCache();
                }
            });
    };
    var resetShadow = function () {
        for (var itemIndex in items) {
            if (resetShadowAfterInsert[items[itemIndex].type]) {
                for (var i in items[itemIndex].content.children) {
                    if (items[itemIndex].content.children[i].color) {
                        items[itemIndex].content.children[i].color = resetShadowColor[items[itemIndex].type];
                    }
                    if (items[itemIndex].content.children[i].shadow)
                        items[itemIndex].content.children[i].shadow = null;
                    if (useCache)
                        items[itemIndex].content.updateCache();
                }
            }
        }
    };
    var getAlpha = function (s) {
        if (s.promoted)
            return 0.7;

        if (s.size > lastMax) {
            s.size = lastMax;
        }

        var alpha = 0.10 + (s.size / lastMax) * 0.50;
        return alpha;
    };

    var instance = {
        terminate: function () {
            instance.stop = true;
            while (items.length > 0) {
                var i = items.pop();
                stage.removeChild(i.content);
                w.removeShape(i.id);
            }
            while (instance.dataSource.length > 0) {
                instance.dataSource.pop();
            }
            if (bg)
                stage.removeChild(bg);
            return;
        },
        stop: false,
        globalPause: false,
        dataSource: [],
        run: function (callback) {
            if (pause) {
                callback();
                return;
            }

            if (instance.globalPause) {
                callback();
                return;
            }

            if (instance.stop) {
                // todo: cleanup
                while (items.length > 0) {
                    var i = items.pop();
                    stage.removeChild(i.content);
                    w.removeShape(i.id);
                }
                if (bg)
                    stage.removeChild(bg);
                return;
            }


            if (effectAfterNInserts > 0 && insertCount > effectAfterNInserts) {
                idleCount = 0;
                insertCount = 0;
                idleCount++;
                var defer = new $.Deferred();
                effZoomOut(defer);
                $.when(defer).done(function () {
                    callback();
                });
                return;
            }
            if (instance.dataSource.length > 0) {
                var data = instance.dataSource.shift();

                var item = instance.createItem(data);
                item.type = data.type;

                for (var i in items) {

                    /**** HACK to skip duplicated words ****/
                    if (items[i].type == "word" && item.type == "word" && items[i].content.children[0].text.toLowerCase() == item.content.children[0].text.toLowerCase()) {
                        instance.run(callback);
                        return;
                    }

                    if (items[i].id == item.id) {
                        if (item.size == 0) {
                            $.when(w.removeShape(item.id)).done(function () {
                                stage.removeChild(items[i].content);
                                items.splice(i, 1);
                            });
                        } else {
                            items[i].content.promoted = item.promoted;
                        }

                        instance.run(callback);
                        return;
                    }
                }
                $.when(instance.postItem(item, worker)).then(function () {

                    setTimeout(callback, speed);
                }, function () {
                    trace("clean up");
                    $.when(instance.cleanUpStage(worker)).done(function () {
                        instance.run(callback);
                    });
                }, function () {
                });
                idleCount = 0;
                insertCount++;

                return;
            }
            if (idleCount < 0) {
                insertCount = 0;
                var defer = new $.Deferred();
                resetShadow();
                effZoomInOut(defer);
                $.when(defer).done(function () {
                    callback();
                });
                return;
            }
            if (effectAfterNIdles > 0 && idleCount > effectAfterNIdles) {
                insertCount = 0;
                idleCount = -1;
                var defer = new $.Deferred();
                effZoomOut(defer);
                $.when(defer).done(function () {
                    callback();
                });
                return;
            }

            //idle
            idleCount++;
            callback();
        },
        createItem: function (data) {
            var item = { content: null, collisionShape: null, promoted: data.promoted, id: data.id, size: data.size, type: data.type };
            // if NaN default to 40

            if (isNaN(data.size))
                data.size = 1;

            if (data.promoted) {
                item.priority = 1;
                data.size *= 1.5;
            }

            var f = sizeW / 1600;
            var w, h, ctx, randColor, text, fontStyle, textObject, imgData;
            if (data.type == "image") {
                item.content = new cjs.Container();
                var bitmap = new cjs.Bitmap(data.image);
                bitmap.shadow = new cjs.Shadow(shadowColor.image, 2, 2, shadowSize.image);
                item.content.addChild(bitmap);
                item.content.snapToPixel = true;

                w = data.image.width;
                h = data.image.height;
                var imageSize = defaultImageSize * 2;
                var margin = imageSize / 40;
                //imageSize *= f;
                var s = imageSize / Math.max(w, h);

                bitmap.scaleX = s;
                bitmap.scaleY = s;

                var imageColor = fontColor.image;
                var authorBitmap = new cjs.Bitmap(data.authorImage);
                if (randomizeColor.image) {
                    imageColor = randomColor();
                }

                textObject = new cjs.Text("@" + data.authorName + ", " + prettyDate(data.dateTime), imageSize / 22 + "px 'Kavoon'", imageColor);
                var lineh = textObject.getMeasuredHeight();

                item.content.addChild(authorBitmap);
                item.content.addChild(textObject);
                textObject.y = h * s + 2 * margin;
                textObject.x = imageSize / 8 + 1 * margin;
                authorBitmap.y = h * s + margin;
                authorBitmap.x = 0;
                var sAuthor = imageSize / 8 / Math.min(250, Math.max(data.aimage.width, data.aimage.width));
                authorBitmap.scaleX = sAuthor;
                authorBitmap.scaleY = sAuthor;

                w = w * s;
                h = h * s + lineh + 3 * margin;

                item.content.regX = w / 2;
                item.content.regY = h / 2;
                if (debug) {
                    var g = new cjs.Graphics();
                    if (item.promoted)
                        g.beginStroke(cjs.Graphics.getRGB(255, 0, 0));
                    else
                        g.beginStroke(cjs.Graphics.getRGB(255, 200, 200));

                    g.drawRect(-margin, -margin, w + 2 * margin, h + 2 * margin);
                    var shape = new cjs.Shape(g);
                    item.content.addChild(shape);
                }

                item.content.rotation = 0;
                if (useCache)
                    item.content.cache(-w, -h, w * 2, h * 3);

                item.collisionShape = obb({ x: -margin, y: -margin }, w + margin * 2, h + margin * 2, degToRad(item.content.rotation));

                item.tween = cjs.Tween.get(item.content);
            } else if (data.type == "tweet") {
                var ctx = $("<canvas width='" + sizeW + "' height='" + sizeH + "'></canvas>")[0].getContext("2d");

                text = data.content;
                text = '"' + text + '"';
                var tweetFontSize = defaultTweetSize;
                //tweetFontSize *= f;
                var margin = tweetFontSize / 6;
                fontStyle = tweetFontSize + "px '" + "Arial" + "'";

                var lines = fragmentText(text, tweetFontSize * 7, ctx);
                var textObjects = [];
                var authorBitmap = new cjs.Bitmap(data.authorImage);

                //var lineh;
                var linew = 0;
                w = 0;
                for (var i in lines) {
                    textObjects[i] = new cjs.Text(lines[i], fontStyle, fontColor.tweet);
                    linew = textObjects[i].getMeasuredWidth();
                    if (linew > w)
                        w = linew;
                }
                
                var tweetColor = fontColor.tweet;
                var tweetShadowColor = shadowColor.tweet;
                if (randomizeColor.tweet) {
                    tweetColor = randomColor();
                    tweetShadowColor = tweetColor;
                }
                textObjects[lines.length] = new cjs.Text("@" + data.authorName + ", " + prettyDate(data.dateTime), tweetFontSize / 1.8 + "px 'Kavoon'", tweetColor);

                var lineh = textObjects[0].getMeasuredHeight();
                h = lineh * (lines.length + 1);

                //author
                item.content = new cjs.Container();
                item.content.addChild(authorBitmap);
                item.content.addChild(textObjects[lines.length]);
                textObjects[lines.length].y = lineh * lines.length + 3 * margin;
                textObjects[lines.length].x = tweetFontSize + 2 * margin;
                textObjects[lines.length].shadow = new cjs.Shadow(tweetShadowColor, 2, 2, shadowSize.tweet);
                authorBitmap.y = lineh * lines.length + 2 * margin;
                authorBitmap.x = 0;
                authorBitmap.scaleX = tweetFontSize / 48;
                authorBitmap.scaleY = tweetFontSize / 48;
                authorBitmap.shadow = new cjs.Shadow(tweetShadowColor, 2, 2, shadowSize.tweet);
                item.content.regX = w / 2;
                item.content.regY = h / 2;

                for (var j = 0; j < lines.length; j++) {
                    item.content.addChild(textObjects[j]);
                    textObjects[j].y = lineh * j;
                    textObjects[j].shadow = new cjs.Shadow(tweetShadowColor, 2, 2, shadowSize.tweet);
                }

                item.content.snapToPixel = true;
                item.content.regX = w / 2;
                item.content.regY = h / 2;
                item.content.rotation = 0;

                if (debug) {
                    var g = new cjs.Graphics();
                    if (item.promoted)
                        g.beginStroke(cjs.Graphics.getRGB(255, 0, 0));
                    else
                        g.beginStroke(cjs.Graphics.getRGB(255, 200, 200));

                    g.drawRect(-margin * 4, -margin * 4, w + margin * 8, h + margin * 8);
                    var shape = new cjs.Shape(g);
                    item.content.addChild(shape);
                }

                if (tweetFrame) {
                    var g = new cjs.Graphics();
                    g.beginStroke(cjs.Graphics.getRGB(200, 200, 200)).beginFill("#888");
                    g.drawRect(-margin * 3, -margin * 3, w + margin * 8, h + margin * 8);

                    var shape = new cjs.Shape(g);
                    shape.alpha = 0.1;
                    item.content.addChild(shape);
                    item.collisionShape = obb({ x: -margin * 6, y: -margin * 6 }, w + margin * 14, h + margin * 14, degToRad(item.content.rotation));
                }
                else {
                    item.collisionShape = obb({ x: -margin * 4, y: -margin * 4 }, w + margin * 8, h + margin * 8, degToRad(item.content.rotation));
                }
                
                if (useCache)
                    item.content.cache(-w, -h, w * 3, h * 3);

                item.tween = cjs.Tween.get(item.content);
            } else if (data.type == "word") {
                var ctx = $("<canvas width='" + sizeW + "' height='" + sizeH + "'></canvas>")[0].getContext("2d");
                //ctx = $("#canvas2")[0].getContext("2d");
                text = data.content;
                if (data.size > lastMax)
                    data.size = lastMax;

                var wFontSize = defaultWordSize + (data.size / lastMax) * 50;
                var wordColor = fontColor.word;
                var wordShadowColor = shadowColor.word;
                if (randomizeColor.word) {
                    wordColor = randomColor();
                    wordShadowColor = wordColor;
                }
                
                fontStyle = wFontSize + "px '" + "Arial" + "'";
                textObject = new cjs.Text(text, fontStyle, wordColor);

                w = textObject.getMeasuredWidth();
                h = textObject.getMeasuredHeight();

                // calculate the word weight/height;
                ctx.clearRect(0, 0, sizeW, sizeH);
                ctx.fillStyle = "red";
                ctx.font = fontStyle;
                ctx.textAlign = "left";
                ctx.textBaseline = "top";
                ctx.fillText(text, 0, 0);
                var x1 = w / 2, x2 = w / 2, y1 = h / 2, y2 = h / 2;
                imgData = ctx.getImageData(0, 0, sizeW, sizeH);
                for (var hi = 0; hi < sizeW; hi++) {
                    for (var wi = 0; wi < sizeH; wi++) {
                        var index = (hi * (sizeW) + wi) * 4;
                        if (imgData.data[index]) {
                            x1 = Math.min(x1, wi);
                            x2 = Math.max(x2, wi);
                            y1 = Math.min(y1, hi);
                            y2 = Math.max(y2, hi);
                        }
                    }
                }

                w = Math.ceil(x2 - x1);
                h = Math.ceil(y2 - y1);
                if (w == 0 || h == 0) {
                    w = textObject.getMeasuredWidth();
                    h = textObject.getMeasuredHeight();
                    x1 = 0;
                    y1 = 0;
                }

                w += 5;
                h += 5;

                item.content = new cjs.Container();
                //shadow
                textObject.shadow = new cjs.Shadow(wordShadowColor, 0, 0, shadowSize.word);

                item.content.addChild(textObject);

                textObject.x = -1 * Math.floor(x1) + 1;
                textObject.y = -1 * Math.floor(y1) + 1;
                item.content.snapToPixel = true;
                item.content.regX = w / 2;
                item.content.regY = h / 2;
                item.content.rotation = 0;

                if (debug) {
                    var g = new cjs.Graphics();
                    if (item.promoted)
                        g.beginStroke(cjs.Graphics.getRGB(255, 0, 0));
                    else
                        g.beginStroke(cjs.Graphics.getRGB(255, 200, 200));

                    g.drawRect(0, 0, w, h);
                    var shape = new cjs.Shape(g);
                    item.content.addChild(shape);
                }

                if (useCache)
                    item.content.cache(-w, -h, w * 3, h * 3);

                item.collisionShape = obb({ x: 0, y: 0 }, w, h, degToRad(item.content.rotation));
            }
            return item;
        },
        postItem: function (item) {
            var defer = new $.Deferred();
            var r = degToRad(randomRotation(rotationMode));
            while (rotationMode != 0 && (lastRotation == item.collisionShape.rotation || Math.abs(lastRotation - item.collisionShape.rotation) == Math.PI)) {
                r = degToRad(randomRotation(rotationMode));
                item.collisionShape.rotation = r;
            }

            lastRotation = r;

            trace("thinking");
            $.when(w.fitCollisionShape(item.collisionShape)).then(function (r) {
                trace("thinking done");
                if (r !== false) {
                    resetShadow();

                    var content = item.content;
                    item.collisionShape = obb(r.position, r.w, r.h, r.rotation);
                    content.x = item.collisionShape.position.x;
                    content.y = item.collisionShape.position.y;
                    content.rotation = radToDeg(item.collisionShape.rotation);
                    content.alpha = 0;

                    var effects = [];

                    if (useSizeAlpha[item.type])
                        item.content.alpha = getAlpha(item);
                    if (!insertEffect[item.type] && !useSizeAlpha[item.type]) {
                        item.content.alpha = 1;
                    }


                    var d = new $.Deferred();
                    if (preload == -1) {
                        effGoto(item, d, gotoEffect[item.type], insertEffect[item.type]);
                    } else {
                        d.resolve();
                    }
                    $.when(w.insertShape(item.id, item.collisionShape), d).done(function () {
                        defer.resolve();
                    });

                    stage.addChild(item.content);
                    //stage.update();
                    items.push(item);
                    if (w == worker) {
                        stage.cache(0, 0, sizeW, sizeH);
                    }
                } else {
                    defer.reject();
                }
            },
                function () {
                    trace("thinking failed");
                    defer.reject();
                }, function () {
                });

            return defer.promise();
        },
        cleanUpStage: function () {
            var count = Math.min(removeCount, items.length);
            var removeList = [];
            var promises = [];
            // set up the items to remove
            for (var i = 0; i < count; i++) {
                promises.push(function () {
                    var d = $.Deferred();
                    var rmvItem = items.shift();
                    if (rmvItem.promoted && rmvItem.priority > 0) {
                        items.push(rmvItem);
                        d.resolve();
                    } else {
                        var f = (Math.random() + 0.2) * 1000 * effectSpeedRatio;
                        var t = cjs.Tween.get(rmvItem.content);
                        removeList.push(t);
                        t.setPaused(true);
                        t.to({ alpha: 0.6 }, f).to({ alpha: 0, scaleX: 2.5, scaleY: 2.5 }, f).call(function () {
                            cjs.Tween.removeTweens(rmvItem.content);
                            $.when(w.removeShape(rmvItem.id)).done(function () {
                                stage.removeChild(rmvItem.content);
                                d.resolve();
                            });
                            if (removeList.length > 0)
                                removeList.pop().setPaused(false);
                        });
                    }
                    return d.promise();
                }());
            }

            // limit the concurrent remove
            for (i = 0; i < Math.min(concurrentRemoveCount, removeList.length) ; i++) {
                removeList.pop().setPaused(false);
            }

            var defer = new $.Deferred();
            $.when.apply($, promises).done(function () {
                defer.resolve();
            });
            return defer;
        },
        addMask: function (d) {
            return w.addMask(d);
        },
        chooseMask: function (d) {
            return w.chooseMask(d);
        },
        setBg: function (b) {
            bg = b;
            stage.addChild(bg);
        },
        updateOptions: function (opt) {
            setOptions(opt);
        }
    };
    return instance;
};