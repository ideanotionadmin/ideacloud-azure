var dataAccess = function (dataSrc, instagramClientId, callback) {
    var dataSource = dataSrc;
    var pushData = callback;
    var clientId = instagramClientId;
    
    var instance = {
        instagramMinId: null,
        twitterSinceId : null,
        xhrTwitter: null,
        xhrInstragram : null,
        getTweets: function(searchPhase, count) {
            instance.xhrTwitter = $.ajax({
                type: "GET",
                url: "http://search.twitter.com/search.json?",
                dataType: "jsonp",
                data: {
                    q: searchPhase,
                    include_entities: "true",
                    rpp: count,
                    show_user: false,
                    result_type: "recent",
                    since_id: instance.twitterSinceId,
                },
                error: function() {
                    //alert('error...');
                },
                success: function(d) {
                    var words = [];
                    instance.twitterSinceId = d.max_id;
                    trace("Count: " + d.results.length + "\n");

					for (var i in d.results) {
                        var data = d.results[i];
                        if (data.entities && data.entities.hashtags.length > 0) {
                            for (var hindex in data.entities.hashtags) {
                                if (data.entities.hashtags[hindex].text.length <= 2) {
                                    continue;
                                }
                                var w = "#" + data.entities.hashtags[hindex].text;
                                if (words[w.toLowerCase()]) {
                                    words[w.toLowerCase()].size += 20;
                                } else {
                                    words[w.toLowerCase()] = { size: 10, text: w };
                                }
                            }
                        }
                        if (data.entities && data.entities.media && data.entities.media[0].type == 'photo') {
                            var item = {
                                type: "image",
                                content: data.entities.media[0].media_url,
                                size: 1,
                                id: data.id,
                                dateTime: new Date(data.created_at),
                                authorName: data.from_user,
                                authorImage: data.profile_image_url
                            };
                            item.image = new Image();
                            item.image.item = item;
                            item.image.onload = function() {							
                                dataSource['image'].push(this.item);
                            };
                            item.image.src = data.entities.media[0].media_url + ":medium";
                            item.aimage = new Image();
                            item.aimage.src = data.profile_image_url;
                            trace("Image: " + item.image.src + " id " + data.id + "\n");
                        }
						var text = cleanText(data.text);
						var tweet = { type: "tweet", content: text, size: 1, id: data.id, dateTime: new Date(data.created_at), authorName: data.from_user, authorImage: data.profile_image_url };

						var tokens = text.split(" ");
						for (var t in tokens) {
							if (isAlphaOrParen(tokens[t]) && tokens[t].length > 4) {
								if (words[tokens[t].toLowerCase()]) {
									words[tokens[t].toLowerCase()].size += 1;
								} else {
									words[tokens[t].toLowerCase()] = { size: 1, text: tokens[t] };
								}
							}
						}

						tweet.aimage = new Image();
						tweet.aimage.src = data.profile_image_url;
						dataSource['tweet'].push(tweet);
						trace("Tweet: " + tweet.content + " id " + data.id + "\n");
                    }

                    words.sort(function(a, b) {
                        return a.size > b.size;
                    });

                    for (var token in words) {
                        var word = { type: "word", content: words[token].text, size: words[token].size, id: "_t" + words[token].text.toLowerCase(), dateTime: new Date() };
                        dataSource['word'].push(word);
                        trace("word: " + word.content + " id " + word.id + "\n");
                    }
                    pushData();
                }
            });
        },
        getInstragram: function (searchPhase, count) {            
            instance.xhrInstragram = $.ajax({
                type: "GET",
                url: "https://api.instagram.com/v1/tags/" + searchPhase + "/media/recent?",
                dataType: "jsonp",
                data: {
                    count : count,
                    min_id: instance.instagramMinId,
                    client_id: clientId,
					t : Math.random(),
                },
                error: function() {
                    alert('error...');
                },
                success: function(d) {
                    var words = [];
                    trace("Count Insta: " + d.data.length + "");
					if (d.data.length)
						instance.instagramMinId = d.pagination.min_tag_id;

                    for (var i in d.data) {
                        var data = d.data[i];
                        if (data.tags) {
                            for (var hindex in data.tags) {
                                if (data.tags[hindex].length <= 2) {
                                    continue;
                                }
                                var w = "#" + data.tags[hindex];
                                if (words[w.toLowerCase()]) {
                                    words[w.toLowerCase()].size += 10;
                                } else {
                                    words[w.toLowerCase()] = { size: 10, text: w };
                                }
                            }
                        }
                        if (data.images) {
                            var item = {
                                type: "image",
                                content: data.images.standard_resolution.url,
                                size: 0.7,
                                id: data.id,
                                dateTime: new Date(data.created_time * 1000),
                                authorName: data.user.username,
                                authorImage: data.user.profile_picture
                            };
                            item.image = new Image();
							item.image.item = item;
                            item.image.onload = function() {							
                                dataSource['image'].push(this.item);
                            };
                            item.image.src = data.images.low_resolution.url;
                            item.aimage = new Image();
                            item.aimage.src = data.user.profile_picture;
                            trace("Image: " + item.image.src + " id " + data.id + "\n");
                        }
                    }

                    words.sort(function(a, b) {
                        return a.size > b.size;
                    });

                    for (var token in words) {
                        var word = { type: "word", content: words[token].text, size: words[token].size, id: "_t" + words[token].text.toLowerCase(), dateTime: new Date() };
                        dataSource['word'].push(word);
                        trace("word: " + word.content + " id " + word.id + "\n");
                    }
                    pushData();
                }
            });
        }
    };
    
    return instance;
}