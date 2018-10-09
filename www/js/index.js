var app = {
  // Application Constructor
  initialize: function () {
    this.bindEvents();
    console.log("initialize");
  },
  // Bind Event Listeners
  //
  // Bind any events that are required on startup. Common events are:
  // 'load', 'deviceready', 'offline', and 'online'.
  bindEvents: function () {
    document.addEventListener('deviceready', this.onDeviceReady, false);

    //////////////////////////////////////////////////////////////////
    //The following respond to clicks on the x in the
    //modal box
    //////////////////////////////////////////////////////////////////
    var xSpan = document.getElementById("xModalBox");
    xSpan.addEventListener("click", hidePopupBox, false);
    xSpan = document.getElementById("xModalBoxOK");
    xSpan.addEventListener("click", hidePopupBox, false);
    xSpan = document.getElementById("xModalBoxYesNo");
    xSpan.addEventListener("click", hidePopupBox, false);

    //////////////////////////////////////////////////////////////////
    // This mechanism removes focus (blur) from the input box
    // when the return key is hit (code 13),
    // which has the effect of hiding the soft keyboard
    // Taken out because enter should be "new line"
    ///////////////////////////////////////////////////////////////////
    var input = document.getElementById("msg-send");

    input.addEventListener("keyup", function (event) {
      /* // Cancel the default action, if needed
      event.preventDefault();
      // Number 13 is the "Enter" key on the keyboard
      if (event.keyCode === 13) {
        input.blur(); //removes focus
      } */
    });
  },

  /////////////////////////////////////////////////////////////////////////
  // deviceready Event Handler
  // The scope of 'this' is the event. In order to call the 'receivedEvent'
  // function, we must explicitly call 'app.receivedEvent(...);'
  //
  onDeviceReady: function () {
    app.receivedEvent('deviceready');
    console.log("device ready");
  },
  // Update DOM on a Received Event
  receivedEvent: function (id) {
    console.log('Received Event: ' + id);

    //Listener for bluetooth message
    networking.bluetooth.onReceive.addListener(onBtReceiveHandler);
    //Materialize.updateTextFields();
    //General Initialization for Materialize
    M.AutoInit();
    //Get paired Bluetooth devices
    getBtDevices();
  }
};
//End of app class
//////////////////////////////////////////////////////////////
// Bluetooth Names and addresses

var testCount = 0;

var thisTabletBtName = "void";
var thisTabletBtAddress = "void";

var pairedBtNames = [];
var pairedBtAddresses = [];

var rhoBtName = "void";
var lhoBtName = "void";
var rhoBtAddress = "void";
var lhoBtAddress = "void";

// When Reset the old values are saved in order to reconnect
var rhoBtNameOld = "void";
var lhoBtNameOld = "void";
var rhoBtAddressOld = "void";
var lhoBtAddressOld = "void";

// Bluetooth status variables
var uuid = '94f39d29-7d6d-437d-973b-fba39e49d4ee';
var listeningForConnectionRequest = false;
var lhoConnected = false;
var rhoConnected = false;
var lhoSocketId = -1;
var rhoSocketId = -1;
var serverSocketId = -1;


// This is the 'server' side, of the socket connection
// The 'server' (listener) is the LHO of the 'client', who requests the connection
function startBtListening() {
  console.log("Enter Listening");
  if (!listeningForConnectionRequest) {
    networking.bluetooth.listenUsingRfcomm(uuid, function (socketId) {
      serverSocketId = socketId;
      listeningForConnectionRequest = true;
      console.log("startBluetoothListening " + socketId);
      setConnectionState("rho", "waiting");
      networking.bluetooth.onAccept.addListener(function (acceptInfo) {
        if (acceptInfo.socketId !== serverSocketId) {
          console.log('onAccept -- acceptInfo.socketId != serverSocketId');
          return;
        }
        rhoSocketId = acceptInfo.clientSocketId;
        rhoConnected = true;
        setConnectionState("rho", "connected");
        networking.bluetooth.close(serverSocketId);
        console.log("Accepted Connection: ", "Server Socket: " + serverSocketId, "Client RHO Socket: " + rhoSocketId);
      });
    }, function (errorMessage) {
      console.log("error from Listener");
      console.error(errorMessage);
    });
  }
}

// Offers to connect to LHO
function startCalling() {
  console.log("startCalling", lhoBtAddress, rhoBtAddress, lhoBtName, rhoBtName);
  var deviceAddress;

  if (!lhoConnected) {
    //var elLho = document.getElementById("lho-name");
    //deviceAddress = elLho.value;
    deviceAddress = lhoBtAddress;
    setConnectionState("lho", "waiting");
    console.log("connectClient waiting ", deviceAddress);
    networking.bluetooth.connect(deviceAddress, uuid, function (socketId) {
      lhoSocketId = socketId;
      lhoConnected = true;
      console.log("Client connected. LHO socket = ", socketId, lhoBtAddress, lhoBtName);
      setConnectionState("lho", "connected");
      //Notify LHO who the RHO is.
      //Do not change the format in any way. The other side depends upon it.  
      msgToLho("rho-name: " + thisTabletBtName + " rho-addr: " + thisTabletBtAddress + " ");
    }, function (errorMessage) {
      console.log("error from Calling", lhoBtAddress, lhoBtName, lhoSocketId);
      console.error(errorMessage);
    });
  }
}

// Send Message to Right
///////////////////////
function msgToRho(msgText) {
  var val = document.getElementById("msg-send").value;
  if (msgText != "") {
    val = msgText;
  }
  var buf = arrayBufferFromString(val);

  if (rhoConnected) {
    networking.bluetooth.send(rhoSocketId, buf, function (bytes_sent) {
      console.log('Sent ' + bytes_sent + ' bytes ' + val + ' rhoSocket: ' + rhoSocketId);
    }, function (errorMessage) {
      console.log('Send failed: ' + errorMessage + ' msg: ' + val + ' rhoSocket: ' + rhoSocketId);
    });
  } else {
    console.log("RHO not connected, message not sent");
  }
}

// Send Message to Left
/////////////////////////////////
function msgToLho(msgText) {
  var val = document.getElementById("msg-send").value;
  if (msgText != "") {
    val = msgText;
  }
  var buf = arrayBufferFromString(val);

  if (lhoConnected) {
    networking.bluetooth.send(lhoSocketId, buf, function (bytes_sent) {
      console.log('Sent ' + bytes_sent + ' bytes ' + val + ' lhoSocket: ' + lhoSocketId);
    }, function (errorMessage) {
      console.log('Send failed: ' + errorMessage + ' msg: ' + val + ' lhoSocket: ' + lhoSocketId);
    });
  } else {
    console.log("LHO not connected, message not sent");
  }
}

////////////////////////////////////////////////////////////////////////
// Received Message
// Called in response to onReceive Event, i.e. when a Bluetooth
// message has arrived.
// Determines whether in one of our sockets, i.e.
// lhoSocket or rhoSocket
// If not, this is considered an error
// If yes, the data is read and displayed in the inbox, appropriate checkBox marked
//  
function onBtReceiveHandler(receiveInfo) {
  var strReceived = "";

  var socketId = -1;
  var source = "";

  if (lhoConnected) {
    if (receiveInfo.socketId == lhoSocketId) {
      socketId = lhoSocketId;
      source = "lho";
      checkCheckBox("left", true);
      checkCheckBox("right", false);
    }
  }
  if (rhoConnected) {
    if (receiveInfo.socketId == rhoSocketId) {
      socketId = rhoSocketId;
      source = "rho";
      checkCheckBox("left", false);
      checkCheckBox("right", true);
    }
  }

  if (!rhoConnected && !lhoConnected) {
    console.log("Error: Message Received but neither side Connected");
    return;
  }

  if (socketId == -1) {
    console.log("Error: Message Received on socket ", receiveInfo.socketId);
    console.log("rhoSocketId = " + rhoSocketId, "lhoSocketId = " + lhoSocketId);
    return;
  }

  var textField = document.getElementById("msg-rcvd");
  textField.value = "";
  strReceived = stringFromArrayBuffer(receiveInfo.data);
  // console.log("Data received: ", strReceived);

  // Message into Inbox
  textField.value = strReceived;
  M.updateTextFields();
  M.textareaAutoResize(textField);

  msgInterpreter(source, strReceived);
}

// Gets Adapter State and name and list of paired devices
// The names are then entered in the drop-downs for selection of RHO and LHO
// Initial connection state set to "disconnected"
// Called when Phonegap event "deviceready" has been fired
//
function getBtDevices() {
  // The status of the local adapter 
  networking.bluetooth.getAdapterState(function (adapterInfo) {
      // The adapterInfo object has the following properties:
      // address: String --> The address of the adapter, in the format 'XX:XX:XX:XX:XX:XX'.
      // name: String --> The human-readable name of the adapter.
      // enabled: Boolean --> Indicates whether or not the adapter is enabled.
      // discovering: Boolean --> Indicates whether or not the adapter is currently discovering.
      // discoverable: Boolean --> Indicates whether or not the adapter is currently discoverable.
      //
      var el = document.getElementById("this-tablet-name");
      el.innerHTML = adapterInfo.name;
      thisTabletBtName = adapterInfo.name; // Our Bluetooth name
      //!!!! After Android 6 the local MAC address is no longer accessible !!!!
      // So the addr is always 02:00:00:00:00:00
      thisTabletBtAddress = adapterInfo.address; // Our BT address
      console.log('Adapter ' + adapterInfo.address + ': ' + adapterInfo.name);
    },
    function (errorMessage) {
      console.error(errorMessage);
      popupBox("Bluetooth Error: " + errorMessage);
    });

  // Information re paired devices
  networking.bluetooth.getDevices(function (devices) {
    pairedBtNames.length = 0; //reset in case called more than once
    pairedBtAddresses.length = 0;
    for (var i = 0; i < devices.length; i++) {
      // The deviceInfo object has the following properties:
      // address: String --> The address of the device, in the format 'XX:XX:XX:XX:XX:XX'.
      // name: String --> The human-readable name of the device.
      // paired: Boolean --> Indicates whether or not the device is paired with the system.
      // uuids: Array of String --> UUIDs of protocols, profiles and services advertised by the device.
      console.log(i, devices[i].name, devices[i].address);
      pairedBtNames[i] = devices[i].name;
      pairedBtAddresses[i] = devices[i].address;
      addDeviceSelection(i);
    }
  });

  setConnectionState("rho", "disconnected");
  setConnectionState("lho", "disconnected");
}
/////////////////////////////////////////////////////////////////////
// Puts pairedBtNames[ix] into LHO and RHO text
// device selection lists if not already present
// pairedBtAddresses[ix] into option.value
//
function addDeviceSelection(ix) {
  //var elRho = document.getElementById("rho-name");
  var elLho = document.getElementById("lho-name");
  var opt;

  // elRho.value = pairedBtAddresses[ix];
  // //console.log("Add RHO Device: ", ix, pairedBtNames[ix], pairedBtAddresses[ix]);
  // if (!(elRho.selectedIndex >= 0)) { //a new entry
  //   opt = document.createElement("option");
  //   opt.text = pairedBtNames[ix];
  //   opt.value = pairedBtAddresses[ix];
  //   //option.selected = true;
  //   elRho.add(opt, ix + 1);
  //   elRho.selectedIndex = "0";
  //   rhoBtName = opt.text;
  //   rhoBtAddress = opt.value;
  //   elRho.onchange();
  //   //console.log("RHO added");
  // }

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
    //console.log("LHO added");
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

////////////////////////////////////////////////////////////////////////////////////////
// opp is either "rho" or "lho"
// state is "disconnected", "waiting" or "connected"
// The function changes the class of the corresponding element
// in order to display the  red, yellow or green symbol
//
function setConnectionState(opp, state) {
  var elDis;
  var elWat;
  var elCon;
  //console.log("setConnectionState", opp, state);
  if (opp == "rho") {
    elDis = document.getElementById("rho-disconnected");
    elWat = document.getElementById("rho-waiting");
    elCon = document.getElementById("rho-connected");
  }
  if (opp == "lho") {
    elDis = document.getElementById("lho-disconnected");
    elWat = document.getElementById("lho-waiting");
    elCon = document.getElementById("lho-connected");
  }
  //console.log(elDis.classList, elWat.classList, elCon.classList);
  elDis.classList.remove("dot-red");
  elCon.classList.remove("dot-green");
  elWat.classList.remove("dot-yellow");
  elDis.classList.add("dot-transparent");
  elCon.classList.add("dot-transparent");
  elWat.classList.add("dot-transparent");
  //console.log(elDis.classList, elWat.classList, elCon.classList);
  if (state == "disconnected") {
    elDis.classList.add("dot-red");
    elDis.classList.remove("dot-transparent");
  }
  if (state == "waiting") {
    elWat.classList.add("dot-yellow");
    elWat.classList.remove("dot-transparent");
  }
  if (state == "connected") {
    elCon.classList.add("dot-green");
    elCon.classList.remove("dot-transparent");
  }
  //console.log(elDis.classList, elWat.classList, elCon.classList);
}

///////////////////////////////////////////////////////////////////
// Data sent and received on the bluetooth socket is an unstructured
// binary "arrayBuffer". 
// We send strings and need to convert from and to the buffer format   
function arrayBufferFromString(str) {
  var buf, bufView, i, j, ref, strLen;

  strLen = str.length;
  buf = new ArrayBuffer(strLen);
  bufView = new Uint8Array(buf);
  for (i = j = 0, ref = strLen; j < ref; i = j += 1) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

///////////////////////////////////////////////////////////////////
// Data sent and received on the bluetooth socket is an unstructured
// binary "arrayBuffer". 
// We send strings and need to convert from and to the buffer format  
function stringFromArrayBuffer(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
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

  //This will restore the selection in both dropdowns
  rightEl.value = rhoBtAddress;
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
  if (listeningForConnectionRequest) {
    networking.bluetooth.close(serverSocketId);
  }
  listeningForConnectionRequest = false;
  serverSocketId = -1;

  if (lhoConnected) {
    networking.bluetooth.close(lhoSocketId);
  }
  setConnectionState("lho", "disconnected");
  lhoSocketId = -1;

  if (rhoConnected) {
    networking.bluetooth.close(rhoSocketId);
  }
  setConnectionState("rho", "disconnected");
  lhoSocketId = -1;

  lhoConnected = false;
  rhoConnected = false;
}

function reConnect() {
  startBtListening();
  startCalling();
}

// Some messages require action
// An example is the msg that communicates rho name and address
// The content determines what to do
function msgInterpreter(msgSource, msgText) {
  var ix1, ix2;
  var prefixName = "rho-name: ";
  var prefixAddr = "rho-addr: ";
  var strName = "";
  var strAddr = "";

  console.log( "interpreter: ", msgSource, msgText);
  if (msgSource == "rho"){ 
    ix1 = msgText.indexOf(prefixName);
    console.log(ix1, prefixName);
    if (ix1 >= 0) {
      ix1 += prefixName.length;
      strName = msgText.substring(ix1);
      console.log(ix1, strName);
      ix2 = strName.indexOf(" ");
      strName = strName.slice(0, ix2);
      console.log(ix2, strName);
    }

    ix1 = msgText.indexOf(prefixAddr);
    console.log(ix1, prefixAddr);
    if (ix1 >= 0) {
      ix1 += prefixAddr.length;
      strAddr = msgText.substring(ix1);
      console.log(ix1, strAddr);
      ix2 = strAddr.indexOf(" ");
      strAddr = strAddr.slice(0, ix2);
      console.log(ix2, strAddr);
    }
  }

  console.log( strName, strAddr );

  // Accept the transmitted values
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