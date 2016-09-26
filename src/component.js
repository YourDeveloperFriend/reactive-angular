
window.Component = function Component(template, model, exposes = []) {
  return function source(props$) {
    let view = null;
    const viewOutput = baconBus();
    const modelInput = {
      prop(propName) {
        return props$[propName];
      },
      on(eventName) {
        return viewOutput.get(eventName);
      },
    };
    const model$ = model(modelInput);
    
    view = View(template, model$);

    _.forEach(view.output$, (obs, key)=> {
      viewOutput.get(key, obs);
    });
    
    return _.merge(_.pick(model$, exposes), _.pick(view, 'elements$', 'domChanges$'));
  };
}

function baconBus() {
  const buses = {};
  return {
    get(eventName, obs) {
      if(!buses[eventName]) {
        buses[eventName] = {bus: new Bacon.Bus()};
      }
      if(obs) {
        if(buses[eventName].unplug) {
          throw new Error('TRying to bind ' + eventName + ' twice!');
        }
        buses[eventName].unplug = buses[eventName].bus.plug(obs);

      }
      return buses[eventName].bus;
    },
  };
}
