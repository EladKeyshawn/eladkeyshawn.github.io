// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles

// eslint-disable-next-line no-global-assign
require = (function (modules, cache, entry) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof require === "function" && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof require === "function" && require;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }
      
      localRequire.resolve = resolve;

      var module = cache[name] = new newRequire.Module;

      modules[name][0].call(module.exports, localRequire, module, module.exports);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module() {
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;

  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  // Override the current require with this new one
  return newRequire;
})({10:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.h = h;
exports.app = app;
function h(name, attributes /*, ...rest*/) {
  var node;
  var rest = [];
  var children = [];
  var length = arguments.length;

  while (length-- > 2) {
    rest.push(arguments[length]);
  }while (rest.length) {
    if ((node = rest.pop()) && node.pop /* Array? */) {
        for (length = node.length; length--;) {
          rest.push(node[length]);
        }
      } else if (node != null && node !== true && node !== false) {
      children.push(node);
    }
  }

  return typeof name === "function" ? name(attributes || {}, children) : {
    nodeName: name,
    attributes: attributes || {},
    children: children,
    key: attributes && attributes.key
  };
}

function app(state, actions, view, container) {
  var renderLock;
  var invokeLaterStack = [];
  var rootElement = container && container.children[0] || null;
  var oldNode = rootElement && toVNode(rootElement, [].map);
  var globalState = clone(state);
  var wiredActions = clone(actions);

  scheduleRender(wireStateToActions([], globalState, wiredActions));

  return wiredActions;

  function toVNode(element, map) {
    return {
      nodeName: element.nodeName.toLowerCase(),
      attributes: {},
      children: map.call(element.childNodes, function (element) {
        return element.nodeType === 3 // Node.TEXT_NODE
        ? element.nodeValue : toVNode(element, map);
      })
    };
  }

  function render() {
    renderLock = !renderLock;

    var next = view(globalState, wiredActions);
    if (container && !renderLock) {
      rootElement = patch(container, rootElement, oldNode, oldNode = next);
    }

    while (next = invokeLaterStack.pop()) {
      next();
    }
  }

  function scheduleRender() {
    if (!renderLock) {
      renderLock = !renderLock;
      setTimeout(render);
    }
  }

  function clone(target, source) {
    var obj = {};

    for (var i in target) {
      obj[i] = target[i];
    }for (var i in source) {
      obj[i] = source[i];
    }return obj;
  }

  function set(path, value, source) {
    var target = {};
    if (path.length) {
      target[path[0]] = path.length > 1 ? set(path.slice(1), value, source[path[0]]) : value;
      return clone(source, target);
    }
    return value;
  }

  function get(path, source) {
    for (var i = 0; i < path.length; i++) {
      source = source[path[i]];
    }
    return source;
  }

  function wireStateToActions(path, state, actions) {
    for (var key in actions) {
      typeof actions[key] === "function" ? function (key, action) {
        actions[key] = function (data) {
          if (typeof (data = action(data)) === "function") {
            data = data(get(path, globalState), actions);
          }

          if (data && data !== (state = get(path, globalState)) && !data.then // Promise
          ) {
              scheduleRender(globalState = set(path, clone(state, data), globalState));
            }

          return data;
        };
      }(key, actions[key]) : wireStateToActions(path.concat(key), state[key] = state[key] || {}, actions[key] = clone(actions[key]));
    }
  }

  function getKey(node) {
    return node ? node.key : null;
  }

  function setElementProp(element, name, value, isSVG, oldValue) {
    if (name === "key") {} else if (name === "style") {
      for (var i in clone(oldValue, value)) {
        element[name][i] = value == null || value[i] == null ? "" : value[i];
      }
    } else {
      if (typeof value === "function" || name in element && !isSVG) {
        element[name] = value == null ? "" : value;
      } else if (value != null && value !== false) {
        element.setAttribute(name, value);
      }

      if (value == null || value === false) {
        element.removeAttribute(name);
      }
    }
  }

  function createElement(node, isSVG) {
    var element = typeof node === "string" || typeof node === "number" ? document.createTextNode(node) : (isSVG = isSVG || node.nodeName === "svg") ? document.createElementNS("http://www.w3.org/2000/svg", node.nodeName) : document.createElement(node.nodeName);

    if (node.attributes) {
      if (node.attributes.oncreate) {
        invokeLaterStack.push(function () {
          node.attributes.oncreate(element);
        });
      }

      for (var i = 0; i < node.children.length; i++) {
        element.appendChild(createElement(node.children[i], isSVG));
      }

      for (var name in node.attributes) {
        setElementProp(element, name, node.attributes[name], isSVG);
      }
    }

    return element;
  }

  function updateElement(element, oldProps, attributes, isSVG) {
    for (var name in clone(oldProps, attributes)) {
      if (attributes[name] !== (name === "value" || name === "checked" ? element[name] : oldProps[name])) {
        setElementProp(element, name, attributes[name], isSVG, oldProps[name]);
      }
    }

    if (attributes.onupdate) {
      invokeLaterStack.push(function () {
        attributes.onupdate(element, oldProps);
      });
    }
  }

  function removeChildren(element, node, attributes) {
    if (attributes = node.attributes) {
      for (var i = 0; i < node.children.length; i++) {
        removeChildren(element.childNodes[i], node.children[i]);
      }

      if (attributes.ondestroy) {
        attributes.ondestroy(element);
      }
    }
    return element;
  }

  function removeElement(parent, element, node, cb) {
    function done() {
      parent.removeChild(removeChildren(element, node));
    }

    if (node.attributes && (cb = node.attributes.onremove)) {
      cb(element, done);
    } else {
      done();
    }
  }

  function patch(parent, element, oldNode, node, isSVG, nextSibling) {
    if (node === oldNode) {} else if (oldNode == null) {
      element = parent.insertBefore(createElement(node, isSVG), element);
    } else if (node.nodeName && node.nodeName === oldNode.nodeName) {
      updateElement(element, oldNode.attributes, node.attributes, isSVG = isSVG || node.nodeName === "svg");

      var oldElements = [];
      var oldKeyed = {};
      var newKeyed = {};

      for (var i = 0; i < oldNode.children.length; i++) {
        oldElements[i] = element.childNodes[i];

        var oldChild = oldNode.children[i];
        var oldKey = getKey(oldChild);

        if (null != oldKey) {
          oldKeyed[oldKey] = [oldElements[i], oldChild];
        }
      }

      var i = 0;
      var j = 0;

      while (j < node.children.length) {
        var oldChild = oldNode.children[i];
        var newChild = node.children[j];

        var oldKey = getKey(oldChild);
        var newKey = getKey(newChild);

        if (newKeyed[oldKey]) {
          i++;
          continue;
        }

        if (newKey == null) {
          if (oldKey == null) {
            patch(element, oldElements[i], oldChild, newChild, isSVG);
            j++;
          }
          i++;
        } else {
          var recyledNode = oldKeyed[newKey] || [];

          if (oldKey === newKey) {
            patch(element, recyledNode[0], recyledNode[1], newChild, isSVG);
            i++;
          } else if (recyledNode[0]) {
            patch(element, element.insertBefore(recyledNode[0], oldElements[i]), recyledNode[1], newChild, isSVG);
          } else {
            patch(element, oldElements[i], null, newChild, isSVG);
          }

          j++;
          newKeyed[newKey] = newChild;
        }
      }

      while (i < oldNode.children.length) {
        var oldChild = oldNode.children[i];
        if (getKey(oldChild) == null) {
          removeElement(element, oldElements[i], oldChild);
        }
        i++;
      }

      for (var i in oldKeyed) {
        if (!newKeyed[oldKeyed[i][1].key]) {
          removeElement(element, oldKeyed[i][0], oldKeyed[i][1]);
        }
      }
    } else if (node.nodeName === oldNode.nodeName) {
      element.nodeValue = node;
    } else {
      element = parent.insertBefore(createElement(node, isSVG), nextSibling = element);
      removeElement(parent, nextSibling, oldNode);
    }
    return element;
  }
}
},{}],11:[function(require,module,exports) {
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = {

    init: function init() {
        return function (state, actions) {
            var url = 'https://medium.com/feed/@eladk';

            feednami.load(url, function (result) {
                if (result.error) {
                    console.log(result.error);
                } else {
                    actions.showPosts(result.feed.entries);
                }
            });
        };
    },

    showPosts: function showPosts(posts) {
        return function () {
            return { posts: posts };
        };
    }

};
},{}],12:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = {
    posts: []
};
},{}],6:[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _hyperapp = require("hyperapp");

exports.default = function (_ref, _ref2) {
    var posts = _ref.posts;
    var init = _ref2.init;
    return (0, _hyperapp.h)(
        "div",
        { "class": "container", oncreate: init },
        (0, _hyperapp.h)(
            "div",
            { "class": "row buffer-top" },
            (0, _hyperapp.h)(
                "div",
                { "class": "six columns" },
                (0, _hyperapp.h)(
                    "h1",
                    null,
                    "Hey, I\u2019m Elad \uD83D\uDC4B"
                ),
                (0, _hyperapp.h)(
                    "p",
                    null,
                    " CS student, software engineer, cyclist and travel enthusiast.",
                    (0, _hyperapp.h)("br", null),
                    "Interested in deep learning, cryptography and articulated software architecture."
                )
            )
        ),
        (0, _hyperapp.h)(
            "div",
            { "class": "row " },
            (0, _hyperapp.h)(
                "h4",
                null,
                "Posts"
            ),
            (0, _hyperapp.h)(
                "div",
                { "class": "eight columns" },
                posts.map(function (post) {
                    return (0, _hyperapp.h)(
                        "div",
                        { "class": "post" },
                        (0, _hyperapp.h)(
                            "span",
                            null,
                            post.date
                        ),
                        (0, _hyperapp.h)(
                            "a",
                            { href: post.link, target: "_blank" },
                            (0, _hyperapp.h)(
                                "p",
                                null,
                                post.title
                            )
                        )
                    );
                })
            )
        ),
        (0, _hyperapp.h)(
            "div",
            { "class": "row buffer-top" },
            (0, _hyperapp.h)(
                "p",
                null,
                "You can find me on:"
            ),
            (0, _hyperapp.h)(
                "h5",
                null,
                (0, _hyperapp.h)(
                    "a",
                    { href: "https://github.com/EladKeyshawn", target: "_blank" },
                    " Github "
                ),
                " |",
                (0, _hyperapp.h)(
                    "a",
                    { href: "https://il.linkedin.com/in/elad-keyshawn-a68938119", target: "_blank" },
                    " LinkedIn "
                ),
                " |",
                (0, _hyperapp.h)(
                    "a",
                    { href: "mailto:me@elad.636@gmail.com", target: "_blank" },
                    " Email "
                ),
                " |",
                (0, _hyperapp.h)(
                    "a",
                    { href: "../../assets/files/resume.pdf", target: "_blank" },
                    " Resume "
                )
            )
        )
    );
};
},{"hyperapp":10}],13:[function(require,module,exports) {
var bundleURL = null;
function getBundleURLCached() {
  if (!bundleURL) {
    bundleURL = getBundleURL();
  }

  return bundleURL;
}

function getBundleURL() {
  // Attempt to find the URL of the current script and use that as the base URL
  try {
    throw new Error;
  } catch (err) {
    var matches = ('' + err.stack).match(/(https?|file|ftp):\/\/[^)\n]+/g);
    if (matches) {
      return getBaseURL(matches[0]);
    }
  }

  return '/';
}

function getBaseURL(url) {
  return ('' + url).replace(/^((?:https?|file|ftp):\/\/.+)\/[^/]+$/, '$1') + '/';
}

exports.getBundleURL = getBundleURLCached;
exports.getBaseURL = getBaseURL;

},{}],9:[function(require,module,exports) {
var bundle = require('./bundle-url');

function updateLink(link) {
  var newLink = link.cloneNode();
  newLink.onload = function () {
    link.remove();
  };
  newLink.href = link.href.split('?')[0] + '?' + Date.now();
  link.parentNode.insertBefore(newLink, link.nextSibling);
}

var cssTimeout = null;
function reloadCSS() {
  if (cssTimeout) {
    return;
  }

  cssTimeout = setTimeout(function () {
    var links = document.querySelectorAll('link[rel="stylesheet"]');
    for (var i = 0; i < links.length; i++) {
      if (bundle.getBaseURL(links[i].href) === bundle.getBundleURL()) {
        updateLink(links[i]);
      }
    }

    cssTimeout = null;
  }, 50);
}

module.exports = reloadCSS;

},{"./bundle-url":13}],4:[function(require,module,exports) {

        var reloadCSS = require('_css_loader');
        module.hot.dispose(reloadCSS);
        module.hot.accept(reloadCSS);
      
},{"_css_loader":9}],5:[function(require,module,exports) {

        var reloadCSS = require('_css_loader');
        module.hot.dispose(reloadCSS);
        module.hot.accept(reloadCSS);
      
},{"_css_loader":9}],7:[function(require,module,exports) {
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

window.feednami = {}, feednami.load = function (e, n) {
  var o = "https://api.feednami.com/api/v1",
      a = e;"object" == (typeof e === "undefined" ? "undefined" : _typeof(e)) && (a = e.url);var t = "url=" + encodeURIComponent(a);e.format && (t += "&include_xml_document&format=" + e.format), e.includeXml && (t += "&include_xml_document");var d = o + "/feeds/load?" + t;if (window.XDomainRequest) {
    var l = document.createElement("script"),
        c = "jsonp_callback_" + new Date().getTime() + "_" + Math.round(1e6 * Math.random());d += "&jsonp_callback=" + c, window[c] = function (e) {
      n(e), document.body.removeChild(l), window[c] = null;try {
        delete window[c];
      } catch (o) {}
    }, l.src = d, document.body.appendChild(l);
  } else {
    var i = new XMLHttpRequest();i.onreadystatechange = function () {
      4 == i.readyState && n(JSON.parse(i.responseText));
    }, i.open("GET", d), i.send();
  }
}, feednami.loadGoogleFormat = function (e, n) {
  return feednami.load({ url: e, format: "google", includeXml: !0 }, n);
};
},{}],2:[function(require,module,exports) {
'use strict';

var _hyperapp = require('hyperapp');

var _actions = require('./actions');

var _actions2 = _interopRequireDefault(_actions);

var _state = require('./state');

var _state2 = _interopRequireDefault(_state);

var _main = require('./components/main');

var _main2 = _interopRequireDefault(_main);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// bundle in some libs
require('./css/skeleton.css');
require('./css/main.css');
require('./js/feednami.min');

(0, _hyperapp.app)(_state2.default, _actions2.default, _main2.default, document.body);
},{"hyperapp":10,"./actions":11,"./state":12,"./components/main":6,"./css/skeleton.css":4,"./css/main.css":5,"./js/feednami.min":7}],43:[function(require,module,exports) {

var global = (1, eval)('this');
var OldModule = module.bundle.Module;
function Module() {
  OldModule.call(this);
  this.hot = {
    accept: function (fn) {
      this._acceptCallback = fn || function () {};
    },
    dispose: function (fn) {
      this._disposeCallback = fn;
    }
  };
}

module.bundle.Module = Module;

if (!module.bundle.parent && typeof WebSocket !== 'undefined') {
  var hostname = '' || location.hostname;
  var ws = new WebSocket('ws://' + hostname + ':' + '65279' + '/');
  ws.onmessage = function (event) {
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      data.assets.forEach(function (asset) {
        hmrApply(global.require, asset);
      });

      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          hmrAccept(global.require, asset.id);
        }
      });
    }

    if (data.type === 'reload') {
      ws.close();
      ws.onclose = function () {
        location.reload();
      };
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + 'data.error.stack');
    }
  };
}

function getParents(bundle, id) {
  var modules = bundle.modules;
  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];
      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(+k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;
  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAccept(bundle, id) {
  var modules = bundle.modules;
  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAccept(bundle.parent, id);
  }

  var cached = bundle.cache[id];
  if (cached && cached.hot._disposeCallback) {
    cached.hot._disposeCallback();
  }

  delete bundle.cache[id];
  bundle(id);

  cached = bundle.cache[id];
  if (cached && cached.hot && cached.hot._acceptCallback) {
    cached.hot._acceptCallback();
    return true;
  }

  return getParents(global.require, id).some(function (id) {
    return hmrAccept(global.require, id);
  });
}
},{}]},{},[43,2])
//# sourceMappingURL=EladKeyshawn.map