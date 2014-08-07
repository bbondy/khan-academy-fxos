define([], function() {
    var TopicModel = Backbone.Model.extend({
        url: "/knowledge-map.json",
        initialize: function() {
        },
        /**
         * Initiates a recursive search for the term `search`
         */
        findVideos: function(search) {
            // TODO: This needs to go in a worker and have the reuslts sent
            // back in a callback. Or at least incrementally build the list.
            var results = [];
            this._findVideos(search, results);
            return results;
        },
        /**
         * Recursively calls _findVideos on all children and adds videos with
         * a matching title to the results array.
         */
        _findVideos: function(search, results) {
            if (this.get("videos")) {
                this.get("videos").forEach(function(item) {
                    // TODO: Possibly search descriptions too?
                    // TODO: Tokenize the `search` string and do an indexOf for each token
                    // TODO: Allow for OR/AND search term strings
                    if (item.get("translated_title") &&
                            item.get("translated_title").toLowerCase().indexOf(search.toLowerCase()) != -1) {
                        results.push(item);
                    }
                }.bind(this));
            }

            if (this.get("topics")) {
                this.get("topics").forEach(function(item) {
                    item._findVideos(search, results);
                }.bind(this));
            }
        },
        getTitle: function() {
            if (this.get("render_type") === "Root") {
                return "Domains";
            } else if (this.get("render_type") === "Domain") {
                return "Subjects";
            } else if (this.get("render_type") === "Subject") {
                return "Topics";
            }
            return this.get("render_type");
        },
        getParentDomain: function() {
            var current = this;
            while (current && current.get("render_type") !== "Domain") {
                current = current.get("parent");
            }
            return current;
        },
        isRootChild: function() {
            if (!this.get("parent")) {
                return false;
            }
            return this.get("parent").get("render_type") === "Root";
        },
        defaults: {
        },
        /**
         * Recursively parses a topic with 2 extra properties:
         *  vidoes: A backbone collection: VideoCollection which contains VideoModel
         *  topics: A backbone collection: topicCollection which contains TopicModel
         */
        parse: function(response){
            var parseTopicChildren = function(topic) {
                topic.children.forEach(function(item) {
                    item.parent = this;//response;
                }.bind(this));
                var topics = topic.children.filter(function(item) {
                    return item.kind === "Topic" && item.slug !== "new-and-noteworthy";
                });
                var videos = topic.children.filter(function(item) {
                    return item.kind === "Video";
                });
                response.topics = new TopicList(topics, {parse: true});
                response.videos= new VideoList(videos, {parse: true});
            }.bind(this);

            parseTopicChildren(response);
            return response;
        },
        isTopic: function() {//todo
            return true;
        },
        isVideoList: function() {//todo
            return false;
        }
    });

    var VideoModel = Backbone.Model.extend({
        initialize: function() {
        },
        defaults: {
            text: ''
        },
        isTopic: function() {//todo
            return false;
        },
        isVideoList: function() {//todo
            return false;
        },
        //todo make a common base object for both topics and videos
        getParentDomain: function() {
            var current = this;
            while (current && current.get("render_type") !== "Domain") {
                current = current.get("parent");
            }
            return current;
        },

    });

    var TopicList = Backbone.Collection.extend({
        model: TopicModel,
    });

    var VideoList = Backbone.Collection.extend({
        model: VideoModel,
        isTopic: function() {//todo
            return false;
        },
        isVideoList: function() {//todo
            return true;
        },
        getParentDomain: function() {//todo
            return null;
        }
    });

    return {
        TopicModel: TopicModel,
        VideoModel: VideoModel,
        TopicList: TopicList,
        VideoList: VideoList,
    };
});
