// If you're using the animate and scrollTop methods in jQuery 
// you don't need a plugin to create a simple scroll-to-top animation

// Back to top
$('a.top').click(function () {
  $(document.body).animate({
    scrollTop: 0
  }, 500);

  return false;
});

// <!-- Create an anchor tag -->
<a class="top" href="#">Back to top</a>

// Changing the scrollTop value changes where you wants the scrollbar to land. 
// All you're really doing is animating the body of the document throughout the course of 500 miliseconds until it scrolls all the way to the top of the document.
