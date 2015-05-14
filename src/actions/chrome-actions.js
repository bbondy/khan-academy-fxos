import Downloads from "../downloads";
import {getKAUrl, isTopic, getTitle, isContent, isVideo} from "../data/topic-tree-helper";
import {onTopicSearch} from "../actions/search-actions.js";
import Util from "../util"
import { getDomainTopicTreeNode, isPaneShowing } from "../data/nav-info";
import Notifications from "../notifications";
import Status from "../status";
import {signIn, signOut} from "../user";
import {TempAppState} from "../models";

export const onClickContentItemFromDownloads = (editNavInfo) => (topicTreeNode) =>
    editNavInfo((navInfo) => navInfo.merge({
        topicTreeNode,
        showProfile: false,
        showDownloads: false,
        showSettings: false,
        wasLastDownloads: true,
        lastTopicTreeNode: navInfo.get("lastTopicTreeNode")
    }));

export const onClickContentItem = (editNavInfo) => (topicTreeNode) =>
    (editNavInfo((navInfo) => navInfo.merge({
        topicTreeNode,
        showProfile: false,
        showDownloads: false,
        showSettings: false,
        // We purposely don't reset searchingTopicTreeNode so that back will work
        // if the user hits a video after searching.
        searchResults: null,
    })), topicTreeNode);

export const onClickTopic = (editNavInfo) => (newTopicTreeNode) =>
    editNavInfo((navInfo) => navInfo.merge({
        topicTreeNode: newTopicTreeNode,
        domainTopicTreeNode: getDomainTopicTreeNode(navInfo, newTopicTreeNode),
        navStack: navInfo.get("navStack").unshift(newTopicTreeNode),
        showProfile: false,
        showDownloads: false,
        showSettings: false,
        wasLastDownloads: false,
    }));

export const onClickSignin = signIn;
export const onClickSignout = signOut;
export const openUrl = (url) => {
    if (window.MozActivity) {
        new window.MozActivity({
            name: "view",
            data: {
                type: "url",
                url: url
            }
        });
    } else {
        window.open(url, "_blank");
    }
};
export const onClickSupport = () => openUrl("https://khanacademy.zendesk.com/hc/communities/public/topics/200155074-Mobile-Discussions");
export const onClickCancelDownloadContent = () => {
    if (!confirm(l10n.get("cancel-download-warning"))) {
        return;
    }
    Downloads.cancelDownloading();
};

export const onClickProfile = (editNavInfo) => () =>
    editNavInfo((navInfo) => navInfo.merge({
        showProfile: true,
        showDownloads: false,
        showSettings: false,
        wasLastDownloads: false
    }));

export const onClickDownloads = (editNavInfo) => () =>
    editNavInfo((navInfo) => navInfo.merge({
        showDownloads: true,
        showProfile: false,
        showSettings: false,
        wasLastDownloads: false
    }));

export const onClickSettings = (editNavInfo) => () =>
    editNavInfo((navInfo) => navInfo.merge({
        showDownloads: false,
        showProfile: false,
        showSettings: true,
        wasLastDownloads: false
    }));

export const onClickBack = (topicTreeNode, navInfo, editNavInfo, editSearch) => () => {
    // If settings or profile or ... is set, then don't show it anymore.
    // This effectively makes the topicTreeNode be in use again.
    if (isPaneShowing(navInfo)) {
        return editNavInfo((navInfo) => navInfo.merge({
            showDownloads: false,
            showProfile: false,
            showSettings: false,
            wasLastDownloads: false
        }));
    }

    if (!!navInfo.get("searchResults") || !!navInfo.get("searchingTopicTreeNode")) {
        editSearch(() => "");
        return onTopicSearch(navInfo, editNavInfo)("");
    }

    var newStack = navInfo.get("navStack").shift();
    editNavInfo((navInfo) => navInfo.merge({
        navStack: newStack,
        topicTreeNode: newStack.peek(),
        domainTopicTreeNode: getDomainTopicTreeNode(navInfo, newStack.peek()),
    }));

    /*
    // If we were on a content item from downloads,
    // then go back to downloads.
    if (navInfo.get("wasLastDownloads")) {
        onClickDownloads();
        return;
    }

    // If we have a last model set, then we're effectively
    // presisng back from the downloads screen itself.
    // The lastTopicTreeNode is needed because the downloads pane is the
    // only pane where clicking on it can change the topicTreeNode.
    if (navInfo.get("lastTopicTreeNode")) {
        navInfo.merge({
            topicTreeNode: navInfo.get("lastTopicTreeNode"),
            lastTopicTreeNode: undefined,
            showDownloads: false,
            showProfile: false,
            showSettings: false,
            wasLastDownloads: false
        });
    }

    if (isContentList(navInfo.get("topicTreeNode"))) {
        return onTopicSearch("");
    }

    navInfo.merge({
        topicTreeNode: getParent(topicTreeNode),
        showProfile: false,
        showDownloads: false,
        showSettings: false,
        wasLastDownloads: false
    });
    */
};

export const onClickShare = (topicTreeNode) => () => new window.MozActivity({
    name: "share",
    data: {
        type: "url",
        url: getKAUrl(topicTreeNode)
    }
});

export const onClickViewOnKA = (topicTreeNode) => () => openUrl(getKAUrl(topicTreeNode));

export const onClickDeleteDownloadedContent = (topicTreeNode) => () => Downloads.deleteContent(topicTreeNode);

export const onClickDownloadContent = (topicTreeNode) => () => {
    var totalCount = 1;
    if (isTopic(topicTreeNode)) {
        totalCount = getChildNotDownloadedCount(topicTreeNode);
    }

    // Check for errors
    if (totalCount === 0) {
        alert(l10n.get("already-downloaded"));
        return;
    } else if (TempAppState.get("isDownloadingTopic")) {
        alert(l10n.get("already-downloading"));
        return;
    } else if (Util.isMeteredConnection()) {
        if (!confirm(l10n.get("metered-connection-warning"))) {
            return;
        }
    } else if (Util.isBandwidthCapped()) {
        if (!confirm(l10n.get("limited-bandwidth-warning"))) {
            return;
        }
    }

    // Format to string with commas
    var totalCountStr = Util.numberWithCommas(totalCount);

    // Prompt to download remaining
    if (isTopic(topicTreeNode)) {
        if (!confirm(l10n.get("download-remaining", {
                totalCount: totalCount,
                totalCountStr: totalCountStr}))) {
            return;
        }
    }

    var onProgress = (count, currentProgress, cancelling) => {
        if (cancelling) {
            Status.update(l10n.get("canceling-download"));
            return;
        }
        count = Util.numberWithCommas(count);
        var progressMessage = l10n.get("downloading-progress", {
            count: count,
            totalCount: totalCount,
            totalCountStr: totalCountStr,
            currentProgress: currentProgress
        });
        Status.update(progressMessage);
    };

    Status.start();
    var message;
    var title;
    Downloads.download(topicTreeNode, onProgress).then((topicTreeNode, count) => {
        var title = l10n.get("download-complete");
        var contentTitle = getTitle(topicTreeNode);
        if (isContent(topicTreeNode)) {
            if (isVideo(topicTreeNode)) {
                message = l10n.get("video-complete-body", {
                    title: contentTitle
                });
            } else {
                message = l10n.get("article-complete-body", {
                    title: contentTitle
                });
            }
        } else {
            // TODO: We don't want commas here so we should change the source
            // strings for all locales for count and countStr
            // count = Util.numberWithCommas(count);
            message = l10n.get("content-items-downloaded-succesfully", {
                count: count,
                title: contentTitle
            });
        }

        Status.stop();
        Notifications.info(title, message, () => {});
    }).catch((isCancel) => {
        if (isCancel) {
            title = l10n.get("download-canceled");
            message = l10n.get("content-items-downloaded-cancel");
        } else {
            title = l10n.get("download-aborted");
            message = l10n.get("content-items-downloaded-failure");
        }
        Status.stop();
        Notifications.info(title, message, () => {});
    });
};
