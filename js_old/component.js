'use strict';

window.Component = function Component(template, model) {
  var exposes = arguments.length <= 2 || arguments[2] === undefined ? [] : arguments[2];

  return function source(props$) {
    var view = ComponentView(template);
    var modelInput = {
      prop: function prop(propName) {
        return props$[propName];
      },
      on: function on(eventName) {
        return view.getBinding(eventName);
      }
    };
    var model$ = model(modelInput);

    var bindings = view.bind(model$);
    return _.merge(_.pick(model$, exposes), _.pick(bindings, 'elements$', 'domChanges$'));
  };
};