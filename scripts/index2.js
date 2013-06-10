var cjs = window.createjs;
var debug = false;
var dataSourceUrl = "http://confoo-cloud.cloudapp.net:80/";
var useSocketIO = true;
var showing = false;

(function () {
    var canvas, preloader, stage;
    var worker1, worker2, worker3;
    var container1, container2, container3;
    var dataSource = { image: [], word: [], tweet: [], ic: 0, wc: 0, tc: 0 };
    var sizeW = 1600;
    var sizeH = 1200;
    var mode = 0;  

    var twitterSearchPhrase = 'Microsoft';
    var instaSearchPhrase = 'Microsoft';
    var speed = 1;
    var speedFactor = 0.5;
    var bgColor = '#000000';
    var fadecolor = '#aaaaaa';
    var tweetColor = '#ff0000';
    var tintValue = 120;
    var zoomout = 5;
    var effGoto = false;
    var wordRotation = 1;
    var tweetRotation = 1;
    var imageRotation = 1;
    var shadow = 1;

    loadSettings();

    var dal = dataAccess(dataSource, '74e8c9bc10634f3dab6b84da4e8468f5', pushData);

    // Preload
    // words or images or tweets go here...
    dataSource.word = [
        { type: "word", content: "Microsoft", size: 80, id: "_t" + "microsoft", dateTime: new Date() },
    ];

    var manifest = [
        { src: "shapes/no-mask.png", id: "noMask", data: { mask: true } },
        { src: "shapes/tweets.png", id: "circleMask", data: { mask: true } },
        { src: "shapes/image.png", id: "cloudmask", data: { mask: true } },
        { src: "shapes/word.png", id: "noMask", data: { mask: true } }
    ];

    // Setup related methods
    function screenResize() {
        var h = $(window).height();
        var w = $(window).width();
        if (w / h > sizeW / sizeH) { // wider 1000 100
            $('#canvas').css('width', w);
            $('#canvas').css('height', w * sizeH / sizeW);
            $('#canvas').css('top', (h - (w * sizeH / sizeW)) / 2);
        } else { // narrower
            $('#canvas').css('height', h);
            $('#canvas').css('width', h * sizeW / sizeH);
            $('#canvas').css('left', (w - (h * sizeW / sizeH)) / 2);
        }
    }

    function handleFileLoad(event) {
        switch (event.item.type) {
            case cjs.LoadQueue.IMAGE:
                //image loaded
                if (event.item.data.mask) {
                    
                    worker1.addMask(event);
//                    worker2.addMask(event);
//                    worker3.addMask(event);
                }
                break;
        }
    }

    function handleComplete() {
        //setupMask(0);
        worker1.chooseMask(0);

        // Uncomment this for debug using Twitter directly
        getData();
        runWorkers(4000);
    }

    function runWorkers(d) {
        if (mode == 0) {
            container1.alpha = 1;
            //container2.alpha = 1;
            //container3.alpha = 1;
        }

        if (mode == 0) {
            setTimeout(function () {
                runCallback();
            }, d);        
        }
    }

    function runCallback() {
        var r = randomRange(0, 100);
        setTimeout(function() { worker1.run(runCallback); }, speed);

    }

    // Data related Methods
    function getData() {
        if (!useSocketIO) {
            if (dataSource["tweet"].length == 0 || dataSource.tc == dataSource["tweet"].length) {
                trace("getting data");
                dal.getTweets(twitterSearchPhrase, 50);
                if (mode == 0)
                    dal.getInstragram(instaSearchPhrase, 40);
                else
                    dal.getInstragram(instaSearchPhrase, 6);
            }

            setTimeout(function() { getData(); }, 12000);
        }
    }

    function pushData() {

        if (dataSource["tweet"].length > dataSource.tc) {
            for (var j = dataSource.tc; j < dataSource["tweet"].length; j++) {
                worker1.dataSource.unshift(dataSource["tweet"][j]);                
            }
            dataSource.tc = j;
        }
        if (dataSource["word"].length > dataSource.wc) {
            for (var i = dataSource.wc; i < dataSource["word"].length; i++) {
                if (dataSource["word"][i].size > 0) {
                    dataSource["word"][i].size = dataSource["word"][i].size * (Math.random() + 1);
                    worker1.dataSource.splice(randomRange(0, worker1.dataSource.length), 0, dataSource["word"][i]);
                }
            }
            dataSource.wc = i;
        }
        if (dataSource["image"].length > dataSource.ic) {
            for (var k = dataSource.ic; k < dataSource["image"].length; k++) {
                worker1.dataSource.splice(randomRange(0, worker1.dataSource.length), 0, dataSource["image"][k]);
            }
            dataSource.ic = k;
        }

    }

    // Word Cloud related Methods
    function setupWordCloud() {
        canvas = document.getElementById('canvas');
        stage = new cjs.Stage(canvas);
        container1 = new cjs.Container();
        container1.tween = cjs.Tween.get(container1);
        container1.mouseEventsEnabled = false;
        worker1 = wordCloud(container1, cjs, {
            factor: 2,
            sizeW: sizeW,
            sizeH: sizeH,
            defaultMaxSize: 40,
            removeCount: 12,
            concurrentRemoveCount: 8,
            rotationMode: tweetRotation,
            effectAfterNIdles: -1,
            effectAfterNInserts: zoomout,
            defaultWordSize: 50,
            defaultTweetSize: 28,
            defaultImageSize: 160,
            insertEffect: { tweet: true, word: true, image: true },
            gotoEffect: { tweet: effGoto, word: effGoto, image: effGoto },
            useSizeAlpha: { tweet: false, word: false, image: false },
            resetShadowAfterInsert: { tweet: true, word: true, image: true },
            resetShadowColor: { tweet: fadecolor, word: fadecolor, image: fadecolor },
            shadowColor: { tweet: tweetColor, word: tweetColor, image: tweetColor },
            fontColor: { tweet: tweetColor, word: tweetColor, image: tweetColor },
            shadowSize: { tweet: 25 * shadow, word: 25 * shadow, image: 15 * shadow },
            effectSpeedRatio: speedFactor,
            useCache: true,
            preload: -1,
            
        });

       

        stage.addChild(container1);


        preloader = new cjs.LoadQueue(false);
        preloader.onComplete = handleComplete;
        preloader.onFileLoad = handleFileLoad;
        preloader.loadManifest(manifest);

        cjs.Ticker.useRAF = true;
        cjs.Ticker.setFPS(30);
        cjs.Ticker.addListener(stage);
    }
    var restartWordCloud = function (s) {
        if (mode == 0) {
            worker1.terminate();
        }

        dal.xhrTwitter.abort();
        dal.xhrInstragram.abort();
        dal.instagramMinId = null;
        dal.twitterSinceId = null;
        dataSource.image = [];
        dataSource.word = [];
        dataSource.tweet = [];
        dataSource.ic = 0;
        dataSource.wc = 0;
        dataSource.tc = 0;

        dal.getTweets(twitterSearchPhrase, 50);
        if (mode == 0)
            dal.getInstragram(instaSearchPhrase, 40);
        else
            dal.getInstragram(instaSearchPhrase, 6);

        startLoading();

        runWorkers(10000);

    };

    function loadSettings() {
        if ($.cookie('ideacloud-tintvalue'))
            tintValue = parseInt($.cookie('ideacloud-tintvalue'));
        if ($.cookie('ideacloud-bgcolor'))
            bgColor = $.cookie('ideacloud-bgcolor');
        if ($.cookie('ideacloud-fadecolor'))
            fadecolor = $.cookie('ideacloud-fadecolor');
        if ($.cookie('ideacloud-tweetcolor'))
            tweetColor = $.cookie('ideacloud-tweetcolor');
        if ($.cookie('ideacloud-speedFactor'))
            speedFactor = parseFloat($.cookie('ideacloud-speedFactor'));
        if ($.cookie('ideacloud-zoomout'))
            zoomout = parseInt($.cookie('ideacloud-zoomout'));
        if ($.cookie('ideacloud-effGoto'))
            effGoto = $.cookie('ideacloud-effGoto') == "true";
        if ($.cookie('ideacloud-wordRotation'))
            wordRotation = parseInt($.cookie('ideacloud-wordRotation'));
        if ($.cookie('ideacloud-imageRotation'))
            imageRotation = parseInt($.cookie('ideacloud-imageRotation'));
        if ($.cookie('ideacloud-tweetRotation'))
            tweetRotation = parseInt($.cookie('ideacloud-tweetRotation'));
        if ($.cookie('ideacloud-shadow'))
            shadow = parseInt($.cookie('ideacloud-shadow'));

    }

    // UI Controls related Methods
    var initControls = function () {
        if (shadow === 1)
            $('input#shadow').prop('checked', true);
        else 
            $('input#shadow').prop('checked', false);
        if (tweetRotation === 1)
            $('input#tweetRotation').prop('checked', true);
        else
            $('input#tweetRotation').prop('checked', false);
        if (wordRotation === 1)
            $('input#wordRotation').prop('checked', true);
        else
            $('input#wordRotation').prop('checked', false);
        if (imageRotation === 1)
            $('input#imageRotation').prop('checked', true);
        else
            $('input#imageRotation').prop('checked', false);
        if (effGoto)
            $('input#effGoto').prop('checked', true);
        else
            $('input#effGoto').prop('checked', false);

        $('body').css('background-color', bgColor);
        $('input#speedFactor').val(speedFactor);
        $('input#zoomout').val(zoomout);
        $('input#tintValue').val(tintValue);
        
        $('input#bgcolor').minicolors(
            {
                animationSpeed: 100,
                animationEasing: 'swing',
                change: null,
                changeDelay: 0,
                control: 'hue',
                defaultValue: bgColor,
                hide: function () {
                    bgColor = $('input#bgcolor').minicolors('value');
                },
                hideSpeed: 100,
                inline: false,
                letterCase: 'lowercase',
                opacity: false,
                position: 'default',
                show: null,
                showSpeed: 100,
                swatchPosition: 'left',
                textfield: true,
                theme: 'default',
            }
        );
        $('input#tweetcolor').minicolors(
            {
                animationSpeed: 100,
                animationEasing: 'swing',
                change: null,
                changeDelay: 0,
                control: 'hue',
                defaultValue: tweetColor,
                hide: function () {
                    tweetColor = $('input#tweetcolor').minicolors('value');
                },
                hideSpeed: 100,
                inline: false,
                letterCase: 'lowercase',
                opacity: false,
                position: 'default',
                show: null,
                showSpeed: 100,
                swatchPosition: 'left',
                textfield: true,
                theme: 'default',
            }
        );
        $('input#fadecolor').minicolors(
           {
               animationSpeed: 100,
               animationEasing: 'swing',
               change: null,
               changeDelay: 0,
               control: 'hue',
               defaultValue: fadecolor,
               hide: function () {
                   fadecolor = $('input#fadecolor').minicolors('value');
               },
               hideSpeed: 100,
               inline: false,
               letterCase: 'lowercase',
               opacity: false,
               position: 'default',
               show: null,
               showSpeed: 100,
               swatchPosition: 'left',
               textfield: true,
               theme: 'default',
           }
       );
    };

    $('#reset').click(function() {
        twitterSearchPhrase = 'Microsoft';
        instaSearchPhrase = 'Microsoft';
        speed = 1;
        speedFactor = 0.5;
        bgColor = '#000000';
        fadecolor = '#aaaaaa';
        tweetColor = '#ff0000';
        tintValue = 120;
        zoomout = 5;
        effGoto = true;
        wordRotation = 1;
        tweetRotation = 1;
        imageRotation = 1;
        shadow = 1;
        
        $.cookie('ideacloud-tweetcolor', tweetColor, { expires: 300, path: '/' });
        $.cookie('ideacloud-bgcolor', bgColor, { expires: 300, path: '/' });
        $.cookie('ideacloud-fadecolor', fadecolor, { expires: 300, path: '/' });
        $.cookie('ideacloud-speedFactor', speedFactor, { expires: 300, path: '/' });
        $.cookie('ideacloud-tintvalue', tintValue, { expires: 300, path: '/' });
        $.cookie('ideacloud-zoomout', zoomout, { expires: 300, path: '/' });
        $.cookie('ideacloud-effGoto', effGoto, { expires: 300, path: '/' });
        $.cookie('ideacloud-wordRotation', wordRotation, { expires: 300, path: '/' });
        $.cookie('ideacloud-imageRotation', imageRotation, { expires: 300, path: '/' });
        $.cookie('ideacloud-tweetRotation', tweetRotation, { expires: 300, path: '/' });
        $.cookie('ideacloud-shadow', shadow, { expires: 300, path: '/' });
        initControls();

        window.location = window.location;        
    });

    $('#cloud-update').click(function () {
        tweetColor = $('input#tweetcolor').minicolors('value');
        $.cookie('ideacloud-tweetcolor', tweetColor, { expires: 300, path: '/' });

        bgColor = $('input#bgcolor').minicolors('value');
        $.cookie('ideacloud-bgcolor', bgColor, { expires: 300, path: '/' });

        fadecolor = $('input#fadecolor').minicolors('value');
        $.cookie('ideacloud-fadecolor', fadecolor, { expires: 300, path: '/' });

        speedFactor = parseFloat($('input#speedFactor').val());
        $.cookie('ideacloud-speedFactor', speedFactor, { expires: 300, path: '/' });

        tintValue = parseInt($('input#tintValue').val());
        $.cookie('ideacloud-tintvalue', tintValue, { expires: 300, path: '/' });

        zoomout = parseInt($('input#zoomout').val());
        $.cookie('ideacloud-zoomout', zoomout, { expires: 300, path: '/' });

        
        effGoto = $('input#effGoto').is(":checked");
        $.cookie('ideacloud-effGoto', effGoto, { expires: 300, path: '/' });
        if ($('input#wordRotation').is(":checked"))
            wordRotation = 1;
        else {
            wordRotation = 0;
        }
        $.cookie('ideacloud-wordRotation', wordRotation, { expires: 300, path: '/' });

        if ($('input#imageRotation').is(":checked"))
            imageRotation = 1;
        else {
            imageRotation = 0;
        }
        $.cookie('ideacloud-imageRotation', imageRotation, { expires: 300, path: '/' });

        if ($('input#tweetRotation').is(":checked"))
            tweetRotation = 1;
        else {
            tweetRotation = 0;
        }
        $.cookie('ideacloud-tweetRotation', tweetRotation, { expires: 300, path: '/' });

        if ($('input#shadow').is(":checked"))
            shadow = 1;
        else {
            shadow = 0;
        }
        $.cookie('ideacloud-shadow', shadow, { expires: 300, path: '/' });

        window.location = window.location;

    });
    
    function updateOptions() {
        worker1.updateOptions(
            {
                rotationMode: tweetRotation,
                effectAfterNInserts: zoomout,
                gotoEffect: { tweet: effGoto, word: effGoto, image: effGoto },
                resetShadowColor: { tweet: fadecolor, word: fadecolor, image: fadecolor },
                shadowColor: { tweet: tweetColor, word: tweetColor, image: tweetColor },
                fontColor: { tweet: tweetColor, word: tweetColor, image: tweetColor },
                shadowSize: { tweet: 25 * shadow, word: 25 * shadow, image: 15 * shadow },
                effectSpeedRatio: speedFactor,

            }
        );
    }

    $('#option-modal .close').click(function () {
        $('#option-modal').hide();
        $('#option-modal-open').show();
    });

    $('#option-modal-open').click(function () {
        $('#option-modal').show();
        $('#option-modal-open').hide();
    });

    $('.mode0').click(function () {
        if (mode == 0)
            return false;

        mode = 0;
        runWorkers(5000);
        return false;
    });

    $('.mode1').click(function () {
        if (mode == 1)
            return false;

        mode = 1;
        runWorkers(5000);
        return false;
    });

    function startLoading() {
       
    }

    function loadComplete() {
        stopLoading();
    }
    function stopLoading() {
    }

    // On Dom Ready
    $(function () {
        initControls();

        screenResize();

        $(window).resize(screenResize);

        setupWordCloud();
    });


    var socket = io.connect(dataSourceUrl);

    // Data Access via socket.io
    socket.on('fromServer', function (data) {
        if (useSocketIO) {
            if (typeof (data.message) == 'string')
                return;

            var message = data.message;
            if ($('#cbRandomColor').is(':checked')) {
                message.colour = "#fff";
            }
            if (message.type == "image") {
                var item = { type: "image", content: message.content.replace(/\\\//g, "/"), size: message.size, id: message.id, color: message.colour, dateTime: new Date(message.datetime), authorName: message.authorname, authorImage: message.authorprofileurl.replace(/\\\//g, "/") };
                item.image = new Image();
                item.image.onload = function () {
                    insertImage(item, message.size == 0);
                };
                item.aimage = new Image();
                item.aimage.src = item.authorImage;
                item.image.src = message.content.replace(/\\\//g, "/");

                trace("Image: " + item.image.src + " id " + message.id + "\n");
            } else if (message.type == "tweet") {
                var tweet = { type: "tweet", content: cleanText(message.content), size: message.size, id: message.id, color: message.colour, dateTime: new Date(message.datetime), authorName: message.authorname, authorImage: message.authorprofileurl.replace(/\\\//g, "/") };

                insertTweet(tweet, message.size == 0);

                tweet.aimage = new Image();
                tweet.aimage.src = tweet.authorImage;

                trace("Tweet: " + message.content + " id " + message.id + "\n");
            } else if (message.type == "word") {
                var word = { type: "word", content: cleanText(message.content), size: message.size, id: message.id, color: message.colour, dateTime: message.datetime };

                insertWord(word, message.size == 0);

                trace("Word: " + message.content + " id " + message.id + "\n");
            }
        }
    });

    function insertImage(item, remove) {
        if (remove) {
            worker1.dataSource.unshift(item);
        } else {
            worker1.dataSource.splice(randomRange(0, worker1.dataSource.length), 0, item);
        }
    }
    function insertTweet(tweet, remove) {
        if (remove) {
            worker1.dataSource.unshift(tweet);

        } else {
            worker1.dataSource.push(tweet);
        }
    }
    function insertWord(word, remove) {
        if (remove) {
            worker1.dataSource.unshift(word);

        } else {
            worker1.dataSource.push(word);

        }
    }

    $('#handler').click(function() {
        if (showing) {
            $('#options').hide();
            showing = false;
        } else {
            $('#options').show();
            showing = true;
        }
    });

})();



