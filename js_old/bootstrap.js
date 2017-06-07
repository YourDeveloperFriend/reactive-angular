'use strict';

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

function bootstrap($root, Component, props$) {
  var instance = Component(props$);
  var elementChanges$ = instance.elements$.map(function (elements) {
    return function ($root, previousElements) {
      if (!_.isArray(elements[0])) {
        elements = elements ? [elements] : [];
      }
      var newElements = elements.map(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2);

        var key = _ref2[0];
        var value = _ref2[1];

        return [key, getFromKey(previousElements, key) || value()];
      });
      _.forEach(previousElements, function (value, key) {
        if (!getFromKey(newElements, key)) {
          $root.removeChild(value);
        }
      });
      newElements.forEach(function (_ref3) {
        var _ref32 = _slicedToArray(_ref3, 2);

        var key = _ref32[0];
        var element = _ref32[1];
        return $root.appendChild(element);
      });
      return newElements;
    };
  });
  var domChanges = instance.domChanges$.map(function (fn) {
    return function ($root, elements) {
      fn($root.firstChild);
      return elements;
    };
  });

  var elements = [];
  Observable.merge(elementChanges$, domChanges).subscribe(function (domChange) {
    try {
      elements = domChange($root, elements);
    } catch (e) {
      console.log('error', e, e.stack);
    }
  }, function (error) {
    console.log('error', error, error.stack);
  });
}

function getFromKey(array, toFind) {
  var $el = _.find(array, function (_ref4) {
    var _ref42 = _slicedToArray(_ref4, 2);

    var key = _ref42[0];
    var value = _ref42[1];
    return key === toFind;
  });
  return $el && $el[1];
}