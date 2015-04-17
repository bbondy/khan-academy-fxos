const APIClient = require("./apiclient");

const userInfoLocalStorageName = "userInfo-3";

const signIn = () => APIClient.signIn();
const signOut = () => {
    // Unbind user specific data from the topic tree
    // TODO
    /*
    this._syncStartedToTopicTree(false);
    this._syncCompletedToTopicTree(false);
    this._syncUserVideoProgressToTopicTree(false);
    this._syncUserExerciseProgressToTopicTree(false);

    // Remove userInfo from the model and clear its local storage
    this.unset("userInfo");
    */
    localStorage.removeItem(userInfoLocalStorageName);
    return APIClient.signOut();
};


module.exports = {
    signIn,
    signOut,
};
