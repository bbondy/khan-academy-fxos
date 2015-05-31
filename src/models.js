"strict";

import _ from "underscore";
import Util from "./util";
import APIClient from "./apiclient";
import Storage from "./storage";
import Minify from "./minify";

// This whole file is going away, don't worry about linting it.
/*eslint-disable */

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
            this.models = _.map(this.models, (x) => new options.modelClass(x, {parse: true})); // eslint-disable-line
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

export class TopicModel extends TopicTreeBase {

    constructor(data, extra) {
        super(data, extra);
    }

    getTopics() {
        let topics = new TopicList(this.get(Minify.getShortName("children")).filter((child) =>
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
        for (let i = 0; i < this.getContentItems().models.length; i++) {
            var model = this.getContentItems().models[i];
            if (!predicate || predicate(model)) {
                yield model;
            }
        }

        for (let i = 0; i < this.getTopics().models.length; i++) {
            yield* this.getTopics().models[i].enumChildrenGenerator(predicate);
        }
    }
    /**
     * Returns the total count of content items underneath the specified topic
     */
    getChildCount() {
        var count = 0;
        this.enumChildren(() => {
            count++;
        });
        return count;
    }
    /**
     * Returns the total count of content items underneath the specified topic
     * that is not downloaded
     */
    getChildNotDownloadedCount(topicTreeNode) {
        var count = 0;
        this.enumChildren((topicTreeNode) => count++, (model) => !model.isDownloaded());
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

class TopicTreeCollection extends BaseCollection {
    constructor(models, options) {
        super(models, options);
    }
}

export class TopicList extends TopicTreeCollection {
    constructor(models, options={}) {
        options.modelClass = TopicModel;
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

export class ContentList extends TopicTreeCollection {
    constructor(models, options={}) {
        options.modelClass = ContentModel;
        super(models, options);
    }
    isContentList() {
        return true;
    }
}

/*eslint-enable */
