// Run it from the console of myfollow page when you have loggined in Weibo
function ajaxCall(url, data) {
  var req = new XMLHttpRequest();
  req.onload = function (e) {
    console.log(JSON.parse(e.target.response));
  }
  req.open('POST', url, true);
  req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  req.send(data);
}

Array.prototype.forEach.call(document.querySelectorAll('.member_li[action-data]'), function (ele) {
  var data = ele.getAttribute('action-data');
  ajaxCall('http://weibo.com/aj/f/unfollow?ajwvr=6&__rnd=' + new Date().getTime(), data);
});
