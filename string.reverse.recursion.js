function reverse(str) {
  if (str.length <= 1) {
    return str;
  }
  // stringObject.substr(start,length)
  return reverse(str.substr(1)) + str[0];
}
