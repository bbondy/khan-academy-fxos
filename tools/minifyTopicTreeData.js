fs = require("fs"),
   Minify = require("../js/minify").Minify;

var files = ["data/topic-tree.json", "data/topic-tree-fr.json", "data/topic-tree-pt.json", "data/topic-tree-es.json"];

files.forEach(function(filename) {
    fs.readFile(filename, "utf8", function (err,data) {
        var topicTree = JSON.parse(data);

        Minify.minify(topicTree);

        // .js output
        var outputData = Minify.getOutput(topicTree);
        fs.writeFile(filename.substring(0, filename.length - 5) + ".min.js", "window.topicTree = " + outputData + ";");

        // JSON output
        //var outputData = JSON.stringify(topicTree);
        //fs.writeFile(filename.substring(0, filename.length - 5) + ".min.json", outputData);
    });
});
