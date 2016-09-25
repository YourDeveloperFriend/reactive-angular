
function View(template, model$) {
  const childrenComponents = getChildren(template, model$);
  if(childrenComponents.length === 1 && childrenComponents[0][0].length === 0) {
    return childrenComponents[0][1];
  } else {
    const childManager = childManagerFactory(childrenComponents, template);
    const output$ = _(getViewOutput(template, model$)).groupBy('0').mapValues(value=> Observable.merge(value[0][1])).value();
    const domChanges$ = getDomChanges(template, model$);
    return { 
      output$: mergeOutput(output$, _.map(childrenComponents, '1.output$')),
      elements$: Observable.just(template),
      domChanges$: Observable.merge(...domChanges$, ...getDomChangesOfChildren(childManager)),
    };
  }
}

function mergeOutput(output, outputArray) {
  return new Proxy({}, {
    get(target, name) {
      return Observable.merge([output[name], ..._.map(outputArray, name)].filter(_.identity));
    },
  });
}

function getDomChangesOfChildren(domManager) {
  const locationMap = new Map();
  let domChanges = [];
  for(const [parentNode, children] of domManager) {
    domChanges = domChanges.concat(children.map(([child, nextSibling])=> {
      const domChanges$ = child.domChanges$;
      const elementChanges = getPreviousAsWell.call(child.elements$)
      .flatMap(([elements, previous])=> {
        if(!_.isArray(elements)) {
          elements = elements ? [elements] : [];
        }
        if(!_.isArray(previous)) {
          previous = previous ? [previous] : [];
        }
        locationMap.set(child, elements[0]);
        if(elements.length === previous) {
          // TODO: rearranging?
          return [];
        }
        if(elements.length > previous.length) {
          return elements.slice(previous.length).map(element=> ()=> insertBefore.call(parentNode, element, locationMap.get(nextSibling) || nextSibling));
        }
        if(previous.length > elements.length) {
          return previous.slice(elements.length).map(element=> ()=> element.parentNode === parentNode && parentNode.removeChild(element));
        }
      });
      return [domChanges$, elementChanges];
    }));
  }
  return _.flatten(domChanges);
}

function insertBefore(element, nextSibling) {
  if(nextSibling) {
    this.insertBefore(element, nextSibling);
  } else {
    this.appendChild(element);
  }
}

function childManagerFactory(children, template) {
  const map = new Map();
  const toRemove = [];
  for(const [depth, child] of children) {
    const childNode = dig(template, depth);
    const parentNode = childNode.parentNode;
    toRemove.push([parentNode, childNode]);
    if(!map.has(parentNode)) {
      map.set(parentNode, []);
    }
    let ordered = map.get(childNode.parentNode);
    ordered.forEach(([sibling, nextSibling], i)=> {
      if(nextSibling === childNode) {
        ordered[i][1] = child;
      }
    });
    ordered.push([child, childNode.nextSibling]);
  }
  toRemove.forEach(([parentNode, child])=> parentNode.removeChild(child));
  return map;
}

function getDomChanges(template, model$) {
  return forEachAttribute(template, (attribute, dom)=> {
    const doubleBind = surrounds(attribute.name, '[()]');
    if(doubleBind) {
      const attr = dom.type === 'checkbox' ? 'checked' : 'value';
      return model$[attribute.value].map(value=> ()=> dom[attr] = value);
    }
    const surrounded = surrounds(attribute.name, '[]');
    if(surrounded) {
      return model$[attribute.value].map(value=> ()=> dom[surrounded] = value);
    }
    const matches = attribute.value.match(/{{.*?}}/g);
    if(matches) {
      //domChanges.push(model$[attribute.value].map(value=> ()=> dom[surrounded] = value));
    }
  }, textNode=> {
    const template = textNode.textContent;
    const matches = template.match(/{{.*?}}/g);
    if(matches) {
      const keys = _.uniq(matches.map(match=> {
        return surrounds(match, '{{}}');
      }));
      const reg = keys.map(key=> key.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"));
      return Observable.combineLatest(keys.map(key=> model$[key].startWith('')), (...values)=> {
        return function() {
          textNode.textContent = values.reduce((template, value, i)=> {
            return template.replace(new RegExp('{{' + reg[i] + '}}', 'g'), value);
          }, template);
        };
      });
    }
  });
}

function getViewOutput(template, model$) {
  return forEachAttribute(template, (attribute, dom)=> {
    const doubleBind = surrounds(attribute.name, '[()]');
    if(doubleBind) {
      if(doubleBind === 'ngmodel') {
        return [attribute.value, Observable.create(observer=> {
          const eventName = dom.type === 'checkbox' ? 'change' : 'keyup';
          const valueAttr = dom.type === 'checkbox' ? 'checked' : 'value';
          dom.addEventListener(eventName, onEvent);
          return function dispose() {
            dom.removeEventListener(eventName, onEvent);
          };
          function onEvent(event) {
            observer.onNext(event.target[valueAttr]);
          }
        })];
      } else {
        throw new Error('Uknown doublebind: ' + doubleBind);
      }
    }
    const surrounded = surrounds(attribute.name, '()');
    if(surrounded) {
      return [attribute.value, Observable.create(observer=> {
        dom.addEventListener(surrounded, onEvent);
        return function dispose() {
          dom.removeEventListener(surrounded, onEvent);
        };
        function onEvent(event) {
          observer.onNext(event);
        }
      })];
    }
  });
}
 

function getChildren(template, model$, depth = []) {
  return forEachChild(template, (dom, depth)=> {
    if(dom.hasAttribute('*ngfor')) {
      return [[depth, ngForDirective(dom, model$)]];
    } else if(dom.hasAttribute('*ngif')) {
      return [[depth, ngIfDirective(dom, model$)]];
    } else if(dom.tagName === 'APP' || dom.tagName === 'CHILD') {
      return [[depth, customComponent(dom, model$)]];
    }
  });
}
