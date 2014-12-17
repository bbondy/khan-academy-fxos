require(["react-dev", "util", "models", "apiclient", "storage", "downloads", "cache", "minify", "notifications", "status", "views", "video", "article"],
        function(React, Util, models, APIClient, Storage, Downloads, Cache, Minify, Notifications, Status, Views, VideoViews, ArticleViews) {

    var TestUtils = React.addons.TestUtils;
    var Simulate = TestUtils.Simulate;
    var mainView;

    var clickBack = function() {
        var backButton = TestUtils.findRenderedComponentWithType(mainView, Views.BackButton);
        var backLink = TestUtils.findRenderedDOMComponentWithTag(backButton, "a").getDOMNode();
        Simulate.click(backLink);
    };

    var search = function(term) {
        var topicSearch = TestUtils.findRenderedComponentWithType(mainView, Views.TopicSearch);
        var input = TestUtils.findRenderedDOMComponentWithTag(topicSearch, "input").getDOMNode();
        Simulate.change(input, { target: { value: term} });
    };

    var MainView = React.createFactory(Views.MainView);
    var mountNode = document.getElementById("app");
    $(mountNode).empty();

    QUnit.asyncTest("test react views", function(assert) {

        // Init everything
        Storage.init().then(function(){
          return APIClient.init();
        }).then(function() {
            return models.TopicTree.init();
        }).then(function() {
            return $.when(Downloads.init(), Cache.init(), models.AppOptions.fetch());
        }).then(function() {
            // We don't want to have to wait for results, so just start this and don't wait
            models.CurrentUser.init();

            mainView = TestUtils.renderIntoDocument(MainView({
                model: models.TopicTree.root
            }));

            var mainViewElements = ["header-title", "search", "icon-menu",
                "topic-list-container", "sidebar"];
            mainViewElements.forEach(function(c) {
                TestUtils.findRenderedDOMComponentWithClass(mainView, c);
            });

            // Make sure topic tree items display
            var topicItems = TestUtils.scryRenderedComponentsWithType(mainView, Views.TopicListItem);
            assert.ok(topicItems.length >= 10);
            assert.ok(_(topicItems).some(function(topicItem) {
                return topicItem.props.topic.getTitle() === "Math";
            }));
            assert.ok(!_(topicItems).some(function(topicItem) {
                return topicItem.props.topic.getTitle() === "Arithmetic";
            }));

            // Make sure topic tree navigation works
            var link = TestUtils.findRenderedDOMComponentWithTag(topicItems[0], "a");
            Simulate.click(link.getDOMNode());
            topicItems = TestUtils.scryRenderedComponentsWithType(mainView, Views.TopicListItem);
            assert.ok(_(topicItems).some(function(topicItem) {
                return topicItem.props.topic.getTitle() === "Arithmetic";
            }));
            assert.ok(!_(topicItems).some(function(topicItem) {
                return topicItem.props.topic.getTitle() === "Math";
            }));

            //Make sure that the back button works
            clickBack();
            topicItems = TestUtils.scryRenderedComponentsWithType(mainView, Views.TopicListItem);
            assert.ok(_(topicItems).some(function(topicItem) {
                return topicItem.props.topic.getTitle() === "Math";
            }));
            assert.ok(!_(topicItems).some(function(topicItem) {
                return topicItem.props.topic.getTitle() === "Arithmetic";
            }));

            // Test topic search
            search("monkey");
            var videoItems = TestUtils.scryRenderedComponentsWithType(mainView, Views.VideoListItem);
            //assert.ok(videoItems.length >= 2);
            assert.ok(_(videoItems).some(function(videoItem) {
                return videoItem.props.video.getTitle() === "Monkeys for a party";
            }));
            assert.ok(_(videoItems).some(function(videoItem) {
                return videoItem.props.video.getTitle() === "Harlow monkey experiments";
            }));

            // Test that video view render with transcripts
            models.AppOptions.set("showTranscripts", true);
            link = TestUtils.scryRenderedDOMComponentsWithTag(videoItems[0], "a")[0];
            Simulate.click(link.getDOMNode());
            // Check to make sure the sidebar contains: Download Video, Open in Website, Share
            var sidebar = TestUtils.findRenderedComponentWithType(mainView, Views.Sidebar);
            if (Util.isFirefoxOS()) {
                TestUtils.findRenderedDOMComponentWithClass(sidebar, "download-video-link");
                TestUtils.findRenderedDOMComponentWithClass(sidebar, "share-link");
            } else {
                assert.strictEqual(TestUtils.scryRenderedDOMComponentsWithClass(sidebar, "download-video-link").length, 0);
                assert.strictEqual(TestUtils.scryRenderedDOMComponentsWithClass(sidebar, "share-link").length, 0);
            }
            TestUtils.findRenderedDOMComponentWithClass(sidebar, "open-in-website-link");
            var videoViewer = TestUtils.findRenderedComponentWithType(mainView, VideoViews.VideoViewer);
            return videoViewer.videoCreatedPromise;
        }).then(function() {
            if (models.CurrentUser.isSignedIn()) {
                TestUtils.findRenderedDOMComponentWithClass(mainView, "energy-points"); // Only if signed in
            } else {
                assert.strictEqual(TestUtils.scryRenderedDOMComponentsWithClass(mainView, "energy-points").length, 0);
            }
            var videoViewer = TestUtils.findRenderedComponentWithType(mainView, VideoViews.VideoViewer);
            assert.ok(videoViewer._getVideoDOMNode());
            return videoViewer.transcriptPromise;
        }).then(function() {
            var videoViewer = TestUtils.findRenderedComponentWithType(mainView, VideoViews.VideoViewer);
            var transcriptViewer = TestUtils.findRenderedComponentWithType(videoViewer, VideoViews.TranscriptViewer);
            var transcriptItems = TestUtils.scryRenderedComponentsWithType(transcriptViewer, VideoViews.TranscriptItem);
            assert.ok(transcriptItems.length > 0);
            clickBack();

            // Make sure a video with transcript option off has no transcript promise
            models.AppOptions.set("showTranscripts", false);
            search("monkey");
            var videoItems = TestUtils.scryRenderedComponentsWithType(mainView, Views.VideoListItem);
            link = TestUtils.scryRenderedDOMComponentsWithTag(videoItems[0], "a")[0];
            Simulate.click(link.getDOMNode());
            videoViewer = TestUtils.findRenderedComponentWithType(mainView, VideoViews.VideoViewer);
            assert.ok(!videoViewer.transcriptPromise);
            models.AppOptions.set("showTranscripts", true);
            clickBack();

            // Test that an article renders
            search("Oscillation with angular velocity");
            var articleItem = TestUtils.findRenderedComponentWithType(mainView, Views.ArticleListItem);
            link = TestUtils.scryRenderedDOMComponentsWithTag(articleItem, "a")[0];
            Simulate.click(link.getDOMNode());
            TestUtils.findRenderedDOMComponentWithTag(mainView, "article");
            var sidebar = TestUtils.findRenderedComponentWithType(mainView, Views.Sidebar);
            if (Util.isFirefoxOS()) {
                TestUtils.findRenderedDOMComponentWithClass(sidebar, "download-article-link");
            } else {
                assert.strictEqual(TestUtils.scryRenderedDOMComponentsWithClass(sidebar, "download-article-link").length, 0);
            }
            //assert.strictEqual(TestUtils.scryRenderedDOMComponentsWithClass(sidebar, "open-in-website-link").length, 0);
            //assert.strictEqual(TestUtils.scryRenderedDOMComponentsWithClass(sidebar, "share-link").length, 0);
            var articleViewer = TestUtils.findRenderedComponentWithType(mainView, ArticleViews.ArticleViewer);
            return articleViewer.p1;
        }).then(function() {

            // View setings works
            models.AppOptions.reset();
            sidebar = TestUtils.findRenderedComponentWithType(mainView, Views.Sidebar);
            var viewSettingsLink = TestUtils.findRenderedDOMComponentWithClass(sidebar, "view-settings-link").getDOMNode();
            Simulate.click(viewSettingsLink);
            TestUtils.findRenderedDOMComponentWithClass(mainView, "settings").getDOMNode();

            // showDownloadsOnly setting
            var showDownloadsSetting = TestUtils.findRenderedDOMComponentWithClass(mainView, "show-downloads-setting").getDOMNode();
            assert.strictEqual(models.AppOptions.get("showDownloadsOnly"), false);
            Simulate.change(showDownloadsSetting, { target: { checked: true} });
            assert.strictEqual(models.AppOptions.get("showDownloadsOnly"), true);

            // showTranscripts setting
            var showTranscriptsSetting = TestUtils.findRenderedDOMComponentWithClass(mainView, "show-transcripts-setting").getDOMNode();
            assert.strictEqual(models.AppOptions.get("showTranscripts"), true);
            Simulate.change(showTranscriptsSetting, { target: { checked: false} });
            assert.strictEqual(models.AppOptions.get("showTranscripts"), false);

            // setPlaybackRate
            var playbackRateSetting = TestUtils.findRenderedDOMComponentWithClass(mainView, "set-playback-speed-setting").getDOMNode();
            assert.strictEqual(models.AppOptions.get("playbackRate"), 100);
            Simulate.change(playbackRateSetting, { target: { value: 3} });
            assert.strictEqual(models.AppOptions.get("playbackRate"), 200);

            // test the reset button
            var resetButton = TestUtils.findRenderedDOMComponentWithClass(mainView, "reset-button").getDOMNode();
            var oldConfirm = window.confirm;
            window.confirm = function() { return true; };
            Simulate.click(resetButton);
            assert.strictEqual(models.AppOptions.get("playbackRate"), 100);
            assert.strictEqual(models.AppOptions.get("showTranscripts"), true);
            assert.strictEqual(models.AppOptions.get("showDownloadsOnly"), false);
            window.confirm = oldConfirm;

            clickBack();

            // View downloads works
            sidebar = TestUtils.findRenderedComponentWithType(mainView, Views.Sidebar);
            if (Util.isFirefoxOS()) {
                var viewDownloadsLink = TestUtils.findRenderedDOMComponentWithClass(sidebar, "view-downloads-link").getDOMNode();
                Simulate.click(viewDownloadsLink);
                TestUtils.findRenderedDOMComponentWithClass(mainView, "downloads").getDOMNode();
                clickBack();
            }

            // Open support link exists
            sidebar = TestUtils.findRenderedComponentWithType(mainView, Views.Sidebar);
            TestUtils.findRenderedDOMComponentWithClass(sidebar, "open-support-link");

            ////////////////////
            // Logged in only tests
            ////////////////////

            if (!models.CurrentUser.isSignedIn()) {
                alert("Not signed in, not all tests were run.");
                QUnit.start();
                return;
            }

            // Make sure View Profile works correctly
            sidebar = TestUtils.findRenderedComponentWithType(mainView, Views.Sidebar);
            var viewProfileLink = TestUtils.findRenderedDOMComponentWithClass(sidebar, "view-profile-link").getDOMNode();
            Simulate.click(viewProfileLink);
            TestUtils.findRenderedDOMComponentWithClass(mainView, "profile").getDOMNode();
            TestUtils.findRenderedDOMComponentWithClass(mainView, "username").getDOMNode();
            TestUtils.findRenderedDOMComponentWithClass(mainView, "points-header").getDOMNode();
            TestUtils.findRenderedDOMComponentWithClass(mainView, "energy-points-profile").getDOMNode();
            assert.strictEqual(TestUtils.scryRenderedDOMComponentsWithClass(mainView, "badge-category-count").length, 6);
            assert.strictEqual(TestUtils.scryRenderedDOMComponentsWithClass(mainView, "badge-category-icon").length, 6);
            clickBack();
            QUnit.start();
        }).fail(function(error) {
            if (error) {
                Util.warn("Promise failed: " + error);
            } else {
                Util.warn("Promise failed");
            }
        });
    });
});
