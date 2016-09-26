
window.Component = function Component(template, model, exposes = []) {
  return function source(props$) {
    let view = ComponentView(template);
    const modelInput = {
      prop(propName) {
        return props$[propName];
      },
      on(eventName) {
        return view.getBinding(eventName);
      },
    };
    const model$ = model(modelInput);
    
    const bindings = view.bind(model$);
    return _.merge(_.pick(model$, exposes), _.pick(bindings, 'elements$', 'domChanges$'));
  };
}
