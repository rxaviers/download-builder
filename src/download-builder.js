/*
 * DownloadBuilder main class JavaScript file
 * @requires jQuery (external)
 *
 * ** ADD LICENSE HERE **
 */
/*!
 * DownloadBuilder http://git.io/r3JMkQ
 */
(function( exports, $, undefined ) {

var accumulateChange, allGroup, defaultCheckAction, flushChanges, groupToggleAlls, triggerCheck;

/**
 * class DownloadBuilder
 *
 * The main class required to set up a DownloadBuilder instance in the browser.
 *
 * ```javascript
 * var downloadBuilder = new DownloadBuilder( element );
 * ```
 */

var defaults = {
  components: "input[data-dependencies][name][type=checkbox]",
  toggleAll: "input[type=checkbox].toggle-all",
  groupToggleAll: "input[class^=\"toggle-all-\"][type=checkbox]"
};

/**
 * new DownloadBuilder( element, options )
 * - element [ String / jQuery element ]: download builder element.
 *   TODO: Needs better explanation of its expected structure.
 * - options [ Object ]: Detailed below.
 *
 * options:
 * - components [ String ]: Selector. Default:
 *   `input[data-dependencies][name][type=checkbox]`
 * - toggleAll [ String ]: Selector. Default: `input[type=checkbox].toggle-all`
 * - groupToggleAll[ String ]: Selector. Default:
 *   `input[class^=\"toggle-all-\"][type=checkbox]`
 * 
 * Events:
 * - check( ev, components, value, affectedDependents ): Triggered when user
 *   check or uncheck any component checkboxes or any toggleAll checkboxes.
 * - accumulated-change( ev, components, value ): Triggered after components
 *   being checked or unchecked.
 */
function DownloadBuilder( element, options ) {
  var self = this;
  options = $.extend( {}, DownloadBuilder.defaults, options );

  // Initialize download builder elements
  this.element = $( element );
  var componentsSelector = this.componentsSelector = options.components;
  var toggleAllSelector = options.toggleAll;
  var groupToggleAllSelector = options.groupToggleAll;
  this.allComponents = this.element.find( options.components );
  this.toggleAll = this.element.find( toggleAllSelector );
  this.groupToggleAlls = this.element.find( groupToggleAllSelector );

  // Initialize dependencies and dependents auxiliary variables.
  var dependencies = this.dependencies = {};
  var dependents = this.dependents = {};
  this.allComponents.each(function() {
    var component = $( this ),
      thisDependencies = component.data( "dependencies" ),
      thisName = component.attr( "name" );

    if ( !thisName || !thisDependencies ) {
      return;
    }
    thisDependencies = thisDependencies.split( "," );
    dependencies[ thisName ] = $();
    $.each( thisDependencies, function() {
      var dependecy = this,
        dependecyElem = $( "[name=" + this + "]" );
      dependencies[ thisName ] = dependencies[ thisName ].add( dependecyElem );
      if ( !dependents[ dependecy ] ) {
        dependents[ dependecy ] = $();
      }
      dependents[ dependecy ] = dependents[ dependecy ].add( component );
    });
  });

  // Bind events
  this.element
    .on( "click", toggleAllSelector, function( event ) {
      var target = $( event.target );
      triggerCheck.call( self, event, self.allComponents, target.prop( "checked" ), {
        skipDependencies: true
      });
    })
    .on( "click", groupToggleAllSelector, function( event ) {
      var target = $( event.target );
      triggerCheck.call( self, event, allGroup.call( self, target ), target.prop( "checked" ) );
    })
    .on( "click", componentsSelector, function( event ) {
      var target = $( event.target );
      triggerCheck.call( self, event, target, target.prop( "checked" ) );
    })
    .on( "change", componentsSelector, function( event ) {
      var target = $( event.target );
      accumulateChange.call( self, target );
    });
}

DownloadBuilder.defaults = defaults;

/**
 * -private method-
 * downloadBuilder#accumulateChange( component )
 *
 * Accumulate checked/unchecked components that really changed, so we can
 * updated the toggleAlls later, and we can send one only event with all the
 * changes.
 */
accumulateChange = function( component ) {
  if ( !this.accChangedComponents ) {
    this.accChangedComponents = $();
  }
  this.accChangedComponents = this.accChangedComponents.add( component );
};

/**
 * -private method-
 * downloadBuilder#allGroup( groupToggleAll )
 *
 * Descend until it finds components.
 */
allGroup = function( groupToggleAll ) {
  var container;
  var components = $();
  for ( container = groupToggleAll.parent(); container.length && !components.length; container = container.parent() ) {
    components = container.find( this.componentsSelector );
  }
  return components;
};

/**
 * -private method-
 * downloadBuilder#defaultCheckAction( components, value, options )
 *
 * Checks/unchecks components and its dependencies/dependents.
 */
defaultCheckAction = function check( components, value, options ) {
  var self = this;
  var depElements = $();
  var dependencies = this.dependencies;
  var dependents = this.dependents;

  components.each(function() {
    var component = $( this ),
      name = component.attr( "name" );

    // Handle dependencies
    if ( value && !options.skipDependencies ) {
      if ( dependencies[ name ] ) {
        // Whenever a checkbox is activated, also activate all dependencies
        depElements = depElements.add( dependencies[ name ] );
      }
    } else if ( dependents[ name ] && !options.skipDependencies ) {
      // Whenever a checkbox is deactivated, also deactivate all dependents
      depElements = depElements.add( dependents[ name ] );
    }

    if ( component.prop( "checked" ) !== value ) {
      component.prop( "checked", value ).trigger( "change" );
    }
  });

  // Update dependencies
  if ( depElements.length ) {
    defaultCheckAction.call( this, depElements, value, {
      skipFlush: true
    });
  }

  if ( !options.skipFlush ) {
    flushChanges.call( this, value );
  }
};

/**
 * -private method-
 * downloadBuilder#flushChanges( value )
 *
 * Trigger updateToggleAlls and the accumulated-change event.
 */
flushChanges = function( value ) {
  var event = $.Event( "accumulated-change" );
  if ( this.accChangedComponents ) {
    updateToggleAlls.call( this, this.accChangedComponents, value );
    this.element.trigger( event, [ this.accChangedComponents, value ]);
    delete this.accChangedComponents;
  }
};

/**
 * -private method-
 * downloadBuilder#groupToggleAlls( components )
 *
 * Return the toggleAlls for the given components.
 */
groupToggleAlls = function( components ) {
  var self = this;
  var groupToggleAlls = $();

  if ( !this.component2groupToggleAll ) {
    this.component2groupToggleAll = {};
    this.groupToggleAlls.each(function() {
      var groupToggleAll = $( this );
      allGroup.call( self, groupToggleAll ).each(function() {
        var component = $( this );
        var componentName = component.attr( "name" );
        self.component2groupToggleAll[ componentName ] = groupToggleAll;
      });
    });
  }

  components.each(function() {
    var component = $( this );
    var componentName = component.attr( "name" );
    var groupToggleAll = self.component2groupToggleAll[ componentName ];
    groupToggleAlls = groupToggleAlls.add( groupToggleAll );
  });

  return groupToggleAlls;
};

/**
 * -private method-
 * downloadBuilder#triggerCheck( components, value, options )
 *
 * Calculate affectedDependents (if it's the case), trigger "check" and then
 * trigger the default action if default has not been prevented.
 */
triggerCheck = function( clickEvent, components, value, options ) {
  var self = this;
  var extra = {};
  options = options || {};

  // Calculate affectedDependents when uncheck.
  if ( !value && !options.skipDependencies ) {
    var affectedComponentNames = [];
    var affectedDependents = $();
    var dependents = this.dependents;
    components.each(function() {
      var name = $( this ).attr( "name" );
      if ( !dependents[ name ] ) {
        return;
      }
      var checkedDependents = dependents[ name ]
        .filter( ":checked" )
        .not( components );
      if ( checkedDependents.length ) {
        affectedComponentNames.push( name );
        affectedDependents = affectedDependents.add( checkedDependents );
      }
    });
    extra.affectedComponentNames = affectedComponentNames;
    extra.affectedDependents = affectedDependents;
  }

  var event = $.Event( "check" );
  event.defaultAction = function() {
    // When components is the clicked one, its change event will be triggered
    // after defaultCheckAction finishes. So, adding it to the accumulated-
    // changed-components now to make things work properly.
    accumulateChange.call( self, components );
    defaultCheckAction.call( self, components, value, options );
  };
  this.element.trigger( event, [ components, value, extra ]);

  if ( event.isDefaultPrevented() ) {
    clickEvent.preventDefault();
  } else {
    event.defaultAction();
  }
};

/**
 * -private method-
 * downloadBuilder#updateToggleAlls( components, value )
 *
 * Smart update toggleAll's, checking/unchecking it when appropriate.
 */
updateToggleAlls = function( components, value ) {
  var self = this;

  // Update toggle all
  if ( value ) {
    groupToggleAlls.call( this, components ).each(function() {
      var groupToggleAll = $( this );
      var groupComponents = allGroup.call( self, groupToggleAll );
      // Set group toggle all if all components of its group are checked
      if ( !groupComponents.filter( ":not(:checked)" ).length ) {
        groupToggleAll.prop( "checked", true );
      }
    });
    // Set toggle all if all components are checked
    if ( !this.allComponents.filter( ":not(:checked)" ).length ) {
      this.toggleAll.prop( "checked", true );
    }
  } else {
    groupToggleAlls.call( this, components ).each(function() {
      var groupToggleAll = $( this );
      var groupComponents = allGroup.call( self, groupToggleAll );
      // Unset group toggle all if no components of its group are checked
      if ( !groupComponents.filter( ":checked" ).length ) {
        groupToggleAll.prop( "checked", false );
      }
    });
    // Unset toggle all if no components are checked
    if ( !this.allComponents.filter( ":checked" ).length ) {
      this.toggleAll.prop( "checked", false );
    }
  }
};


/**
 * Public methods
 */
DownloadBuilder.prototype = {

  /**
   * downloadBuilder#on( ... )
   * aguments: same arguments as jQuery's .on().
   */
  on: function() {
    this.element.on.apply( this.element, arguments );
    return this;
  }
};

/**
 * Export public interface
 */
exports.DownloadBuilder = DownloadBuilder;

}( this, jQuery ));
// vim:ts=2:st=2:sw=2:et:tw=80:
