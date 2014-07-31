/*jshint browser: true */
var define;
(function() {
  'use strict';

  if (typeof define === 'function') {
    return;
  }

  var baseUrl = document.currentScript.dataset.baseurl || '.';
  if (baseUrl.lastIndexOf('/') !== baseUrl.length - 1) {
    baseUrl += '/';
  }

  var registry = {};

  // This function assumes single segment IDs with a - in them mean it is
  // a custom element, and what we may really want is the ID of the main
  // module inside the package for that ID. This assumes the main module is
  // called 'script'.
  function aryMayNeedScript(parts) {
    if (parts.length === 1 && parts.indexOf('-') !== -1) {
      parts.push('script');
    }
    return parts;
  }

  function toFullId(refId, id) {
    var idParts = id.split('/');
    aryMayNeedScript(idParts);

    if (id.charAt(0) === '.') {
      var parts = refId.split('/');
      // Pull off last part, because that is the refId's module name, not the
      // directory
      parts.pop();

      parts = parts.concat(idParts);

      for (var i = 0; i < parts.length; i++) {
        var part = parts[i];
        if (part === '.') {
          parts.splice(i, 1);
          i -= 1;
        } else if (part === '..') {
          if (i === 0) {
              continue;
          } else if (i > 0) {
              parts.splice(i - 1, 2);
              i -= 2;
          }
        }
      }

      return parts.join('/');
    } else {
      return idParts.join('/');
    }
  }

  function toPath(id, ext) {
    // Pull off last part. If contains a `-` it means it is a custom element
    // name, so really want the script ID inside that element's directory.
    // Shorthand for a "package" config, but components to use 'script.js' as
    // their main module.
    return baseUrl + id + (ext ? '.' + ext : '');
  }

  function hasId(id) {
    return registry.hasOwnProperty(id);
  }

  var plugins = {
    text: function(id, refId) {
      id = 'text!' + id;

      if (hasId(id)) {
        return registry[id];
      } else {
          throw new Error('text resource ' + id + ' is not registered yet.' +
                          ' Place a define() for it before ' + refId);
      }
    },

    tmpl: function(id, refId) {
      var text = plugins.text(id, refId);
      var node = document.createElement('template');
      node.innerHTML = text;
      return node;
    },

    css: function(id, refId) {
      var path = toPath(id, 'css');
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.type = 'text/css';
      link.href = path;
      document.head.appendChild(link);
    }
  };

  function makeRequire(id) {
    var req = function(dep) {
      var prefix, resourceId, exports, fullId,
          parts = dep.split('!');

      if (parts.length === 2) {
        prefix = parts[0];
        resourceId = toFullId(id, parts[1]);
        fullId = prefix + '!' + resourceId;

        if (hasId(fullId)) {
          return registry[fullId];
        } else {
          return (registry[fullId] = plugins[prefix](resourceId, id));
        }
      } else {
        fullId = toFullId(id, dep);
        if (hasId(fullId)) {
          return registry[fullId];
        } else {
          throw new Error('gaia-bootstrap: ' + fullId +
                          ' not loaded yet. Add a script tag for: ' +
                          toPath(fullId, 'js') +
                          ' before the script tag for ' + id);
        }
      }
    };

    req.toUrl = function(resource) {
      var ext,
          parts = resource.split('/'),
          lastPart = parts[parts.length - 1],
          dotIndex = lastPart.lastIndexOf('.');

      if (dotIndex > -1) {
        ext = lastPart.substring(dotIndex + 1);
        parts[parts.length - 1] = lastPart.substring(0, dotIndex);
      }

      var fullId = toFullId(id, parts.join('/'));
      return toPath(fullId, ext);
    };

    return req;
  }

  define = function(id, deps, fn) {
    if (typeof id !== 'string') {
      throw new Error('Only define calls with string IDs are allowed');
    }

    if (!fn) {
      fn = deps;
    }

    // Normalize ID for package-main components
    id = aryMayNeedScript(id.split('/')).join('/');

    var exports = registry[id] = {};
    var mod = {
      id: id,
      exports: exports
    };

    var result = fn(makeRequire(id), exports, mod);

    if (result !== undefined) {
      registry[id] = result;
    } else if (mod.exports !== exports) {
      registry[id] = mod.exports;
    }
  };
}());