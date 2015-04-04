const TopicTreeHelper = require("../data/topic-tree-helper"),
    APIClient = require("../apiclient"),
    Immutable = require("immutable"),
    {isArticle} = require("../data/topic-tree-helper"),
    Storage = require("../storage");

const reportArticleRead = (topicTreeCursor) => {
    return new Promise((resolve, reject) => {
        if (!models.CurrentUser.isSignedIn()) {
            return setTimeout(resolve, 0);
        }

        APIClient.reportArticleRead(TopicTreeHelper.getId(topicTreeCursor)).then((result) => {
            Util.log("reported article complete: %o", result);
            article.set({
                completed: true
            });

            /*
            // TODO: Re-enable when completed entities is figured out in new data model
            var index = this.get("completedEntityIds").indexOf(article.getId());
            if (index === -1) {
                this.get("completedEntityIds").push(article.getId());
            }
            this._saveCompleted();
            */
            resolve(result);
        }).catch(() => {
            reject();
        });
    });
};

const setArticleContent = (topicTreeCursor, optionsCursor, result) => optionsCursor.setIn(
    ["temp", TopicTreeHelper.getKey(topicTreeCursor)],
    Immutable.fromJS({
        error: !!result,
        content: result,
    }));

const loadIfArticle = (optionsCursor) => (topicTreeCursor) => {
    if (!isArticle(topicTreeCursor)) {
        return topicTreeCursor;
    }

    if (TopicTreeHelper.isDownloaded(topicTreeCursor)) {
        this.p1 = Storage.readText(TopicTreeHelper.getId(topicTreeCursor)).then((result) => {
            Util.log("rendered article from storage");
            setArticleContent(topicTreeCursor, optionsCursor, result);
        });
    } else {
        this.p1 = APIClient.getArticle(TopicTreeHelper.getId(topicTreeCursor)).then((result) => {
            Util.log("rendered article from web");
            setArticleContent(topicTreeCursor, optionsCursor, result);
        }).catch(() => {
            setArticleContent(topicTreeCursor, optionsCursor);
        });
    }
    return topicTreeCursor;
};

module.exports = {
    reportArticleRead,
    loadIfArticle,
};
