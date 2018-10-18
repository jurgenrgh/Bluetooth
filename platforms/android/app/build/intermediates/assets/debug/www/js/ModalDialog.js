///////////////////////////////////////////////////////////////////////////////
// Functions related to the popup box -- Version 2
// Using the Materialize library
// 
// This is a simple modal overlay containing a text message
// and 0, 1 or 2 buttons (ok; yes/no).
//
// msgText: any string
// id     : string identifier used to determine the action when the box is dismissed
// okText : label for the button, if blank - no button
// yesText: dito
// noText : dito
// 
var currentModalId;
var textSample = "<strong>Lorem ipsum dolor sit amet,</strong> " +
 "consectetur adipiscing elit, sed do eiusmod " +
  "tempor incididunt ut labore et dolore magna " +
   "aliqua. Ut enim ad minim veniam, quis nostrud " +
    "exercitation ullamco laboris nisi ut aliquip " +
    "ex ea commodo consequat. Duis aute irure dolor " +
    "in reprehenderit in voluptate velit esse cillum " +
    "dolore eu fugiat nulla pariatur. Excepteur sint " +
    "occaecat cupidatat non proident, sunt in culpa qui " +
    "officia deserunt mollit <br/> anim <br/> id est laborum.";

function popupBox(msgTitle, msgText, id, okText, yesText, noText) {
    
    currentModalId = id;

    var head = document.getElementById("dialog-header");
    head.innerHTML = msgTitle;
    var box = document.getElementById("dialog-text");
    box.innerHTML = msgText;

    var okBtn = document.getElementById("ok-button");
    var okSpan = document.getElementById("ok-span");
    if (okText != "") {
        okSpan.innerHTML = okText;
        okBtn.style.display = "inline-block";
    } else {
        okBtn.style.display = "none";
    }

    var yesBtn = document.getElementById("yes-button");
    var yesSpan = document.getElementById("yes-span");
    if (yesText != "") {
        yesSpan.innerHTML = yesText;
        yesBtn.style.display = "inline-block";
    } else {
        yesBtn.style.display = "none";
    }

    var noBtn = document.getElementById("no-button");
    var noSpan = document.getElementById("no-span");
    if (noText != "") {
        noSpan.innerHTML = noText;
        noBtn.style.display = "inline-block";
    } else {
        noBtn.style.display = "none";
    }

    var el = document.getElementById("modalDialog");
    var instance = M.Modal.getInstance(el);
    instance.open();
}

function hidePopupBox(){
    var el = document.getElementById("modalDialog");
    var instance = M.Modal.getInstance(el);
    instance.close();
}

function okModalClicked(){
    console.log("okModal ID= " + currentModalId);
}
function yesModalClicked(){
    console.log("yesModal ID= " + currentModalId);
}
function noModalClicked(){
    console.log("noModal ID= " + currentModalId);
}



