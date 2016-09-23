
const oParser = new DOMParser();

window.parse = function parse(str) {
  return oParser.parseFromString(str, 'text/html').body.children;
}
