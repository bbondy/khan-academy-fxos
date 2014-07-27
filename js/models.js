define(["jquery", "backbone"], function() {
    var TopicModel = Backbone.Model.extend({
        url: "/knowledge-map.json",
        initialize: function() {
        },
        defaults: {
        },
        /**
         * Recursively parses a topic with 2 extra properties:
         *  vidoes: A backbone collection: VideoCollection which contains VideoModel
         *  topics: A backbone collection: topicCollection which contains TopicModel
         */
        parse: function(response){
            var parseTopicChildren = function(topic) {
                topic.children.forEach(function(item) {
                    item.parent = this;//response;
                }.bind(this));
                var topics = topic.children.filter(function(item) {
                    return item.kind === "Topic";
                });
                var videos = topic.children.filter(function(item) {
                    return item.kind === "Video";
                });
                response.topics = new TopicList(topics, {parse: true});
                response.videos= new VideoList(videos, {parse: true});
            }.bind(this);

            parseTopicChildren(response);
            return response;
        },
        isTopic: function() {//todo
            return true;
        }
    });

    var VideoModel = Backbone.Model.extend({
        initialize: function() {
        },
        defaults: {
            text: ''
        },
        isTopic: function() {//todo
            return false;
        }
    });

    var TopicList = Backbone.Collection.extend({
        model: TopicModel,
    });

    var VideoList = Backbone.Collection.extend({
        model: VideoModel
    });

    return {
        TopicModel: TopicModel,
        VideoModel: VideoModel,
        TopicList: TopicList,
        VideoList: VideoList,
    };
});
