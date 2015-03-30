var Downloads = require("../downloads"),
    TopicTreeHelper = require("../data/topic-tree-helper"),
    Downloads = require("../downloads"),
    Util = require("../util"),
    { getDomainTopicTreeCursor, isPaneShowing } = require("../data/nav-info"),
    Notifications = require("../notifications"),
    Status = require("../status"),
    models = require("../models");


const onClickContentItemFromDownloads = (navInfoCursor) => (topicTreeCursor) => navInfoCursor.merge({
    topicTreeCursor,
    showProfile: false,
    showDownloads: false,
    showSettings: false,
    wasLastDownloads: true,
    lastTopicTreeCursor: navInfoCursor.get("lastTopicTreeCursor")
});

const onClickContentItem = (navInfoCursor) => (topicTreeCursor) => navInfoCursor.merge({
    topicTreeCursor,
    showProfile: false,
    showDownloads: false,
    showSettings: false
});

const onClickTopic = (navInfoCursor) => (newTopicTreeCursor) =>
    navInfoCursor.merge({
        topicTreeCursor: newTopicTreeCursor,
        domainTopicTreeCursor: getDomainTopicTreeCursor(navInfoCursor, newTopicTreeCursor),
        navStack: navInfoCursor.get("navStack").valueOf().unshift(newTopicTreeCursor),
        showProfile: false,
        showDownloads: false,
        showSettings: false,
        wasLastDownloads: false
    });

//TODO used to call: this.forceUpdate();
const onClickSignin = () => APIClient.signIn();
//TODO used to call: this.forceUpdate();
const onClickSignout = () => models.CurrentUser.signOut();
const openUrl = (url) => {
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
const onClickSupport = () => openUrl("https://khanacademy.zendesk.com/hc/communities/public/topics/200155074-Mobile-Discussions");
const onClickCancelDownloadContent = () => {
    if (!confirm(l10n.get("cancel-download-warning"))) {
        return;
    }
    Downloads.cancelDownloading();
};




const onClickProfile = (navInfoCursor) => () => navInfoCursor.merge({
    showProfile: true,
    showDownloads: false,
    showSettings: false,
    wasLastDownloads: false
});

const onClickDownloads = (navInfoCursor) => () => navInfoCursor.merge({
    showDownloads: true,
    showProfile: false,
    showSettings: false,
    wasLastDownloads: false
});

const onClickSettings = (navInfoCursor) => () => navInfoCursor.merge({
    showDownloads: false,
    showProfile: false,
    showSettings: true,
    wasLastDownloads: false
});

const onTopicSearch = (navInfoCursor) => (topicSearch) => {
    if (!topicSearch) {
        navInfoCursor.merge({
            topicTreeCursor: navInfoCursor.get("searchingTopicTreeCursor"),
            searchingTopicTreeCursor: null
        });
        return;
    }

    var searchingTopicTreeCursor = navInfoCursor.get("searchingTopicTreeCursor");
    if (!searchingTopicTreeCursor) {
        searchingTopicTreeCursor = navInfoCursor.get("topicTreeCursor");
    }
    var results = searchingtopicTreeCursor.findContentItems(topicSearch);
    var contentList = new models.ContentList(results);
    navInfoCursor.merge({
        topicTreeCursor: contentList,
        searchingTopicTreeCursor: searchingTopicTreeCursor
    });
};

const onClickBack = (navInfoCursor, topicTreeCursor) => () => {
    // If settings or profile or ... is set, then don't show it anymore.
    // This effectively makes the topicTreeCursor be in use again.
    if (isPaneShowing(navInfoCursor)) {
        navInfoCursor.merge({
            showDownloads: false,
            showProfile: false,
            showSettings: false,
            wasLastDownloads: false
        });
        if (TopicTreeHelper.isContentList(navInfoCursor.get("topicTreeCursor"))) {
            onTopicSearch("");
        }
        return;
    }

    var newStack = navInfoCursor.get("navStack").valueOf().shift();
    navInfoCursor.merge({
        navStack: newStack,
        topicTreeCursor: newStack.peek(),
        domainTopicTreeCursor: getDomainTopicTreeCursor(navInfoCursor, newStack.peek()),
    });

    /*
    // If we were on a content item from downloads,
    // then go back to downloads.
    if (navInfoCursor.get("wasLastDownloads")) {
        onClickDownloads();
        return;
    }

    // If we have a last model set, then we're effectively
    // presisng back from the downloads screen itself.
    // The lastTopicTreeCursor is needed because the downloads pane is the
    // only pane where clicking on it can change the topicTreeCursor.
    if (navInfoCursor.get("lastTopicTreeCursor")) {
        navInfoCursor.merge({
            topicTreeCursor: navInfoCursor.get("lastTopicTreeCursor"),
            lastTopicTreeCursor: undefined,
            showDownloads: false,
            showProfile: false,
            showSettings: false,
            wasLastDownloads: false
        });
    }

    if (TopicTreeHelper.isContentList(navInfoCursor.get("topicTreeCursor"))) {
        return onTopicSearch("");
    }

    navInfoCursor.merge({
        topicTreeCursor: getParent(topicTreeCursor),
        showProfile: false,
        showDownloads: false,
        showSettings: false,
        wasLastDownloads: false
    });
    */
};

const onClickShare = (topicTreeCursor) => () => new window.MozActivity({
    name: "share",
    data: {
        type: "url",
        url: TopicTreeHelper.getKAUrl(topicTreeCursor)
    }
});

const onClickViewOnKA = (topicTreeCursor) => () => openUrl(TopicTreeHelper.getKAUrl(topicTreeCursor));

const onClickDeleteDownloadedContent = (topicTreeCursor) => () => Downloads.deleteContent(topicTreeCursor);

const onClickDownloadContent = (topicTreeCursor) => () => {
    var totalCount = 1;
    if (TopicTreeHelper.isTopic(topicTreeCursor)) {
        totalCount = getChildNotDownloadedCount(topicTreeCursor);
    }

    // Check for errors
    if (totalCount === 0) {
        alert(l10n.get("already-downloaded"));
        return;
    } else if (models.TempAppState.get("isDownloadingTopic")) {
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
    if (TopicTreeHelper.isTopic(topicTreeCursor)) {
        if (!confirm(l10n.get("download-remaining", {
                totalCount: totalCount,
                totalCountStr: totalCountStr
            }))) {
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
    Downloads.download(topicTreeCursor, onProgress).then((topicTreeCursor, count) => {
        var title = l10n.get("download-complete");
        var contentTitle = TopicTreeHelper.getTitle(topicTreeCursor);
        if (TopicTreeHelper.isContent(topicTreeCursor)) {
            if (TopicTreeHelper.isVideo(topicTreeCursor)) {
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






module.exports = {
    onClickContentItemFromDownloads,
    onClickContentItem,
    onClickTopic,

    onClickSignin,
    onClickSignout,
    openUrl,
    onClickSupport,
    onClickCancelDownloadContent,

    onClickProfile,
    onClickDownloads,
    onClickSettings,
    onTopicSearch,
    onClickBack,
    onClickShare,
    onClickViewOnKA,
    onClickDeleteDownloadedContent,
    onClickDownloadContent,
};
