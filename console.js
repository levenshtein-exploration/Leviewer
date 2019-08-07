var s = new sigma('container');

var exp = document.getElementById("experiment");

var data_listener = function(event) {
	var x_position=0;
	var y_position=1;
	var lab="";
	var last_node="";
	for (let row of event.data) {
		for(let element of row){
	  		if(element==row[0]){
	  			lab=row[0];
		  	}else{
		  		s.graph.addNode({
					// Main attributes:
					id: 'n_'+lab+element.toString(),
					label: lab+element.toString(),
					// Display attributes:
					x: x_position,
					y: 1/element,
					size: 1,
					color: '#f00'
				})
				if(element!=row[1]){
					s.graph.addEdge({
	  					id: 'e_'+lab+element.toString(),
						source: last_node,
						target: 'n_'+lab+element.toString()
					});
				}
				last_node='n_'+lab+element.toString()
				x_position+=1/row.length;
		  	}		
	  	}
	  	x_position=0;
	}
	all_nodes=s.graph.nodes();
  	for(let x_position=0;x_position<1;x_position+=1/event.data[0].length){
    	list_nodes=[];
    	for(node of all_nodes){
    		if(node.x==x_position){
        		list_nodes.push(node);
      		}
    	}
    	list_nodes.sort(triY);
    	for(var i=0;i<list_nodes.length;i++){
    		node.y=y_position;
    		if(list_nodes[i]!=list_nodes[i-1]){
    			y_position-=1/event.data.length;
    		}    		
    	}
    	y_position=1;
  	}
  	s.refresh();
}

var triY = function(a, b){
  if (a.y < b.y) return -1;
  if (a.y > b.y) return 1;
  if (a.y == b.y) return 0;
}

exp.addEventListener("data_loaded", data_listener);