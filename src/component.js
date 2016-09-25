
window.Component = function Component(template, model, exposes = []) {
  return function source(props$) {
    let view = null;
    const modelInput = {
      prop(propName) {
        return props$[propName];
      },
      on(eventName) {
        return Observable.defer(()=> view.output$[eventName]);
      },
    };
    const model$ = model(modelInput);
    
    view = View(template, model$);
    return _.merge(_.pick(model$, exposes), _.pick(view, 'elements$', 'domChanges$'));
  };
}
