var exp = document.getElementById("experiment");

class Graph {
  constructor(div_id) {
    // Create the canvas
    this.div = document.getElementById(div_id);
    this.canvas = document.createElement("canvas");
    this.canvas.style["z-index"] = 0;
    this.div.appendChild(this.canvas);
    // Crete the overlay canvas
    this.over_canvas = document.createElement("canvas");
    this.over_canvas.style["z-index"] = 1;
    this.div.appendChild(this.over_canvas);

    this.ctx = this.canvas.getContext("2d");
    this.setup = this.defaultSetups();
    this.current_size = 500;
    this.current_node = null;

    this.resize(this.current_size);
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

  resize(height) {
    // Blocks to mesure
    let main = document.getElementById("main_screen");
    let side = document.getElementById("side");
    // Space needed computation
    let computed_width = main.offsetWidth - side.offsetWidth - 50;
    // Width update
    this.div.style.width = computed_width + "px";
    this.canvas.style.width = this.over_canvas.style.width = computed_width + "px";
    this.canvas.width = this.over_canvas.width = computed_width * this.setup.zoomFactor;
    // Height update
    side.style.height = height + 'px';
    this.div.style.height = (height) + "px";
    this.canvas.style.height = this.over_canvas.style.height = height + 'px';
    this.canvas.height = this.over_canvas.height = height * this.setup.zoomFactor;
  }

  addNode(node, overlayRefreshment=true) {
    this.nodes.push(node);
    this.nodes_by_idx.set(node.id, node);
    if (overlayRefreshment)
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
    let side = document.getElementById("side");
    let update_activated = true;
    let that = this;
    this.over_canvas.onmousemove = (e) => {
      if (!update_activated)
        return;
      let node = nearest_node(
        (e.clientX - that.div.offsetLeft) / that.div.offsetWidth ,
        (e.clientY - that.div.offsetTop) / that.div.offsetHeight
      );
      side.innerHTML = "<p>" + node.label + "</p><p>" + node.overlay + "</p>";
      that.current_node = node;
      that.repaint_overlay();
    };
    // Stop the update create by mouse movement by clicking
    this.over_canvas.onclick = () => {update_activated = !update_activated;}
  }

  repaint() {
    let ctx = this.ctx;

    // Paint background
    ctx.fillStyle = "#FFFFFF"
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    let that = this;
    let paint_callback = function* () {
      // Paint edges
      ctx.strokeStyle = that.setup.edgeFillStyle;
      ctx.lineWidth = that.setup.edgeWidth;

      for (let edge of that.edges) {
        let node1 = edge[0];
        let node2 = edge[1];
        ctx.moveTo(node1.x * that.canvas.width, node1.y * that.canvas.height);
        ctx.lineTo(node2.x * that.canvas.width, node2.y * that.canvas.height);
        yield true;
      }
      ctx.stroke();

      // Paint nodes
      for (let node of that.nodes) {
        // Verify properties
        if (!('x' in node) || !('y' in node) || node.x < 0 || node.x > 1 || node.y < 0 || node.y > 1) {
          console.log("Wrong values for node " + node + "\nA node must contain a x and a y properties between 0 and 1.");
          continue;
        }

        // Draw the node
        ctx.fillStyle = that.setup.nodeFillStyle;
        ctx.beginPath();
        ctx.arc(
          node.x * that.canvas.width,
          node.y * that.canvas.height,
          that.setup.nodeSize/2,
          0,
          Math.PI * 2,
          true
        );
        ctx.fill();
        yield true;
      }
    };

    let generator = paint_callback();
    let partial_refresh = () => {
      for (let idx=0 ; idx<200 ; idx++) {
        if (!generator)
          break;
        generator.next();
      }

      if (generator)
        window.requestAnimationFrame(partial_refresh);
    };
    window.requestAnimationFrame(partial_refresh);
  }

  repaint_overlay() {
    // Clear the screen
    let ctx = this.over_canvas.getContext("2d");
    ctx.clearRect(0, 0, this.over_canvas.width, this.over_canvas.height);

    // Repaint the overlay
    if (this.current_node == null)
      return;
    // Draw the node
    ctx.fillStyle = "#00AA00";
    ctx.beginPath();
    ctx.arc(
      this.current_node.x * this.canvas.width,
      this.current_node.y * this.canvas.height,
      this.setup.nodeSize/2,
      0,
      Math.PI * 2,
      true
    );
    ctx.fill();
  }
}

// ----- Create the graph and prepare update -----
g = new Graph("container");
window.onresize = () => {
  g.resize(g.current_size);
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

  g.current_size = Math.max(500, values_per_k[num_diff_k-1].size * 30);
  g.resize(g.current_size);

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

      g.addNode(node, false);
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

  g.refreshOverlay();
  g.repaint();
}

exp.addEventListener("data_loaded", data_listener);