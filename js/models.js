/* @flow weak */
// Using weak only because flow doesn't support generators and yield syntax

"strict";

define(["jquery", "underscore", "backbone", "util", "apiclient", "storage", "minify"],
       function($, _, Backbone, Util, APIClient, Storage, Minify) {
    var TopicTreeBase = {
        /**
         * Gets the ID of the topic tree item
         */
        getId: function() {
            if (this.isExercise()) {
                return this.getProgressKey().substring(1);
            }
            return this.get(Minify.getShortName("id"));
        },
        /**
         * Gets the slug of the topic tree item
         */
        getProgressKey: function() {
            return this.get(Minify.getShortName("progress_key"));
        },
        /**
         * Gets the slug of the topic tree item
         */
        getSlug: function() {
            return this.get(Minify.getShortName("slug"));
        },
        /**
         * Gets a best possible guess at a unique ID, usually based on the ID
         */
        getKey: function() {
            return this.getId() || this.getSlug() || this.getTitle();
        },
        /**
         * Gets the kind of the topic tree item
         * Example values: Article, Topic, Video
         */
        getKind: function() {
            return Minify.getLongValue("kind", this.get(Minify.getShortName("kind")));
        },
        /**
         * Obtains the translated title of the topic tree item
         */
        getTitle: function() {
            return this.get(Minify.getShortName("translated_title")) ||
                this.get(Minify.getShortName("translated_display_name"));
        },
        /**
         * Checks if the topic tree item is a topic
         */
        isTopic: function() {
            return false;
        },
        /**
         * Checks if the topic tree item is a video list
         */
        isVideoList: function() {
            return false;
        },
        /**
         * Checks if the topic tree item is a video
         */
        isVideo: function() {
            return this.getKind() === "Video";
        },
        /**
         * Checks if the topic tree item is an article list
         */
        isArticleList: function() {
            return false;
        },
        /**
         * Checks if the topic tree item is an article
         */
        isArticle: function() {
            return this.getKind() === "Article";
        },
        /**
         * Checks if the topic tree item is an article list
         */
        isExerciseList: function() {
            return false;
        },
        /**
         * Checks if the topic tree item is an article
         */
        isExercise: function() {
            return this.getKind() === "Exercise";
        },
        /**
         * Checks if the topic tree item is a content item
         */
        isContent: function() {
            return this.isVideo() || this.isArticle() || this.isExercise();
        },
        /**
         * Checks if the topic tree item is a content list
         */
        isContentList: function() {
            return false;
        },
        /**
         * Obtains the parent domain topic tree item
         */
        getParentDomain: function() {
            var current = this;
            while (current && !current.isRootChild()) {
                current = current.getParent();
            }
            return current;
        },
        /**
         * Checks if the topic tree item is a child of the root topic tree item
         * I.e. a top level subject.
         */
        isRootChild: function() {
            return this.getParent() && this.getParent().isRoot();
        },
        /**
         * Cehecks if the topic tree item is the root item
         */
        isRoot: function() {
            return !this.getParent();
        },
        /**
         * Obtains the parent of this topic tree item.
         */
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
            Util.log("loading topic tree from storage: " + this.getTopicTreeFilename());
            this.allContentItems.length = 0;
            var topicTreePromise = Storage.readText(this.getTopicTreeFilename());
            topicTreePromise.done((topicTree) => {
                Util.log("Loaded topic tree from local copy, parsing...");
                this.root = new TopicModel(JSON.parse(topicTree), {parse: true});
                d.resolve();
            });

            // If we don't have a local downloaded copy, load in the
            // one we shipped with for the instaled app.
            topicTreePromise.fail(() => {
                var filename = `/data/topic-tree`;
                var lang = Util.getLang();
                if (lang) {
                    filename += "-" + lang;
                }
                filename += ".min.js";
                Util.log("going for pre-installed default file: %s", filename);
                Util.loadScript(filename).done(() => {
                    Util.log("Topic tree script loaded, parsing...");
                    this.root = new TopicModel(window.topictree, {parse: true});
                    d.resolve();
                }).fail(() => {
                    d.reject();
                });
            });
            return d.promise();
        },
        /**
         * Refreshes topic tree info by doing an API call and minifying the
         * output. On the next program load it will be used.
         */
        refreshTopicTreeInfo: function() {
            var d = $.Deferred();
            var getTopicTreePromise = APIClient.getTopicTree();
            getTopicTreePromise.done((data) => {
                // Mutates passed in object tree
                Minify.minify(data);
                Storage.writeText(this.getTopicTreeFilename(),
                    JSON.stringify(data));
                d.resolve(data);
            });

            getTopicTreePromise.fail(() => {
                d.reject();
            });
            return d.promise();
        },
        // Obtains the path of a locally cached topic tree file
        // if one is specified.
        getTopicTreeFilename: function() {
            var lang = Util.getLang();
            var path = "topictree";
            if (lang) {
                path += `-${lang}`;
            }
            return path + ".min.json";
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
         *   If not specified all content items will be searched
         */
        getContentItemsByIds: function(ids) {
            return _(this.allContentItems).filter(function(model) {
                return ids.indexOf(model.getId()) !== -1;
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
                maxResults = 40;
            }
            var results = [];
            this._findContentItems(search, results, maxResults);
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

            _(this.get("contentItems").models).each((item) => {
                // TODO: Possibly search descriptions too?
                // TODO: We could potentially index the transcripts for a really good search
                // TODO: Tokenize the `search` string and do an indexOf for each token
                // TODO: Allow for OR/AND search term strings
                if (item.getTitle() &&
                        item.getTitle().toLowerCase().indexOf(search.toLowerCase()) !== -1) {
                    results.push(item);
                }
            });

            _(this.get("topics").models).each((item) => {
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
                        item[Minify.getShortName("kind")] === Minify.getShortValue("kind", "Article") ||
                        item[Minify.getShortName("kind")] === Minify.getShortValue("kind", "Exercise");
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
            return this.get("points") || 0;
        },
        getName: function() {
            return this.get(Minify.getShortName("name"));
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
                value = "http://fastly.kastatic.org/KA-youtube-converted/" + value + ".mp4";
            }
            return value;
        },
        getDuration: function() {
            return this.get(Minify.getShortName("duration"));
        },
        getFilename: function() {
            return this.get(Minify.getShortName("file_name"));
        },
        // A newer perseus style exercise
        isPerseusExercise:function() {
            return !this.get(Minify.getShortName("file_name"));
        },
        // An older style exercise pointed to by the khan-exercises submodule
        isKhanExercisesExercise: function() {
            return !!this.get(Minify.getShortName("file_name"));
        }
    });

    var VideoModel = ContentModel.extend({});

    var ArticleModel = ContentModel.extend({});

    var ExerciseModel = ContentModel.extend({});

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

    var ExerciseList = ContentList.extend({
        model: ExerciseModel,
        isExerciseList: function() {
            return true;
        }
    });

    var UserModel = Backbone.Model.extend({
        _getLocalStorageName: function(base) {
            return base + "-uid-" + (this.get("userInfo").nickname ||
                this.get("userInfo").username);
        },
        _completedEntitiesLocalStorageName: function() {
            return this._getLocalStorageName("completed");
        },
        _startedEntitiesLocalStorageName: function() {
            return this._getLocalStorageName("started");
        },
        _userVideosLocalStorageName: function() {
            return this._getLocalStorageName("userVideos");
        },
        _userExercisesLocalStorageName: function() {
            return this._getLocalStorageName("userExercises");
        },
        _userInfoLocalStorageName: "userInfo-3",
        init: function() {
            if (!this.isSignedIn()) {
                Util.log("Not signed in, won't get user info!");
                this.initialized = true;
                return $.Deferred().resolve().promise();
            }

            // If we have cached info, use that, otherwise fall back
            // to refreshing the user info.
            var userInfo = localStorage.getItem(this._userInfoLocalStorageName);
            if (userInfo) {
                this.set("userInfo", JSON.parse(userInfo));
            }

            if (this._loadLocalStorageData()) {
                Util.log("User info being refreshed from cache");
            } else {
                Util.log("User info being refreshed from server");
                this.refreshLoggedInInfo(false);
            }

            this.initialized = true;
            return $.Deferred().resolve().promise();
        },
        signIn: function() {
            var d = $.Deferred();
            APIClient.signIn().done(() => {
                //this.refreshLoggedInInfo(); <-- Since we currently change the
                // window.locaiton, we dont' get a callback from this promise.
                // So there's no point to refreshLoggedInInfo.  Commenting for
                // extra emphasis.

                // We don't need to wait for the result of the
                // refreshLoggedInInfo promise, just resolve right away.
                d.resolve();
            }).fail(() => {
                d.reject();
            });
            return d.promise();
        },
        signOut: function() {

            // Unbind user specific data from the topic tree
            this._syncStartedToTopicTree(false);
            this._syncCompletedToTopicTree(false);
            this._syncUserVideoProgressToTopicTree(false);
            this._syncUserExerciseProgressToTopicTree(false);

            // Remove userInfo from the model and clear its local storage
            this.unset("userInfo");
            localStorage.removeItem(this._userInfoLocalStorageName);

            return APIClient.signOut();
        },
        isSignedIn: function() {
            return APIClient.isSignedIn();
        },
        _loadLocalStorageData: function() {
            // We can't obtain the other local storage values if this is not present!
            if (!this.get("userInfo")) {
                return false;
            }

            var completedEntityIds = localStorage.getItem(this._completedEntitiesLocalStorageName());
            if (completedEntityIds) {
                this.set("completedEntityIds", JSON.parse(completedEntityIds));
                this._syncCompletedToTopicTree(true);
            }
            var startedEntityIds = localStorage.getItem(this._startedEntitiesLocalStorageName());
            if (startedEntityIds) {
                this.set("startedEntityIds", JSON.parse(startedEntityIds));
                this._syncStartedToTopicTree(true);
            }
            var userVideos = localStorage.getItem(this._userVideosLocalStorageName());
            if (userVideos) {
                userVideos = JSON.parse(userVideos);
                this.set("userVideos", userVideos);
                this._syncUserVideoProgressToTopicTree(true);
            }
            var userExercises = localStorage.getItem(this._userExercisesLocalStorageName());
            if (userExercises) {
                userExercises = JSON.parse(userExercises);
                this.set("userExercises", userExercises);
                this._syncUserExerciseProgressToTopicTree(true);
            }
            return this.get("completedEntityIds") &&
                this.get("startedEntityIds") &&
                this.get("userVideos") &&
                this.get("userExercises");
        },
        _syncCompletedToTopicTree: function(set) {
            var completedEntities = TopicTree.getContentItemsByIds(this.get("completedEntityIds"));
            _.each(completedEntities, function(contentItem) {
                if (set) {
                    contentItem.set("completed", true);
                    if (contentItem.isVideo()) {
                        contentItem.set("points", 750);
                    }
                } else {
                    contentItem.unset("completed");
                }
            });
            Util.log("completed entity Ids: %o", this.get("completedEntityIds"));
            Util.log("completed entities: %o", completedEntities);
        },
        _syncStartedToTopicTree: function(set) {
            var startedEntities = TopicTree.getContentItemsByIds(this.get("startedEntityIds"));
            _.each(startedEntities, function(contentItem) {
                if (set) {
                    contentItem.set("started", true);
                } else {
                    contentItem.unset("started");
                }
            });
            Util.log("started entity Ids: %o", this.get("startedEntityIds"));
            Util.log("started entities: %o", startedEntities);
        },
        _syncUserVideoProgressToTopicTree: function(set) {
            // Get a list of the Ids we'll be searching for in TopicTree models
            // This is only being done for a fast lookup so we don't need to later
            // search through all o the models
            var filteredContentItemIds = _(this.get("userVideos")).map((result) => {
                return result.video.id;
            });
            var filteredContentItems = TopicTree.getContentItemsByIds(filteredContentItemIds);

            _(this.get("userVideos")).each((result) => {
                // By passing filteredContentItems here we don't need to search through all
                // of the content item models! :D
                var video = TopicTree.getContentItemById(result.video.id, filteredContentItems);
                if (!video) {
                    return; // go to next item
                }
                if (set) {
                    if (result.last_second_watched > 10 &&
                            result.duration - result.last_second_watched > 10) {
                        video.set("lastSecondWatched", result.last_second_watched);
                        video.set("points", result.points);
                    }
                } else {
                    video.unset("lastSecondWatched");
                    video.unset("points");
                }
            });
            Util.log('getUserVideos entities: %o', this.get("userVideos"));
        },
        _syncUserExerciseProgressToTopicTree: function(set) {
            // Get a list of the Ids we'll be searching for in TopicTree models
            // This is only being done for a fast lookup so we don't need to later
            // search through all o the models
            var filteredContentItemIds = _(this.get("userExercises")).map((result) => {
                return result.exercise_model.content_id;
            });
            var filteredContentItems = TopicTree.getContentItemsByIds(filteredContentItemIds);

            _(this.get("userExercises")).each((result) => {
                // By passing filteredContentItems here we don't need to search through all
                // of the content item models! :D
                var exercise = TopicTree.getContentItemById(result.exercise_model.content_id, filteredContentItems);
                if (!exercise) {
                    return; // go to next item
                }
                if (set) {
                    exercise.set("totalCorrect", result.total_correct);
                    exercise.set("totalDone", result.total_done);
                    exercise.set("streak", result.streak);
                } else {
                    exercise.unset("totalCorrect");
                    exercise.unset("totalDone");
                    exercise.unset("streak");
                }
            });
            Util.log('getUserExercises entities: %o', this.get("userExercises"));
        },
        _saveUserInfo: function() {
            if (this.get("userInfo")) {
                localStorage.removeItem(this._userInfoLocalStorageName);
                localStorage.setItem(this._userInfoLocalStorageName, JSON.stringify(this.get("userInfo")));
            }
        },
        _saveStarted: function() {
            if (this.get("startedEntityIds")) {
                localStorage.removeItem(this._startedEntitiesLocalStorageName());
                localStorage.setItem(this._startedEntitiesLocalStorageName(), JSON.stringify(this.get("startedEntityIds")));
            }
        },
        _saveCompleted: function() {
            if (this.get("completedEntityIds")) {
                localStorage.removeItem(this._completedEntitiesLocalStorageName());
                localStorage.setItem(this._completedEntitiesLocalStorageName(), JSON.stringify(this.get("completedEntityIds")));
            }
        },
        _saveUserVideos: function() {
            var userVideos = this.get("userVideos");
            if (!userVideos) {
                return;
            }
            userVideos = userVideos.map((userVideo) => {
                return {
                    duration: userVideo.duration,
                    last_second_watched: userVideo.last_second_watched,
                    points: userVideo.points,
                    video: {
                        id: userVideo.id
                    }
                };
            });
            localStorage.removeItem(this._userVideosLocalStorageName());
            localStorage.setItem(this._userVideosLocalStorageName(), JSON.stringify(userVideos));
        },
        _saveUserExercises: function() {
            var userExercises = this.get("userExercises");
            if (!userExercises) {
                return;
            }
            userExercises = userExercises.map((exercise) => {
                return {
                    streak: exercise.streak,
                    total_correct: exercise.total_correct,
                    total_done: exercise.total_done,
                    exercise_model: {
                        content_id: exercise.exercise_model.content_id
                    }
                };
            });

            // The extra removeItem calls before the setItem calls help in case local storage is almost full
            localStorage.removeItem(this._userExercisesLocalStorageName());
            localStorage.setItem(this._userExercisesLocalStorageName(), JSON.stringify(userExercises));
        },
        refreshLoggedInInfo: function(forceRefreshAllInfo) {
            var d = $.Deferred();
            if (!this.isSignedIn()) {
                return d.resolve().promise();
            }

            // Get the user profile info
            APIClient.getUserInfo().then((result) => {
                Util.log("getUserInfo: %o", result);
                this.set("userInfo", {
                    avatarUrl: result.avatar_url,
                    joined: result.joined,
                    nickname: result.nickname,
                    username: result.username,
                    points: result.points,
                    badgeCounts: result.badge_counts
                });
                this._saveUserInfo();

                if (!forceRefreshAllInfo && this._loadLocalStorageData()) {
                    Util.log("User info only obtained. Not obtaining user data because we have it cached already!");
                    return;
                }

                // The call is needed for completed/in progress status of content items
                // Unlike getUserVideos, this includes both articles and videos.
                return APIClient.getUserProgress();

            }).then((data) => {
                Util.log("getUserProgress: %o", data);
                var startedEntityIds = data.started;
                var completedEntityIds = data.complete;

                // Get rid of the 'a' and 'v' prefixes, and set the completed / started
                // attributes accordingly.
                this.set("startedEntityIds", _.map(startedEntityIds, function(e) {
                    return e.substring(1);
                }));
                this.set("completedEntityIds", _.map(completedEntityIds, function(e) {
                    return e.substring(1);
                }));

                // Update topic tree models
                this._syncStartedToTopicTree(true);
                this._syncCompletedToTopicTree(true);

                // Save to local storage
                this._saveStarted();
                this._saveCompleted();

                return APIClient.getUserVideos();
            }).then((userVideosResults) => {
                // The call is needed for the last second watched and points of each watched item.
                this.set("userVideos", userVideosResults);
                this._syncUserVideoProgressToTopicTree(true);
                this._saveUserVideos();

                return APIClient.getUserExercises();
            }).then((userExercisesResults) => {
                this.set("userExercises", userExercisesResults);
                this._syncUserExerciseProgressToTopicTree(true);
                this._saveUserExercises();
                d.resolve();
            }).fail(() => {
                d.reject();
            });
            return d.promise();
        },
        reportArticleRead: function(article) {
            var d = $.Deferred();
            APIClient.reportArticleRead(article.getId()).done((result) => {
                Util.log('reported article complete: %o', result);
                article.set({
                    completed: true
                });

                var index = this.get("completedEntityIds").indexOf(article.getId());
                if (index === -1) {
                    this.get("completedEntityIds").push(article.getId());
                }
                this._saveCompleted();
                d.resolve(result);
            }).fail(() => {
                d.reject();
            });
            return d.promise();
        },
        reportVideoProgress: function(video, youTubeId, secondsWatched, lastSecondWatched) {
            var d = $.Deferred();
            var videoId = video.getId();
            var duration = video.getDuration();
            APIClient.reportVideoProgress(videoId, youTubeId, duration, secondsWatched, lastSecondWatched).done((result) => {
                if (!result) {
                    Util.warn("Video progress report returned null results!");
                    return;
                }
                Util.log('reportVideoProgress result: %o', result);

                var lastPoints = video.getPoints() || 0;
                var newPoints = lastPoints + result.points_earned;
                if (newPoints > 750) {
                    newPoints = 750;
                }

                // If they've watched some part of the video, and it's not almost the end
                // Otherwise check if we already have video progress for this item and we
                // therefore no longer need it.
                var lastSecondWatched;
                if (result.last_second_watched > 10 &&
                        duration - result.last_second_watched > 10) {
                    lastSecondWatched = result.last_second_watched;
                }

                // If we're just getting a completion of a video update
                // the user's overall points locally.
                if (result.points_earned > 0) {
                    // TODO: It would be better to store userInfo properties directly
                    // That way notificaitons will go out automatically.
                    var userInfo = CurrentUser.get("userInfo");
                    userInfo.points += result.points_earned;
                    CurrentUser._saveUserInfo();
                }

                video.set({
                    points: newPoints,
                    completed: result.is_video_completed,
                    started: !result.is_video_completed,
                    lastSecondWatched: lastSecondWatched
                });

                // Update locally stored cached info
                var index;
                if (result.is_video_completed) {
                    index = this.get("startedEntityIds").indexOf(video.getId());
                    if (index !== -1) {
                        this.get("startedEntityIds").splice(index, 1);
                    }
                    index = this.get("completedEntityIds").indexOf(video.getId());
                    if (index === -1) {
                        this.get("completedEntityIds").push(video.getId());
                    }
                } else {
                    index = this.get("startedEntityIds").indexOf(video.getId());
                    if (index === -1) {
                        this.get("startedEntityIds").push(video.getId());
                    }
                }

                var foundUserVideo = _(this.get("userVideos")).find((info) => {
                    info.video.id === video.getId();
                });
                var isNew = !foundUserVideo;
                foundUserVideo = foundUserVideo || {
                    video: { id: video.getId() },
                    duration: video.getDuration()
                };
                foundUserVideo["points"] = newPoints;
                foundUserVideo["last_second_watched"] = lastSecondWatched;
                if (isNew) {
                    this.get("userVideos").push(foundUserVideo);
                }

                this._saveStarted();
                this._saveCompleted();
                this._saveUserVideos();
                this._saveUserExercises();

                d.resolve({
                    completed: result.is_video_completed,
                    lastSecondWatched: result.last_second_watched,
                    pointsEarned: result.points_earned,
                    youtubeId: result.youtube_id,
                    videoId: videoId,
                    id: video.getId()
                });
            }).fail(() => {
                d.reject();
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
            currentDownloadRequest: null,
            isTopicDownloading: false
        }
    });

    /**
     * Stores app level options in local storage
     */
    var AppOptionsModel = Backbone.Model.extend({
        defaults: {
            autoUpdateTopicTree: true,
            showDownloadsOnly: false,
            showTranscripts: true,
            playbackRate: 100
        },
        reset: function() {
            this.clear().set(this.defaults);
            this.save();
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

    var CurrentUser = new UserModel();
    return {
        TopicModel,
        ContentModel,
        VideoModel,
        ArticleModel,
        ExerciseModel,
        TopicList,
        ContentList,
        VideoList,
        ArticleList,
        ExerciseList,
        TopicTree,
        AppOptions: new AppOptionsModel(),
        TempAppState: new TempAppStateModel(),
        CurrentUser
    };
});
