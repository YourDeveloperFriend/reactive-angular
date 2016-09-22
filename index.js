
window.values = [];
const {Observable, Subject} = Rx;
const oParser = new DOMParser();

const directives = {
  ngFor,
  ngIf,
};

const components = {
  App: model,
};

const doubleBind = {
  //ngModel,
};

const template = oParser.parseFromString(`<div>
  {{name}}
  <h1>{{name}} {{body}}</h1>
  <input type="text" [(ngModel)]="name" />
  <ul>
    <li>before</li>
                                         <li *ngFor="let value of values"><span>{{value}}</span> <span>{{name}}</span></li>
    <li>after</li>
  </ul>
  <button (click)="boost" [disabled]="disabled" >Click</button>
  <input type="checkbox" [(ngModel)]="disabled" /> Disabled
</div>`, 'text/html');

const elements = template.body.children;

const numbers = [
  'one',
  'two',
  'three',
  'four',
  'five',
];

function model(input$) {

  const name$ = input$.on('name').startWith('Nathan');
  
  const values$ = input$.on('boost')
  .startWith({})
  .scan((a, b)=> a + 1, -1)
  .scan(function(values, i) {
    return values.concat(_.times(1000, j=> j));
  }, []);

  return combineLatestObject({
    name: name$,
    disabled: input$.on('disabled').startWith(true),
    body: Observable.of('Booya'),
    values: values$,
    booya: Observable.of('https://cdn.psychologytoday.com/sites/default/files/blogs/38/2008/12/2598-75772.jpg'),
  });
}

var input$ = {
  events$: new Subject(),
  on(eventName) {
    return this.events$.filter(event=> event[0] === eventName).pluck(1);
  },
  trigger(eventName, data) {
    this.events$.onNext([eventName, data]);
  },
};

var output$ = model(input$);

const $root = document.getElementById('root');

for(const element of elements) {
  linkChild(element, {input$, output$});
  $root.appendChild(element);
}

function bindEvent(element, scope$, attribute) {
  const matches = attribute.name.match(/^\((.*?)\)$/);
  if(matches) {
    const value = attribute.value;
    element.addEventListener(matches[1], function(data) {
      scope$.input$.trigger(value, data);
    });
  }
}

function ngIf(element, scope$, attribute) {
  const parentNode = element.parentNode;
  const sibling = element.nextSibling;
  parentNode.removeChild(element);
  const comment = document.createComment('ngIf');
  sibling ? parentNode.insertBefore(comment, sibling) : parentNode.appendChild(comment);
  element.removeAttribute(attribute.name);

  const values$ = scope$.output$.pluck(attribute.value).distinctUntilChanged()
  .withLatestFrom(scope$.output$)
  ::subscribe(function([show, output]) {
    if(show) {
      if(comment.nextSibling) {
        parentNode.insertBefore(element, comment.nextSibling);
      } else {
        parentNode.appendChild(element);
      }
      linkChild(element, {
        input$: scope$.input$,
        output$: scope$.output$.startWith(output),
      });
    } else {
      parentNode.removeChild(element);
      //unlink?
    }
  });
}

function ngFor(element, scope$, attribute) {
  const parentNode = element.parentNode;
  const sibling = element.nextSibling;
  parentNode.removeChild(element);
  const comment = document.createComment('ngFor');
  sibling ? parentNode.insertBefore(comment, sibling) : parentNode.appendChild(comment);
  const [, key, attr, , trackBy] = attribute.value.match(/^let (.*?) of (.*?)$/);
  let previousChildren = [];
  element.removeAttribute(attribute.name);

  let cached = new Map();

  const values$ = scope$.output$.pluck(attr).distinctUntilChanged()
  .withLatestFrom(scope$.output$)
  ::subscribe(function([values, output]) {
    for(const child of previousChildren) {
      child.parentNode.removeChild(child);
      //unlink?
    }
    const nextSibling = comment.nextSibling;
    const children = values.map((value, index)=> {
      const child = previousChildren[index] || element.cloneNode(true);
      if(nextSibling) {
        parentNode.insertBefore(child, nextSibling);
      } else {
        parentNode.appendChild(child);
      }
      if(!previousChildren[index]) {
        const output$ = scope$.output$.startWith(output).map(output=> setImmutable(setImmutable(output, key, value), '$index', index));
        linkChild(child, {
          input$: scope$.input$,
          output$,
        });
      }
      return child;
    });
    previousChildren = children;
  });
}

function setImmutable(object, key, value) {
  return _.set(_.clone(object), key, value);
}

function bindNgModel(element, scope$, attribute) {
  const matches = attribute.name === '[(ngmodel)]';
  if(matches) {
    const modelName = attribute.value;
    scope$.output$.pluck(modelName).distinctUntilChanged()
    ::subscribe(value=> {
      if(element.getAttribute('type') === 'checkbox') {
        element.checked = value;
      } else {
        element.value = value;
      }
    });
    if(element.getAttribute('type') === 'checkbox') {
      element.addEventListener('change', function(e) {
        scope$.input$.trigger(modelName, e.target.checked);
      });
    } else {
      element.addEventListener('keyup', function(e) {
        scope$.input$.trigger(modelName, e.target.value);
      });
    }
  }
}


function linkChild(element, scope$) {
  let containsDirective = false;
  for(const attribute of element.attributes) {
    if(attribute.name.indexOf('*') === 0) {
      containsDirective = true;
    }
  }
  if(containsDirective) {
    _.forEach(directives, (directive, directiveName)=> {
      if(element.hasAttribute('*' + directiveName)) {
        directive(element, scope$, element.getAttributeNode('*' + directiveName));
      }
    });
  } else {
    for(const attribute of element.attributes) {
      bindEvent(element, scope$, attribute);
      bindProperty(element, scope$, attribute);
      bindNgModel(element, scope$, attribute);
    }
    for(const childNode of element.childNodes) {
      if(childNode.nodeType === 3) {
        bindTextContent(childNode.textContent, scope$, value=> childNode.textContent = value);
      } else {
        linkChild(childNode, scope$);
      }
    }
  }
}

function bindProperty(element, scope$, attribute) {
  const matches = attribute.name.match(/^\[([^(].+)\]$/);
  if(matches) {
    const attrName = matches[1];
    const propName = attribute.value;
    element.removeAttribute(attribute.name);
    scope$.output$.pluck(propName).distinctUntilChanged()::subscribe(value=> {
      element[attrName] = value;
    });
  } else {
    bindTextContent(attribute.value, scope$, value=> element.setAttribute(attribute.name, value));
  }
}

function bindTextContent(template, scope$, cb) {
  const matches = template.match(/{{.*?}}/g);
  if(matches) {
    Observable.combineLatest(_(matches).map(function(match) {
      var key = match.match(/{{(.*)}}/)[1];
      return key;
    }).uniq().map(function(key) {
      return scope$.output$.pluck(key).distinctUntilChanged().map(function(value) { return [key, value]; });
    }).value())
    .map(values=> {
      return values.reduce((template, [key, value])=> {
        return template.replace(new RegExp('{{' + key.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&") + '}}', 'g'), value != null ? value : '');
      }, template);
    })
    ::subscribe(cb);
  }
}

function combineLatestObject(obj) {
  return Observable.combineLatest(_.map(obj, (obs$, key)=> obs$.map(value=> [key, value])), (...values)=> {
    return values.reduce((result, [key, value])=> _.set(result, key, value), {});
  });
}

function subscribe(cb) {
  return this.subscribe(cb, function onError(error) {
    console.log('on error', error, error.stack);
  });
}
