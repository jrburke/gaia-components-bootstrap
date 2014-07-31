# gaia-components bootstrap

This is a bootstrap script that helps in building the Custom Elements currently under [gaia-components](https://github.com/gaia-components).

Since HTML Imports is not available, there are still some unclear pathways around path referencing, multiple types of dependencies, and optimization. This approach uses a JS module API, the AMD module API, to express the dependencies and handle some resources through resource plugins.

However, the app consuming these resources does not need to us an AMD loader. The app just needs to be sure to include this script tag before any of the scripts tags for the gaia-components that fit in this model.

Right now, there are just two that work with this experimental approach:

* [jrburke/gaia-header](https://github.com/jrburke/gaia-header)
* [gaia-components/gaia-icons](https://github.com/gaia-components/gaia-icons) (just really a style sheet, so does not need adaptation, but a dependency for gaia-header)

See the [jrburke/gaia-header/index.html](https://github.com/jrburke/gaia-header/blob/master/index.html) for a demo of this approach. In order to run that demo, clone the repos mentioned below into a folder with these folder children.

* containing-folder
  * gaia-components-bootstrap (this repo)
  * gaia-header (from https://github.com/jrburke/gaia-header)
  * gaia-icons (from https://github.com/gaia-components/gaia-icons)

Then be sure to load the gaia-header/index.html in the browser using a URL that includes `containing-folder` in the name.

## Usage

For apps that do not have an AMD loader, it loads the bootstrap script, and then sets a `data-baseurl` on that script to inform the bootstrap what path to use as the base URL for dependency ID resolution. Then include any script tags for scripts needed by the components (you can view these like HTML Imports tags, but also, flattened):

From the jrburke/gaia-header/index.html example:

```html
  <script data-baseurl=".." src="../gaia-components-bootstrap/bootstrap.js"></script>
  <!-- These lib/font-fit.js is a dependency for script.js,
  and script.js is the main custom element in this example repo. -->
  <script src="lib/font-fit.js"></script>
  <script src="script.js"></script>
```

If a dependency is missing or out of order, then this bootstrap.js will mention which one, and where its script tag should be placed relative to the other scripts.

Then, just use named define() calls to define assets. To avoid having to deal with fetching HTML templates, right now those are just inlined with the module that defines the custom component. Condensed code for the gaia-header example, just to show the dependency relationships:

```javascript
// The text for the template used by this element.
define('text!gaia-header/template.html', function() {
  return [
    '<div class="inner">',
      '<button class="action-button"></button>',
      '<content></content>',
    '</div>'
  ].join('');
});

// Defines the gaia-header custom element.
define('gaia-header/script', function(require,exports,module) {
  var fontFit = require('./lib/font-fit');
  var template = require('tmpl!./template.html');
  require('css!gaia-icons/style');

  // To set up the path to its own style.css for the inline import of a scoped
  // style, require.toUrl can be used:
  var path = require.toUrl('./style.css');

  // Register the element and set the exports
  module.exports = document.registerElement('gaia-header', { prototype: proto });
});
```

This bootstrap script can handle 'css!', 'text!' and 'tmpl!' "loader plugins" for those IDs, and resolves relative IDs, and then generates paths based on those IDs using the data-baseurl value.

This bootstrap.js script does not do any async loading on its own, it just allows setting up relationships, and doing some specialized work based on the supported loader plugin types. Any dependency is expected to be already available by the time it is first requested by a Custom Element definition.

So, this script should not be seen as a loader, but really just a support script to enable building Custom Elements that have dependencies among each other easier, similar to the x-tag or polymer bootstrap scripts.

## Usage in an AMD loader

This style uses named module definitions. This allows it to work with a simple bootstrap script without needing a smarter loader. However, it means that you will need to install the Custom Element directories using the same directory name as the ID and you may need either a config entry or write out an adapter module for the main module reference.

While the named modules are not the ultimate ideal in module use, this allows non-modular apps to easily consume these resources without needing a loader. So, a decent compromise, and gives these components a way to better handle their dependencies. It even allows the non-modular apps to use some of the AMD optimization tooling for the custom element optimizations.

Full AMD loader usage likely needs a couple of tweaks and testing out -- for instance making sure there are real loader plugins installed in the AMD app for 'css', 'text' and 'tmpl'. The email app has real loader plugins for those types of resources, so it is just about making sure other projects can get to them.

## Considerations

While this means the gaia-components need a bootstrap script, the size of the bootstrap, which is small, will be made up in not needing to duplicate the baseUrl work or UMD API wrapping in all the gaia-components. So I believe it is a net win on space.

Plus, it allows gaia apps that are using modules (soon to be at least 5 apps) to consume these resources without needing to worry about handling an alternate way to do ID resolution, dependency management and optimization.
