
const {parse} = window;
const {Observable} = window.Rx;

window.View = function View(view) {
  const template = parse(view);
  const childViews = getChildViews(template);
  const events = getEventsFn(template);
  const bindings = getBindings(template);
  return function($placeholder) {
    const dom = template.clone(true);
    const children = childViews(dom);
    return {
      inputs$: events(dom).merge(children.events),
        return children.reduce(function(bound, child) {
          return bound.merge(child.outputs(output));
        }, bound);
      outputs(output) {
        const bound = bindings(dom, output).startWith(()=> {
          const {nextSibling, parentNode} = $placeholder;
          if(nextSibling) {
            parentNode.insertBefore(dom, nextSibling);
          } else {
            parentNode.appendChild(dom);
          }
          parentNode.removeChild($placeholder);
        });
        return children.reduce(function(bound, child) {
          return bound.merge(child.outputs(output));
        }, bound);
      },
      destroy() {
        dom.parentNode.removeChild(dom);
      }
    };
  };
}

function getEventsFn(template) {
  const events = getEvents();
  const groups = _.groupBy(events, '0');
  return function(dom) {
    return _.mapValues(groups, events=> {
      return Observable.merge(events.map(event=> event(dom)));
    });
  };
}

function getEvents(template, depth = []) {
  const events = [];
  for(const attribute of template.attributes) {
    if(surrounds(attribute.name, '(', ')')) {
      const key = attribute.value;
      events.push([key, dom=> {
        return Observable.create(observer=> {
          const $el = dig(dom, depth);
          const eListener = observer::onNext;
          $el.addEventListener(attribute.substring(1, attribute.length - 1), eListener);
          return function dispose() {
            $el.removeEventListener(attribute.substring(1, attribute.length - 1), eListener);
          }
        });
      }]);
    } else if(attribute.name === '[(ngmodel)]') {
      const key = attribute.value;
      events.push([key, dom=> {
        return Observable.create(observer=> {
          const $el = dig(dom, depth);
          const eListener = observer::onNext;
          $el.addEventListener('keyup', eListener);
          return function dispose() {
            $el.removeEventListener('keyup', eListener);
          }
        });
      }]);
    }
  }
  for(const [i, childNode] of template.childNodes.entries()) {
    events = events.concat(getEvents(childNode, depth.concat([i])));
  }
  return events;
}

function getBindings(template) {
  const bindings = getBindingsFn(template);
  return function (dom, output) {
    return Observable.merge(bindings.map(([key, binding])=> {
      return output.key.map(value=> {
        return function() {
          binding(dom, value);
        };
      });
    }));
  };
}

function getBindingsFn(template, depth = []) {
  const bindings = [];
  for(const attribute of template.attributes) {
    if(attribute.name === '[(ngmodel)]') {
      const key = attribute.value;
      bindings.push([key, (dom, value)=> {
        const el = dig(dom, depth);
        el.value = value;
      }]);
    } else if(surrounds(attribute.name, '[', ']')) {
      const key = attribute.value;
      events.push([key, (dom, value)=> {
        const el = dig(dom, depth);
        el[attribute.name.substring(1, attribute.name.length - 1)] = value;
      }]);
    }
  }
  for(const [i, childNode] of template.childNodes.entries()) {
    events = events.concat(getEvents(childNode, depth.concat([i])));
  }
  return events;
}
