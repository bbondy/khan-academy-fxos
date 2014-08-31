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
        isArticleList: function() {
            return false;
        },
        isArticle: function() {
            return false;
        },
        isContent: function() {
            return false;
        },
        isContentList: function() {
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
        isRoot: function() {
            return this.get("render_type") === "Root";
        }
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
        findContentItems: function(search, maxResults) {
            if (_.isUndefined(maxResults)) {
                maxResults = 100;
            }
            window.searchit = this;
            // TODO: This needs to go in a worker and have the reuslts sent
            // back in a callback. Or at least incrementally build the list.
            var results = [];
            this._findContentItems(search, results);
            return results.slice(0, maxResults);
        },
        /**
         * Recursively calls _findContentItems on all children and adds videos and articles with
         * a matching title to the results array.
         */
        _findContentItems: function(search, results, maxResults) {
            if (results.length > maxResults)
                return;
            if (this.get("contentItems")) {
                this.get("contentItems").forEach(function(item) {
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
                    item._findContentItems(search, results, maxResults);
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
         *  contentItems: A backbone collection: ContentList which contains ContentModel instances
         *  topics: A backbone collection: TopicList which contains TopicModel instances
         */
        parse: function(response){
            var parseTopicChildren = function(topic) {
                topic.children.forEach(function(item) {
                    item.parent = this;//response;
                }.bind(this));
                var topics = topic.children.filter(function(item) {
                    return item.kind === "Topic" && item.slug !== "new-and-noteworthy";
                });
                var contentItems = topic.children.filter(function(item) {
                    return item.kind === "Video" || item.kind === "Article";
                });
                response.topics = new TopicList(topics, {parse: true});
                response.contentItems = new ContentList(contentItems, {parse: true});
            }.bind(this);

            parseTopicChildren(response);
            return response;
        },
        isTopic: function() {
            return true;
        },
    });

    var ContentModel = TopicTreeModel.extend({
        isVideo: function() {
            return this.get("kind") === "Video";
        },
        isArticle: function() {
            return this.get("kind") === "Article";
        },
        isContent: function() {
            return true;
        }
    });

    var VideoModel = ContentModel.extend({
        isVideo: function() {
            return true;
        },
    });

    var ArticleModel = ContentModel.extend({
        isArticle: function() {
            return true;
        },
    });

    var TopicList = TopicTreeCollection.extend({
        model: TopicModel,
    });

    var ContentList = TopicTreeCollection.extend({
        model: ContentModel,
        isContentList: function() {
            return true;
        }
    });

    var VideoList = ContentList.extend({
        model: VideoModel,
        isVideoList: function() {
            return true;
        }
    });

    var ArticleList = ContentList.extend({
        model: ArticleModel,
        isArticleList: function() {
            return true;
        }
    });

    return {
        TopicModel: TopicModel,
        ContentModel: ContentModel,
        VideoModel: VideoModel,
        ArticleModel: ArticleModel,
        TopicList: TopicList,
        ContentList: ContentList,
        VideoList: VideoList,
        ArticleList: ArticleList,
    };
});
