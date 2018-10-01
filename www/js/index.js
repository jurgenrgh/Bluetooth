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
    var xSpan = document.getElementById("xModalBox");
    xSpan.addEventListener("click", hidePopupBox, false);
    xSpan = document.getElementById("xModalBoxOK");
    xSpan.addEventListener("click", hidePopupBox, false);
    xSpan = document.getElementById("xModalBoxYesNo");
    xSpan.addEventListener("click", hidePopupBox, false);

    var input = document.getElementById("msg-send");

    input.addEventListener("keyup", function(event) {
      // Cancel the default action, if needed
      event.preventDefault();
      // Number 13 is the "Enter" key on the keyboard
      if (event.keyCode === 13) {
        // Trigger the button element with a click
        //document.getElementById("myBtn").click();
        
        input.blur();
      }
    });

    
  },
  // deviceready Event Handler
  //
  // The scope of 'this' is the event. In order to call the 'receivedEvent'
  // function, we must explicitly call 'app.receivedEvent(...);'
  onDeviceReady: function () {
    app.receivedEvent('deviceready');
    console.log("device ready");
  },
  // Update DOM on a Received Event
  receivedEvent: function (id) {
    console.log('Received Event: ' + id);
    networking.bluetooth.onReceive.addListener(onReceiveHandler);
    getBtDevices();
  }

};
//End of app class
//////////////////////////////////////////////////////////////
// Bluetooth Names and addresses
var thisTabletBtName = "void";
var thisTabletBtAddress = "void";

var pairedBtNames = [];
var pairedBtAddresses = [];

var rhoBtName = "void";
var lhoBtName = "void";
var rhoBtAddress = "void";
var lhoBtAddress = "void";

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
    networking.bluetooth.listenUsingRfcomm(uuid, function(socketId) {
      serverSocketId = socketId;
      listeningForConnectionRequest = true;
      console.log("startBluetoothListening " + socketId);
      setConnectionState("rho", "waiting");
      networking.bluetooth.onAccept.addListener(function(acceptInfo) {
        if (acceptInfo.socketId !== serverSocketId) {
          console.log('onAccept -- acceptInfo.socketId != serverSocketId');
          return;
        }
        rhoSocketId = acceptInfo.clientSocketId;
        rhoConnected = true;
        setConnectionState("rho", "connected");
        console.log("Accepted Connection: ", "Server Socket: " + serverSocketId, "Client Socket: " + rhoSocketId);
      });
    }, function(errorMessage) {
      console.error(errorMessage);
    });
  }
}

function startCalling(){
  console.log("startCalling", lhoBtAddress, rhoBtAddress, lhoBtName, rhoBtName);
  var deviceAddress;
  
  if (!lhoConnected) {
    //var elLho = document.getElementById("lho-name");
    //deviceAddress = elLho.value;
    deviceAddress = lhoBtAddress;
    setConnectionState("lho", "waiting");
    //console.log("connectClient waiting ", deviceAddress);
    networking.bluetooth.connect(deviceAddress, uuid, function(socketId) {
      lhoSocketId = socketId;
      lhoConnected = true;
      console.log("Client connected. LHO socket = ", socketId);
      setConnectionState("lho", "connected");
    }, function(errorMessage) {
      console.error(errorMessage);
    });
  }
}

function msgToRho() {
  var val = document.getElementById("msg-send").value;
  var buf = arrayBufferFromString(val);

  if (rhoConnected) {
    networking.bluetooth.send(rhoSocketId, buf, function(bytes_sent) {
      console.log('Sent ' + bytes_sent + ' bytes ' + val + ' rhoSocket: ' + rhoSocketId);
    }, function(errorMessage) {
      console.log('Send failed: ' + errorMessage + ' msg: ' + val + ' rhoSocket: ' + rhoSocketId);
    });
  } else {
    console.log("RHO not connected, message not sent");
  }
}

function msgToLho() {
  var val = document.getElementById("msg-send").value;
  var buf = arrayBufferFromString(val);

  if (lhoConnected) {
    networking.bluetooth.send(lhoSocketId, buf, function(bytes_sent) {
      console.log('Sent ' + bytes_sent + ' bytes ' + val + ' lhoSocket: ' + lhoSocketId);
    }, function(errorMessage) {
      console.log('Send failed: ' + errorMessage  + ' msg: ' + val + ' lhoSocket: ' + lhoSocketId);
    });
  } else {
    console.log("LHO not connected, message not sent");
  }
}

function onReceiveHandler(receiveInfo) {
  var strReceived;

  var socketId = -1;
  var source = "";

  if (lhoConnected) {
    if (receiveInfo.socketId == lhoSocketId) {
      socketId = lhoSocketId;
      source = "LHO";
      checkCheckBox("left", true);
      checkCheckBox("right", false);
    }
  }
  if (rhoConnected) {
    if (receiveInfo.socketId == rhoSocketId) {
      socketId = rhoSocketId;
      source = "RHO";
      checkCheckBox("left", false);
      checkCheckBox("right", true);
    }
  }

  if(!rhoConnected && !lhoConnected ){
    console.log( "Error: Message Received but neither side Connected");
    return;
  }

  if(socketId == -1){
    console.log("Error: Message Received on socket ", receiveInfo.socketId);
    console.log("rhoSocketId = " + rhoSocketId, "lhoSocketId = " + lhoSocketId);
    return;
  }

  strReceived = stringFromArrayBuffer(receiveInfo.data);
  console.log("Data received: ", strReceived);

  //acknowledge receipt

  //networking.bluetooth.send(socketId, reply);

  document.getElementById("msg-rcvd").value = "Received from " + source + ": " + strReceived;
}

// Gets Adapter State and name and list of paired
// devices
// The names are then entered in the drop-down
// so that rho and lho can be selected
// Initially connection state set to "disconnected"
function getBtDevices() {
  networking.bluetooth.getAdapterState(function (adapterInfo) {
      // The adapterInfo object has the following properties:
      // address: String --> The address of the adapter, in the format 'XX:XX:XX:XX:XX:XX'.
      // name: String --> The human-readable name of the adapter.
      // enabled: Boolean --> Indicates whether or not the adapter is enabled.
      // discovering: Boolean --> Indicates whether or not the adapter is currently discovering.
      // discoverable: Boolean --> Indicates whether or not the adapter is currently discoverable.
      //console.log('Adapter ' + adapterInfo.address + ': ' + adapterInfo.name);
      //
      var el = document.getElementById("this-tablet-name");
      el.innerHTML = adapterInfo.name;
      thisTabletBtName = adapterInfo.name; //Bluetooth name
      thisTabletBtAddress = adapterInfo.address;
      console.log("Name and Address", thisTabletBtName, thisTabletBtAddress);
    },
    function (errorMessage) {
      console.error(errorMessage);
      popupBox("Bluetooth Error: " + errorMessage);
    });

  networking.bluetooth.getDevices(function (devices) {
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
  //setConnectionState("rho", "disconnected");
  //setConnectionState("lho", "disconnected");
  //console.log("getBtDevices");
}



// Puts pairedBtNames[ix] into LHO and RHO text
// device selection lists if not already present
// pairedBtAddresses[ix] into option.value
//
function addDeviceSelection(ix) {
  var elRho = document.getElementById("rho-name");
  var elLho = document.getElementById("lho-name");

  elRho.value = pairedBtAddresses[ix];
  if (!(elRho.selectedIndex >= 0)) { //a new entry
    var option = document.createElement("option");
    option.text = pairedBtNames[ix];
    option.value = pairedBtAddresses[ix];
    //option.selected = true;
    elRho.add(option, ix + 1);
    elRho.selectedIndex = "0";
    rhoBtName = option.text;
    rhoBtAddress = option.value;
  }

  elLho.value = pairedBtAddresses[ix];
  if (!(elLho.selectedIndex >= 0)) { //a new entry
    var option = document.createElement("option");
    option.text = pairedBtNames[ix];
    option.value = pairedBtAddresses[ix];
    //option.selected = true;
    elLho.add(option, ix + 1);
    elLho.selectedIndex = "0";
    lhoBtName = option.text;
    lhoBtAddress = option.value;
  }
}

// Called when selection of LHO Tablet changes
// val is the assigned value corresponding to the chosen list item
function handleLhoChange(e) {
  var ix = e.selectedIndex;
  lhoBtName = e.options[ix].text;
  lhoBtAddress = e.options[ix].value;
  //popupBox("LHO tablet selected: " + lhoBtName + " " + lhoBtAddress);
}

// Called when RHO tablet changes
// val is the assigned value corresponding to the chosen list item
function handleRhoChange(e) {
  var ix = e.selectedIndex;
  rhoBtName = e.options[ix].text;
  rhoBtAddress = e.options[ix].value;
  //popupBox("LHO tablet selected: " + rhoBtName + " " + rhoBtAddress);
}

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

// opp is either "rho" or "lho"
// state is "disconnected", "waiting" or "connected"
// The function changes the class of the corresponding element
// in order to display the  red, yellow or green symbol
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

function arrayBufferFromString(str) {
  var buf,
    bufView,
    i,
    j,
    ref,
    strLen;
  strLen = str.length;
  buf = new ArrayBuffer(strLen);
  bufView = new Uint8Array(buf);
  for (i = j = 0, ref = strLen; j < ref; i = j += 1) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

function stringFromArrayBuffer(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}


