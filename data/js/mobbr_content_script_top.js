function findParticipation() {
    var participation = document.getElementsByName("participation");
    if (participation.length > 0) {
        var content = JSON.parse(participation[0].content);
        return {url: window.location.href, participation: true, numberParticipants: content.participants.length};
    }
    return {url: window.location.href, participation: false};
}

function createLightboxWrapper() {
    /*
     * To bypass CSP (Content Security Policy) restrictions from websites with restrictive frame-src (e.g GitHub)
     * Create an iframe with src='about:blank?mobbr' which will be a wrapper for the cross-origin iframe that loads the mobbr lightbox
     *
     * This is necessary because the current CSP implementation in Firefox doesn't exclude extensions from frame-src CSP restrictions declared by websites
     *
     * Firefox bugs: https://bugzilla.mozilla.org/show_bug.cgi?id=615708 https://bugzilla.mozilla.org/show_bug.cgi?id=792479
     * CSP should not interfere with extensions: http://www.w3.org/TR/CSP/#processing-model
     * Github blog post: https://github.com/blog/1477-content-security-policy
     *
     */
    div = document.createElement("div");
    div.setAttribute('id', 'mobbr_wrapper_div');
    div.style.cssText = 'display:none; position: fixed; top: 0; right: 0; width: 320px; height: 100%; z-index: 2147483647;';

    iframe = document.createElement("iframe");
    iframe.setAttribute('name', 'mobbr_wrapper_frame');
    iframe.setAttribute('id', 'mobbr_wrapper_frame');
    iframe.setAttribute('frameborder', '0');
    iframe.style.cssText = 'width: 100%; height: 100%;';
    iframe.src = "about:blank?mobbr";

    div.appendChild(iframe);
    document.body.appendChild(div);
}

function showLightboxWrapper() {
    document.getElementById('mobbr_wrapper_div').style.display = 'block';
}

function hideLightboxWrapper() {
    document.getElementById('mobbr_wrapper_div').style.display = 'none';
}

function receiveMessage(event) {
    var data = event.data;
    switch(data.msgType) {
        case 'hideLightboxWrapper':
            hideLightboxWrapper();
            break;
    }
}

window.addEventListener("message", receiveMessage);

if (window == top) {
    createLightboxWrapper();

    self.port.on("openLightbox", function() {
        document.getElementById('mobbr_wrapper_frame').contentWindow.postMessage({msgType: 'openLightbox', url: window.location.href}, '*');
        showLightboxWrapper();
    });

    self.port.on("hideLightbox", function() {
        document.getElementById('mobbr_wrapper_frame').contentWindow.postMessage({msgType: 'hideLightbox'}, '*');
        hideLightboxWrapper();
    });

    self.port.on("findParticipation", function() {
        self.port.emit("foundParticipation", findParticipation());
    });
}