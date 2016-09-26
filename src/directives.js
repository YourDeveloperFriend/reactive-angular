
function ngIfDirective(template, model$, output$) {
  const attr = template.getAttribute('*ngif');
  template.removeAttribute('*ngif');
  const view = View(template, model$, output$);
  return {
    elements$: model$[attr].withLatestFrom(view.elements$).map(([value, elements])=> value ? elements : null),
    domChanges$: view.domChanges$,
  };
}

function customComponent(template, model$, parentOutput$) {
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
    input[attribute.name] = Observable.just(attribute.value);
  }
  const ComponentClass = template.tagName === 'APP' ? AppComponent: ChildComponent;
  const instance = ComponentClass(input);
  _.forEach(output, (value, key)=> {
    instance[key].subscribe(parentOutput$[value]);
  });
  return {
    elements$: instance.elements$,
    domChanges$: instance.domChanges$,
  }
}
function ngForDirective(template, model$, output$) {
  const config = template.getAttribute('*ngfor');
  const [, key, varName] = config.match(/^let (.*) of (.*)$/);
  template.removeAttribute('*ngfor');
  const views$ = model$[varName]
  .scan((previous, values)=> {
    return values.map((value, i)=> {
      return previous && previous[i] || View(template, _.merge({}, model$, {[key]: model$[varName].pluck(i).startWith(value)}));
    });
  }, []);
  return {
    elements$: views$.flatMapLatest(views=> Observable.combineLatest(_.map(views, 'elements$'))),
    domChanges$: views$.flatMapLatest(views=> Observable.merge(_.map(views, 'domChanges$'))),
  };
}
