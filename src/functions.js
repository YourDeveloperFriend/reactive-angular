
const oParser = new DOMParser();
function parse(str) {
  return oParser.parseFromString(str, 'text/html').body.children[0];
}

function dig(dom, depth) {
  if(depth.length === 0) {
    return dom;
  } else {
    return dig(dom.childNodes[depth[0]], depth.slice(1));
  }
}

function getPreviousAsWell() {
  return this.scan([], (previous, values)=> {
    return [values, previous[0]];
  });
}

function surrounds(str, surrounding) {
  const middle = surrounding.length / 2;
  const [start, finish] = [surrounding.substring(0, middle), surrounding.substring(middle)];
  if(str.indexOf(start) === 0 && str.lastIndexOf(finish) === str.length - finish.length) {
   return str.substring(start.length, str.length - finish.length) 
  }
}

function forEachAttribute(template, attributeFn, textNodeFn = _.constant([]), depth = []) {
  return forEachChild(template, (dom, depth)=> _.map(dom.attributes, attr=> attributeFn(attr, dom, depth)), textNodeFn, depth);
}

function forEachChild(template, childFn, textNodeFn = _.constant([]), depth = []) {
  let result = childFn(template, depth) || [];
  
  for(let [i, childNode] of template.childNodes.entries()) {
    if(childNode.nodeType === 3) {
      result = result.concat(textNodeFn(childNode));
    } else if(childNode.nodeType !== 8) {
      result = result.concat(forEachChild(childNode, childFn, textNodeFn, depth.concat([i])));
    }
  }
  return result.filter(_.identity);
}

