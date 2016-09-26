
function bootstrap($root, Component, props$) {
  const instance = Component(props$);
  const domChanges$ = Bacon.mergeAll(instance.domChanges$, instance.elements$.map(elements=> {
    return function() {
      while($root.firstChild) {
        $root.removeChild($root.firstChild);
      }
      if(elements) {
        if(_.isArray(elements)) {
          for(const element of elements) {
            $root.appendChild(element);
          }
        } else {
          $root.appendChild(elements);
        }
      }
    }
  }));
  domChanges$.onValue(function(domChange) {
    try {
      domChange();
    } catch(e) {
      console.log('error', e, e.stack);
    }
  });
  domChanges$.onError(function(error) {
    console.log('error', error, error.stack);
  });
}
