const _ = require("underscore"),
    TopicTreeHelper = require("../data/topic-tree-helper"),
    APIClient = require("../apiclient"),
    Immutable = require("immutable"),
    {isArticle} = require("../data/topic-tree-helper"),
    Storage = require("../storage");

const reportArticleRead = (topicTreeNode) => {
    return new Promise((resolve, reject) => {
        if (!models.CurrentUser.isSignedIn()) {
            return setTimeout(resolve, 0);
        }

        APIClient.reportArticleRead(TopicTreeHelper.getId(topicTreeNode)).then((result) => {
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

const setArticleContent = (editArticleContent, result) =>
    editArticleContent((article) => {
        return  Immutable.fromJS({
            error: !result,
            content: result,
        })
    });

const loadIfArticle = (editTempStore) => (topicTreeNode) => {
    if (!isArticle(topicTreeNode)) {
        return topicTreeNode;
    }

    const In = (path) => (edit) => (state) => state.updateIn(path, edit);
    const editArticleContent = _.compose(editTempStore, In([TopicTreeHelper.getKey(topicTreeNode)]));
    if (TopicTreeHelper.isDownloaded(topicTreeNode)) {
        this.p1 = Storage.readText(TopicTreeHelper.getId(topicTreeNode)).then((result) => {
            Util.log("rendered article from storage");
            setArticleContent(editArticleContent, result);
        });
    } else {
        this.p1 = APIClient.getArticle(TopicTreeHelper.getId(topicTreeNode)).then((result) => {
            Util.log("rendered article from web: ", result);
            setArticleContent(editArticleContent, result);
        }).catch(() => {
            setArticleContent(editArticleContent);
        });
    }
    return topicTreeNode;
};

module.exports = {
    reportArticleRead,
    loadIfArticle,
};
