
var setup_selector = function () {
  // Get the select to update
  var selector = document.getElementById("experiment");

  // --- Fill with correct values ---
  // Request the file list file from the server
  fetch("/data/file_list.txt")
  .then(data=>{return data.text();})
  // On data, split the response into multiple options in the select.
  .then(res=>{
    res = res.split("\n");
    for (let line of res) {
      line = line.replace(/(\r\n|\n|\r)/gm, "");
      if (line.length > 0) {
        selector.innerHTML += "<option value='" + line + "'>" + line + "</option>";
      }
    }
  });

  // --- Setup the onclick event ---
  selector.onchange = () => {
    let value = selector.value;

    // Do nothing for empty values
    if (value.length == 0)
      return;

    let _DATA_LOADED = [];

    // Load the corresponding file
    fetch("/data/" + value).then(data=>{return data.text()}).then(res=>{
      res = res.split("\n");
      for (let line of res) {
        line = line.replace(/(\r\n|\n|\r)/gm, "");
        if (line.length == 0)
          continue;
        _DATA_LOADED.push(line.split("\t"));
      }

      // Send an event to say that the data are loaded
      var event = new Event("data_loaded");
      event.data = _DATA_LOADED;
      selector.dispatchEvent(event);
    })
  }
};

setup_selector();
