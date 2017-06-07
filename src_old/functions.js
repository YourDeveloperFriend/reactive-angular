
const {Subject, Observable} = Rx;
window.TTT = [];
window.BBB = [];

Rx.config.longStackSupport = true;

const oParser = new DOMParser();
function parse(str) {
  return parseDOM(oParser.parseFromString(str, 'text/html').body.children);
}

function parseDOM(children) {
  return _.map(children, child=> {
    if(child.nodeType === 3) {
      return child.textContent;
    } else if(child.nodeType === 8) {
      return false;
    } else {
      return {
        name: child.tagName,
        attributes: _.merge(..._.map(child.attributes, attribute=> ({[attribute.name]: attribute.value}))),
        children: parseDOM(child.childNodes),
      };
    }
  }).filter(_.identity);
}



function dig(dom, depth) {
  if(depth.length === 0) {
    return dom;
  } else {
    return dig(dom.childNodes[depth[0]], depth.slice(1));
  }
}

function getPreviousAsWell() {
  return this.scan((previous, values)=> {
    return [values, previous[0]];
  }, []);
}

function surrounds(str, surrounding) {
  const middle = surrounding.length / 2;
  const [start, finish] = [surrounding.substring(0, middle), surrounding.substring(middle)];
  if(str.indexOf(start) === 0 && str.lastIndexOf(finish) === str.length - finish.length) {
   return str.substring(start.length, str.length - finish.length) 
  }
}

function forEachAttribute(template, attributeFn, textNodeFn = _.constant([]), depth = []) {
  return forEachChild(template, (dom, depth)=> _.map(dom.attributes, (value, attr)=> attributeFn(value, attr, dom, depth)), textNodeFn, depth);
}

function forEachChild(template, childFn, textNodeFn = _.constant([]), depth = []) {
  let result = childFn(template, depth) || [];
  
  return _.reduce(template.children, (child, i)=> {
    if(_.isString(child)) {
      return result.concat(textNodeFn(child));
    } else {
      return result.concat(forEachChild(child, childFn, textNodeFn, depth.concat([i])));
    }
  }, result).filter(_.identity);
}

