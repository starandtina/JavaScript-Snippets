 // http://stackoverflow.com/a/472729
 function qualifyURL(href) {
   var el = document.createElement('div');
   var escapedURL = href
     .split('&').join('&amp;')
     .split('<').join('&lt;')
     .split('"').join('&quot;');

   el.innerHTML = '<a href="' + escapedURL + '">x</a>';

   return el.firstChild.href;
 }
