define(["util", "apiclient", "storage", "minify"], function(Util, APIClient, Storage, _Minify) {
    var TopicTreeBase = {
        getId: function() {
            return this.get(Minify.getShortName("id"));
        },
        getKind: function() {
            return this.get(Minify.getShortName("kind"));
        },
        getTitle: function() {
            return this.get(Minify.getShortName("translated_title"));
        },
        isTopic: function() {
            return false;
        },
        isVideoList: function() {
            return false;
        },
        isVideo: function() {
            return this.getKind() === Minify.getShortValue("kind", "Video");
        },
        isArticleList: function() {
            return false;
        },
        isArticle: function() {
            return this.getKind() === Minify.getShortValue("kind", "Article");
        },
        isContent: function() {
            return this.isVideo() || this.isArticle();
        },
        isContentList: function() {
            return false;
        },
        getParentDomain: function() {
            var current = this;
            while (current && !current.isRootChild()) {
                current = current.getParent();
            }
            return current;
        },
        isRootChild: function() {
            return this.getParent() && this.getParent().isRoot();
        },
        isRoot: function() {
            return !this.getParent();
        },
        getParent: function() {
            return this.get("parent");
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

            // Check if we have a local downloaded copy of the topic tree
            var topicTreePromise = Storage.readText(this.getTopicTreeFilename());
            topicTreePromise.done((data) => {
                console.log("Loaded topic tree from local copy");
                var topicTreeData = JSON.parse(data);
                this.root = new TopicModel(topicTreeData, {parse: true});
                d.resolve();
            });

            // If we don't have a local downloaded copy, load in the
            // one we shipped with for the instaled app.
            topicTreePromise.fail(() => {
                var defaultTreeLoadPromise = APIClient.getInstalledTopicTree();
                defaultTreeLoadPromise.done((topicTreeData) => {
                    console.log("Loaded topic tree from installed default");
                    this.root = new TopicModel(topicTreeData, {parse: true});
                d.resolve();
                    d.resolve();
                });
                defaultTreeLoadPromise.fail(() => {
                    d.reject("Fatal error! Could not load topic tree!");
                });
            });
            return d.promise();
        },
        refreshTopicTreeInfo: function() {
            var d = $.Deferred();
            var getTopicTreePromise = APIClient.getTopicTree();
            getTopicTreePromise.done((data) => {
                Storage.writeText(this.getTopicTreeFilename(), JSON.stringify(data));
                d.resolve(data);
            });

            getTopicTreePromise.fail(() => {
                d.reject();
            });
            return d.promise();
        },
        getTopicTreeFilename: function() {
            var lang = Util.getLang();
            return `topictree4-${lang}.json`;
        },

        allContentItems: [],

        /**
         * Given an id, returns the model corresponding to that id
         * @param id The id of the content item to search for
         * @param filteredList a list of filtered items to look through.
         *   If not specified all content items will be searched
         * filteredList is usually the return value of getContentItemsByIds to speed
         * up lookups.
         */
        getContentItemById: function(id, filteredList) {
            return _(filteredList || this.allContentItems).find(function(model) {
                return model.getId() === id;
            });
        },
        /**
         * Much more efficient version of the above if you needs multiple ID
         * lookup, such as what download manager does.
         * It will only iterate over all of the content items once, but will
         * iterate over the passed in ids multiple times.
         * @param ids An array of content item ids to look for
         * @param filteredList a list of filtered items to look through.
         *   If not specified all content items will be searched
         */
        getContentItemsByIds: function(ids, filteredList) {
            return _(this.allContentItems).filter(function(model) {
                return ids.indexOf(model.getId()) != -1;
            });
        }
    };

    var TopicModel = TopicTreeModel.extend({
        url: "/knowledge-map.json",
        initialize: function() {
        },

        /**
         * Recursively traverses the topic tree and calls a
         * callback for each found content item.
         */
        enumChildren: function(callback, predicate) {
            _(this.get("contentItems").models).each(function(model) {
                if (!predicate || predicate(model)) {
                    callback(model);
                }
            });
            _(this.get("topics").models).each(function(topic) {
                topic.enumChildren(callback, predicate);
            });
        },
        /**
         * Provides a generator which can be used to iterate through
         * the content items incrementally.
         */
        enumChildrenGenerator: function*(predicate) {
            for (var i = 0; i < this.get("contentItems").models.length; i++) {
                var model = this.get("contentItems").models[i];
                if (!predicate || predicate(model)) {
                    yield model;
                }
            }

            for (var i = 0; i < this.get("topics").models.length; i++) {
                yield* this.get("topics").models[i].enumChildrenGenerator(predicate);
            }
        },
        /**
         * Returns the total count of content items underneath the specified topic
         */
        getChildCount: function() {
            var count = 0;
            this.enumChildren((model) => {
                count++;
            });
            return count;
        },
        /**
         * Returns the total count of content items underneath the specified topic
         * that is not downloaded
         */
        getChildNotDownloadedCount: function() {
            var count = 0;
            this.enumChildren((model) => count++, (model) => !model.isDownloaded());
            return count;
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
            if (results.length > maxResults) {
                return;
            }

            _(this.get("contentItems")).each((item) => {
                // TODO: Possibly search descriptions too?
                // TODO: We could potentially index the transcripts for a really good search
                // TODO: Tokenize the `search` string and do an indexOf for each token
                // TODO: Allow for OR/AND search term strings
                if (item.getTitle() &&
                        item.getTitle().toLowerCase().indexOf(search.toLowerCase()) !== -1) {
                    results.push(item);
                }
            });

            _(this.get("topics")).each((item) => {
                item._findContentItems(search, results, maxResults);
            });
        },
        /**
         * Recursively parses a topic with 2 extra properties:
         *  contentItems: A backbone collection: ContentList which contains ContentModel instances
         *  topics: A backbone collection: TopicList which contains TopicModel instances
         */
        parse: function(response){
            var parseTopicChildren = (topic) => {
                _(topic[Minify.getShortName("children")]).each((item) => {
                    item.parent = this;//response;
                });
                var topics = _(topic[Minify.getShortName("children")]).filter(function(item) {
                    // Not new and noteworthy (x29232c6b)
                    return item[Minify.getShortName("kind")] === Minify.getShortValue("kind", "Topic") &&
                        item[Minify.getShortName("id")] !== "x29232c6b";
                });
                var contentItems = _(topic[Minify.getShortName("children")]).filter(function(item) {
                    return item[Minify.getShortName("kind")] === Minify.getShortValue("kind", "Video") ||
                        item[Minify.getShortName("kind")] === Minify.getShortValue("kind", "Article");
                });
                response.downloadCount = 0;
                response.topics = new TopicList(topics, {parse: true});
                response.contentItems = new ContentList(contentItems, {parse: true});
                TopicTree.allContentItems.push.apply(TopicTree.allContentItems, response.contentItems.models);
            };

            parseTopicChildren(response);
            return response;
        },
        isTopic: function() {
            return true;
        },
    });

    var ContentModel = TopicTreeModel.extend({
        isContent: function() {
            return true;
        },
        isDownloaded: function() {
            return !!this.get("downloaded");
        },
        setDownloaded: function(downloaded) {
            this.set("downloaded", downloaded);
        },
        getContentMimeType: function() {
            return this.isVideo ? "video/mp4" : "text/html";
        },
        isCompleted: function() {
            return this.get("completed");
        },
        isStarted: function() {
            return this.get("started");
        },
        getYoutubeId: function() {
            return this.get(Minify.getShortName("youtube_id"));
        },
        getPoints: function() {
            return this.get("points");
        },
        getKAUrl: function() {
            var value = this.get(Minify.getShortName("ka_url"));
            if (!value) {
                return null;
            }
            if (value.substring(0, 4) !== "http") {
                value = "http://www.khanacademy.org/video/" + value;
            }
            return value;
        },
        getDownloadUrl: function() {
            var value = this.get(Minify.getShortName("download_urls"));
            if (!value) {
                return null;
            }
            if (value.substring(0, 4) !== "http") {
                value = "http://s3.amazonaws.com/KA-youtube-converted/" + value + ".mp4";
            }
            return value;
        },
        getDuration: function() {
            return this.get(Minify.getShortName("duration"));
        }
    });

    var VideoModel = ContentModel.extend({});

    var ArticleModel = ContentModel.extend({});

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
            return APIClient.signIn().done(() => {
                this.refreshLoggedInInfo();
                // We don't need to wait for the result of the
                // refreshLoggedInInfo promise, just resolve right away.
                d.resolve();
            });
            return d.promise();
        },
        signOut: function() {
            return APIClient.signOut();
        },
        isSignedIn: function() {
            return APIClient.isSignedIn();
        },
        refreshLoggedInInfo: function() {
            var d = $.Deferred();
            if (!this.isSignedIn()) {
                return d.resolve().promise();
            }

            // The call is needed for completed/in progress status of content items
            // Unlike getUserVideos, this includes both articles and videos.
            APIClient.getUserProgress().done(function(data) {
                console.log('user progress summary: %o', data);
                this.completedEntityIds = data.complete;
                this.startedEntityIds = data.started;

                // Get rid of the 'a' and 'v' prefixes, and set the completed / started
                // attributes accordingly.
                this.completedEntityIds = _.map(this.completedEntityIds, function(e) {
                    return e.substring(1);
                });
                this.startedEntityIds = _.map(this.startedEntityIds, function(e) {
                    return e.substring(1);
                });

                // Get the entities corresponding to the ids
                this.completedEntities = TopicTree.getContentItemsByIds(this.completedEntityIds);
                this.startedEntities = TopicTree.getContentItemsByIds(this.startedEntityIds);

                // Mark the entities as completed and started
                this.completedEntities = _.each(this.completedEntities, function(contentItem) {
                    contentItem.set("completed", true);
                });
                this.startedEntities = _.map(this.startedEntities, function(contentItem) {
                    contentItem.set("started", true);
                });

                console.log("completed entities: %o", this.completedEntities);
                console.log("started entities: %o", this.startedEntities);

                // The call is needed for the last second watched and points of each watched item.
                APIClient.getUserVideos().done(function(results) {
                    console.log('getUserVideos: %o', results)

                    // Get a list of the Ids we'll be searching for in TopicTree models
                    // This is only being done for a fast lookup so we don't need to later
                    // search through all o the models
                    var filteredContentItemIds = _(results).map((result) => {
                        return result.video.id;
                    });
                    var filteredContentItems = TopicTree.getContentItemsByIds(filteredContentItemIds);

                    _(results).each((result) => {
                        // By passing filteredContentItems here we don't need to search through all
                        // of the content item models! :D
                        var video = TopicTree.getContentItemById(result.video.id, filteredContentItems);
                        if (result.last_second_watched > 10 &&
                                result.duration - result.last_second_watched > 10) {
                            video.set("lastSecondWatched", result.last_second_watched);
                            video.set("points", result.points);
                        }
                    });
                    d.resolve();
                });
            });
            return d.promise();
        },
        reportVideoProgress: function(video, youTubeId, secondsWatched, lastSecondWatched) {
            var d = $.Deferred();
            var videoId = video.getId();
            var duration = video.getDuration();
            APIClient.reportVideoProgress(videoId, youTubeId, duration, secondsWatched, lastSecondWatched).done((result) => {
                console.log('reportVideoProgress result: %o', result);

                var lastPoints = video.getPoints() || 0;
                var newPoints = lastPoints + result.points_earned;
                if (newPoints > 750) {
                    newPoints = 750;
                }
                video.set("points", newPoints);

                // If they've watched some part of the video, and it's not almost the end
                if (result.last_second_watched > 10 &&
                        duration - result.last_second_watched > 10) {
                    video.set("lastSecondWatched", result.last_second_watched);
                // Otherwise check if we already have video progress for this item and we
                // therefore no longer need it.  Remove it to save memory.
                } else {
                    video.unset("lastSecondWatched");
                }

                if (result.is_video_completed) {
                    video.set("completed", true);
                    video.unset("started");
                } else {
                    video.set("started", true);
                }

                d.resolve({
                    completed: result.is_video_completed,
                    lastSecondWatched: result.last_second_watched,
                    pointsEarned: result.points_earned,
                    youtubeId: result.youtube_id,
                    videoId: videoId,
                    id: result.id
                });
            });
            return d.promise();
        }
    });

    // Just really a model to hold temporary app state
    // that should not persist after it is changed on app
    // restarts.
    // For example we use this for isDownloadingTopic from
    // Downloads so we can easily adjust views based on that state
    // changing.
    var TempAppStateModel = Backbone.Model.extend({
        defaults: {
            isTopicDownloading: false
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
        TempAppState: new TempAppStateModel(),
        CurrentUser: new UserModel()
    };
});
