
function bootstrap($root, Component, props$) {
  const instance = Component(props$);
  const elementChanges$ = instance.elements$.map(elements=> {
    return function($root, previousElements) {
      if(!_.isArray(elements[0])) {
        elements = elements ? [elements] : [];
      }
      const newElements = elements.map(([key, value])=> {
        return [key, getFromKey(previousElements, key) || value()];
      });
      _.forEach(previousElements, (value, key)=> {
        if(!getFromKey(newElements, key)) {
          $root.removeChild(value);
        }
      });
      newElements.forEach(([key, element])=> $root.appendChild(element));
      return newElements;
    };
  });
  const domChanges = instance.domChanges$.map(fn=> {
    return function($root, elements) {
      fn($root.firstChild);
      return elements;
    };
  });

  let elements = [];
  Observable.merge(elementChanges$, domChanges)
  .subscribe(function(domChange) {
    try {
      elements = domChange($root, elements);
    } catch(e) {
      console.log('error', e, e.stack);
    }
  }, function(error) {
    console.log('error', error, error.stack);
  });
}

function getFromKey(array, toFind) {
  const $el = _.find(array, ([key, value])=> key === toFind);
  return $el && $el[1];
}
