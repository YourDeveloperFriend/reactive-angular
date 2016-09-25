
function bootstrap($root, Component, props$) {
  const instance = Component(props$);
  instance.domChanges$.merge(instance.elements$.map(elements=> {
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
  })).subscribe(function(domChange) {
    try {
      domChange();
    } catch(e) {
      console.log('error', e, e.stack);
    }
  }, function(error) {
    console.log('error', error, error.stack);
  });
}
