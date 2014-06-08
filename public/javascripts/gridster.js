$(document).load(function () {
var grid_canvas = $(".gridster > ul").gridster( 
{  widget_margins: [3, 3],        
widget_base_dimensions: [110, 110],serialize_params: function($w, wgd)
  {
   return {
    id: $($w).attr('id'),
    col: wgd.col,
    row: wgd.row,
    size_x: wgd.size_x,
    size_y: wgd.size_y,
   };
  },
  draggable: 
  {
   stop: function(event, ui) {    
    var positions = JSON.stringify(this.serialize());
    localStorage.setItem('positions', positions);
  
    $.post(
    "process.php",
    {"positions": positions},
    function(data)
     {
      if(data==200)
       console.log("Data successfully sent to the server");
      else
       console.log("Error: Data cannot be sent to the server")
     }
    );}
  } 
    }).data('gridster');