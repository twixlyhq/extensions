module.exports = {
  capitalize: function (str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },
  getQueryString: function (name) {
    var result = null;
    var regexS = "[\\?&#]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec('?' + window.location.href.split('?')[1]);
    if (results != null) {
      result = decodeURIComponent(results[1].replace(/\+/g, " "));
    }
    return result;
  }
}