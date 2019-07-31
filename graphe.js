var exp = document.getElementById("experiment");
exp.addEventListener("data_loaded", function(event) {
for (let row of event.data) {
	  console.log(row);
	}
});