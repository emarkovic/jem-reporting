var info = {};

var beforePacer = 0;
var afterPacer = 0;

window.onload = function () {
	document.getElementById("submit").onclick = check;
}

function check() {
	var input = document.getElementById("input");
	var file = input.value;
	if (file) {
		document.getElementById("initial").style.display = "none";

		processData(JSON.parse(file));
		calculate();
		stylePage();

		document.getElementById("done").style.display = "block";
	} else {
		alert("No input detected");
	}	
}

function processData(file) {
	for (var i = 0; i < file.length; i++) {
		var record = file[i];
		var cost = record.Cost;
		cost = parseFloat(cost.substring(1));
		var court = record.Court;
		var desc = record.Description;
		var search = record.Search;

		var name = court + search + desc;
		//if the record does not exist in the structure, put it there with count=0
		if (!info[name]) {
			info[name] = {
				"cost" : cost,
				"count" : 0
			}
		}
		info[name].count ++;
	}
}

function calculate() {
	for (var key in info) {
		var record = info[key];
		// console.log(record.cost);
		// console.log(record.count);
		
		beforePacer += (record.cost * record.count);	
		afterPacer += record.cost;
	}
	console.log("before", beforePacer);
	console.log("after", afterPacer);
}

function stylePage() {
	var saveArea = document.getElementById("saveArea");
	var resultArea = document.getElementById("resultArea");

	var diff = Math.round((beforePacer - afterPacer) * 1000) / 1000;
	saveArea.innerHTML = diff;
}