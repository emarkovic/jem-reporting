var recordsUS = {};
var recordsCC = {};

var beforePacer = 0;
var afterPacer = 0;

window.onload = function () {
	document.getElementById("submit").onclick = check;
	document.getElementById("download").onclick = downloadCSV;
}

function check() {
	var input = document.getElementById("input");
	var file = input.value;
	if (file) {
		document.getElementById("initial").style.display = "none";

		//json -> correctly formatted data
		processData(JSON.parse(file));

		//recordsUS has data now, good to use!
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
		var desc = record.Description;
		//only include description with "IMAGE"/"PDF DOCUMENT"/"TRANSCRIPT"
		if (~desc.indexOf("IMAGE") || ~desc.indexOf("PDF DOCUMENT") || ~desc.indexOf("TRANSCRIPT")) {
			var cost = parseFloat(record.Cost.substring(1));
			var court = record.Court;
			var search = record.Search;
			var name = court + search + desc;	

			fillUS(name, cost);	
			fillCC(record, name, cost);

		}
	}
	console.log(recordsCC);
}

function calculate() {
	for (var key in recordsUS) {
		var record = recordsUS[key];
		
		beforePacer += (record.cost * record.count);	
		afterPacer += record.cost;
	}
}

function stylePage() {
	var saveArea = document.getElementById("saveArea");
	var resultArea = document.getElementById("resultArea");

	var diff = Math.round((beforePacer - afterPacer) * 1000) / 1000;
	saveArea.innerHTML = diff;
}

function downloadCSV() {
	var csvArr = new Array();
	csvArr.push(["Unique Signature", "Number of downloads", "Price", "Total", "Savings"]);
	for (var key in recordsUS) {
		var record = recordsUS[key];
		var tot = record.count * record.cost;
		csvArr.push([key, record.count, "$" + record.cost, "$" + tot, "$" + (tot - record.cost)]);
	}
	console.log(csvArr);

	var csvContent = "data:text/csv;charset=utf-8,";
	csvArr.forEach(function(infoArray, index){
	   dataString = infoArray.join(",");
	   csvContent += index < csvArr.length ? dataString + "\n" : dataString;
	});
	var encodedUri = encodeURI(csvContent);
	window.open(encodedUri);
}

function fillUS(name, cost) {
	if (!recordsUS[name]) { 
		recordsUS[name] = {
			"cost" : cost,
			"count" : 0
		}
	}
	recordsUS[name].count ++;
}

function fillCC(record, name, cost) {
	var clientCode = record["Client Code"];
	/*
	{									Tot 			Savings
		CC 	=> 	[ US => {dnl, cost, (dnl * cost), (dnl * cost) - cost} },
								...
				  US => {dnl, cost, (dnl * cost), (dnl * cost) - cost} }
				],
		...,
		CC 	=> 	[ US => {dnl, cost, (dnl * cost), (dnl * cost) - cost} },
								...
				  US => {dnl, cost, (dnl * cost), (dnl * cost) - cost} }
				]
	}
	 */
	if (!recordsCC[clientCode]) {
		recordsCC[clientCode] = new Array();
	}
	if (!recordsCC[clientCode][name]) {
		recordsCC[clientCode][name] = {
				"count" : 0,
				"cost" : cost,
				"tot" : 0,
				"save" : 0
		};	
	}
	recordsCC[clientCode][name].count++;
	recordsCC[clientCode][name].tot = recordsCC[clientCode][name].count * cost;
	recordsCC[clientCode][name].save = recordsCC[clientCode][name].tot - cost;
}

