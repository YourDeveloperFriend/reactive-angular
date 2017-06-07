"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _Rx = Rx;
var Observable = _Rx.Observable;

window.componentManager = (function () {
  function ComponentManager(components) {
    _classCallCheck(this, ComponentManager);

    this.components = components;
  }

  _createClass(ComponentManager, [{
    key: "toDOM",
    value: function toDOM($el) {
      return Observable.combineLatest(this.components.map(function (component) {
        return component.toDOM();
      }), function () {
        var _this = this;

        for (var _len = arguments.length, dom = Array(_len), _key = 0; _key < _len; _key++) {
          dom[_key] = arguments[_key];
        }

        // TODO
        while ($el.lastChild) {
          $el.removeChild($el.lastChild);
        }
        dom.forEach(function (dom) {
          _this.$el.appendChild(dom);
        });
      });
    }
  }, {
    key: "toHTMLString",
    value: function toHTMLString() {}
  }]);

  return ComponentManager;
})();