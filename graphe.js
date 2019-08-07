var s = new sigma('container');

var exp = document.getElementById("experiment");

var data_listener = function(event) {
  var x_position=0;
  var y_position=1;
  for(var i=1;i<event.data[0].length;i++){
    var list=[];
    for(let row in event.data){
      list.push(row[0].toString()+row[i].toString());
    }
    list.sort();
    for(let element of list){
      s.graph.addNode({
        // Main attributes:
        id: 'n_'+element,
        label: element,
        // Display attributes:
        x: x_position,
        y: y_position,
        size: 1,
        color: '#f00'
      })
      y_position-=1/event.data.length;
    }
    x_position+=1/event.data[0].length;
  }
  s.refresh();
}

exp.addEventListener("data_loaded", data_listener);


var triY = function(a, b){
  if (a.y < b.y) return -1;
  if (a.y > b.y) return 1;
  if (a.y == b.y) return 0;
}

