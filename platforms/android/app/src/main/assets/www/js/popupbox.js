///////////////////////////////////////////////////////////////////////////////
// Functions related to the popup box
// This is a simple modal overlay containing a text message
// and 0, 1 or 2 buttons (ok; yes/no)
///////////////////////////////////////////////////////////////////////////////
// function popupBox(msgText, timeout)
// function popupBoxOK(msgText, okButtonText, timeout)
// function popupBoxYesNo(msgText, yesButtonText, noButtonText, buttonValue, timeout)
// function hidePopupBox()
// function setPopupButtonValue(but, val)
// function yesButtonAction()
// function noButtonAction()
// function okButtonAction()
//
///////////////////////////////////////////////////////////////////////////////
// The popup messageBox is called with a text message
// and 0, 1, or 2 buttons. The buttons appear only if their
// text argument (label on the button) is not blank
function popupBox(msgText, timeout) {
  clearTimeout(popupTimeOutRunning);

  var msg = document.getElementById("msgBox");
  msg.style.display = "block"; //make it visible

  var txt = document.getElementById("modalMsgText");
  txt.innerHTML = msgText;
  //timeout in ms
  if (timeout > 0) {
    timeout = timeout * 1000;
    popupTimeOutRunning = setTimeout(hidePopupBox, timeout);
  }
  //console.log("popup prompt", msgText, timeout);
}

////////////////////////////////////////////////////////////////////////////////
// Popup with ok button
//
function popupBoxOK(msgText, okButtonText, bVal, timeout) {
  clearTimeout(popupTimeOutRunning);

  var msg = document.getElementById("msgBoxOK");
  msg.style.display = "block"; //make it visible

  var txt = document.getElementById("modalMsgTextOK");
  txt.innerHTML = msgText;

  var bOK = document.getElementById("okButton");
  if (okButtonText != "") {
    bOK.innerHTML = okButtonText;
    bOK.style.visibility = "visible";
    bOK.value = bVal;
  } else {
    bOK.style.visibility = "hidden";
  }
  //timeout in ms
  if (timeout > 0) {
    timeout = timeout * 1000;
    popupTimeOutRunning = setTimeout(hidePopupBox, timeout);
  }

}

///////////////////////////////////////////////////////////////////////////////
// Popup with Yes/No buttons
//
function popupBoxYesNo(msgText, yesButtonText, noButtonText, bVal, timeout) {
  clearTimeout(popupTimeOutRunning);

  var msg = document.getElementById("msgBoxYesNo");
  msg.style.display = "block"; //make it visible

  var txt = document.getElementById("modalMsgTextYesNo");
  txt.innerHTML = msgText;

  var bYes = document.getElementById("yesButton");
  if (yesButtonText != "") {
    bYes.innerHTML = yesButtonText;
    bYes.style.visibility = "visible";
    bYes.value = bVal;
  } else {
    bYes.style.visibility = "hidden";
  }
  var bNo = document.getElementById("noButton");
  if (noButtonText != "") {
    bNo.innerHTML = noButtonText;
    bNo.style.visibility = "visible";
    bNo.value = bVal;
  } else {
    bNo.style.visibility = "hidden";
  }
  //timeout in ms
  if (timeout > 0) {
    timeout = timeout * 1000;
    popupTimeOutRunning = setTimeout(hidePopupBox, timeout);
  }

}

//////////////////////////////////////////////////////////////////////////////
// When the user clicks on <span> (x) in the box, close all the popups
// that might be showing
//
function hidePopupBox() {
  var msg = document.getElementById('msgBox');
  msg.style.display = "none";
  msg = document.getElementById('msgBoxOK');
  msg.style.display = "none";
  msg = document.getElementById('msgBoxYesNo');
  msg.style.display = "none";
}

///////////////////////////////////////////////////////////////////////////////
// Set the button "value" attribute when the popup is opened
// The idea is to allow different actions when clicked
//
function setPopupButtonValue(but, val) {
  if (but == "Yes") {
    var yb = document.getElementById("yesButton");
    yb.value = val;
  }
  if (but == "No") {
    var nb = document.getElementById("noButton");
    nb.value = val;
  }
  if (but == "OK") {
    var ob = document.getElementById("okButton");
    ob.value = val;
  }
}

///////////////////////////////////////////////////////////////////////////////
// The button value is set when the popupbox is opened
// It identifies the required action
// This function is called when the Yes-button is pressed
function yesButtonAction() {
  var b = document.getElementById("yesButton");
  var t = b.innerHTML;
  var val = b.value;
  //specific actions here depending upon value
}

///////////////////////////////////////////////////////////////////////////////
// Analogous to yes action
//
function noButtonAction() {
  var b = document.getElementById("noButton");
  var t = b.innerHTML;
  var val = b.value;
  //specific actions here depending upon value
}

function okButtonAction() {
  var b = document.getElementById("okButton");
  var t = b.innerHTML;
  var val = b.value;
  //specific actions here depending upon value

  hidePopupBox();
}
