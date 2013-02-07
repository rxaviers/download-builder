## Hello

This is a front-end lib to give you core DownloadBuilder functionalities.

## What does it do?
- Handle check/uncheck of dependencies/dependents;
- Handle toggleAll logic;

## How to use it?

```javascript
var downloadBuilder = new DownloadBuilder( element );
```

DownloadBuilder will look inside of `element` and define:
- Components = `input[data-dependencies][name][type=checkbox]`;
- Toggle All = `input[type=checkbox].toggle-all`;
- Toggle All per group = `input[class^=\"toggle-all-\"][type=checkbox]`

If you want different toggle all class names, use the options below.

```javascript
var downloadBuilder = new DownloadBuilder( element, {
  toggleAll: ".select-all",
  toggleAllCategory: "[class^=\"select-all-\"]"
});
```

If you don't want to pass dependencies using the html attribute `data-dependencies`, pass the whole structure in options. (To be implemented yet)

```javascript
var downloadBuilder = new DownloadBuilder( element, {
  categories: [{
    name: "core",
    components: [{
      name: "core",
      dependencies: []
    },{
      name: "widgets",
      dependencies: []
    },{
      name: "mouse",
      dependencies: [ "core", "widget" ]
    },{
      name: "position",
      dependencies: []
    }]
  },{
    name: "widgets",
    components: [{
      name: "accordion",
      dependencies: [ "core", "widgets" ]
    },{
      name: "autocomplete",
      dependencies: [ "core", "widget", "menu", "position" ]
    }, ... ]
  }, ... ]
});
```

Checking or unchecking a component will trigger the `check` event. Clicking any toggle all will also trigger this event with all its corresponding components.

```javascript
downloadBuilder.on( "check", function( event, components, value, affectedDependents ) {
  if ( !check && userRegret( components, affectedDependents ) ) {
    // User did not confirm uncheck action via dialog.
    // Eg: uncheck all Interactions of http://jqueryui.com/download/ by clicking its toggle all.
    return false;
  }
});
```

For each checked or unchecked component, the `change` event will be triggered.

```javascript
downloadBuilder.on( "change", function( event, component, value ) {
  updateModel( component, value );
});
```

After all the components (singular if user clicks on one component, but plural for toggle alls) the `accumulated-change` event will be triggered.

```javascript
downloadBuilder.on( "accumulated-change", function( event, components, value ) {
  updateModel( components, value );
});
```

Follow a suggestion to render your html.

```html
{{#each categories}}
	<div class="ui-widget ui-widget-content component-group clearfix">
		<div class="component-group-desc">
			<h3>{{name}}</h3>
			<p>{{description}}</p>
		</div>
		<div class="component-group-list">
		{{#each components}}
			<div class="clearfix">
				<input id="{{name}}" type="checkbox" checked name="{{name}}" class="ui-widget-content" data-dependencies="{{dependencies}}">
				<label for="{{name}}" title="{{description}}" class="clearfix">
					<span class="component-title">{{title}}</span>
					<span class="component-desc">{{description}}</span>
				</label>
			</div>
		{{/each}}
		</div>
	</div>
{{/each}}
```

## Demo

Checkout our [demo](http://downloadbuilder.github.com/download-builder/demo/).

Checkout the [javascript application](https://github.com/DownloadBuilder/download-builder/blob/master/demo/app.js) of the demo above.
