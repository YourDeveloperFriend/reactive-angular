'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var oParser = new DOMParser();

window.parse = function parse(str) {
  return parseDOM(oParser.parseFromString(str, 'text/html').body.children);
};

function parseDOM(children) {
  return _.map(children, function (child) {
    if (child.type === 3) {
      return child.textContent;
    } else {
      var _ref2;

      return {
        name: child.tagName,
        attributes: (_ref2 = _).merge.apply(_ref2, _toConsumableArray(_.map(child.attributes, function (attribute) {
          return _defineProperty({}, attribute.name, attribute.value);
        }))),
        children: parseDOM(child.childNodes)
      };
    }
  });
}