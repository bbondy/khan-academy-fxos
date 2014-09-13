define(["ka"], function(KA) {
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


    /**
     * Provides a fast lookup for an individual content item
     * This is used for downloads manager so we don't have to have multiple
     * models representing a single entity.
     * It's not used for search just because the root of search isn't always
     * equal to 'all' items.
     * This isn't an actual backbone model (yet)
     */
    var TopicTree = {
        init: function() {
            var d = $.Deferred();
            KA.APIClient.getTopicTree().done((topicTreeData) => {
                this.root = new TopicModel(topicTreeData, {parse: true});
                d.resolve();
            });
            return d.promise();
        },
        allContentItems: [],

        /**
         * Given an id, returns the model corresponding to that id
         */
        getContentItemById: function(id) {
            return _(this.allContentItems).find(function(model) {
                return model.get("id") === id;
            });
        },
        /**
         * Much more efficient version of the above if you needs multiple ID
         * lookup, such as what download manager does.
         * It will only iterate over all of the content items once, but will
         * iterate over the passed in ids multiple times.
         */
        getContentItemsByIds: function(ids) {
            return _(this.allContentItems).filter(function(model) {
                return ids.indexOf(model.get("id")) != -1;
            });
        }
    };


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
                response.downloadCount = 0;
                response.topics = new TopicList(topics, {parse: true});
                response.contentItems = new ContentList(contentItems, {parse: true});
                TopicTree.allContentItems.push.apply(TopicTree.allContentItems, response.contentItems.models);
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
        },
        isDownloaded: function() {
            return !!this.get("downloaded");
        },
        getContentMimeType: function() {
            return this.isVideo ? "video/mp4" : "text/html";
        }
    });

    var VideoModel = ContentModel.extend({
        isVideo: function() {
            return true;
        }
    });

    var ArticleModel = ContentModel.extend({
        isArticle: function() {
            return true;
        }
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

    var UserModel = Backbone.Model.extend({
        signIn: function() {
            var d = $.Deferred();
            return KA.APIClient.signIn().done(() => {
                this.refreshLoggedInInfo();
                // We don't need to wait for the result of the
                // refreshLoggedInInfo promise, just resolve right away.
                d.resolve();
            });
            return d.promise();
        },
        signOut: function() {
            return KA.APIClient.signOut();
        },
        isSignedIn: function() {
            return KA.APIClient.isSignedIn();
        },
        refreshLoggedInInfo: function() {
            var d = $.Deferred();
            if (!this.isSignedIn()) {
                return d.resolve().promise();
            }

            // The calli s needed so we get KA.APIClient.completedEntities
            // Which is used for completed/in progress tatus of content items
            KA.APIClient.getUserProgress().done(function(completedEntities, startedEntities) {
                console.log("getUserProgress:");
                console.log(completedEntities);
                console.log(startedEntities);

                // The call is needed so we get KA.APIClient.videoProgress
                // which tells us the duration of each watched item.
                KA.APIClient.getUserVideos().done(function(results) {
                    console.log('getUserVideos')
                    console.log(results);
                    d.resolve();
                });
            });
            return d.promise();
        }
    });

    /**
     * Stores app level options in local storage
     */
    var AppOptionsModel = Backbone.Model.extend({
        defaults: {
            showDownloadsOnly: false
        },
        sync: function(method, model, options) {
            if (method === "create" || method === "update") {
                localStorage.setItem(this._name, JSON.stringify(this.toJSON()));
            } else if (method === "read") {
                var result = localStorage.getItem(this._name);
                var attributes = this.parse(JSON.parse(result));
                if (attributes) {
                    this.attributes = attributes;
                }
            } else if (method === "delete") {
                // You can't delete options!
            }
            return $.Deferred().resolve().promise();
        },
        _name: "appOptions.json"
    });

    return {
        TopicModel,
        ContentModel,
        VideoModel,
        ArticleModel,
        TopicList,
        ContentList,
        VideoList,
        ArticleList,
        TopicTree,
        AppOptions: new AppOptionsModel(),
        CurrentUser: new UserModel()
    };
});
