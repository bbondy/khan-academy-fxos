module.exports = function(packageFilename, async = true, callback = undefined) {
    // Check if the scripti s already loaded
    if (document.getElementById(packageFilename)) {
        return;
    }

    var s = document.createElement("script");
    s.id =  packageFilename;
    s.type = "text/javascript";
    s.src = "/build/" + packageFilename;
    s.async = async;
    s.onload = callback;
    document.body.appendChild(s);
};
