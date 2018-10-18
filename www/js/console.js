////////////////////////////////////////////////////////////////////
// Puts pairedBtNames[ix] into LHO and RHO text
// device selection lists if not already present
// pairedBtAddresses[ix] into option.value
//
function addDeviceSelection(ix) {
    var elLho = document.getElementById("lho-name");
    var opt;

    elLho.value = pairedBtAddresses[ix];
    //console.log("Add LHO Device: ", ix, pairedBtNames[ix], pairedBtAddresses[ix]);
    if (!(elLho.selectedIndex >= 0)) { //a new entry
        opt = document.createElement("option");
        opt.text = pairedBtNames[ix];
        opt.value = pairedBtAddresses[ix];
        //option.selected = true;
        elLho.add(opt, ix + 1);
        elLho.selectedIndex = "0";
        lhoBtName = opt.text;
        lhoBtAddress = opt.value;
        elLho.onchange();
        //console.log("LHO added: ", lhoBtName, lhoBtAddress);
    }
}

//////////////////////////////////////////////////////////////////////////////////////
// Called when selection of LHO Tablet changes
// val is the assigned value corresponding to the chosen list item
function handleLhoChange(e) {
    var ix = e.selectedIndex;
    lhoBtName = e.options[ix].text;
    lhoBtAddress = e.options[ix].value;
    //console.log("LHO tablet selected: " + lhoBtName + " " + lhoBtAddress);
    //e.material_select();
    M.FormSelect.init(e, e.options);
}

///////////////////////////////////////////////////////////////////////////////////////
// Called when RHO tablet changes
// val is the assigned value corresponding to the chosen list item
function handleRhoChange(e) {
    var ix = e.selectedIndex;
    rhoBtName = e.options[ix].text;
    rhoBtAddress = e.options[ix].value;
    //console.log("RHO tablet selected: " + rhoBtName + " " + rhoBtAddress);
    //e.material_select();
    M.FormSelect.init(e, e.options);
}

///////////////////////////////////////////////////////////////////////////////////////
// name = "left" or "right"
// set = Boolean true means set check mark, false means clear
function checkCheckBox(name, set) {
    if (name == "left") {
        document.getElementById("checkBoxLeft").checked = set;
    }
    if (name == "right") {
        document.getElementById("checkBoxRight").checked = set;
    }
}

// Turn off Bluetooth, wait 3sec, turn back on, wait 3sec
function btInit() {
    networking.bluetooth.disable(function () {
        console.log("Bluetooth disabled by Init");
    }, function () {
        console.log("Error: Disabling Bluetooth by Init failed");
    });

    window.setTimeout(function () {
        networking.bluetooth.enable(function () {
            console.log("Bluetooth enabled by Init");
        }, function () {
            console.log("Error: Enabling Bluetooth by Init failed");
        });
    }, 5000);

    for (i = 1; i <= 12; i++) {
        networking.bluetooth.close(i);
    }
}

// This clears everything and starts over
// To make the same connections as before
// use "reconnect"; but you must do the same for the neighbors 
function generalReset() {

    // To Reset
    // thisTabletBtName, thisTabletBtAddress
    // pairedBtNames, pairedBtAddresses;

    var leftEl = document.getElementById("lho-name");
    var rightEl = document.getElementById("rho-name");
    var leftIx = leftEl.selectedIndex;
    var rightIx = rightEl.selectedIndex;

    var leftOpt = leftEl.options;
    var rightOpt = rightEl.options;

    //console.log("Before Reset LHO: ix, text, value: ", leftIx, leftOpt[leftIx].text, leftOpt[leftIx].value);
    //console.log("Before Reset RHO: ix, text, value: ", rightIx, rightOpt[rightIx].text, rightOpt[rightIx].value);

    //Save old values for reconnection
    rhoBtNameOld = rhoBtName;
    lhoBtNameOld = lhoBtName;
    rhoBtAddressOld = rhoBtAddress;
    lhoBtAddressOld = lhoBtAddress;

    //console.log( "Before Get Devices: left name, right name, left addr, right addr: ", lhoBtName, rhoBtName, lhoBtAddress, rhoBtAddress);

    getBtDevices();

    //console.log( "After Get Devices: left name, right name, left addr, right addr: ", lhoBtName, rhoBtName, lhoBtAddress, rhoBtAddress);

    rhoBtName = rhoBtNameOld;
    lhoBtName = lhoBtNameOld;
    rhoBtAddress = rhoBtAddressOld;
    lhoBtAddress = lhoBtAddressOld;

    //Restore Name of RHO
    rightEl.value = rhoBtName;
    //This will restore the selection in the dropdown
    leftEl.value = lhoBtAddress;

    // for (var i = 0; i < leftEl.options.length; i++) {
    //   if (leftEl.options[i].text === lhoBtNameOld) {
    //     leftEl.text = lhoBtNameOld;
    //     leftEl.selectedIndex = i;
    //     break;
    //   }
    // }

    //  for (var i = 0; i < rightEl.options.length; i++) {
    //   if (rightEl.options[i].text === rhoBtNameOld) {
    //     rightEl.text = rhoBtNameOld;
    //     rightEl.selectedIndex = i;
    //     break;
    //   }
    // }

    // leftIx = leftEl.selectedIndex;
    // rightIx = rightEl.selectedIndex;

    // leftOpt = leftEl.options;
    // rightOpt = rightEl.options;

    // console.log("After Reset LHO: ix, text, value: ", leftIx, leftOpt[leftIx].text, leftOpt[leftIx].value);
    // console.log("After Reset RHO: ix, text, value: ", rightIx, rightOpt[rightIx].text, rightOpt[rightIx].value);

    // console.log("After Reset LHO: Name Addr: ", lhoBtName, lhoBtAddress);
    // console.log("After Reset RHO: Name Addr: ", rhoBtName, rhoBtAddress);

    // Bluetooth status variables
    // uuid = '94f39d29-7d6d-437d-973b-fba39e49d4ee';

    //if (listeningForConnectionRequest) {
    networking.bluetooth.close(serverSocketId);
    //}
    listeningForConnectionRequest = false;
    serverSocketId = -1;

    //if (lhoConnected) {
    networking.bluetooth.close(lhoSocketId);
    //}
    setConnectionState("lho", "disconnected");
    lhoSocketId = -1;

    //if (rhoConnected) {
    networking.bluetooth.close(rhoSocketId);
    //}
    setConnectionState("rho", "disconnected");
    rhoSocketId = -1;

    lhoConnected = false;
    rhoConnected = false;
}

function reConnect() {
    startBtListening();
    window.setTimeout(function () {
        startCalling();
    }, 5000);
}

function displayStatus(pop, console) {

    var txt = [];
    var msgText = "";

    txt[1] = "thisTab: " + thisTabletBtName + " " + thisTabletBtAddress + "<br/>";

    txt[2] = "paired[1]: " + pairedBtNames[0] + " " + pairedBtAddresses[0] + "<br/>";
    txt[3] = "paired[2]: " + pairedBtNames[1] + " " + pairedBtAddresses[1] + "<br/>";
    txt[4] = "paired[3]: " + pairedBtNames[2] + " " + pairedBtAddresses[2] + "<br/>";

    txt[5] = "rho: " + rhoBtName + " " + rhoBtAddress + "<br/>";
    txt[6] = "lho: " + lhoBtName + " " + lhoBtAddress + "<br/>";

    txt[7] = "rhoOld: " + rhoBtNameOld + " " + rhoBtAddressOld + "<br/>";
    txt[8] = "lhoOld: " + lhoBtNameOld + " " + lhoBtAddressOld + "<br/>";

    // Bluetooth status variables
    txt[9] = "uuid: " + uuid + "<br/>";

    txt[10] = "listening: " + listeningForConnectionRequest + "<br/>";
    txt[11] = "Connected: " + "lho: " + lhoConnected + " rho: " + rhoConnected + "<br/>";

    txt[12] = "Sockets: " + " server: " + serverSocketId + " rho: " + rhoSocketId + " lho: " + lhoSocketId;

    for (i = 1; i <= 12; i++) {
        msgText += txt[i];
    }

    if (pop) {
        popupBox("Status", msgText, "stat", "OK", "", "");
    }
    if (console) {
        console.log("Status: ", msgText);
    }
}




// Some messages require action
// An example is the msg that communicates rho name and address
// The content determines what to do
// The RHO address is a nonce (always 02:00:00:00:00:00) for security reasons,
// therefor the address has to be found in the list of paired devices.  
function msgInterpreter(msgSource, msgText) {
    var ix, ix1, ix2, ix3;
    var prefixName = "rho-name: ";
    var prefixAddr = "rho-addr: ";
    var prefixRelayLho = "relay-lho";
    var prefixRelayRho = "relay-rho";
    var strName = "";
    var strAddr = "";
    var strCount = "";
    var intCount = -1;
    var newMsg = "";
    var side = "";

    console.log("interpreter: ", msgSource, msgText);

    //// Name and address of rho /////////////////////
    if (msgSource == "rho") {
        ix1 = msgText.indexOf(prefixName);
        if (ix1 >= 0) {
            ix1 += prefixName.length;
            strName = msgText.substring(ix1);
            ix2 = strName.indexOf(" ");
            strName = strName.slice(0, ix2);
        }

        ix1 = msgText.indexOf(prefixAddr);
        if (ix1 >= 0) {
            ix1 += prefixAddr.length;
            strAddr = msgText.substring(ix1);
            ix2 = strAddr.indexOf(" ");
            strAddr = strAddr.slice(0, ix2);
        }

        var len = pairedBtNames.length;
        for (i = 0; i < len; i++) {
            if (pairedBtNames[i] == strName) {
                strAddr = pairedBtAddresses[i];
            }
        }

        // Accept the transmitted rho name and address values
        // These go into the rho dropdown and globals
        if ((strName.length > 0) && (strAddr.length > 0)) {
            rhoBtName = strName;
            rhoBtAddress = strAddr;

            //Sets selected option in txtbox
            var rightEl = document.getElementById("rho-name");
            rightEl.value = rhoBtName;
            M.updateTextFields();
            M.textareaAutoResize(rightEl);
        }
    }

    ///// Propagate Circulating Test Message ///////////////////
    ix = msgText.indexOf(prefixRelayLho);
    if (ix >= 0) {
        side = "lho";
    } else {
        ix = msgText.indexOf(prefixRelayRho);
        if (ix >= 0) {
            side = "rho";
        }
    }
    if (ix >= 0) {
        ix1 = msgText.indexOf(" ");
        strCount = msgText.substring(ix1 + 1);
        ix2 = strCount.indexOf(" ");
        strCount = strCount.slice(0, ix2);
        console.log("Received: ", msgText, "Count = ", strCount);

        intCount = parseInt(strCount, 10);
        strCount = intCount.toString();
        newMsg = "relay-" + side + " " + strCount + " " + msgText;

        console.log("newMsg: ", newMsg, "Count: ", strCount);
        relayTestMessage(msgText, intCount, side, relaySecDelay);
    }
}

// LHO and RHO name and address saved in localStorage

function storeNeighborInfo() {
    console.log("Saving LHO: ", lhoBtName, lhoBtAddress);
    console.log("Saving RHO: ", rhoBtName, rhoBtAddress);
    window.localStorage.setItem("lhoBtName", lhoBtName);
    window.localStorage.setItem("lhoBtAddress", lhoBtAddress);
    window.localStorage.setItem("rhoBtName", rhoBtName);
    window.localStorage.setItem("rhoBtAddress", rhoBtAddress);

    console.log("Store LHO: ", lhoBtName, lhoBtAddress);
    console.log("Store RHO: ", rhoBtName, rhoBtAddress);

    displayStatus(true, true);
}

function restoreNeighborInfo() {

    console.log("Before restore LHO: ", lhoBtName, lhoBtAddress);
    console.log("Before restore RHO: ", rhoBtName, rhoBtAddress);

    lhoBtName = window.localStorage.getItem("lhoBtName");
    lhoBtAddress = window.localStorage.getItem("lhoBtAddress");
    rhoBtName = window.localStorage.getItem("rhoBtName");
    rhoBtAddress = window.localStorage.getItem("rhoBtAddress");


    if (rhoBtName == null) {
        console.log("No stored Neighbor Info");
    } else {
        var rightEl = document.getElementById("rho-name");
        rightEl.value = rhoBtName;
        M.updateTextFields();
        M.textareaAutoResize(rightEl);
    }

    console.log("Restore LHO: ", lhoBtName, lhoBtAddress);
    console.log("Restore RHO: ", rhoBtName, rhoBtAddress);

    displayStatus(true, true);
}