function ajaxCall(url) {
  var req = new XMLHttpRequest();
  req.onload = function (e) {
    // results.innerHTML = e.target.response.message;
  };
  req.open('GET', url + '?' + new Date().getTime(), true);
  req.responseType = 'json';
  req.send();
}
