function pluralize( count, singular, plural ) {
  return count === 1 ? singular : plural;
}

var downloadBuilder = new DownloadBuilder( "form" )
  .on({
    "check": function( event, components, value, extra ) {
      console.log( "check", arguments );
      if ( extra.affectedDependents && extra.affectedDependents.length ) {
        event.preventDefault();
        $( "<div>" )
          .attr( "title", "Remove " + extra.affectedComponentNames.join( ", " ) + "?" )
          .append(
            $( "<p>" ).html(
              "Are you sure you want to remove <b>" + extra.affectedComponentNames.join( ", " ) + "</b>? The following " + pluralize( extra.affectedDependents.length, "component", "components" ) + " " + pluralize( extra.affectedDependents.length, "depends", "depend" ) + " on it and will be removed: " + extra.affectedDependents.map(function() {
                return "<b>" + this.name + "</b>";
              }).toArray().join( ", " ) + "."
            )
          )
          .dialog({
            modal: true,
            buttons: {
              "Remove": function() {
                event.defaultAction();
                $( this ).remove();
              },
              "Cancel": function() {
                $( this ).remove();
              }
            }
          })
          .dialog( "widget" ).addClass( "download-builder-dialog" );
      }
    },
    "change": function( event ) {
      console.log( "change", arguments );
    },
    "accumulated-change": function( event, components, value ) {
      console.log( "accumulated-change", arguments );
    }
  });
