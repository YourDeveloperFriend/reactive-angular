
const {Observable} = Rx;
window.componentManager = class ComponentManager {
  constructor(components) {
    this.components = components;
  }
  toDOM($el) {
    return Observable.combineLatest(this.components.map(component=> {
      return component.toDOM();
    }), function(...dom) {
      // TODO
      while($el.lastChild) {
        $el.removeChild($el.lastChild);
      }
      dom.forEach(dom=> {
        this.$el.appendChild(dom);
      });
    });
  }
  toHTMLString() {

  }
}
