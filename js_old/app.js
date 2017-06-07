'use strict';

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

var _set = function set(object, property, value, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent !== null) { set(parent, property, value, receiver); } } else if ('value' in desc && desc.writable) { desc.value = value; } else { var setter = desc.set; if (setter !== undefined) { setter.call(receiver, value); } } return value; };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _Rx = Rx;
var Observable = _Rx.Observable;
var Subject = _Rx.Subject;
var Component = window.Component;
var componentManager = window.componentManager;

window.bootstrap = function ($el, model, view) {

  var children = parse(str, 'text/html').body.children;
  var manager = new ComponentManager($el, _.map(children, function (child) {
    return new Component(child);
  }));

  return manager.toDOM($el);

  var directives = {
    ngFor: ngFor,
    ngIf: ngIf
  };

  var doubleBind = {
    //ngModel,
  };

  var elements = template.body.children;

  var input$ = {
    events$: new Subject(),
    on: function on(eventName) {
      return this.events$.filter(function (event) {
        return event[0] === eventName;
      }).pluck(1);
    },
    trigger: function trigger(eventName, data) {
      this.events$.onNext([eventName, data]);
    }
  };

  var output$ = model(input$);

  var $root = document.getElementById('root');

  var components = elements.map(function (element) {
    return linkChild(element, { input$: input$, output$: output$ });
  });

  var RootComponent = (function () {
    function RootComponent() {
      _classCallCheck(this, RootComponent);
    }

    _createClass(RootComponent, [{
      key: 'init',
      value: function init() {}
    }, {
      key: 'toHTMLString',
      value: function toHTMLString() {}
    }, {
      key: 'destroy',
      value: function destroy() {}
    }]);

    return RootComponent;
  })();

  function bindEvent(element, scope$, attribute) {
    var matches = attribute.name.match(/^\((.*?)\)$/);
    if (matches) {
      (function () {
        var value = attribute.value;
        element.addEventListener(matches[1], function (data) {
          scope$.input$.trigger(value, data);
        });
      })();
    }
  }

  function ngIf(element, scope$, attribute) {
    var _context;

    var parentNode = element.parentNode;
    var sibling = element.nextSibling;
    parentNode.removeChild(element);
    var comment = document.createComment('ngIf');
    sibling ? parentNode.insertBefore(comment, sibling) : parentNode.appendChild(comment);
    element.removeAttribute(attribute.name);

    var values$ = (_context = scope$.output$[attribute.value].distinctUntilChanged().withLatestFrom(scope$.output$), subscribe).call(_context, function (_ref) {
      var _ref2 = _slicedToArray(_ref, 2);

      var show = _ref2[0];
      var output = _ref2[1];

      if (show) {
        if (comment.nextSibling) {
          parentNode.insertBefore(element, comment.nextSibling);
        } else {
          parentNode.appendChild(element);
        }
        linkChild(element, {
          input$: scope$.input$,
          output$: scope$.output$.startWith(output)
        });
      } else {
        parentNode.removeChild(element);
        //unlink?
      }
    });
  }

  var ngForComponent = (function () {
    function ngForComponent(options) {
      _classCallCheck(this, ngForComponent);

      _set(Object.getPrototypeOf(ngForComponent.prototype), 'options', options, this);
    }

    _createClass(ngForComponent, [{
      key: 'init',
      value: function init() {
        this.done = new Subject();
      }
    }, {
      key: 'toHTMLString',
      value: function toHTMLString() {
        var _this = this;

        return this.options.obs.ready$.take(1).map(function () {
          // TODO
          return _this.toString();
        });
      }
    }, {
      key: 'destroy',
      value: function destroy() {}
    }]);

    return ngForComponent;
  })();

  function ngFor(element, scope$, attribute) {
    var _context2;

    var parentNode = element.parentNode;
    var sibling = element.nextSibling;
    parentNode.removeChild(element);
    var comment = document.createComment('ngFor');
    sibling ? parentNode.insertBefore(comment, sibling) : parentNode.appendChild(comment);

    var _attribute$value$match = attribute.value.match(/^let (.*?) of (.*?)$/);

    var _attribute$value$match2 = _slicedToArray(_attribute$value$match, 5);

    var key = _attribute$value$match2[1];
    var attr = _attribute$value$match2[2];
    var trackBy = _attribute$value$match2[4];

    var previousChildren = [];
    element.removeAttribute(attribute.name);

    var cached = new Map();

    return (_context2 = scope$.output$[attr].pluck('length').distinctUntilChanged().scan(function (previous, length) {
      return _.times(function (i) {
        return previous[i] || scope$.output$[attr].pluck(i).distinctUntilChanged();
      });
    }, []).map(function (observables) {
      return observables.map(function (obs, index) {
        var _$merge;

        return new ngForComponent({
          element: element,
          obs: _.merge({}, scope$.output$, (_$merge = {}, _defineProperty(_$merge, key, value), _defineProperty(_$merge, '$index', index), _$merge))
        });
      });
    }), subscribe).call(_context2, function (_ref3) {
      var _ref32 = _slicedToArray(_ref3, 2);

      var values = _ref32[0];
      var output = _ref32[1];
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = previousChildren[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var child = _step.value;

          child.parentNode.removeChild(child);
          //unlink?
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator['return']) {
            _iterator['return']();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      var nextSibling = comment.nextSibling;
      var children = values.map(function (value, index) {
        var child = previousChildren[index] || element.cloneNode(true);
        if (nextSibling) {
          parentNode.insertBefore(child, nextSibling);
        } else {
          parentNode.appendChild(child);
        }
        if (!previousChildren[index]) {
          var _output$ = scope$.output$.startWith(output).map(function (output) {
            return setImmutable(setImmutable(output, key, value), '$index', index);
          });
          linkChild(child, {
            input$: scope$.input$,
            output$: _output$
          });
        }
        return child;
      });
      previousChildren = children;
    });
  }

  function setImmutable(object, key, value) {
    return _.set(_.clone(object), key, value);
  }

  function bindNgModel(element, scope$, attribute) {
    var matches = attribute.name === '[(ngmodel)]';
    if (matches) {
      var _context3;

      (function () {
        var modelName = attribute.value;
        (_context3 = scope$.output$[modelName].distinctUntilChanged(), subscribe).call(_context3, function (value) {
          if (element.getAttribute('type') === 'checkbox') {
            element.checked = value;
          } else {
            element.value = value;
          }
        });
        if (element.getAttribute('type') === 'checkbox') {
          element.addEventListener('change', function (e) {
            scope$.input$.trigger(modelName, e.target.checked);
          });
        } else {
          element.addEventListener('keyup', function (e) {
            var start = Date.now();
            scope$.input$.trigger(modelName, e.target.value);
            console.log('end', (Date.now() - start) / 1000);
          });
        }
      })();
    }
  }

  function linkChild(element, scope$) {
    var containsDirective = false;
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = element.attributes[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var attribute = _step2.value;

        if (attribute.name.indexOf('*') === 0) {
          containsDirective = true;
        }
      }
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2['return']) {
          _iterator2['return']();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }

    if (containsDirective) {
      _.forEach(directives, function (directive, directiveName) {
        if (element.hasAttribute('*' + directiveName)) {
          directive(element, scope$, element.getAttributeNode('*' + directiveName));
        }
      });
    } else {
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = element.attributes[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var attribute = _step3.value;

          bindEvent(element, scope$, attribute);
          bindProperty(element, scope$, attribute);
          bindNgModel(element, scope$, attribute);
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3['return']) {
            _iterator3['return']();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }

      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        var _loop = function () {
          var childNode = _step4.value;

          if (childNode.nodeType === 3) {
            bindTextContent(childNode.textContent, scope$, function (value) {
              return childNode.textContent = value;
            });
          } else {
            linkChild(childNode, scope$);
          }
        };

        for (var _iterator4 = element.childNodes[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          _loop();
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4['return']) {
            _iterator4['return']();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }
    }
  }

  function bindProperty(element, scope$, attribute) {
    var matches = attribute.name.match(/^\[([^(].+)\]$/);
    if (matches) {
      var _context4;

      (function () {
        var attrName = matches[1];
        var propName = attribute.value;
        element.removeAttribute(attribute.name);
        (_context4 = scope$.output$[propName].distinctUntilChanged(), subscribe).call(_context4, function (value) {
          element[attrName] = value;
        });
      })();
    } else {
      bindTextContent(attribute.value, scope$, function (value) {
        return element.setAttribute(attribute.name, value);
      });
    }
  }

  function bindTextContent(template, scope$, cb) {
    var matches = template.match(/{{.*?}}/g);
    if (matches) {
      var _context5;

      (_context5 = Observable.combineLatest(_(matches).map(function (match) {
        var key = match.match(/{{(.*)}}/)[1];
        return key;
      }).uniq().map(function (key) {
        return scope$.output$[key].distinctUntilChanged().map(function (value) {
          return [key.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), value];
        });
      }).value()).map(function (values) {
        return values.reduce(function (template, _ref4) {
          var _ref42 = _slicedToArray(_ref4, 2);

          var key = _ref42[0];
          var value = _ref42[1];

          return template.replace(new RegExp('{{' + key + '}}', 'g'), value != null ? value : '');
        }, template);
      }), subscribe).call(_context5, cb);
    }
  }

  function combineLatestObject(obj) {
    return Observable.combineLatest(_.map(obj, function (obs$, key) {
      return obs$.map(function (value) {
        return [key, value];
      });
    }), function () {
      for (var _len = arguments.length, values = Array(_len), _key = 0; _key < _len; _key++) {
        values[_key] = arguments[_key];
      }

      return values.reduce(function (result, _ref5) {
        var _ref52 = _slicedToArray(_ref5, 2);

        var key = _ref52[0];
        var value = _ref52[1];
        return _.set(result, key, value);
      }, {});
    });
  }

  function subscribe(cb) {
    return this.subscribe(cb, function onError(error) {
      console.log('on error', error, error.stack);
    });
  }
};
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var bindElement = window.bindElement;

var Component = (function () {
  function Component(template) {
    _classCallCheck(this, Component);

    this.template = template;
  }

  _createClass(Component, [{
    key: "toHTMLString",
    value: function toHTMLString() {}
  }, {
    key: "toDOM",
    value: function toDOM() {
      return bindElement(this.template);
    }
  }]);

  return Component;
})();
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _Rx = Rx;
var Observable = _Rx.Observable;

window.componentManager = (function () {
  function ComponentManager(components) {
    _classCallCheck(this, ComponentManager);

    this.components = components;
  }

  _createClass(ComponentManager, [{
    key: "toDOM",
    value: function toDOM($el) {
      return Observable.combineLatest(this.components.map(function (component) {
        return component.toDOM();
      }), function () {
        var _this = this;

        for (var _len = arguments.length, dom = Array(_len), _key = 0; _key < _len; _key++) {
          dom[_key] = arguments[_key];
        }

        // TODO
        while ($el.lastChild) {
          $el.removeChild($el.lastChild);
        }
        dom.forEach(function (dom) {
          _this.$el.appendChild(dom);
        });
      });
    }
  }, {
    key: "toHTMLString",
    value: function toHTMLString() {}
  }]);

  return ComponentManager;
})();
'use strict';

var bootstrap = window.bootstrap;

var view = '<div>\n  {{name}}\n  <h1>{{name}} {{body}}</h1>\n  <input type="text" [(ngModel)]="name" />\n  <ul>\n    <li>before</li>\n                                         <li *ngFor="let value of values"><span>{{value}}</span> <span>{{name}}</span></li>\n    <li>after</li>\n  </ul>\n  <button (click)="boost" [disabled]="disabled" >Click</button>\n  <input type="checkbox" [(ngModel)]="disabled" /> Disabled\n</div>';

function model(input$) {
  var name$ = input$.on('name').startWith('Nathan');

  var values$ = input$.on('boost').startWith({}).scan(function (a, b) {
    return a + 1;
  }, -1).scan(function (values, i) {
    return values.concat(_.times(2000, function (j) {
      return j;
    }));
  }, []);

  return {
    name: name$,
    disabled: input$.on('disabled').startWith(true),
    body: Observable.of('Booya'),
    values: values$,
    booya: Observable.of('https://cdn.psychologytoday.com/sites/default/files/blogs/38/2008/12/2598-75772.jpg')
  };
}

bootstrap(document.getElementById('root'), model, view);
"use strict";
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = parse;

var oParser = new DOMParser();

function parse(str) {
  return oParser.parseFromString(str, 'text/html');
}

module.exports = exports['default'];
