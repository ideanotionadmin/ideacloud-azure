var cjs = window.createjs;
var debug = false;
var dataSourceUrl = "http://social-cloud.cloudapp.net:80/";
var useSocketIO = true;
var showing = false;

(function () {
    var canvas, preloader, stage;
    var worker1, worker2, worker3;
    var container1;
    var dataSource = { image: [], word: [], tweet: [], ic: 0, wc: 0, tc: 0 };
    var mode = 0;
    var effGoto = false;   

    var twitterSearchPhrase = 'Microsoft';
    var instaSearchPhrase = 'Microsoft';

    var options = {
        bgColor : '#000000',
        rateWordsPerMin : 40,
        rateTweetsPerMin : 4,
        rateImagesPerMin : 2,
        wordColors : '#C4D6CE,#F9E4CA,#E89B9A,#917471,#E83402,#9396A0,#FFFBED,#CDC489',
        fadeColor : '#aaaaaa',
        tweetColor : '#ff0000',
        wordSize: 48,
        wordSizeMax : 72,
        tweetSize : 38,
        tweetSizeMax : 46,
        imageSize : 400,
        imageSizeMax: 540,
        sizeW: 1920,
        sizeH: 1200,
        speedFactor: 1,
        shadow : 1,
        promotedStays : 2,
    };


    urlToSettings();
    
    var dal = dataAccess(dataSource, '74e8c9bc10634f3dab6b84da4e8468f5', pushData);

    // Preload
    // words or images or tweets go here...
    dataSource.word = [
        //{ type: "word", content: "Microsoft", size: 80, id: "_t" + "microsoft", dateTime: new Date() },
    ];

    var manifest = [
        { src: "shapes/no-mask.png", id: "noMask", data: { mask: true } },
        { src: "shapes/word.png", id: "noMask", data: { mask: true } },
        { src: "shapes/tweets.png", id: "circleMask", data: { mask: true } },
        { src: "shapes/image.png", id: "cloudmask", data: { mask: true } }
    ];

    // Setup related methods
    function screenResize() {
        var h = $(window).height();
        var w = $(window).width();
        if (w / h < options.sizeW / options.sizeH) { // wider 1000 100
            $('#canvas').css('width', w);
            $('#canvas').css('height', w * options.sizeH / options.sizeW);
            $('#canvas').css('top', (h - (w * options.sizeH / options.sizeW)) / 2);
        } else { // narrower
            $('#canvas').css('height', h);
            $('#canvas').css('width', h * options.sizeW / options.sizeH);
            $('#canvas').css('left', (w - (h * options.sizeW / options.sizeH)) / 2);
        }
        //$('#canvas').css('border', 'solid 1px red');
    }

    function handleFileLoad(event) {
        switch (event.item.type) {
            case cjs.LoadQueue.IMAGE:
                //image loaded
                if (event.item.data.mask) {
                    
                    worker1.addMask(event);
                    worker2.addMask(event);
                    worker3.addMask(event);
                }
                break;
        }
    }

    function handleComplete() {
        //setupMask(0);
        worker1.chooseMask(1);
        worker2.chooseMask(2);
        worker3.chooseMask(3);

        // Uncomment this for debug using Twitter directly
        getData();
        runWorkers(4000);
    }

    function runWorkers(d) {
        if (mode == 0) {
            container1.alpha = 1;
        }

        if (mode == 0) {
            setTimeout(function () {
                runCallback1();

                setTimeout(function () { worker2.run(runCallback2); }, 60000 / options.rateTweetsPerMin);
                setTimeout(function () { worker3.run(runCallback3); }, 60000 / options.rateImagesPerMin);
            }, d);        
        }
    }

    function runCallback1() {
        setTimeout(function () { worker1.run(runCallback1); }, 60000 / options.rateWordsPerMin);
    }
    function runCallback2() {
        setTimeout(function () { worker2.run(runCallback2); }, 60000 / options.rateTweetsPerMin);
    }
    function runCallback3() {
        setTimeout(function () { worker3.run(runCallback3); }, 60000 / options.rateImagesPerMin);
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
                    worker3.dataSource.splice(randomRange(0, worker3.dataSource.length), 0, dataSource["word"][i]);
                }
            }
            dataSource.wc = i;
        }
        if (dataSource["image"].length > dataSource.ic) {
            for (var k = dataSource.ic; k < dataSource["image"].length; k++) {
                worker2.dataSource.splice(randomRange(0, worker2.dataSource.length), 0, dataSource["image"][k]);
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
        container1.mouseEventsEnabled = true;
        worker1 = wordCloud(container1, cjs, {
            factor: 1.5,
            sizeW: options.sizeW,
            sizeH: options.sizeH,
            sizeMax : 30,
            removeCount: 12,
            concurrentRemoveCount: 8,
            rotationMode: 1,
            effectAfterNIdles: -1,
            effectAfterNInserts: -1,
            wordSize: options.wordSize,
            wordSizeMax: options.wordSizeMax,
            insertEffect: { tweet: true, word: true, image: true },
            gotoEffect: { tweet: effGoto, word: effGoto, image: effGoto },
            useSizeAlpha: { tweet: false, word: false, image: false },
            resetShadowAfterInsert: { tweet: false, word: false, image: false},
            resetShadowColor: { tweet: options.fadeColor, word: options.fadeColor, image: options.fadeColor },
            fontColor: { tweet: options.tweetColor, word: options.tweetColor, image: options.tweetColor },
            effectSpeedRatio: options.speedFactor,
            useCache: true,
            preload: -1,
            randomizeColor: options.wordColors.split(","),
            speed : 1,
        });

        
        worker2 = wordCloud(container1, cjs, {
            factor: 1.5,
            sizeW: options.sizeW,
            sizeH: options.sizeH,
            sizeMax: 10,
            removeCount: 1,
            concurrentRemoveCount: 1,
            rotationMode: 0,
            effectAfterNIdles: -1,
            effectAfterNInserts: -1,
            tweetSize: options.tweetSize,
            tweetSizeMax: options.tweetSizeMax,
            insertEffect: { tweet: true, word: true, image: true },
            gotoEffect: { tweet: effGoto, word: effGoto, image: effGoto },
            useSizeAlpha: { tweet: false, word: false, image: false },
            resetShadowAfterInsert: { tweet: true, word: true, image: true },
            resetShadowColor: { tweet: options.fadeColor, word: options.fadeColor, image: options.fadeColor },
            shadowColor: { tweet: options.tweetColor, word: options.tweetColor, image: options.tweetColor },
            fontColor: { tweet: options.tweetColor, word: options.tweetColor, image: options.tweetColor },
            shadowSize: { tweet: 25 * options.shadow, word: 25 * options.shadow, image: 15 * options.shadow },
            effectSpeedRatio: options.speedFactor,
            useCache: true,
            preload: -1,
            tweetFrame: true,
        });
        
        
        worker3 = wordCloud(container1, cjs, {
            factor: 1.5,
            sizeW: options.sizeW,
            sizeH: options.sizeH,
            sizeMax: 10,
            removeCount: 1,
            concurrentRemoveCount: 1,
            rotationMode: 0,
            effectAfterNIdles: -1,
            effectAfterNInserts: -1,
            imageSize: options.imageSize,
            imageSizeMax: options.imageSizeMax,
            insertEffect: { tweet: true, word: true, image: true },
            gotoEffect: { tweet: false, word: false, image: false },
            useSizeAlpha: { tweet: false, word: false, image: false },
            resetShadowAfterInsert: { tweet: true, word: true, image: true },
            resetShadowColor: { tweet: options.fadeColor, word: options.fadeColor, image: options.fadeColor },
            shadowColor: { tweet: options.tweetColor, word: options.tweetColor, image: options.tweetColor },
            fontColor: { tweet: options.tweetColor, word: options.tweetColor, image: options.tweetColor },
            shadowSize: { tweet: 25 * options.shadow, word: 2 * options.shadow, image: 15 * options.shadow },
            effectSpeedRatio: options.speedFactor,
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
            worker2.terminate();
            worker3.terminate();
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

    function urlToSettings() {
        if (window.location.hash.length > 1) {
            var jsonObject = JSON.parse(window.location.hash.substring(1));
            options = jsonObject;
        }
    }
    
    function optionsToUrl() {
        var str = JSON.stringify(options);
        window.location.hash = str;
    }

    // UI Controls related Methods
    var initControls = function () {


        $('body').css('background-color', options.bgColor);
        $('input#speedFactor').val(options.speedFactor);
        $('input#imageSizeMax').val(options.imageSizeMax);
        $('input#promoted').val(options.promotedStays);
        $('input#imageSize').val(options.imageSize);
        $('input#tweetSizeMax').val(options.tweetSizeMax);
        $('input#tweetSize').val(options.tweetSize);
        $('input#wordSizeMax').val(options.wordSizeMax);
        $('input#wordSize').val(options.wordSize);
        $('input#rateWordsPerMin').val(options.rateWordsPerMin);
        $('input#rateTweetsPerMin').val(options.rateTweetsPerMin);
        $('input#rateImagesPerMin').val(options.rateImagesPerMin);
        $('input#wordColors').val(options.wordColors);

        if (options.shadow)
            $('input#shadow').prop("checked", true);
        else {
            $('input#shadow').prop("checked", false);
        }
        

        $('input#bgColor').minicolors(
            {
                animationSpeed: 100,
                animationEasing: 'swing',
                change: null,
                changeDelay: 0,
                control: 'hue',
                defaultValue: options.bgColor,
                hide: function () {
                    options.bgColor = $('input#bgColor').minicolors('value');
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
        $('input#fadeColor').minicolors(
            {
                animationSpeed: 100,
                animationEasing: 'swing',
                change: null,
                changeDelay: 0,
                control: 'hue',
                defaultValue: options.fadeColor,
                hide: function () {
                    options.fadeColor = $('input#fadeColor').minicolors('value');
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
        $('input#tweetColor').minicolors(
           {
               animationSpeed: 100,
               animationEasing: 'swing',
               change: null,
               changeDelay: 0,
               control: 'hue',
               defaultValue: options.tweetColor,
               hide: function () {
                   options.tweetColor = $('input#tweetColor').minicolors('value');
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
        options = {
            bgColor: '#000000',
            rateWordsPerMin: 40,
            rateTweetsPerMin: 4,
            rateImagesPerMin: 2,
            wordColors: '#C4D6CE,#F9E4CA,#E89B9A,#917471,#E83402,#9396A0,#FFFBED,#CDC489',
            fadeColor: '#aaaaaa',
            tweetColor: '#ff0000',
            wordSize: 48,
            wordSizeMax: 72,
            tweetSize: 38,
            tweetSizeMax: 46,
            imageSize: 400,
            imageSizeMax: 540,
            sizeW: 1920,
            sizeH: 1200,
            speedFactor: 1,
            shadow: 1,
            promotedStays : 2,
        };
        optionsToUrl();
        window.location.href = window.location.href;
        location.reload();

    });

    $('#cloud-update').click(function () {
        options.tweetColor = $('input#tweetColor').minicolors('value');
        options.bgColor = $('input#bgColor').minicolors('value');
        options.fadeColor = $('input#fadeColor').minicolors('value');
        options.speedFactor = parseFloat($('input#speedFactor').val());

        options.rateWordsPerMin = parseFloat($('input#rateWordsPerMin').val());
        options.rateTweetsPerMin = parseFloat($('input#rateTweetsPerMin').val());
        options.rateImagesPerMin = parseFloat($('input#rateImagesPerMin').val());

        options.wordSize = parseInt($('input#wordSize').val());
        options.wordSizeMax = parseInt($('input#wordSizeMax').val());
        options.tweetSize = parseInt($('input#tweetSize').val());
        options.tweetSizeMax = parseInt($('input#tweetSizeMax').val());
        options.imageSize = parseInt($('input#imageSize').val());
        options.imageSizeMax = parseInt($('input#imageSizeMax').val());
        options.promotedStays = parseInt($('input#promoted').val());
        options.wordColors = $('input#wordColors').val();


        if ($('input#shadow').is(":checked"))
            options.shadow = 1;
        else {
            options.shadow = 0;
        }

        optionsToUrl();
        window.location.href = window.location.href;
        location.reload();

    });
    

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
                item.aimage = new Image();
                item.aimage.src = item.authorImage;
                item.image.src = message.content.replace(/\\\//g, "/");
                
                if (message.promoted) {
                    item.promoted = true;
                    item.priority = options.promotedStays;
                    trace("PROMOTED Image: " + item.image.src + " id " + message.id + "\n");
                }
                else {
                    trace("Image: " + item.image.src + " id " + message.id + "\n");
                }
                item.image.onload = function () {
                    insertImage(item, message.size == 0);
                };
            } else if (message.type == "tweet") {
                var tweet = { type: "tweet", content: cleanText(message.content), size: message.size, id: message.id, color: message.colour, dateTime: new Date(message.datetime), authorName: message.authorname, authorImage: message.authorprofileurl.replace(/\\\//g, "/") };

                tweet.aimage = new Image();
                tweet.aimage.src = tweet.authorImage;

                if (message.promoted) {
                    tweet.promoted = true;
                    tweet.priority = options.promotedStays;
                    trace("PROMOTED Tweet: " + message.content + " id " + message.id + "\n");
                }
                else {
                    trace("Tweet: " + message.content + " id " + message.id + "\n");
                }
                if (tweet.content.length > 4)
                    insertTweet(tweet, message.size == 0);
            } else if (message.type == "word") {
                var word = { type: "word", content: cleanText(message.content), size: message.size, id: message.id, color: message.colour, dateTime: message.datetime };


                if (message.promoted) {
                    word.promoted = true;
                    word.priority = options.promotedStays;
                    trace("PROMOTED Word: " + message.content + " id " + message.id + "\n");
                }
                else {
                    trace("Word: " + message.content + " id " + message.id + "\n");
                }
                insertWord(word, message.size == 0);
            }
        }
    });

    function insertImage(item, remove) {
        if (remove || item.promoted) {
            worker3.dataSource.unshift(item);
        } else {
            worker3.dataSource.push(item);
        }
    }
    function insertTweet(tweet, remove) {
        if (remove || tweet.promoted) {
            worker2.dataSource.unshift(tweet);

        } else {
            worker2.dataSource.push(tweet);
        }
    }
    function insertWord(word, remove) {
        if (remove || word.promoted) {
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

    $('#popup-background').click(function() {
        $('#popup-background').hide();
        $('#popup').hide();
    });

})();



