var picWall = function (stg, createjs, options) {
    var cjs = createjs;
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
    var sizeI = 260;
    var pictureAlpha = 0.5;
	var preload = 0;
	var preloadComplete = null;

    
    // options;
    var sizeH = options.sizeH;
    var sizeW = options.sizeW;
    if (options.sizeI)
        sizeI = options.sizeI;
    var removeCount = options.removeCount;
    var concurrentRemoveCount = options.concurrentRemoveCount;
    var speed = options.speed;
    var useCache = options.useCache;
    if (options.effectAfterNInserts)
        effectAfterNInserts = options.effectAfterNInserts;
    if (options.effectAfterNIdles)
        effectAfterNIdles = options.effectAfterNIdles;
    if (options.pictureAlpha)
        pictureAlpha = options.pictureAlpha;
    if (options.preload)
        preload = options.preload;
    if (options.preloadComplete)
        preloadComplete = options.preloadComplete;
		
    var worker = new Worker('scripts/picwall/picwall.webworker.js');
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
        addMask: function (d) {
            promise[promiseCounter] = new $.Deferred();
            worker.postMessage({ action: "addMask",  pid: promiseCounter });
            return promise[promiseCounter++].promise();
        },
        chooseMask: function (d) {
            promise[promiseCounter] = new $.Deferred();
            worker.postMessage({ action: "chooseMask", data: d, pid: promiseCounter });
            return promise[promiseCounter++].promise();
        },
        insertShape: function (id) {
            promise[promiseCounter] = new $.Deferred();
            worker.postMessage({ action: "insertShape", id: id, pid: promiseCounter });
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
            worker.postMessage({ action: "setSize", data: { w: p.w, h: p.h, i: p.i }, pid: promiseCounter });
            return promise[promiseCounter++].promise();
        },
    };
    w.setSize({ w: sizeW, h: sizeH, i : sizeI });

    var effFly = function (item, defer) {
        var content = item.content;
        var tween = cjs.Tween.get(item.content);

        var flyinDistance = Math.random() * sizeW / 16;
        var flyinAngle = Math.random() * Math.PI * 2;

        content.x = item.collisionShape.position.x + Math.sin(flyinAngle) * flyinDistance;
        content.y = item.collisionShape.position.y + Math.cos(flyinAngle) * flyinDistance;
        tween.to({ alpha: 1, x: item.collisionShape.position.x, y: item.collisionShape.position.y }, 1200, cjs.Ease.cubicOut).wait(2000).call(function() {
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
        tween.to({ alpha: 1, scaleX: osx, scaleY: osy, x: item.collisionShape.position.x, y: item.collisionShape.position.y }, 1200, cjs.Ease.cubicOut).call(function() {
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
        tween.to({ alpha: 1, scaleX: osx, scaleY: osy, x: item.collisionShape.position.x, y: item.collisionShape.position.y }, 2000, cjs.Ease.backInOut).call(function() {
            defer.resolve();
        });
    };    
    var effGoto = function(item, defer) {
        var content = item.content;
        var effects = [];
        effects.push(effFade);
        effects.push(effFly);
        effects.push(effGrow);
        pause = true;

        var s = cjs.Tween.get(stage);

        var sX = sizeW / 2 + randomRange(-10, 10);
        var sY = sizeH / 2 + randomRange(-10, 10);
        var p = Math.random();
        s.to({ regX: item.collisionShape.position.x, regY: item.collisionShape.position.y, x: sX, y: sY, scaleX: 2 + p, scaleY: 2 + p, rotation: -content.rotation }, 4000, cjs.Ease.backOut).call(function() {
            var d = new $.Deferred();
            effects[randomRange(0, effects.length - 1)](item, d);

        }).wait(6000).call(function() {
            pause = false;
            defer.resolve();
        });
    };
    var effZoomOut = function(defer) {
        var s = cjs.Tween.get(stage);            
        pause = true;
        s.to({ regX: sizeW / 2, regY: sizeH / 2, x: sizeW / 2, y: sizeH / 2, scaleX: 1, scaleY: 1, rotation: 0 }, 3000, cjs.Ease.backInOut)
            .wait(4000).call(function() {
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
        s.to({ regX: item.collisionShape.position.x, regY: item.collisionShape.position.y, x: sizeW / 2, y: sizeH / 2, scaleX: 2.5, scaleY: 2.5, rotation: -item.content.rotation }, 4000, cjs.Ease.backInOut)
            .wait(6000).to({ regX: sizeW / 2, regY: sizeH / 2, x: sizeW / 2, y: sizeH / 2, scaleX: 1, scaleY: 1, rotation: 0 }, 4000, cjs.Ease.backInOut)
            .wait(6000).call(function() {
                pause = false;
                defer.resolve();
            });
    };
    var effPlaceImage = function(item, defer) {
        var content = item.content;
        var effects = [];
        effects.push(effFade);
        effects.push(effFly);
        effects.push(effGrow);
        pause = true;

        var s = cjs.Tween.get(stage);

        s.to({ }, 50, cjs.Ease.backOut).call(function() {
            var d = new $.Deferred();
            effects[randomRange(0, effects.length - 1)](item, d);

        }).wait(50).call(function() {
            pause = false;
            defer.resolve();
        });
    };
    var instance = {
        terminate: function () {
            instance.stop = true;
        },
        dataSource: [],
        stop : false,
        checkItem : function (id) {
            var found = false;
            for (var oIndex = 0; oIndex < items.length; oIndex++) {
                if (id == items[oIndex].id) {
                    found = true;
                    break;
                }
            }
            return found;
        },
        run : function () {
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
                return;
            }

            if (preload == 0) {
                stage.alpha = 1;                
                preload = -1;
                if (preloadComplete)
                    preloadComplete();
            } else if (preload > 0) {
                stage.alpha = 0;
				if (instance.dataSource.length == 0) {
                    preload = 0;
                    setTimeout(instance.run(), speed);
                }
                else {
                    var data = instance.dataSource.shift();
                    var item = instance.createItem(data);
                    item.type = data.type;
					for (var i in worker.items) {
						if (worker.items[i].id == item.id) {
							if (item.size == 0) {
								$.when(worker.removeShape(item.id)).done(function () {
									worker.stage.removeChild(worker.items[i].content);
									worker.items.splice(i, 1);
								});
							} else {
								worker.items[i].promoted = item.promoted;
							}
							setTimeout(instance.run(), speed);
							return;
						}
					}
					$.when(instance.postImage(item, worker)).then(function () {
                        setTimeout(function () { instance.run(); }, 0);
                        preload--;
                    }, function () {
                        trace("clean up");
                        $.when(instance.cleanUpStage(worker)).done(function () {
                            instance.run();
                        });
                    }, function () {
                    });
                }
                return;
            }
				
            if (instance.dataSource.length > 0) {
                var data = instance.dataSource.shift();

                var item = instance.createItem(data);
                item.type = data.type;

                for (var i in worker.items) {
                    if (worker.items[i].id == item.id) {
                        if (item.size == 0) {
                            $.when(worker.removeShape(item.id)).done(function () {
                                worker.stage.removeChild(worker.items[i].content);
                                worker.items.splice(i, 1);
                            });
                        } else {
                            worker.items[i].promoted = item.promoted;
                        }
                        setTimeout(instance.run(), speed);
                        return;
                    }
                }


                $.when(instance.postImage(item, worker)).then(function () {
                    setTimeout(function () { instance.run(); }, speed);
                }, function () {
                    trace("failed insert? ");
                    instance.run();
                }, function () {
                });
            }
            else {
                //idleCount++;
                setTimeout(function () { instance.run(); }, speed);
            }         
        },
        createItem: function (data) {
            var item = { content: null, collisionShape: null, promoted: data.promoted, id: data.id, size: data.size };
            data.size *= 1.4;

            // if NaN default to 40
            if (isNaN(data.size))
                data.size = 40;

            /*            if (data.highlight) {
                            item.priority = 1;
                            data.size *= 1.4;
                        }*/

            var factor = sizeW / 1600;
            var w, h, ctx, randColor, text, fontStyle, textObject, imgData;
            if (data.type == "image") {
                item.content = new cjs.Container();
                var bitmap = new cjs.Bitmap(data.image);
                item.content.addChild(bitmap);
                item.content.snapToPixel = true;

                w = data.image.width;
                h = data.image.height;
                var margin = 0;
                var imageSize = sizeI - 2 * margin;
                //imageSize *= factor;

                bitmap.scaleX = imageSize / Math.min(w, h);
                bitmap.scaleY = imageSize / Math.min(w, h);

                w = imageSize;
                h = imageSize;

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

                
                item.content.cache(0, 0, imageSize, imageSize);

                item.content.rotation = 0;
                item.content.alpha = 0.8;
                item.collisionShape = obb({ x: -margin, y: -margin }, w + margin * 2, h + margin * 2, degToRad(item.content.rotation));
                item.tween = cjs.Tween.get(item.content);
            }
            else if (data.type == "tweet") {
                var ctx = $("<canvas width='" + sizeW + "' height='" + sizeH + "'></canvas>")[0].getContext("2d");

                randColor = "#fff";
                text = data.content;
                text = '"' + text + '"';
                var tweetFontSize = defaultTweetSize;
                tweetFontSize *= factor;
                var margin = 6;
                fontStyle = tweetFontSize + "px '" + "Arial" + "'";

                var lines = fragmentText(text, 12 * tweetFontSize, ctx);
                var textObjects = [];
                var authorBitmap = new cjs.Bitmap(data.authorImage);

                //var lineh;
                var linew = 0;
                w = 0;
                for (var i in lines) {
                    textObjects[i] = new cjs.Text(lines[i], fontStyle, randColor);
                    linew = textObjects[i].getMeasuredWidth();
                    if (linew > w)
                        w = linew;
                }
                textObjects[lines.length] = new cjs.Text("@" + data.authorName + ", " + prettyDate(data.dateTime), tweetFontSize / 1.8 + "px 'Kavoon'", "#fff");

                var lineh = textObjects[0].getMeasuredHeight();
                h = lineh * (lines.length + 1.2);

                //author
                item.content = new cjs.Container();
                var gRect = new cjs.Graphics();
                //gRect.beginStroke(cjs.Graphics.getRGB(0, 0, 0));
                gRect.beginFill(cjs.Graphics.getRGB(160, 0, 0));
                gRect.drawRect(-margin * 3, -margin * 3, w + margin * 6, h + margin * 6);
                var bg = new cjs.Shape(gRect);
                bg.alpha = 0.80;
                bg.shadow = new cjs.Shadow("#000", 0, 0, 40);
                item.content.addChild(bg);


                item.content.addChild(authorBitmap);
                item.content.addChild(textObjects[lines.length]);
                textObjects[lines.length].y = lineh * lines.length + 3 * margin;
                textObjects[lines.length].x = tweetFontSize + 2 * margin;
                textObjects[lines.length].shadow = new cjs.Shadow("#000", 2, 2, 30);
                authorBitmap.y = lineh * lines.length + 2 * margin;
                authorBitmap.x = 0;
                authorBitmap.scaleX = tweetFontSize / 48;
                authorBitmap.scaleY = tweetFontSize / 48;
                authorBitmap.shadow = new cjs.Shadow("#000", 2, 2, 30);
                item.content.regX = w / 2;
                item.content.regY = h / 2;

                for (var j = 0; j < lines.length; j++) {
                    item.content.addChild(textObjects[j]);
                    textObjects[j].y = lineh * j;
                    textObjects[j].shadow = new cjs.Shadow("#000", 2, 2, 30);
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

                //item.content.cache(-margin * 4, -margin * 4, w + 8 * margin, h + 8 * margin);

                item.collisionShape = obb({ x: -margin * 4, y: -margin * 4 }, w + margin * 8, h + margin * 8, degToRad(item.content.rotation));
                item.tween = cjs.Tween.get(item.content);
            }
            else if (data.type == "word") {
                var ctx = $("<canvas width='" + sizeW + "' height='" + sizeH + "'></canvas>")[0].getContext("2d");
                //ctx = $("#canvas2")[0].getContext("2d");
                randColor = "#fee"; //data.color;
                var margin = 2;
                text = data.content;
                var wFontSize = defaultWordSize + data.size * 2;
                wFontSize *= factor;
                fontStyle = wFontSize + "px '" + "Arial" + "'";
                textObject = new cjs.Text(text, fontStyle, randColor);

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
                textObject.shadow = new cjs.Shadow("#f00", 0, 0, 15);

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

                    g.drawRect(-margin, -margin, w + 2 * margin, h + 2 * margin);
                    var shape = new cjs.Shape(g);
                    item.content.addChild(shape);
                }


                item.content.cache(-margin, -margin, w + 2 * margin, h + 2 * margin);
                item.collisionShape = obb({ x: -margin, y: -margin }, w + 2 * margin, h + 2 * margin, degToRad(item.content.rotation));
                item.tween = cjs.Tween.get(item.content);
            }
            return item;
        },        
        postImage : function (item) {
            var defer = new $.Deferred();
            var promises = [];
            $.when(w.insertShape(item.id)).then(function(results) {
                var removeIndex;
				var transSpeed = 500;
				if (preload > 0)
					transSpeed = 0;
					
                for (var i in results) {
                    var found = false;
                    for (var j in items) {
                        if (results[i].id == items[j].id) {
                            if (results[i].x >= 0 && results[i].y >= 0) {
                                (function() {
                                    var d = new $.Deferred();
                                    promises.push(d);
                                    //cjs.Tween.removeTweens(w.items[j].content);
                                    cjs.Tween.get(items[j].content).to({
                                        x: results[i].x,
                                        y: results[i].y
                                    }, transSpeed).call(function() {
                                        d.resolve();
                                    });
                                })();
                            } else {
                                var rem = stage.removeChild(items[j].content);
                                removeIndex = j;
                                found = true;
                                break;
                            }
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        item.content.x = results[i].x;
                        item.content.y = results[i].y;
                        item.content.alpha = 0;
                        cjs.Tween.get(item.content).wait(800).to({ alpha: pictureAlpha }, 800);
                        stage.addChild(item.content);
                        items.push(item);
                    }
                }
                if (removeIndex) {
                    items.splice(removeIndex, 1);
                }

                $.when.apply($, promises).done(function() {
                    defer.resolve();
                });
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
                        var f = (Math.random() + 0.2) * 1000;
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
        }
    };
    return instance;
};