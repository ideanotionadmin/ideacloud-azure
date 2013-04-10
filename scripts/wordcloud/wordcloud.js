var wordCloud = function (stg, createjs, options) {
    var cjs = createjs;
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
    var presetAlpha = { tweet: false, word: true, image: false };
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
    var useCache = true;
    var effectSpeedRatio = 1;
    lastMax = options.defaultMaxSize;
    sizeH = options.sizeH;
    sizeW = options.sizeW;
    removeCount = options.removeCount;
    concurrentRemoveCount = options.concurrentRemoveCount;
    
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
        if (opts.presetAlpha)
            presetAlpha = opts.presetAlpha;
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
        setRotation: function(d) {
            promise[promiseCounter] = new $.Deferred();
            worker.postMessage({ action: "setRotation", data: d, pid: promiseCounter });
            return promise[promiseCounter++].promise();
        },
        addMask: function(d) {
            promise[promiseCounter] = new $.Deferred();
            worker.postMessage({ action: "addMask", data: d, pid: promiseCounter });
            return promise[promiseCounter++].promise();
        },
        chooseMask: function(d) {
            promise[promiseCounter] = new $.Deferred();
            worker.postMessage({ action: "chooseMask", data: d, pid: promiseCounter });
            return promise[promiseCounter++].promise();
        },
        insertShape: function(id, p) {
            promise[promiseCounter] = new $.Deferred();
            worker.postMessage({ action: "insertShape", data: { position: p.position, w: p.w, h: p.h, rotation: p.rotation }, id: id, pid: promiseCounter });
            return promise[promiseCounter++].promise();
        },
        removeShape: function(id) {
            promise[promiseCounter] = new $.Deferred();
            worker.postMessage({ action: "removeShape", id: id, pid: promiseCounter });
            return promise[promiseCounter++].promise();
        },
        clearShapes: function() {
            promise[promiseCounter] = new $.Deferred();
            worker.postMessage({ action: "clearShapes", pid: promiseCounter });
            return promise[promiseCounter++].promise();
        },
        fitCollisionShape: function(p) {
            promise[promiseCounter] = new $.Deferred();
            worker.postMessage({ action: "fitCollisionShape", data: { position: p.position, w: p.w, h: p.h, rotation: p.rotation }, pid: promiseCounter });
            return promise[promiseCounter++].promise();
        },
        setSize: function (p) {
            promise[promiseCounter] = new $.Deferred();
            worker.postMessage({ action: "setSize", data: { w: p.w, h: p.h }, pid: promiseCounter });
            return promise[promiseCounter++].promise();
        },
    };
    w.setSize({ w: sizeW, h: sizeH });
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
    var effFade = function(item, defer) {
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
    var effGrow = function(item, defer) {
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
    var effGoto = function(item, defer, gotoEff, insertEff) {
        var content = item.content;
        var effects = [];
        if (insertEff) {
            effects.push(effFade);
            effects.push(effFly);
            effects.push(effGrow);
        }
        pause = true;

        var s = cjs.Tween.get(stage);

        var sX = sizeW / 2 + randomRange(-10, 10);
        var sY = sizeH / 2 + randomRange(-10, 10);
        var p = Math.random();
        if (gotoEff) {
            s.to({ regX: item.collisionShape.position.x, regY: item.collisionShape.position.y, x: sX, y: sY, scaleX: 2 + p, scaleY: 2 + p, rotation: -content.rotation }, 4000 * effectSpeedRatio, cjs.Ease.backOut).call(function() {
                var d = new $.Deferred();
                if (effects.length > 0)
                    effects[randomRange(0, effects.length - 1)](item, d);
            }).wait(6000 * effectSpeedRatio).call(function() {
                pause = false;
                defer.resolve();
            });
        }
        else {
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
    var effZoomOut = function(defer) {
        var s = cjs.Tween.get(stage);            
        pause = true;
        s.to({ regX: sizeW / 2, regY: sizeH / 2, x: sizeW / 2, y: sizeH / 2, scaleX: 1, scaleY: 1, rotation: 0 }, 3000 * effectSpeedRatio, cjs.Ease.backInOut)
            .wait(4000 * effectSpeedRatio).call(function () {
                pause = false;
                defer.resolve();
            });
    };
    var effZoomInOut = function(defer) {
        var s = cjs.Tween.get(stage);
        if (items.length == 0) {
            defer.resolve();
            return;
        }
        var item = items[randomRange(0, items.length - 1)];
        pause = true;
        s.to({ regX: item.collisionShape.position.x, regY: item.collisionShape.position.y, x: sizeW / 2, y: sizeH / 2, scaleX: 2.5, scaleY: 2.5, rotation: -item.content.rotation }, 4000 * effectSpeedRatio, cjs.Ease.backInOut)
            .wait(6000 * effectSpeedRatio).to({ regX: sizeW / 2, regY: sizeH / 2, x: sizeW / 2, y: sizeH / 2, scaleX: 1, scaleY: 1, rotation: 0 }, 4000 * effectSpeedRatio, cjs.Ease.backInOut)
            .wait(6000 * effectSpeedRatio).call(function () {
                pause = false;
                defer.resolve();
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

                }
            }
        }
    };
    var getAlpha = function(s) {
        if (s.promoted)
            return 0.7;

        if (s.size > lastMax)
            lastMax = s.size;

        var alpha = 0.30 + (s.size / lastMax) * 0.30;
        return alpha;
    };
    

    var instance = {
        terminate: function () {
            instance.stop = true;
        },
        stop: false,
        globalPause: false,
        dataSource: [],        
        run: function () {
            if (pause) {
                setTimeout(function () { instance.run(); }, 1000);
                return;
            }

            if (instance.globalPause) {
                setTimeout(function () { instance.run(); }, 1000);
                return;
            }

            if (instance.stop) {
                // todo: cleanup
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
            }

            if (effectAfterNInserts > 0 && insertCount > effectAfterNInserts) {
                idleCount = 0;
                insertCount = 0;
                idleCount++;
                var defer = new $.Deferred();
                effZoomOut(defer);
                $.when(defer).done(function() {
                    setTimeout(function() { instance.run(); }, 1000);
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
                        setTimeout(instance.run(), speed);
                        return;
                    }
                    
                    if (items[i].id == item.id) {
                        if (item.size == 0) {
                            $.when(w.removeShape(item.id)).done(function() {
                                stage.removeChild(items[i].content);
                                items.splice(i, 1);
                            });
                        } else {
                            items[i].content.promoted = item.promoted;
                        }

                        setTimeout(instance.run(), speed);
                        return;
                    }
                }
                $.when(instance.postItem(item, worker)).then(function() {
                    
                    setTimeout(function () { instance.run(); }, speed);
                }, function() {
                    trace("clean up");
                    $.when(instance.cleanUpStage(worker)).done(function () {
                        instance.run();
                    });
                }, function() {
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
                $.when(defer).done(function() {
                    setTimeout(function () { instance.run(); }, speed);
                });
                return;
            }
            if (effectAfterNIdles > 0 && idleCount > effectAfterNIdles) {
                insertCount = 0;
                idleCount = -1;
                var defer = new $.Deferred();
                effZoomOut(defer);
                $.when(defer).done(function() {
                    setTimeout(function () { instance.run(); }, speed);
                });
                return;
            } 
            
            //idle
            idleCount++;
            setTimeout(function () { instance.run(); }, speed);            
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

            var factor = sizeW / 1600;
            var w, h, ctx, randColor, text, fontStyle, textObject, imgData;
            if (data.type == "image") {
                item.content = new cjs.Container();
                var bitmap = new cjs.Bitmap(data.image);
                bitmap.shadow = new cjs.Shadow(shadowColor.image, 2, 2, shadowSize.image);
                item.content.addChild(bitmap);
                item.content.snapToPixel = true;

                w = data.image.width;
                h = data.image.height;
                var imageSize = defaultImageSize;
                var margin = imageSize / 50;
                imageSize *= factor;
                var s = imageSize / Math.max(w, h);

                bitmap.scaleX = s;
                bitmap.scaleY = s;

                var authorBitmap = new cjs.Bitmap(data.authorImage);
                textObject = new cjs.Text("@" + data.authorName + ", " + prettyDate(data.dateTime), imageSize / 18 + "px 'Kavoon'", fontColor.image);
                var lineh = textObject.getMeasuredHeight();

                item.content.addChild(authorBitmap);
                item.content.addChild(textObject);
                textObject.y = h * s + 1 * margin;
                textObject.x = imageSize / 8 + 4 * margin;
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
                item.collisionShape = obb({ x: -margin, y: -margin }, w + margin * 2, h + margin * 2, degToRad(item.content.rotation));
                item.tween = cjs.Tween.get(item.content);
            } else if (data.type == "tweet") {
                var ctx = $("<canvas width='" + sizeW + "' height='" + sizeH + "'></canvas>")[0].getContext("2d");
                
                text = data.content;
                text = '"' + text + '"';
                var tweetFontSize = defaultTweetSize;
                tweetFontSize *= factor;
                var margin = tweetFontSize / 8;
                fontStyle = tweetFontSize + "px '" + "Arial" + "'";

                var lines = fragmentText(text, 12 * tweetFontSize, ctx);
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
                textObjects[lines.length] = new cjs.Text("@" + data.authorName + ", " + prettyDate(data.dateTime), tweetFontSize / 1.8 + "px 'Kavoon'", fontColor.tweet);

                var lineh = textObjects[0].getMeasuredHeight();
                h = lineh * (lines.length + 1);

                //author
                item.content = new cjs.Container();
                item.content.addChild(authorBitmap);
                item.content.addChild(textObjects[lines.length]);
                textObjects[lines.length].y = lineh * lines.length + 3 * margin;
                textObjects[lines.length].x = tweetFontSize + 2 * margin;
                textObjects[lines.length].shadow = new cjs.Shadow(shadowColor.tweet, 2, 2, shadowSize.tweet);
                authorBitmap.y = lineh * lines.length + 2 * margin;
                authorBitmap.x = 0;
                authorBitmap.scaleX = tweetFontSize / 48;
                authorBitmap.scaleY = tweetFontSize / 48;
                authorBitmap.shadow = new cjs.Shadow(shadowColor.tweet, 2, 2, shadowSize.tweet);
                item.content.regX = w / 2;
                item.content.regY = h / 2;

                for (var j = 0; j < lines.length; j++) {
                    item.content.addChild(textObjects[j]);
                    textObjects[j].y = lineh * j;
                    textObjects[j].shadow = new cjs.Shadow(shadowColor.tweet, 2, 2, shadowSize.tweet);
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

                    g.drawRect(-margin * 2, -margin * 2, w + margin * 4, h + margin * 4);
                    var shape = new cjs.Shape(g);
                    item.content.addChild(shape);
                }

                item.collisionShape = obb({ x: -margin * 2, y: -margin * 2 }, w + margin * 4, h + margin * 4, degToRad(item.content.rotation));
                item.tween = cjs.Tween.get(item.content);
            } else if (data.type == "word") {
                var ctx = $("<canvas width='" + sizeW + "' height='" + sizeH + "'></canvas>")[0].getContext("2d");
                //ctx = $("#canvas2")[0].getContext("2d");
                text = data.content;
                if (data.size > lastMax)
                    lastMax = data.size;

                var wFontSize = defaultWordSize + (data.size / lastMax) * 30;
                
                fontStyle = wFontSize + "px '" + "Arial" + "'";
                textObject = new cjs.Text(text, fontStyle, fontColor.word);

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
                textObject.shadow = new cjs.Shadow(shadowColor.word, 0, 0, shadowSize.word);

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
                    item.content.cache(0, 0, w, h);
                item.collisionShape = obb({ x: 0, y: 0 }, w, h, degToRad(item.content.rotation));                
            }
            return item;
        },
        postItem: function(item) {
            var defer = new $.Deferred();
            var originRotation = stage.rotation;
            while (rotationMode != 0 && originRotation == item.collisionShape.rotation) {
                item.collisionShape.rotation = degToRad(randomRotation(rotationMode));
            }

            $.when(w.fitCollisionShape(item.collisionShape)).then(function(r) {
                if (r !== false) {
                    resetShadow();

                    var content = item.content;
                    item.collisionShape = obb(r.position, r.w, r.h, r.rotation);
                    content.x = item.collisionShape.position.x;
                    content.y = item.collisionShape.position.y;
                    content.rotation = radToDeg(item.collisionShape.rotation);
                    content.alpha = 0;

                    var effects = [];

                    if (presetAlpha[item.type])
                        item.content.alpha = getAlpha(item);
                    if (!insertEffect[item.type] && !presetAlpha[item.type]) {
                        item.content.alpha = 1;
                    }
                    

                    var d = new $.Deferred();
                    effGoto(item, d, gotoEffect[item.type], insertEffect[item.type]);
                    $.when(w.insertShape(item.id, item.collisionShape), d).done(function() {
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
                function() {
                    defer.reject();
                }, function() {
                });

            return defer.promise();
        },
        cleanUpStage:  function () {
            var count = Math.min(removeCount, items.length);
            var removeList = [];
            var promises = [];
            // set up the items to remove
            for (var i = 0; i < count; i++) {
                promises.push(function() {
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
                        t.to({ alpha: 0.6 }, f).to({ alpha: 0, scaleX: 2.5, scaleY: 2.5 }, f).call(function() {
                            cjs.Tween.removeTweens(rmvItem.content);
                            $.when(w.removeShape(rmvItem.id)).done(function() {
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
            for (i = 0; i < Math.min(concurrentRemoveCount, removeList.length); i++) {
                removeList.pop().setPaused(false);
            }

            var defer = new $.Deferred();
            $.when.apply($, promises).done(function() {
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