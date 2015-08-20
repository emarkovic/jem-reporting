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
			name = name.replace(/,/g,'')	

			fillUS(name, cost);	
			fillCC(record, name, cost);

		}
	}
	// console.log(recordsCC);
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

	var diff = Math.trunc((beforePacer - afterPacer) * 100) / 100;
	saveArea.innerHTML = diff;

	addUSTable(resultArea);
}

function downloadCSV() {
	var csvArr = new Array();
	csvArr.push(["", "Totals ->", "$" + afterPacer, "$" + beforePacer, "$" + (beforePacer - afterPacer)]);
	csvArr.push(["Unique Signature", "Number of downloads", "Price", "Total", "Savings"]);
	for (var key in recordsUS) {
		var record = recordsUS[key];
		var tot = record.count * record.cost;
		csvArr.push([key, record.count, "$" + record.cost, "$" + tot, "$" + (tot - record.cost)]);
	}

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

function addUSTable(resultArea) {
	var table = document.createElement("table");
	table.classList.add("table");
	table.classList.add("table-striped");
	resultArea.appendChild(table);

	var tHead = document.createElement("thead");
	table.appendChild(tHead);
	///////////////////////////////////////////////////
	
	var trH1 = document.createElement("tr");
	tHead.appendChild(trH1);

	var thUS = document.createElement("th");
	thUS.innerHTML = "";
	trH1.appendChild(thUS);

	var thCount = document.createElement("th");
	thCount.innerHTML = "Totals ->";
	trH1.appendChild(thCount);

	var thPrice = document.createElement("th");
	thPrice.innerHTML = "$" + (Math.trunc(afterPacer * 100) / 100);
	trH1.appendChild(thPrice);

	var thTot = document.createElement("th");
	thTot.innerHTML = "$" + (Math.trunc(beforePacer * 100) / 100);
	trH1.appendChild(thTot);

	var thSave = document.createElement("th");
	thSave.innerHTML = "$" + (Math.trunc((beforePacer - afterPacer) * 100) / 100);
	trH1.appendChild(thSave);

	///////////////////////////////////////////////////
	var trH2 = document.createElement("tr");
	tHead.appendChild(trH2);

	var thUS = document.createElement("th");
	thUS.innerHTML = "Unique Signature";
	trH2.appendChild(thUS);

	var thCount = document.createElement("th");
	thCount.innerHTML = "Number of Downloads";
	trH2.appendChild(thCount);

	var thPrice = document.createElement("th");
	thPrice.innerHTML = "Price Per Page";
	trH2.appendChild(thPrice);

	var thTot = document.createElement("th");
	thTot.innerHTML = "Total Cost";
	trH2.appendChild(thTot);

	var thSave = document.createElement("th");
	thSave.innerHTML = "Savings";
	trH2.appendChild(thSave);

	var tBody = document.createElement("tbody");
	table.appendChild(tBody);

	for (var key in recordsUS) {
		//each key is one record
		var rec = recordsUS[key];
		var trB = document.createElement("tr");
		tBody.appendChild(trB);

		//signature
		var sig = document.createElement("th");
		sig.innerHTML = key;
		trB.appendChild(sig);

		//count
		var cnt = document.createElement("th");
		cnt.innerHTML = rec.count;
		trB.appendChild(cnt);

		//price
		var cost = document.createElement("th");
		cost.innerHTML = "$" + rec.cost;
		trB.appendChild(cost);

		//tot
		var tp = rec.cost * rec.count;
		var tot = document.createElement("th");
		tot.innerHTML = "$" + (Math.trunc(tp * 100) / 100);
		trB.appendChild(tot);

		//sav
		var sv = tp - rec.cost;
		var sav = document.createElement("th");
		sav.innerHTML = "$" + (Math.trunc(sv * 100) / 100);
		trB.appendChild(sav);
	}
}