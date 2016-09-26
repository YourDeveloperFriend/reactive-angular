
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
      return View(template, model$, output$);
    },
  };
}

function View(template, model$, parentOutput$) {
  const childrenComponents = getChildren(template, model$, parentOutput$);
  if(childrenComponents.length === 1 && childrenComponents[0][0].length === 0) {
    return childrenComponents[0][1];
  } else {
    const childManager = childManagerFactory(childrenComponents, template);
    bindViewOutput(template, parentOutput$);
    const domChanges$ = getDomChanges(template, model$);
    return { 
      elements$: Observable.just(template),
      domChanges$: Observable.merge(...domChanges$, ...getDomChangesOfChildren(childManager)),
    };
  }
}

function getDomChangesOfChildren(domManager) {
  const locationMap = new Map();
  let domChanges = [];
  for(const [parentNode, children] of domManager) {
    domChanges = domChanges.concat(children.map(([child, nextSibling])=> {
      const domChanges$ = child.domChanges$;
      const elementChanges = child.elements$::getPreviousAsWell()
      .flatMap(([elements, previous])=> {
        if(!_.isArray(elements)) {
          elements = elements ? [elements] : [];
        }
        if(!_.isArray(previous)) {
          previous = previous ? [previous] : [];
        }
        locationMap.set(child, elements[0] || locationMap.get(nextSibling) || nextSibling);
        if(elements.length === previous.length) {
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
    const textTemplate = textNode.textContent;
    const matches = textTemplate.match(/{{.*?}}/g);
    if(matches) {
      const keys = _.uniq(matches.map(match=> {
        return surrounds(match, '{{}}');
      }));
      const reg = keys.map(key=> key.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"));
      return Observable.combineLatest(keys.map(key=> model$[key].startWith('')), (...values)=> {
        return function() {
          if(keys[0] === 'value') {
            window.TTT.push([template, textNode]);
          }
          textNode.textContent = values.reduce((textTemplate, value, i)=> {
            return textTemplate.replace(new RegExp('{{' + reg[i] + '}}', 'g'), value);
          }, textTemplate);
        };
      });
    }
  });
}

function getSubjects(template) {
  const keys = forEachAttribute(template, (attribute, dom)=> {
    const doubleBind = surrounds(attribute.name, '[()]');
    if(doubleBind) {
      if(doubleBind === 'ngmodel') {
        return attribute.value;
      } else {
        throw new Error('Uknown doublebind: ' + doubleBind);
      }
    }
    const surrounded = surrounds(attribute.name, '()');
    if(surrounded) {
      return attribute.value;
    }
  });
  return _.uniq(keys);
}

function bindViewOutput(template, output$) {
  forEachAttribute(template, (attribute, dom)=> {
    const outputValue = attribute.value;
    const doubleBind = surrounds(attribute.name, '[()]');
    if(doubleBind) {
      if(doubleBind === 'ngmodel') {
        const eventName = dom.type === 'checkbox' ? 'change' : 'keyup';
        const valueAttr = dom.type === 'checkbox' ? 'checked' : 'value';
        Observable.fromEvent(dom, eventName).map(e=> e.target[valueAttr]).subscribe(output$[outputValue]);
      } else {
        throw new Error('Uknown doublebind: ' + doubleBind);
      }
    }
    const surrounded = surrounds(attribute.name, '()');
    if(surrounded) {
      Observable.fromEvent(dom, surrounded).subscribe(output$[outputValue]);
    }
  });
}
 

function getChildren(template, model$, parentOutput$) {
  return forEachChild(template, (dom, depth)=> {
    if(dom.hasAttribute('*ngfor')) {
      return [[depth, ngForDirective(dom, model$, parentOutput$)]];
    } else if(dom.hasAttribute('*ngif')) {
      return [[depth, ngIfDirective(dom, model$, parentOutput$)]];
    } else if(dom.tagName === 'APP' || dom.tagName === 'CHILD') {
      return [[depth, customComponent(dom, model$, parentOutput$)]];
    }
  });
}
