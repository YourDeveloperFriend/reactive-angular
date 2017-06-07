'use strict';

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function ngIfDirective(template, model$, output$) {
  var attr = template.getAttribute('*ngif');
  template.removeAttribute('*ngif');
  var view = View(template, model$, output$);
  return {
    elements$: model$[attr].withLatestFrom(view.elements$).map(function (_ref) {
      var _ref2 = _slicedToArray(_ref, 2);

      var value = _ref2[0];
      var elements = _ref2[1];
      return value ? elements : null;
    }),
    domChanges$: view.domChanges$
  };
}

function customComponent(template, model$, parentOutput$) {
  var input = {};
  var output = {};
  _.forEach(template.attributes, function (value, name) {
    var eventName = surrounds(name, '()');
    if (eventName) {
      output[eventName] = value;
    } else {
      var inputName = surrounds(name, '[]');
      if (inputName) {
        input[inputName] = model$[value];
      } else {
        input[name] = Observable.just(value);
      }
    }
  });
  var ComponentClass = template.tagName === 'APP' ? AppComponent : ChildComponent;
  var instance = ComponentClass(input);
  _.forEach(output, function (value, key) {
    instance[key].subscribe(parentOutput$[value]);
  });
  return {
    elements$: instance.elements$,
    domChanges$: instance.domChanges$
  };
}
function ngForDirective(template, model$, output$) {
  var config = template.attributes['*ngfor'];

  var _config$match = config.match(/^let (.*) of (.*)$/);

  var _config$match2 = _slicedToArray(_config$match, 3);

  var key = _config$match2[1];
  var varName = _config$match2[2];

  delete template.attributes['*ngfor'];
  var views$ = model$[varName].scan(function (previous, values) {
    return values.map(function (value, i) {
      return previous && previous[i] || View(template, _.merge({}, model$, _defineProperty({}, key, model$[varName].pluck(i).startWith(value))));
    });
  }, []);
  return {
    elements$: views$.flatMapLatest(function (views) {
      return Observable.combineLatest(_.map(views, 'elements$'));
    }),
    domChanges$: views$.flatMapLatest(function (views) {
      return Observable.merge(_.map(views, 'domChanges$'));
    })
  };
}