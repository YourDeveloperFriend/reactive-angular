'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var _Rx = Rx;
var Subject = _Rx.Subject;
var Observable = _Rx.Observable;

window.TTT = [];
window.BBB = [];

Rx.config.longStackSupport = true;

var oParser = new DOMParser();
function parse(str) {
  return parseDOM(oParser.parseFromString(str, 'text/html').body.children);
}

function parseDOM(children) {
  return _.map(children, function (child) {
    if (child.nodeType === 3) {
      return child.textContent;
    } else if (child.nodeType === 8) {
      return false;
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
  }).filter(_.identity);
}

function dig(_x5, _x6) {
  var _again = true;

  _function: while (_again) {
    var dom = _x5,
        depth = _x6;
    _again = false;

    if (depth.length === 0) {
      return dom;
    } else {
      _x5 = dom.childNodes[depth[0]];
      _x6 = depth.slice(1);
      _again = true;
      continue _function;
    }
  }
}

function getPreviousAsWell() {
  return this.scan(function (previous, values) {
    return [values, previous[0]];
  }, []);
}

function surrounds(str, surrounding) {
  var middle = surrounding.length / 2;
  var start = surrounding.substring(0, middle);
  var finish = surrounding.substring(middle);

  if (str.indexOf(start) === 0 && str.lastIndexOf(finish) === str.length - finish.length) {
    return str.substring(start.length, str.length - finish.length);
  }
}

function forEachAttribute(template, attributeFn) {
  var textNodeFn = arguments.length <= 2 || arguments[2] === undefined ? _.constant([]) : arguments[2];
  var depth = arguments.length <= 3 || arguments[3] === undefined ? [] : arguments[3];

  return forEachChild(template, function (dom, depth) {
    return _.map(dom.attributes, function (value, attr) {
      return attributeFn(value, attr, dom, depth);
    });
  }, textNodeFn, depth);
}

function forEachChild(template, childFn) {
  var textNodeFn = arguments.length <= 2 || arguments[2] === undefined ? _.constant([]) : arguments[2];
  var depth = arguments.length <= 3 || arguments[3] === undefined ? [] : arguments[3];

  var result = childFn(template, depth) || [];

  return _.reduce(template.children, function (child, i) {
    if (_.isString(child)) {
      return result.concat(textNodeFn(child));
    } else {
      return result.concat(forEachChild(child, childFn, textNodeFn, depth.concat([i])));
    }
  }, result).filter(_.identity);
}