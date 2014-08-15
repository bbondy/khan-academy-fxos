define([], function() {
    var TopicTreeBase = {
        isTopic: function() {
            return false;
        },
        isVideoList: function() {
            return false;
        },
        isVideo: function() {
            return false;
        },
        getParentDomain: function() {
            var current = this;
            while (current && !current.isRootChild()) {
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
    };
    var TopicTreeModel = Backbone.Model.extend(TopicTreeBase);
    var TopicTreeCollection = Backbone.Collection.extend(TopicTreeBase);

    var TopicModel = TopicTreeModel.extend({
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
                    // TODO: We could potentially index the transcripts for a really good search
                    // TODO: Tokenize the `search` string and do an indexOf for each token
                    // TODO: Allow for OR/AND search term strings
                    if (item.get("title") &&
                            item.get("title").toLowerCase().indexOf(search.toLowerCase()) !== -1) {
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
        isTopic: function() {
            return true;
        },
    });

    var VideoModel = TopicTreeModel.extend({
        initialize: function() {
        },
        isVideo: function() {
            return true;
        },
    });

    var TopicList = TopicTreeCollection.extend({
        model: TopicModel,
    });

    var VideoList = TopicTreeCollection.extend({
        model: VideoModel,
        isVideoList: function() {
            return true;
        }
    });

    return {
        TopicModel: TopicModel,
        VideoModel: VideoModel,
        TopicList: TopicList,
        VideoList: VideoList,
    };
});
