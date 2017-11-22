// Input:
//   global array 'programs', each entry is an array;
//     the first element of such array is the name, and the second element is an array with the program data
//  Example:
//   [
//     [
//       "MAINSRC",
//       [0x2C, 0x2A, 0x9F, 0x6C...]
//     ],
//     [
//       "SPRTSRC",
//       [0x00, 0x00, 0x00, 0xF0, 0xFC, 0xFF...]
//     ]
//   ]

var parsedPrograms = [];

function ice_open_js(name, dataPtr, lengthPtr, offset) {
	var js_name = c_prog_name_to_js_string(name);
	
	for (var i = 0; i < programs.length; i++) {
		if (programs[i][0] == js_name) {
			js_data_to_c_mem(i, dataPtr, lengthPtr);
			parsedPrograms.push([js_name, offset]);
			return 1;
		}
	}
	
	// Program not found
	return 0;
}

function ice_open_first_prog_js(dataPtr, lengthPtr) {
	js_data_to_c_mem(0, dataPtr, lengthPtr);
	parsedPrograms.push([programs[0][0], 0]);
}

function ice_close_js(dataPtr, lengthPtr, offsetPtr) {
	var prevProg = parsedPrograms.pop();
	var js_name = parsedPrograms[parsedPrograms.length - 1][0];
	
	for (var i = 0; i < programs.length; i++) {
		if (programs[i][0] == js_name) {
			js_data_to_c_mem(i, dataPtr, lengthPtr);
			Module.setValue(offsetPtr, prevProg[1], 'i32');
			return;
		}
	}
}

function ice_display_error(string, whichLine) {
	var error = c_prog_name_to_js_string(string);
	
	setEdMsgBad("Error at line " + whichLine + " of program " + parsedPrograms[parsedPrograms.length - 1][0] + ": " + error);
}

function ice_export_program(varName, data, length) {
	var outputName = c_prog_name_to_js_string(varName);
	var programData = "";
	
	for (var i = 0; i < length; i++) {
		programData += String.fromCharCode(Module.getValue(data + i, 'i8'));
	}
	sc3_pushDownload(programData, "application/x-ti84ce", proj.projectName + ".8xp");
}

function c_prog_name_to_js_string(ptr) {
	var string = "";
	var inByte;
	
	while ((inByte = Module.getValue(ptr++, 'i8'))) {
		string += String.fromCharCode(inByte);
	}
	
	return string;
}

function js_data_to_c_mem(whichProg, dataPtr, lengthPtr) {
	var data = programs[whichProg][1];
	
	// Write the size to the first 2 bytes
	Module.setValue(lengthPtr, data.length, 'i32');
	
	for (var i = 0; i < data.length; i++) {
		Module.setValue(dataPtr + i, data[i], 'i8');
	}
}