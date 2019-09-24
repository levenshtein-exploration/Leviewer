var exp = document.getElementById("experiment");

class Graph {
  constructor(div_id) {
    // Create the canvas
    this.div = document.getElementById(div_id);
    this.canvas = document.createElement("canvas");
    this.resize();
    this.div.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d");
    // Graph objects
    this.nodes = [];
    this.edges = [];
  }

  resize() {
    this.canvas.style.width = window.innerWidth + "px";
    this.canvas.style.height = '500px';
    this.canvas.width = window.innerWidth;
    this.canvas.height = 500;
  }

  addNode(node) {
    this.nodes.push(node);
  }

  add_edge(node1, node2) {
    console.log("Not yet implemented");
  }

  repaint() {
    // Paint background
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Paint edges

    // Nodes properties
    let fillStyle = "#990000";
    let nodeSize = 30;
    // Paint nodes
    for (let node of this.nodes) {
      // Verify properties
      if (!('x' in node) || !('y' in node) || node.x < 0 || node.x > 1 || node.y < 0 || node.y > 1) {
        console.log("Wrong values for node " + node + "\nA node must contain a x and a y properties between 0 and 1.");
        continue;
      }

      // Draw the node
      this.ctx.fillStyle = fillStyle;
      this.ctx.beginPath();
      this.ctx.arc(
        node.x * this.canvas.width,
        node.y * this.canvas.height,
        nodeSize/2,
        0,
        Math.PI * 2,
        true
      );
      this.ctx.fill();
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

  console.log(values_per_k);

  // Create nodes by column
  for (let k=0 ; k<num_diff_k ; k++) {
    let idx = 1;
    for (let key of values_per_k[k].keys()) {
      g.addNode({
        id: (k+1) + "_" + key,
        label: key,
        overlay: values_per_k[k].get(key).join("\n"),
        x: (k+1)/(num_diff_k+1),
        y: 1 - idx/(values_per_k[k].size+1)
      });
      idx += 1;
    }
  }

  g.repaint();
}

exp.addEventListener("data_loaded", data_listener);