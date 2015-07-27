function map(arr, fn) {
  if (arr.length === 0) {
    return [];
  }
  return [fn(arr[0])].concat(map(arr.slice(1), fn));
}
