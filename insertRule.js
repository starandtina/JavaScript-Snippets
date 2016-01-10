// We all know that we can grab a NodeList from a selector (via document.querySelectorAll) and 
// give each of them a style, but what's more efficient is setting that style to a selector (like you do in a stylesheet)

var sheet = (function () {
  // Create the <style> tag
  var style = document.createElement('style');

  // Add a media (and/or media query) here if you'd like!
  // style.setAttribute('media', 'screen')
  // style.setAttribute('media', 'only screen and (max-width : 1024px)')

  // WebKit hack :(
  style.appendChild(document.createTextNode(''));

  // Add the <style> element to the page
  document.head.appendChild(style);

  return style.sheet;
})();

// Usage
sheet.insertRule("header { float: left; opacity: 0.8; }", 1);

// This is especially useful when working on a dynamic, AJAX-heavy site.  
// If you set the style to a selector, you don't need to account for styling each element 
// that may match that selector (now or in the future).
