
const {parse, View} = window;

function Component(config) {
  return function WaitForProps(props$) {
    return BoundComponent(config, props$);
  };
}

function BoundComponent({props, exposes, view, model}, props$) {
  view = View(view);
  return {
    toHTMLString() {
    
    },
    toDOM($el) {
      elView = view($el);
      const input = {
        on(event) {
          return elView.inputs$[event];
        },
        prop(propName) {
          return props$[propName];
        }
      };
      const output = model(input);
      const exposed = _.pick(output, exposes || []);
      const domChanges = view.outputs(output);
      return {
        exposed,
        domChanges,
      };
    },
  };
};

class Component {
  constructor(template, attrName) {
    this.template = template;
    this.info = template.getAttribute(attrName);
    template.removeAttribute(attrName);
    this.children = [];
    this.getChildren(template, true);
    this.inputs = {};
  }
  getChildren(template) {
    const found = false;
    [
      ['ngfor', NgForComponent],
      ['ngif', NgIfComponent],
    ].forEach(([attrName, Component])=> {
      if(!found && template.getAttribute('*' + attrName)) {
        let comment = null;
        if(!removed) {
          comment = document.createComment(attrName);
          if(template.nextSibling) {
            template.parentNode.insertBefore(comment, template.nextSibling);
          } else {
            template.parentNode.appendChild(comment);
          }
          template.parentNode.removeChild(template);
        }
        this.children.push([comment || this, new Component(template)]);
        found = true;
      }
    });
    if(!found) {
      if(const attribute of template.attributes) {
        if(attribute.name.match(/^\(.*\)$/)) {
          this.inputs[attribute.value] = this.inputs[attribute.value] || [];
          this.inputs[attribute.value].push(function(element) {
            return Observable.create(observer=> {
              const eListener = observer::onNext;
              element.addEventListener(attribute.name, eListener);
              return function dispose() {
                element.removeEventListener(attribute.name, eListener);
              };
            });
          });
        } else if(attribute.name.match(/^\[.*\]$/)) {
          this.outputs[attribute.value] = this.outputs[attribute.value] || [];
          this.outputs.push(function(element, scope$) {
            return $scope[attribute.value].map(value=> {
              return function() {
                element[attribute.name] = value;
              };
            });
          });
        } else if(attribute.name === '[(ngModel)]') {
          this.inputs[attribute.value] = this.inputs[attribute.value] || [];
          this.inputs[attribute.value].push(function(element) {
            return Observable.create(observer=> {
              const eListener = observer::onNext;
              element.addEventListener('keyup', eListener);
              return function dispose() {
                element.removeEventListener('keyup', eListener);
              };
            });
          });
          this.outputs[attribute.value] = this.outputs[attribute.value] || [];
          this.outputs[attribute.value].push(function(element, scope$) {
            return $scope[attribute.value].map(value=> {
              return function() {
                element[attribute.name] = value;
              };
            });
          });
        }
      }
      for(const childNode of template.childNodes) {
        if(childNode.nodeType !== 3) {
          this.getChildren(childNode);
        }
      }
    }
  }
  toHTMLString() {

  }
  toDOM() {
    return bindElement(this.template);
  }
}

class BaseComponent extends Component {
  bindEvent() {

  }
  bindOutput() {

  }
}

class NgForComponent extends BaseComponent {
  constructor(template) {
    super(template, '*.ngfor');
  }
}

class NgIfComponent extends BaseComponent {
  constructor(template) {
    super(template, '*ngif');
  }
}

class CustomComponent extends Component {
  constructor(view, model) {
    super(parse(template));
  }
}
