var exp = document.getElementById("experiment");

class Graph {
  constructor(div_id) {
    // Create the canvas
    this.div = document.getElementById(div_id);
    this.canvas = document.createElement("canvas");
    this.div.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d");
    this.setup = this.defaultSetups();
    this.resize();
    this.reset();
  }

  defaultSetups() {
    return {
      // Edge properties
      edgeFillStyle: "#660000",
      edgeWidth: 2,
      // Node properties
      nodeFillStyle: "#AA0000",
      nodeSize: 30,
      // Overlay properties
      maxDistTrigger: 15,
      // Display properties
      zoomFactor: 2,
      // Global properties
      debug: false
    };
  }

  reset() {
    // Graph objects
    this.nodes = [];
    this.edges = [];
    // Indexes
    this.nodes_by_idx = new Map();
    this.edges_by_node = new Map();
  }

  resize(height=500) {
    let main = document.getElementById("main_screen");
    let side = document.getElementById("side");
    let computed_width = main.offsetWidth - side.offsetWidth - 5;
    this.div.style.width = computed_width + "px";
    this.canvas.style.width = computed_width + "px";
    side.style.height = height + 'px';
    this.canvas.style.height = height + 'px';
    this.canvas.width = computed_width * this.setup.zoomFactor;
    this.canvas.height = height * this.setup.zoomFactor;
  }

  addNode(node) {
    this.nodes.push(node);
    this.nodes_by_idx.set(node.id, node);
    this.refreshOverlay();
  }

  addEdge(node1, node2) {
    if (!this.nodes_by_idx.has(node1.id) || !this.nodes_by_idx.has(node2.id)) {
      console.log("Impossible to add edge because one of the nodes doesn't exists in the graph.");
      return;
    }

    // Add the nodes in edges by node
    if (!this.edges_by_node.has(node1.id))
      this.edges_by_node.set(node1.id, new Set());
    if (!this.edges_by_node.has(node2.id))
      this.edges_by_node.set(node2.id, new Set());

    // To avoid duyplicated edge
    if (this.edges_by_node.get(node1.id).has(node2.id)) {
      if (this.setup.debug)
        console.log(node1.id + " --- " + node2.id + " Already present");
      return;
    }

    // Register the edge
    this.edges_by_node.get(node1.id).add(node2.id);
    this.edges_by_node.get(node2.id).add(node1.id);
    this.edges.push([node1, node2]);
  }

  refreshOverlay() {
    // Sort points by x then y
    let x_binned = new Map();
    for (let node of this.nodes) {
      // Create new set for new x values
      if (!x_binned.has(node.x))
        x_binned.set(node.x, []);
      // Add the node to the correct bin
      x_binned.get(node.x).push(node);
    }

    let x_sorted = [...x_binned.keys()];
    x_sorted.sort();

    // Sort each bin regarding y
    for (let bin of x_binned.values()) {
      bin.sort((a, b) => {return a.y - b.y});
    }

    // Recreate the nearest node function (x and y relative to the canvas)
    var nearest_node = (x, y) => {
      // Search the nearest bin
      let min_dist = 2;
      let min_dist_x = null;
      for (let x_bin of x_sorted) {
        if (Math.abs(x-x_bin) <= min_dist) {
          min_dist = Math.abs(x-x_bin);
          min_dist_x = x_bin;
        }
      }
      let bin = x_binned.get(min_dist_x);

      // Search the nearest node in bin
      min_dist = 2;
      let min_dist_node = null;
      for (let node of bin) {
        if (Math.abs(y-node.y) <= min_dist) {
          min_dist = Math.abs(y-node.y);
          min_dist_node = node;
        }
      }

      return min_dist_node;
    }

    // Use nearest node function for triggering events
    let node_text = document.getElementById("node");
    this.canvas.onmousemove = (e) => {
      let node = nearest_node(
        (e.clientX - this.canvas.offsetLeft) / this.canvas.offsetWidth ,
        (e.clientY - this.canvas.offsetTop) / this.canvas.offsetHeight
      );
      node_text.innerHTML = node.label + "\n" + node.overlay;
    };
  }

  repaint() {
    let ctx = this.ctx;

    // Paint background
    ctx.fillStyle = "#FFFFFF"
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Paint edges
    ctx.strokeStyle = this.setup.edgeFillStyle;
    ctx.lineWidth = this.setup.edgeWidth;

    for (let edge of this.edges) {
      let node1 = edge[0];
      let node2 = edge[1];
      ctx.moveTo(node1.x * this.canvas.width, node1.y * this.canvas.height);
      ctx.lineTo(node2.x * this.canvas.width, node2.y * this.canvas.height);
      ctx.stroke();
    }

    // Paint nodes
    for (let node of this.nodes) {
      // Verify properties
      if (!('x' in node) || !('y' in node) || node.x < 0 || node.x > 1 || node.y < 0 || node.y > 1) {
        console.log("Wrong values for node " + node + "\nA node must contain a x and a y properties between 0 and 1.");
        continue;
      }

      // Draw the node
      ctx.fillStyle = this.setup.nodeFillStyle;
      ctx.beginPath();
      ctx.arc(
        node.x * this.canvas.width,
        node.y * this.canvas.height,
        this.setup.nodeSize/2,
        0,
        Math.PI * 2,
        true
      );
      ctx.fill();
    }
  }
}

// ----- Create the graph and prepare update -----
g = new Graph("container");
window.onresize = () => {
  g.resize();
  g.repaint();
};


// ----- Load data into the graph on event -----
var data_listener = function(event) {
  g.reset();
  // read the number of different k values
  num_diff_k = event.data[0].length - 1;
  // Prepare merged node (one by different value)
  values_per_k = [];
  for (let i=0 ; i<num_diff_k ; i++) {
    values_per_k.push(new Map());
  }

  // Read the words one by one to sort the values
  for (let word of event.data) {
    for (let k=0 ; k<num_diff_k ; k++) {
      let key = word[k+1];
      // First time that the value is encountered
      if (!values_per_k[k].has(key))
        values_per_k[k].set(key, [])
      // Add the word in the map
      values_per_k[k].get(key).push(word[0]);
    }
  }

  g.resize(Math.max(500, values_per_k[num_diff_k-1].size * 30));

  // Create nodes by column
  for (let k=0 ; k<num_diff_k ; k++) {
    let idx = 1;

    // Sort the nodes for one k
    let sorted_nodes = [...values_per_k[k].keys()];
    sorted_nodes.sort((a,b)=>{return a-b});

    for (let key of sorted_nodes) {
      // Create the positionned node
      let node = {
        id: (k+1) + "_" + key,
        label: key,
        overlay: values_per_k[k].get(key).join("\n"),
        x: (k+1)/(num_diff_k+1),
        y: 1 - idx/(values_per_k[k].size+1)
      }

      g.addNode(node);
      idx += 1;
    }
  }

  // Create edges
  for (let word of event.data) {
    for (let k=1 ; k<num_diff_k ; k++) {
      // Get ids for edge
      let id1 = k + "_" + word[k];
      let id2 = (k+1) + "_" + word[k+1];

      // Get nodes from ids
      let node1 = g.nodes_by_idx.get(id1);
      let node2 = g.nodes_by_idx.get(id2);

      // Add the edge
      g.addEdge(node1, node2);
    }
  }

  g.repaint();
}

exp.addEventListener("data_loaded", data_listener);