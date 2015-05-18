import {getId, getKey, isDownloaded, isArticle} from "../data/topic-tree-helper";
import APIClient from "../apiclient";
import Immutable from "immutable";
import {editorForPath} from "../renderer";
import Storage from "../storage";
import Util from "../util";

const setArticleContent = (editArticleContent, result) =>
    editArticleContent(() => {
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
        }).catch(() => {
            setArticleContent(editArticleContent);
        });
    }
    return topicTreeNode;
};
