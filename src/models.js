"strict";

import _ from "underscore";
import Util from "./util";
import APIClient from "./apiclient";
import Storage from "./storage";
import Minify from "./minify";

// temporary helper to help
class BaseModel {
    constructor(data, extra) {
        if (extra && extra.parse) {
            this.attributes = data;
        } else {
            this.defaults = data && data.defaults;
            this.attributes = this.defaults || {};
        }
        this.callbacks = [];
    }
    get(prop) {
        return this.attributes[prop];
    }
    set(prop, value) {
        this.attributes[prop] = value;
        _.each(this.callbacks, (callback) => callback());
    }
    on(type, callback) {
        this.callbacks.push(callback);
    }
}

class BaseCollection {
    constructor(models, options) {
        this.models = models;
        if (options && options.parse) {
            if (_.isString(this.models)) {
                this.models = JSON.parse(this.models);
            } else {
                this.models = models;
            }
        }
        if (options.modelClass) {
            this.models = _.map(this.models, (x) => new options.modelClass(x, {parse: true}));
        }
    }
}

export class TopicTreeBase extends BaseModel {
    constructor(data, extra) {
        super(data, extra);
    }
    /**
     * Gets the ID of the topic tree item
     */
    getId() {
        if (this.isExercise()) {
            return this.getProgressKey().substring(1);
        }
        return this.get(Minify.getShortName("id"));
    }
    /**
     * Gets the slug of the topic tree item
     */
    getProgressKey() {
        return this.get(Minify.getShortName("progress_key"));
    }
    /**
     * Gets the slug of the topic tree item
     */
    getSlug() {
        return this.get(Minify.getShortName("slug"));
    }
    /**
     * Gets a best possible guess at a unique ID, usually based on the ID
     */
    getKey() {
        return this.getId() || this.getSlug() || this.getTitle();
    }
    /**
     * Gets the kind of the topic tree item
     * Example values: Article, Topic, Video
     */
    getKind() {
        return Minify.getLongValue("kind", this.get(Minify.getShortName("kind")));
    }
    /**
     * Obtains the translated title of the topic tree item
     */
    getTitle() {
        return this.get(Minify.getShortName("translated_title")) ||
            this.get(Minify.getShortName("translated_display_name"));
    }
    /**
     * Checks if the topic tree item is a topic
     */
    isTopic() {
        return false;
    }
    /**
     * Checks if the topic tree item is a video list
     */
    isVideoList() {
        return false;
    }
    /**
     * Checks if the topic tree item is a video
     */
    isVideo() {
        return this.getKind() === "Video";
    }
    /**
     * Checks if the topic tree item is an article list
     */
    isArticleList() {
        return false;
    }
    /**
     * Checks if the topic tree item is an article
     */
    isArticle() {
        return this.getKind() === "Article";
    }
    /**
     * Checks if the topic tree item is an article list
     */
    isExerciseList() {
        return false;
    }
    /**
     * Checks if the topic tree item is an article
     */
    isExercise() {
        return this.getKind() === "Exercise";
    }
    /**
     * Checks if the topic tree item is a content item
     */
    isContent() {
        return this.isVideo() || this.isArticle() || this.isExercise();
    }
    /**
     * Checks if the topic tree item is a content list
     */
    isContentList() {
        return false;
    }
    /**
     * Obtains the parent domain topic tree item
     */
    getParentDomain() {
        var current = this;
        while (current && !current.isRootChild()) {
            current = current.getParent();
        }
        return current;
    }
    /**
     * Checks if the topic tree item is a child of the root topic tree item
     * I.e. a top level subject.
     */
    isRootChild() {
        return this.getParent() && this.getParent().isRoot();
    }
    /**
     * Cehecks if the topic tree item is the root item
     */
    isRoot() {
        return !this.getParent();
    }
    /**
     * Obtains the parent of this topic tree item.
     */
    getParent() {
        return this.get("parent");
    }
}

class TopicTreeCollection extends BaseCollection {
    constructor(models, options) {
        super(models, options);
    }
}


/**
 * Provides a fast lookup for an individual content item
 * This is used for downloads manager so we don't have to have multiple
 * models representing a single entity.
 * It's not used for search just because the root of search isn't always
 * equal to 'all' items.
 */
var TopicTree: {
    init: any;
    refreshTopicTreeInfo: any;
    getTopicTreeFilename: any;
    allContentItems: Array<any>;
    getContentItemById: any;
    getContentItemsByIds: any;
    root: any;
} = {
    root: null,
    init: function() {
        return new Promise((resolve, reject) => {

            // Check if we have a local downloaded copy of the topic tree
            Util.log("loading topic tree from storage: " + this.getTopicTreeFilename());
            this.allContentItems.length = 0;
            var topicTreePromise = Storage.readText(this.getTopicTreeFilename());
            topicTreePromise.then((topicTree) => {
                Util.log("Loaded topic tree from local copy, parsing...");

                this.root = new TopicModel(JSON.parse(topicTree), {parse: true});

                resolve();
            });

            // If we don't have a local downloaded copy, load in the
            // one we shipped with for the instaled app.
            topicTreePromise.catch(() => {
                var filename = `/data/topic-tree`;
                var lang = Util.getLang();
                if (lang) {
                    filename += "-" + lang;
                }
                filename += ".min.js";
                Util.log("going for pre-installed default file: %s", filename);
                Util.loadScript(filename).then(() => {
                    Util.log("Topic tree script loaded, parsing...");
                    this.root = new TopicModel(window.topictree, {parse: true});
                    resolve();
                }).catch(() => {
                    reject();
                });
            });
        });
    },
    /**
     * Refreshes topic tree info by doing an API call and minifying the
     * output. On the next program load it will be used.
     */
    refreshTopicTreeInfo: function() {
        return new Promise((resolve, reject) => {
            var getTopicTreePromise = APIClient.getTopicTree();
            getTopicTreePromise.then((data) => {
                // Mutates passed in object tree
                Minify.minify(data);
                Storage.writeText(this.getTopicTreeFilename(),
                    JSON.stringify(data));
                resolve(data);
            });

            getTopicTreePromise.catch(() => {
                reject();
            });
        });
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

export class TopicModel extends TopicTreeBase {

    constructor(data, extra) {
        super(data, extra);
    }

    getTopics() {
        var topics = new TopicList(this.get(Minify.getShortName("children")).filter((child) =>
            child[Minify.getShortName("kind")] === Minify.getShortValue("kind", "Topic")
        ),
        {
            parse: true
        });

        this.parentListToThis(topics);
        return topics;
    }

    getContentItems() {
        var contentItems = new ContentList(this.get(Minify.getShortName("children")).filter((child) => {
            var kind = child[Minify.getShortName("kind")];
            return kind === Minify.getShortValue("kind", "Video") ||
                kind === Minify.getShortValue("kind", "Article") ||
                kind === Minify.getShortValue("kind", "Exercise");
        }),
        {
            parse: true
        });

        this.parentListToThis(contentItems);
        return contentItems;
    }

    parentListToThis(list) {
        _.each(list.models, (child) => {
            child.set("parent", this);
        });
    }

    /**
     * Recursively traverses the topic tree and calls a
     * callback for each found content item.
     */
    enumChildren(callback, predicate) {
        _(this.getContentItems().models).each(function(model) {
            if (!predicate || predicate(model)) {
                callback(model);
            }
        });
        _(this.getTopics().models).each(function(topic) {
            topic.enumChildren(callback, predicate);
        });
    }
    /**
     * Provides a generator which can be used to iterate through
     * the content items incrementally.
     */
    *enumChildrenGenerator(predicate) {
        for (var i = 0; i < this.getContentItems().models.length; i++) {
            var model = this.getContentItems().models[i];
            if (!predicate || predicate(model)) {
                yield model;
            }
        }

        for (var i = 0; i < this.getTopics().models.length; i++) {
            yield* this.getTopics().models[i].enumChildrenGenerator(predicate);
        }
    }
    /**
     * Returns the total count of content items underneath the specified topic
     */
    getChildCount() {
        var count = 0;
        this.enumChildren((model) => {
            count++;
        });
        return count;
    }
    /**
     * Returns the total count of content items underneath the specified topic
     * that is not downloaded
     */
    getChildNotDownloadedCount() {
        var count = 0;
        this.enumChildren((model) => count++, (model) => !model.isDownloaded());
        return count;
    }
    /**
     * Initiates a recursive search for the term `search`
     */
    findContentItems(search, maxResults) {
        if (_.isUndefined(maxResults)) {
            maxResults = 40;
        }
        var results = [];
        this.findContentItems(search, results, maxResults);
        return results.slice(0, maxResults);
    }
    /**
     * Recursively calls findContentItems on all children and adds videos and articles with
     * a matching title to the results array.
     */
    findContentItemsInternal(search, results, maxResults) {
        if (results.length > maxResults) {
            return;
        }

        _(this.getContentItems().models).each((item) => {
            // TODO: Possibly search descriptions too?
            // TODO: We could potentially index the transcripts for a really good search
            // TODO: Tokenize the `search` string and do an indexOf for each token
            // TODO: Allow for OR/AND search term strings
            if (item.getTitle() &&
                    item.getTitle().toLowerCase().indexOf(search.toLowerCase()) !== -1) {
                results.push(item);
            }
        });

        _(this.getTopics().models).each((item) => {
            item.findContentItemsInternal(search, results, maxResults);
        });
    }
    /**
     * Recursively parses a topic with 2 extra properties:
     *  contentItems: A collection: ContentList which contains ContentModel instances
     *  topics: A collection: TopicList which contains TopicModel instances
     */
    parse(response) {
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
                var kind = item[Minify.getShortName("kind")];
                return kind === Minify.getShortValue("kind", "Video") ||
                    kind === Minify.getShortValue("kind", "Article") ||
                    kind === Minify.getShortValue("kind", "Exercise");
            });
            response.downloadCount = 0;
            response.topics = new TopicList(topics, {parse: true});
            response.contentItems = new ContentList(contentItems, {parse: true});
            TopicTree.allContentItems.push.apply(TopicTree.allContentItems, response.contentItems.models);
        };

        parseTopicChildren(response);
        return response;
    }
    isTopic() {
        return true;
    }
}

export class ContentModel extends TopicTreeBase {
    constructor(data, extra) {
        super(data, extra);
    }
    isContent() {
        return true;
    }
    isDownloaded() {
        return !!this.get("downloaded");
    }
    setDownloaded(downloaded) {
        this.set("downloaded", downloaded);
    }
    getContentMimeType() {
        return this.isVideo ? "video/mp4" : "text/html";
    }
    isCompleted() {
        return this.get("completed");
    }
    isStarted() {
        return this.get("started");
    }
    getYoutubeId() {
        return this.get(Minify.getShortName("youtube_id"));
    }
    getPoints() {
        return this.get("points") || 0;
    }
    getName() {
        return this.get(Minify.getShortName("name"));
    }
    getKAUrl() {
        var value = this.get(Minify.getShortName("ka_url"));
        if (!value) {
            return null;
        }
        if (value.substring(0, 4) !== "http") {
            value = "http://www.khanacademy.org/video/" + value;
        }
        return value;
    }
    getDownloadUrl() {
        var value = this.get(Minify.getShortName("download_urls"));
        if (!value) {
            return null;
        }
        if (value.substring(0, 4) !== "http") {
            value = "http://fastly.kastatic.org/KA-youtube-converted/" + value + ".mp4";
        }
        return value;
    }
    getDuration() {
        return this.get(Minify.getShortName("duration"));
    }
    getFilename() {
        return this.get(Minify.getShortName("file_name"));
    }
    // A newer perseus style exercise
    isPerseusExercise() {
        return !this.get(Minify.getShortName("file_name"));
    }
    // An older style exercise pointed to by the khan-exercises submodule
    isKhanExercisesExercise() {
        return !!this.get(Minify.getShortName("file_name"));
    }
}

export class VideoModel extends ContentModel {}
export class ArticleModel extends ContentModel {}
export class ExerciseModel extends ContentModel {}
export class TopicList extends TopicTreeCollection {
    constructor(models, options={}) {
        options.modelClass = TopicModel;
        super(models, options);
    }
}
export class ContentList extends TopicTreeCollection {
    constructor(models, options={}) {
        options.modelClass = ContentModel;
        super(models, options);
    }
    isContentList() {
        return true;
    }
}

class UserModel extends BaseModel {
    getLocalStorageName(base) {
        return base + "-uid-" + (this.get("userInfo").nickname ||
            this.get("userInfo").username);
    }
    completedEntitiesLocalStorageName() {
        return this.getLocalStorageName("completed");
    }
    startedEntitiesLocalStorageName() {
        return this.getLocalStorageName("started");
    }
    userVideosLocalStorageName() {
        return this.getLocalStorageName("userVideos");
    }
    userExercisesLocalStorageName() {
        return this.getLocalStorageName("userExercises");
    }
    init() {
        if (!this.isSignedIn()) {
            Util.log("Not signed in, won't get user info!");
            this.initialized = true;
            return Promise.resolve();
        }

        // If we have cached info, use that, otherwise fall back
        // to refreshing the user info.
        var userInfo = localStorage.getItem(this.userInfoLocalStorageName);
        if (userInfo) {
            this.set("userInfo", JSON.parse(userInfo));
        }

        if (this.loadLocalStorageData()) {
            Util.log("User info being refreshed from cache");
        } else {
            Util.log("User info being refreshed from server");
            this.refreshLoggedInInfo(false);
        }

        this.initialized = true;
        return Promise.resolve();
    }
    signIn() {
        return new Promise((resolve, reject) => {
            APIClient.signIn().then(() => {
                //this.refreshLoggedInInfo(); <-- Since we currently change the
                // window.locaiton, we dont' get a callback from this promise.
                // So there's no point to refreshLoggedInInfo.  Commenting for
                // extra emphasis.

                // We don't need to wait for the result of the
                // refreshLoggedInInfo promise, just resolve right away.
                resolve();
            }).catch(() => {
                reject();
            });
        });
    }
    signOut() {
        // Unbind user specific data from the topic tree
        this.syncStartedToTopicTree(false);
        this.syncCompletedToTopicTree(false);
        this.syncUserVideoProgressToTopicTree(false);
        this.syncUserExerciseProgressToTopicTree(false);

        // Remove userInfo from the model and clear its local storage
        this.unset("userInfo");
        localStorage.removeItem(this.userInfoLocalStorageName);

        return APIClient.signOut();
    }
    isSignedIn() {
        return APIClient.isSignedIn();
    }
    loadLocalStorageData() {
        // We can't obtain the other local storage values if this is not present!
        if (!this.get("userInfo")) {
            return false;
        }

        var completedEntityIds = localStorage.getItem(this.completedEntitiesLocalStorageName());
        if (completedEntityIds) {
            this.set("completedEntityIds", JSON.parse(completedEntityIds));
            this.syncCompletedToTopicTree(true);
        }
        var startedEntityIds = localStorage.getItem(this.startedEntitiesLocalStorageName());
        if (startedEntityIds) {
            this.set("startedEntityIds", JSON.parse(startedEntityIds));
            this.syncStartedToTopicTree(true);
        }
        var userVideos = localStorage.getItem(this.userVideosLocalStorageName());
        if (userVideos) {
            userVideos = JSON.parse(userVideos);
            this.set("userVideos", userVideos);
            this.syncUserVideoProgressToTopicTree(true);
        }
        var userExercises = localStorage.getItem(this.userExercisesLocalStorageName());
        if (userExercises) {
            userExercises = JSON.parse(userExercises);
            this.set("userExercises", userExercises);
            this.syncUserExerciseProgressToTopicTree(true);
        }
        return this.get("completedEntityIds") &&
            this.get("startedEntityIds") &&
            this.get("userVideos") &&
            this.get("userExercises");
    }
    syncCompletedToTopicTree(set) {
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
    }
    syncStartedToTopicTree(set) {
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
    }
    syncUserVideoProgressToTopicTree(set) {
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
        Util.log("getUserVideos entities: %o", this.get("userVideos"));
    }
    syncUserExerciseProgressToTopicTree(set) {
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
        Util.log("getUserExercises entities: %o", this.get("userExercises"));
    }
    saveUserInfo() {
        if (this.get("userInfo")) {
            localStorage.removeItem(UserModel.userInfoLocalStorageName);
            localStorage.setItem(UserModel.userInfoLocalStorageName, JSON.stringify(this.get("userInfo")));
        }
    }
    saveStarted() {
        if (this.get("startedEntityIds")) {
            localStorage.removeItem(this.startedEntitiesLocalStorageName());
            localStorage.setItem(this.startedEntitiesLocalStorageName(), JSON.stringify(this.get("startedEntityIds")));
        }
    }
    saveCompleted() {
        if (this.get("completedEntityIds")) {
            localStorage.removeItem(this.completedEntitiesLocalStorageName());
            localStorage.setItem(this.completedEntitiesLocalStorageName(), JSON.stringify(this.get("completedEntityIds")));
        }
    }
    saveUserVideos() {
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
        localStorage.removeItem(this.userVideosLocalStorageName());
        localStorage.setItem(this.userVideosLocalStorageName(), JSON.stringify(userVideos));
    }
    saveUserExercises() {
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
        localStorage.removeItem(this.userExercisesLocalStorageName());
        localStorage.setItem(this.userExercisesLocalStorageName(), JSON.stringify(userExercises));
    }
    refreshLoggedInInfo(forceRefreshAllInfo) {
        return new Promise((resolve, reject) => {
            if (!this.isSignedIn()) {
                return resolve();
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
                this.saveUserInfo();

                if (!forceRefreshAllInfo && this.loadLocalStorageData()) {
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
                this.syncStartedToTopicTree(true);
                this.syncCompletedToTopicTree(true);

                // Save to local storage
                this.saveStarted();
                this.saveCompleted();

                return APIClient.getUserVideos();
            }).then((userVideosResults) => {
                // The call is needed for the last second watched and points of each watched item.
                this.set("userVideos", userVideosResults);
                this.syncUserVideoProgressToTopicTree(true);
                this.saveUserVideos();

                return APIClient.getUserExercises();
            }).then((userExercisesResults) => {
                this.set("userExercises", userExercisesResults);
                this.syncUserExerciseProgressToTopicTree(true);
                this.saveUserExercises();
                resolve();
            }).catch(() => {
                reject();
            });
        });
    }
    reportArticleRead(article) {
        return new Promise((resolve, reject) => {
            APIClient.reportArticleRead(article.getId()).then((result) => {
                Util.log("reported article complete: %o", result);
                article.set({
                    completed: true
                });

                var index = this.get("completedEntityIds").indexOf(article.getId());
                if (index === -1) {
                    this.get("completedEntityIds").push(article.getId());
                }
                this.saveCompleted();
                resolve(result);
            }).catch(() => {
                reject();
            });
        });
    }
}
UserModel.userInfoLocalStorageName = "userInfo-3";


// Just really a model to hold temporary app state
// that should not persist after it is changed on app
// restarts.
// For example we use this for isDownloadingTopic from
// Downloads so we can easily adjust views based on that state
// changing.
export const TempAppState = new BaseModel({
    defaults: {
        currentDownloadRequest: null,
        isTopicDownloading: false,
        showingStatus: false,
    }
});
