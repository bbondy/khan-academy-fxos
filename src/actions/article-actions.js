import {getId, getKey, isDownloaded, isArticle} from "../data/topic-tree-helper";
import APIClient from "../apiclient";
import Immutable from "immutable";
import {editorForPath} from "../renderer";
import Storage from "../storage";
import {isSignedIn} from "../user";

export const reportArticleRead = (topicTreeNode) => {
    return new Promise((resolve, reject) => {
        if (!isSignedIn()) {
            return setTimeout(resolve, 0);
        }

        APIClient.reportArticleRead(getId(topicTreeNode)).then((result) => {
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
        return Immutable.fromJS({
            error: !result,
            content: result,
        });
    });

export const loadIfArticle = (editTempStore) => (topicTreeNode) => {
    if (!isArticle(topicTreeNode)) {
        return topicTreeNode;
    }

    const editArticleContent = editorForPath(editTempStore, getKey(topicTreeNode));
    if (isDownloaded(topicTreeNode)) {
        Storage.readText(getId(topicTreeNode)).then((result) => {
            Util.log("rendered article from storage");
            setArticleContent(editArticleContent, result);
        });
    } else {
        APIClient.getArticle(getId(topicTreeNode)).then((result) => {
            Util.log("rendered article from web: ", result);
            setArticleContent(editArticleContent, result);
        }).catch((e) => {
            setArticleContent(editArticleContent);
        });
    }
    return topicTreeNode;
};
