'use strict';

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

function ComponentView(template) {
  var output$ = getSubjects(template).reduce(function (subs, key) {
    return _.set(subs, key, new Subject());
  }, {});
  return {
    getBinding: function getBinding(name) {
      if (!output$[name]) {
        output$[name] = new Subject();
      }
      return output$[name];
    },
    bind: function bind(model$) {
      var views = template.map(function (template) {
        return View(template, model$, output$);
      });
      //TODO: all
      return views[0];
    }
  };
}

function View(template, model$, parentOutput$) {
  template = mapChildren(template, model$, parentOutput$);

  bindViewOutput(template, parentOutput$);
  return {
    elements$: Observable.just(['one', function () {
      return buildElement(template);
    }]),
    domChanges$: getDomChanges(template, model$)
  };
}

function insertBefore(element, nextSibling) {
  if (nextSibling) {
    this.insertBefore(element, nextSibling);
  } else {
    this.appendChild(element);
  }
}

function buildElement(template, index) {
  if (_.isString(template)) {
    return document.createTextNode(template);
  }
  var $el = document.createElement(template.name);
  if (index != null) {
    $el.setAttribute('data-ng-child-index', index);
  }
  _.forEach(template.attributes, function (value, key) {
    var surrounding = null;
    if (surrounding = surrounds(key, '()')) {
      $el.addEventListener(surrounding, function (event) {
        this.dispatchEvent(new CustomEvent(template.uuid + '-' + surrounding, event));
      });
    } else if (key === '[(ngmodel)]') {
      (function () {
        var eventName = template.attributes.type === 'checkbox' ? 'change' : 'keyup';
        var valueAttr = template.attributes.type === 'checkbox' ? 'checked' : 'value';
        $el.addEventListener(eventName, function (event) {
          this.dispatchEvent(new CustomEvent(template.uuid + '-ngmodel-' + value, { bubbles: true, detail: event.target[valueAttr] }));
        });
      })();
    } else if (!surrounds(key, '[]')) {
      $el.setAttribute(key, value);
    }
  });
  template.children.forEach(function (child, index) {
    return !child.domChanges$ && $el.appendChild(buildElement(child, index));
  });
  return $el;
}

function getDomChanges(template, model$) {
  var _Observable;

  var domChanges$ = _.map(template.attributes, function (value, attribute) {
    var doubleBind = surrounds(attribute, '[()]');
    if (doubleBind) {
      var _ret2 = (function () {
        var attr = template.attributes.type === 'checkbox' ? 'checked' : 'value';
        return {
          v: model$[value].map(function (value) {
            return function (dom) {
              return dom[attr] = value;
            };
          })
        };
      })();

      if (typeof _ret2 === 'object') return _ret2.v;
    }
    var surrounded = surrounds(attribute, '[]');
    if (surrounded) {
      return model$[value].map(function (value) {
        return function (dom) {
          return dom[surrounded] = value;
        };
      });
    }
    var matches = value.match(/{{.*?}}/g);
    if (matches) {
      return bindText(model$, value, function (node, value) {
        node.setAttribute(attribute, value);
      });
    }
  }).filter(_.identity);
  var childrenChanges$ = template.children.map(function (child, i) {
    var changes$ = null;
    if (child.domChanges$) {
      var elementChanges$ = child.elements$.map(function (elements) {
        if (!_.isArray(elements[0])) {
          elements = elements ? [elements] : [];
        }
        return function (parent) {
          var _getFirstAndNext = getFirstAndNext(parent, i);

          var _getFirstAndNext2 = _slicedToArray(_getFirstAndNext, 2);

          var firstElement = _getFirstAndNext2[0];
          var nextChild = _getFirstAndNext2[1];

          var firstToRemove = elements.reduce(function (prevSibling, _ref, index) {
            var _ref2 = _slicedToArray(_ref, 2);

            var key = _ref2[0];
            var element = _ref2[1];

            var $el = getKey(firstElement, nextChild, key);
            if (!$el) {
              $el = element();
              $el.setAttribute('data-ng-key', key);
            }
            var nextSibling = undefined;
            if (!prevSibling) {
              $el.setAttribute('data-ng-child-index', i);
              firstElement.removeAttribute('data-ng-child-index');
              nextSibling = firstElement || nextChild;
              firstElement = $el;
            } else {
              nextSibling = prevSibling.nextSibling;
            }
            if (!$el.parentNode || $el.nextSibling !== nextSibling) {
              if (nSibling) {
                parent.insertBefore($el, nextSibling);
              } else {
                parent.appendChild($el);
              }
            }
            return $el;
          }).nextSibling || firstElement;
          while (firstToRemove !== nextChild) {
            var temp = firstToRemove.nextSibling;
            firstToRemove.parentNode.removeChild(firstToRemove);
            firstToRemove = temp;
          }
        };
      }).flatMap();
      return child.domChanges$.map(function (change) {
        return function (parent) {
          return change(getFirstAndNext(parent, i)[0]);
        };
      }).merge(elementChanges$);
    } else {
      if (_.isString(child)) {
        changes$ = bindText(model$, child, function (node, value) {
          node.textContent = value;
        });
      } else {
        changes$ = getDomChanges(child, model$);
      }
      changes$ = changes$.map(function (change) {
        return function (parent) {
          var count = 0;
          return change(getFirstAndNext(parent, i)[0]);
        };
      });
      return changes$;
    }
  });

  return (_Observable = Observable).merge.apply(_Observable, _toConsumableArray(domChanges$).concat(_toConsumableArray(childrenChanges$)));
}

function getFirstAndNext(parent, index) {
  var child = parent.firstChild;
  var first = null,
      next = null;
  var count = 0;
  for (var _child = parent.firstChild; _child !== null; _child = _child.nextSibling) {
    if (_child.nodeType === 3) {
      if (count === index) {
        first = _child;
      }if (count === index + 1) {
        next = _child;
        break;
      }
      count++;
    } else {
      var childIndex = getChildIndex(_child);
      if (childIndex) {
        if (childIndex === index) {
          first = _child;
        } else if (childIndex === index + 1) {
          next = _child;
          break;
        }
        count++;
      }
    }
  }
  return [first, next];
}

function getChildIndex(child) {
  var attr = child.getAttribute('data-ng-child-index');
  return attr ? parseInt(attr) : null;
}

function getKey(firstElement, nextSibling, key) {
  for (var $el = firstElement; $el !== nextSibling; $el = $el.nextSibling) {
    if ($el.getAttribute('data-ng-key').value === key) {
      return $el;
    }
  }
}

function bindText(model$, template, fn) {
  var matches = template.match(/{{.*?}}/g);
  if (matches) {
    var _ret3 = (function () {
      var keys = _.uniq(matches.map(function (match) {
        return surrounds(match, '{{}}');
      }));
      var reg = keys.map(function (key) {
        return key.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
      });
      return {
        v: Observable.combineLatest(keys.map(function (key) {
          return model$[key].startWith('');
        }), function () {
          for (var _len = arguments.length, values = Array(_len), _key = 0; _key < _len; _key++) {
            values[_key] = arguments[_key];
          }

          return function (node) {
            var str = values.reduce(function (template, value, i) {
              return template.replace(new RegExp('{{' + reg[i] + '}}', 'g'), value);
            }, template);
            fn(node, str);
          };
        })
      };
    })();

    if (typeof _ret3 === 'object') return _ret3.v;
  }
  return Observable.empty();
}

function getSubjects(template) {
  var keys = forEachAttribute(template, function (value, attribute, dom) {
    var doubleBind = surrounds(attribute, '[()]');
    if (doubleBind) {
      if (doubleBind === 'ngmodel') {
        return value;
      } else {
        throw new Error('Uknown doublebind: ' + doubleBind);
      }
    }
    var surrounded = surrounds(attribute, '()');
    if (surrounded) {
      return value;
    }
  });
  return _.uniq(keys);
}

function bindViewOutput(template, output$) {
  _.forEach(template.attributes, function (value, attribute) {
    template.uuid = _.uniqueId();
    var outputValue = value;
    var doubleBind = surrounds(attribute, '[()]');
    if (doubleBind) {
      if (doubleBind === 'ngmodel') {
        // TODO:
        Observable.fromEvent(document, template.uuid + '-ngmodel-' + value).map(function (e) {
          return e.detail;
        }).subscribe(output$[outputValue]);
      } else {
        throw new Error('Uknown doublebind: ' + doubleBind);
      }
    }
    var surrounded = surrounds(attribute, '()');
    if (surrounded) {
      // TODO:
      Observable.fromEvent(document, template.uuid + '-' + surrounded).subscribe(output$[outputValue]);
    }
  });
  template.children.forEach(function (child) {
    return !child.domChanges$ && !_.isString(child) && bindViewOutput(child, output$);
  });
}

function mapChildren(template, model$, parentOutput$) {
  if (template.attributes['*ngfor']) {
    return ngForDirective(template, model$, parentOutput$);
  } else if (template.attributes['*ngif']) {
    return ngIfDirective(template, model$, parentOutput$);
  } else if (template.name === 'APP' || template.name === 'CHILD') {
    return customComponent(template, model$, parentOutput$);
  } else {
    return _.set(template, 'children', template.children.map(function (value) {
      if (_.isString(value)) {
        return value;
      } else {
        return mapChildren(value, model$, parentOutput$);
      }
    }));
  }
}