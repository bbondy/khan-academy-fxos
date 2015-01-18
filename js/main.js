/* @flow */

"strict";

define(["jquery", "react", "util", "models", "apiclient", "cache", "storage", "downloads", "chrome"],
        function($, React, Util, models, APIClient, Cache, Storage, Downloads, chromeViews) {

  /*
    // I thought this was supposed to be needed, but it seems to not be needed
    // I think the manifest permissions implies this for us.
    $.ajaxSetup({
        xhr: function() {return new window.XMLHttpRequest({mozSystem: true});}
    });
  */

    // TODO: remove, just for easy inpsection
    window.APIClient = APIClient;
    window.Util = Util;
    window.models = models;

    $("body").bind("contextmenu", function(e) {
        Util.log("contextmenu!");
        e.preventDefault();
    });

    // App is moving to background
    $(document).bind("visibilitychange", function(e) {
        if (document.hidden) {
            Util.log("visibility changing (hide)");
            // TODO(bbondy): Try to free up resources here for a smaller chance
            // of getting discarded.
        } else {
            Util.log("visibility changing (show)");
        }
    });


    var MainView = chromeViews.MainView;
    var mountNode = document.getElementById("app");

    // Render the main app chrome
    var mainView = React.render(<MainView/>, mountNode);

    // Init everything
    Storage.init().then(function() {
        return APIClient.init();
    }).then(function() {
        return models.TopicTree.init();
    }).then(function() {
        return $.when(Downloads.init(), Cache.init(), models.AppOptions.fetch());
    }).then(function() {
        // We don't want to have to wait for results, so just start this and don't wait
        models.CurrentUser.init();

        // Start showing the topic tree
        mainView.setProps({model: models.TopicTree.root});
        mainView.setState({currentModel: models.TopicTree.root});
    }).fail((error) => {
        alert(error);
        Util.quit();
    });

});
