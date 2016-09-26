
function ngIfDirective(template, model$) {
  const attr = template.getAttribute('*ngif');
  template.removeAttribute('*ngif');
  const view = View(template, model$);
  return {
    output$: view.output$,
    elements$: Bacon.combineWith(model$[attr], view.elements$, (value, elements)=> value ? elements : []),
    domChanges$: view.domChanges$,
  };
}

function customComponent(template, model$) {
  const input = {};
  const output = {};
  for(const attribute of template.attributes) {
    const eventName = surrounds(attribute.name, '()');
    if(eventName) {
      output[eventName] = attribute.value;
      continue;
    }
    const inputName = surrounds(attribute.name, '[]');
    if(inputName) {
      input[inputName] = model$[attribute.value];
      continue;
    }
    input[attribute.name] = Bacon.constant(attribute.value);
  }
  const ComponentClass = template.tagName === 'APP' ? AppComponent: ChildComponent;
  const instance = ComponentClass(input);
  return {
    output$: _.omit(instance, 'elements$', 'domChanges$'),
    elements$: instance.elements$,
    domChanges$: instance.domChanges$,
  }
}
function ngForDirective(template, model$) {
  const config = template.getAttribute('*ngfor');
  const [, key, varName] = config.match(/^let (.*) of (.*)$/);
  template.removeAttribute('*ngfor');
  const views$ = getPreviousAsWell.call(model$[varName])
  .map(([values, previous])=> {
    return values.map((value, i)=> {
      return previous && previous[i] || View(template.cloneNode(true), _.merge({}, model$, {[key]: model$[varName].map('.' + i).startWith(value)}));
    });
  });
  return {
    output$: createObservableGetter(views$),
    elements$: views$.flatMapLatest(views=> Bacon.combineAsArray(_.map(views, 'elements$'))),
    domChanges$: views$.flatMapLatest(views=> Bacon.mergeAll(_.map(views, 'domChanges$'))),
  };
}

function createObservableGetter(views$) {
  return new Proxy(views$, {
    get(target, name) {
      return target.flatMapLatest(views=> Bacon.mergeAll(_.map(views, 'output$.' + name).filter(_.identity)));
    }
  });
}
