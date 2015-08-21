var uSigRecs = [];
var courtRecs = [];

var beforePacer = 0;
var afterPacer = 0;

var totCrtBeforePacer = 0;
var totCrtAfterPacer = 0;

window.onload = function () {
	document.getElementById("submit").onclick = validateInput;
	document.getElementById("downloadSig").onclick = downloadSig;
	document.getElementById("downloadCourt").onclick = downloadCourt;
}

function validateInput() {
	var input = document.getElementById("input").value;
	if (input) {
		document.getElementById("initial").style.display = "none";

		parseData(JSON.parse(input));
		display();
		document.getElementById("top-link-block").style.display = "block";
		document.getElementById("done").style.display = "block";
	} else {
		alert("No input detected");
	}	
}

/**
 * Parses and sanitizes the data in the original data structure.
 */
function parseData(data) {
	var uniqueUS = {};
	var uniqueCrt = {};
	for (var i = 0; i < data.length; i++) {
		var record = data[i];
		var desc = record.Description;
		//only include description with "IMAGE"/"PDF DOCUMENT"/"TRANSCRIPT"
		if (~desc.indexOf("IMAGE") || ~desc.indexOf("PDF DOCUMENT") || ~desc.indexOf("TRANSCRIPT")) {
			var cost = parseFloat(record.Cost.substring(1));
			var court = record.Court;
			var search = record.Search;
			var name = court + search + desc;
			name = name.replace(/,/g,'')	
			//name, cost, count <-- unique
			addUS(uniqueUS, name, cost);
			addCrt(uniqueCrt, record, name, cost);
		}
	}
	toUSigRecs(uniqueUS);
	toCourtRecs(uniqueCrt);
}

/**
 * Adds a record to uniqueUS if its a unique record, otherwise increments count.
 */
function addUS(uniqueUS, name, cost) {
	if (!uniqueUS[name]) { 
		uniqueUS[name] = {
			"cost" : cost,
			"count" : 0
		}
	}
	uniqueUS[name].count ++;
}

function addCrt(uniqueCrt, record, name, cost) {
	var clientCode = record["Client Code"];
	if (!uniqueCrt[clientCode]) {
		uniqueCrt[clientCode] = new Array();
	}
	if (!uniqueCrt[clientCode][name]) {
		uniqueCrt[clientCode][name] = {
				"count" : 0,
				"cost" : cost,
				"tot" : 0,
				"save" : 0
		};	
	}
	uniqueCrt[clientCode][name].count++;
	uniqueCrt[clientCode][name].tot = uniqueCrt[clientCode][name].count * cost;
	uniqueCrt[clientCode][name].save = uniqueCrt[clientCode][name].tot - cost;
}

/**
 * Puts records in uniqueUS into uSigRecs array. Array is then sorted by number of downloads
 * per record. Highest number on the top.
 * Calculates cost before and after pacer.
 */
function toUSigRecs(uniqueUS) {
	for (var key in uniqueUS) {
		var rec = uniqueUS[key];
		uSigRecs.push({
			"name" : key,
			"cost" : rec.cost,
			"count" : rec.count
		});
		beforePacer += rec.cost * rec.count;
		afterPacer += rec.cost;
	}

	uSigRecs.sort(function (a, b) {
		return b.count - a.count;
	});
	console.log(truncate(beforePacer), truncate(afterPacer), truncate(beforePacer - afterPacer));
}

function toCourtRecs(uniqueCrt) {
	/*
	uniqueCrts = {
		courtId : [
			uniqueSig : {
				cost, count, save, tot
			}		
		]
	}
	 */
	for (var court in uniqueCrt) {
		var crtFiles = uniqueCrt[court];

		var fileInfo = [];
		var totCnt = 0;
		var costAfter = 0;
		var costBefore = 0;
		for (var file in crtFiles) {
			var rec = crtFiles[file]
			fileInfo.push({
				"name" : file,
				"cost" : rec.cost,
				"count" : rec.count,
				"save" : rec.save,
				"tot" : rec.tot
			});
			totCnt += rec.count;

			totCrtBeforePacer += rec.cost * rec.count;
			totCrtAfterPacer += rec.cost;

			costBefore += rec.cost * rec.count;
			costAfter += rec.cost;
		}
		courtRecs.push({
			"court" : court,
			"files" : fileInfo,
			"cnt" : totCnt,
			"before" : costBefore,
			"after" : costAfter,
			"save" : costBefore - costAfter
 		});
	}
	courtRecs.sort(function (a, b) {
		return b.cnt - a.cnt;
	});
	console.log(courtRecs);
}

function display() {
	var uSig = document.getElementById("uSig");
	var court = document.getElementById("court");

	makeTableUS(uSig);	
	makeTableCourt(court);
}

function makeTableUS(uSig) {
	var table = document.createElement("table");
	table.classList.add("table");
	table.classList.add("table-striped");
	uSig.appendChild(table);

	var tHead = document.createElement("thead");
	table.appendChild(tHead);
	///////////////////////////////////////////////////
	
	var trH1 = document.createElement("tr");
	tHead.appendChild(trH1);

	var thBlank = document.createElement("th");
	thBlank.innerHTML = "";
	trH1.appendChild(thBlank);

	var thTotals = document.createElement("th");
	thTotals.innerHTML = "Totals ->";
	trH1.appendChild(thTotals);

	var thAPacer = document.createElement("th");
	thAPacer.innerHTML = "$" + truncate(afterPacer);
	trH1.appendChild(thAPacer);

	var thBPacer = document.createElement("th");
	thBPacer.innerHTML = "$" + truncate(beforePacer);
	trH1.appendChild(thBPacer);

	var thSavePacer = document.createElement("th");
	thSavePacer.innerHTML = "$" + truncate(beforePacer - afterPacer);
	trH1.appendChild(thSavePacer);

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

	for (var i = 0; i < uSigRecs.length; i++) {
		var rec = uSigRecs[i];

		var trB = document.createElement("tr");
		tBody.appendChild(trB);

		//signature
		var sig = document.createElement("th");
		sig.innerHTML = rec.name;
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
		tot.innerHTML = "$" + truncate(tp);
		trB.appendChild(tot);

		//sav
		var sv = tp - rec.cost;
		var sav = document.createElement("th");
		sav.innerHTML = "$" + truncate(sv);
		trB.appendChild(sav);

	}
}

function makeTableCourt(court) {
	var table = document.createElement("table");
	table.classList.add("table");
	table.classList.add("table-striped");
	court.appendChild(table);

	var tHead = document.createElement("thead");
	table.appendChild(tHead);
	///////////////////////////////////////////////////
	
	var trH1 = document.createElement("tr");
	tHead.appendChild(trH1);

	var thBlank1 = document.createElement("th");
	thBlank1.innerHTML = "";
	trH1.appendChild(thBlank1);
	var thBlank2 = document.createElement("th");
	thBlank2.innerHTML = "";
	trH1.appendChild(thBlank2);

	var thTotals = document.createElement("th");
	thTotals.innerHTML = "Totals ->";
	trH1.appendChild(thTotals);

	var thAPacer = document.createElement("th");
	thAPacer.innerHTML = "$" + truncate(totCrtAfterPacer);
	trH1.appendChild(thAPacer);

	var thBPacer = document.createElement("th");
	thBPacer.innerHTML = "$" + truncate(totCrtBeforePacer);
	trH1.appendChild(thBPacer);

	var thSavePacer = document.createElement("th");
	thSavePacer.innerHTML = "$" + truncate(totCrtBeforePacer - totCrtAfterPacer);
	trH1.appendChild(thSavePacer);

	///////////////////////////////////////////////////
	var trH2 = document.createElement("tr");
	tHead.appendChild(trH2);

	var thCrt = document.createElement("th");
	thCrt.innerHTML = "Court";
	trH2.appendChild(thCrt);

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

	for (var i = 0; i < courtRecs.length; i++) {
		var crtObj = courtRecs[i];

		var files = crtObj.files;
		for (var j = 0; j < files.length; j++) {
			var file = files[j];

			var trB1 = document.createElement("tr");
			tBody.appendChild(trB1);	

			//court
			var crt = document.createElement("th");
			crt.innerHTML = crtObj.court;
			trB1.appendChild(crt);

			//signature
			var sig = document.createElement("th");
			sig.innerHTML = file.name;
			trB1.appendChild(sig);

			//count
			var cnt = document.createElement("th");
			cnt.innerHTML = file.count;
			trB1.appendChild(cnt);

			//price
			var cost = document.createElement("th");
			cost.innerHTML = "$" + truncate(file.cost);
			trB1.appendChild(cost);

			//tot
			var tp = file.cost * file.count;
			var tot = document.createElement("th");
			tot.innerHTML = "$" + truncate(file.tot);
			trB1.appendChild(tot);

			//sav
			var sv = tp - file.cost;
			var sav = document.createElement("th");
			sav.innerHTML = "$" + truncate(file.save);
			trB1.appendChild(sav);
		}

		var trB2 = document.createElement("tr");
		tBody.appendChild(trB2);
		trB2.style.backgroundColor = "yellow";	

		//blank
		var blank= document.createElement("th");
		blank.innerHTML = "";
		trB2.appendChild(blank);

		//label
		var totLabel = document.createElement("th");
		totLabel.innerHTML = "Totals for Court ->";
		trB2.appendChild(totLabel);

		//total downloads per court
		var totDnldCrt = document.createElement("th");
		totDnldCrt.innerHTML = crtObj.cnt;
		trB2.appendChild(totDnldCrt);

		//price after per court
		var aPerCrt = document.createElement("th");
		aPerCrt.innerHTML = "$" + truncate(crtObj.after);
		trB2.appendChild(aPerCrt);

		//price before per court
		var bPerCrt = document.createElement("th");
		bPerCrt.innerHTML = "$" + truncate(crtObj.before);
		trB2.appendChild(bPerCrt);

		//savings per court
		var savPerCrt = document.createElement("th");
		savPerCrt.innerHTML = "$" + truncate(crtObj.save);
		trB2.appendChild(savPerCrt);
	}
}

function downloadSig() {
	var csvArr = new Array();
	csvArr.push(["", "Totals ->", "$" + truncate(afterPacer), "$" + truncate(beforePacer), "$" + truncate(beforePacer - afterPacer)]);
	csvArr.push(["Unique Signature", "Number of Downloads", "Price", "Total", "Savings"]);
	for (var i = 0; i < uSigRecs.length; i++) {
		var record = uSigRecs[i];
		var tot = truncate(record.count * record.cost);
		csvArr.push([record.name, record.count, "$" + record.cost, "$" + tot, "$" + truncate(tot - record.cost)]);
	}

	var csvContent = "data:text/csv;charset=utf-8,";
	csvArr.forEach(function(infoArray, index){
	   dataString = infoArray.join(",");
	   csvContent += index < csvArr.length ? dataString + "\n" : dataString;
	});
	var encodedUri = encodeURI(csvContent);
	window.open(encodedUri);
}

function downloadCourt() {
	var csvArr = new Array();	
	csvArr.push(["", "", "Totals ->", "$" + truncate(totCrtAfterPacer), "$" + truncate(totCrtBeforePacer),
									  "$" + truncate(totCrtBeforePacer - totCrtAfterPacer)]);
	csvArr.push(["Court", "Unique Signature", "Number of Downloads", "Price", "Total", "Savings"]);

	for (var i = 0; i < courtRecs.length; i++) {
		var crtObj = courtRecs[i];

		var files = crtObj.files;
		for (var j = 0; j < files.length; j++) {
			var file = files[j];
			csvArr.push([crtObj.court, file.name, file.count, "$" + truncate(file.cost), "$" + truncate(file.tot), "$" + truncate(file.save)]);
		}
		csvArr.push(["", "Totals for Court ->", crtObj.cnt, "$" + truncate(crtObj.after), "$" + truncate(crtObj.before), "$" + truncate(crtObj.save)])
	}

	var csvContent = "data:text/csv;charset=utf-8,";
	csvArr.forEach(function(infoArray, index){
	   dataString = infoArray.join(",");
	   csvContent += index < csvArr.length ? dataString + "\n" : dataString;
	});
	var encodedUri = encodeURI(csvContent);
	window.open(encodedUri);
}

/**
 * Truncates a number to 2 decimal places.
 */
function truncate(num) {
	return Math.trunc(num * 100) / 100;
}