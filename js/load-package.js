// TODO: Provide an async variant
module.exports = function(packageFilename) {
    // Check if the scripti s already loaded
    if (document.getElementById(packageFilename)) {
        return;
    }

    var src = "/build/" + packageFilename;
    var xhrObj = new XMLHttpRequest();
    xhrObj.open("GET", src, false);
    xhrObj.send(null);
    var s = document.createElement("script");
    s.type = "text/javascript";
    s.text = xhrObj.responseText;
    s.id =  packageFilename;
    document.getElementsByTagName("head")[0].appendChild(s);
};
