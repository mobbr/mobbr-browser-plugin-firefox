function openLightbox(url) {
    mobbr.createDiv();
    mobbr.makePayment(url);
}

function hideLightbox() {
    mobbr.hide();
}

function receiveMessage(event) {
    var data = event.data;

    switch(data.msgType) {
        case 'openLightbox':
            openLightbox(data.url);
            break;
        case 'hideLightbox':
            hideLightbox();
            break;
    }
}

window.addEventListener("message", receiveMessage);

document.onclick = function(e) {
    if(document.getElementById("mobbr_div").style.display == 'none') {
        window.parent.postMessage({msgType: 'hideLightboxWrapper'}, '*');
    }
};