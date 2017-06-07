
function ComponentView(template) {
  const output$ = getSubjects(template).reduce((subs, key)=> _.set(subs, key, new Subject()), {});
  return {
    getBinding(name) {
      if(!output$[name]) {
        output$[name] = new Subject();
      }
      return output$[name];
    },
    bind(model$) {
      const views = template.map(template=> {
        return View(template, model$, output$);
      });
      //TODO: all
      return views[0];
    },
  };
}

function View(template, model$, parentOutput$) {
  template = mapChildren(template, model$, parentOutput$);

  bindViewOutput(template, parentOutput$);
  return { 
    elements$: Observable.just(['one', ()=> buildElement(template)]),
    domChanges$: getDomChanges(template, model$),
  };
}

function insertBefore(element, nextSibling) {
  if(nextSibling) {
    this.insertBefore(element, nextSibling);
  } else {
    this.appendChild(element);
  }
}

function buildElement(template, index) {
  if(_.isString(template)) {
    return document.createTextNode(template);
  }
  const $el = document.createElement(template.name);
  if(index != null) {
    $el.setAttribute('data-ng-child-index', index);
  }
  _.forEach(template.attributes, (value, key)=> {
    let surrounding = null;
    if(surrounding = surrounds(key, '()')) {
      $el.addEventListener(surrounding, function(event) {
        this.dispatchEvent(new CustomEvent(template.uuid + '-' + surrounding, event));
      });
    } else if(key === '[(ngmodel)]') {
      const eventName = template.attributes.type === 'checkbox' ? 'change' : 'keyup';
      const valueAttr = template.attributes.type === 'checkbox' ? 'checked' : 'value';
      $el.addEventListener(eventName, function(event) {
        this.dispatchEvent(new CustomEvent(template.uuid + '-ngmodel-' + value, {bubbles: true, detail: event.target[valueAttr]}));
      });
    } else if(!surrounds(key, '[]')) {
      $el.setAttribute(key, value);
    }
  });
  template.children.forEach((child, index)=> !child.domChanges$ && $el.appendChild(buildElement(child, index)));
  return $el;
}

function getDomChanges(template, model$) {
  const domChanges$ = _.map(template.attributes, (value, attribute)=> {
    const doubleBind = surrounds(attribute, '[()]');
    if(doubleBind) {
      const attr = template.attributes.type === 'checkbox' ? 'checked' : 'value';
      return model$[value].map(value=> (dom)=> dom[attr] = value);
    }
    const surrounded = surrounds(attribute, '[]');
    if(surrounded) {
      return model$[value].map(value=> (dom)=> dom[surrounded] = value);
    }
    const matches = value.match(/{{.*?}}/g);
    if(matches) {
      return bindText(model$, value, (node, value)=> {
        node.setAttribute(attribute, value);
      });
    }
  }).filter(_.identity);
  const childrenChanges$ = template.children.map((child, i)=> {
    let changes$ = null;
    if(child.domChanges$) {
      const elementChanges$ = child.elements$.map(elements=> {
        if(!_.isArray(elements[0])) {
          elements = elements ? [elements] : [];
        }
        return function(parent) {
          let [firstElement, nextChild] = getFirstAndNext(parent, i);
          let firstToRemove = elements.reduce((prevSibling, [key, element], index)=> {
            let $el = getKey(firstElement, nextChild, key);
            if(!$el) {
              $el = element();
              $el.setAttribute('data-ng-key', key);
            }
            let nextSibling;
            if(!prevSibling) {
              $el.setAttribute('data-ng-child-index', i);
              firstElement.removeAttribute('data-ng-child-index');
              nextSibling = firstElement || nextChild;
              firstElement = $el;
            } else {
              nextSibling = prevSibling.nextSibling;
            }
            if(!$el.parentNode || $el.nextSibling !== nextSibling) {
              if(nSibling) {
                parent.insertBefore($el, nextSibling);
              } else {
                parent.appendChild($el);
              }
            }
            return $el;
          }).nextSibling || firstElement;
          while(firstToRemove !== nextChild) {
            let temp = firstToRemove.nextSibling;
            firstToRemove.parentNode.removeChild(firstToRemove);
            firstToRemove = temp;
          }
        };
      }).flatMap();
      return child.domChanges$
      .map(change=> (parent)=> change(getFirstAndNext(parent, i)[0]))
      .merge(elementChanges$);
    } else {
      if(_.isString(child)) {
        changes$ = bindText(model$, child, (node, value)=> {
          node.textContent = value;
        });
      } else {
        changes$ = getDomChanges(child, model$);
      }
      changes$ = changes$.map(change=> {
        return function(parent) {
          let count = 0;
          return change(getFirstAndNext(parent, i)[0]);
        };
      });
      return changes$;
    }
  });

  return Observable.merge(...domChanges$, ...childrenChanges$);
}

function getFirstAndNext(parent, index) {
  let child = parent.firstChild;
  let first = null, next = null;
  let count = 0;
  for(let child = parent.firstChild; child !== null; child = child.nextSibling) {
    if(child.nodeType === 3) {
      if(count === index) {
        first = child;
      } if(count === index + 1) {
        next = child;
        break;
      }
      count++;
    } else {
      let childIndex = getChildIndex(child);
      if(childIndex) {
        if(childIndex === index) {
          first = child;
        } else if(childIndex === index + 1) {
          next = child;
          break;
        }
        count++;
      }
    }
  }
  return [first, next];
}

function getChildIndex(child) {
  const attr = child.getAttribute('data-ng-child-index');
  return attr ? parseInt(attr) : null;
}

function getKey(firstElement, nextSibling, key) {
  for(let $el = firstElement; $el !== nextSibling; $el = $el.nextSibling) {
    if($el.getAttribute('data-ng-key').value === key) {
      return $el;
    }
  }
}

function bindText(model$, template, fn) {
  const matches = template.match(/{{.*?}}/g);
  if(matches) {
    const keys = _.uniq(matches.map(match=> {
      return surrounds(match, '{{}}');
    }));
    const reg = keys.map(key=> key.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"));
    return Observable.combineLatest(keys.map(key=> model$[key].startWith('')), (...values)=> {
      return function(node) {
        const str = values.reduce((template, value, i)=> {
          return template.replace(new RegExp('{{' + reg[i] + '}}', 'g'), value);
        }, template);
        fn(node, str);
      };
    });
  }
  return Observable.empty();
}

function getSubjects(template) {
  const keys = forEachAttribute(template, (value, attribute, dom)=> {
    const doubleBind = surrounds(attribute, '[()]');
    if(doubleBind) {
      if(doubleBind === 'ngmodel') {
        return value;
      } else {
        throw new Error('Uknown doublebind: ' + doubleBind);
      }
    }
    const surrounded = surrounds(attribute, '()');
    if(surrounded) {
      return value;
    }
  });
  return _.uniq(keys);
}

function bindViewOutput(template, output$) {
  _.forEach(template.attributes, (value, attribute)=> {
    template.uuid = _.uniqueId();
    const outputValue = value;
    const doubleBind = surrounds(attribute, '[()]');
    if(doubleBind) {
      if(doubleBind === 'ngmodel') {
        // TODO:
        Observable.fromEvent(document, template.uuid + '-ngmodel-' + value).map(e=> e.detail).subscribe(output$[outputValue]);
      } else {
        throw new Error('Uknown doublebind: ' + doubleBind);
      }
    }
    const surrounded = surrounds(attribute, '()');
    if(surrounded) {
      // TODO:
      Observable.fromEvent(document, template.uuid + '-' + surrounded).subscribe(output$[outputValue]);
    }
  });
  template.children.forEach(child=> !child.domChanges$ && !_.isString(child) && bindViewOutput(child, output$));
}
 

function mapChildren(template, model$, parentOutput$) {
  if(template.attributes['*ngfor']) {
    return ngForDirective(template, model$, parentOutput$);
  } else if(template.attributes['*ngif']) {
    return ngIfDirective(template, model$, parentOutput$);
  } else if(template.name === 'APP' || template.name === 'CHILD') {
    return customComponent(template, model$, parentOutput$);
  } else {
    return _.set(template, 'children', template.children.map(value=> {
      if(_.isString(value)) {
        return value;
      } else {
        return mapChildren(value, model$, parentOutput$);
      }
    }));
  }
}
