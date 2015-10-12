const self = require("sdk/self");
const pageMod = require("sdk/page-mod");
const pageWorkers = require("sdk/page-worker");

const buttons = require('sdk/ui/button/action');
const tabs = require("sdk/tabs");

const viewFor = require("sdk/view/core").viewFor;
const modelFor = require('sdk/model/core').modelFor;
const getTabForContentWindow = require("sdk/tabs/utils").getTabForContentWindow;

var workers = {};
var urls = {};

var browserButton = buttons.ActionButton({
    id: "mobbr-button",
    label: "Mobbr",
    icon: {
        "16": "./icons/mobbr16.png",
        "64": "./icons/icon.png",
        "128": "./icons/mobbrball128.png"
    },
    onClick: handleClick
});

function handleClick(state) {
  var currentTab = tabs.activeTab;
  if(workers[currentTab.id])
    workers[currentTab.id].port.emit("openLightbox");
}

tabs.on('ready', function(tab) {
    urls[tab.id] = tab.url;
});

var mobbrLocationChangeListener = {
    onLocationChange: function (aProgress, aRequest, aURI, aFlags) {
        var tab = modelFor(getTabForContentWindow(aProgress.DOMWindow));
        if(tab.url == aURI.spec && urls[tab.id] && urls[tab.id] != tab.url && workers[tab.id]) {
            urls[tab.id] = tab.url;
            var worker = workers[tab.id];
            worker.port.emit("hideLightbox");
            worker.port.emit("findParticipation");
        }
    }
};

var gBrowser = viewFor(tabs.activeTab).ownerDocument.defaultView.gBrowser;
gBrowser.addProgressListener(mobbrLocationChangeListener);

pageMod.PageMod({
    include: /http(s)?:\/\/.*/i,
    contentScriptFile: [self.data.url("js/mobbr_content_script_top.js")],
    contentScriptWhen : 'ready',
    attachTo: ["top", "existing"],
    onAttach: handleAttach
});

pageMod.PageMod({
    include: /about:blank\?mobbr.*/i,
    contentScriptFile: [self.data.url("js/mobbr-button.js"), self.data.url("js/mobbr_content_script_frame.js")],
    contentScriptWhen : 'ready',
    attachTo: ["frame", "existing"]
});

function handleAttach(worker) {
    var currentTab = worker.tab;
    workers[currentTab.id] = worker;

    var pageWorker = pageWorkers.Page({
        contentURL: self.data.url("background.html"),
        contentScriptFile: [self.data.url("lib/lru.js"), self.data.url("lib/nanoajax.min.js"), self.data.url("lib/background.js")]
    });

    worker.port.emit("findParticipation");

    worker.port.on("foundParticipation", function(response) {
        if (!(typeof response != 'undefined')) return;

        if (currentTab.url != response.url)
            worker.port.emit("hideLightbox");

        browserButton.state(currentTab, {badge: ""});
        if (response.participation) {
            mobbrEnabledUrl(currentTab, response.numberParticipants.toString());
        } else {
            pageWorker.port.emit("detectApi", response.url);
        }
        pageWorker.port.emit("detectPayment", response.url);
    });

    pageWorker.port.on("detectedApi", function(mobbrEnabledUrlBadgeText) {
        mobbrEnabledUrl(currentTab, mobbrEnabledUrlBadgeText);
    });

    pageWorker.port.on("detectedPayment", function() {
        showGreenIcon(currentTab);
    });
}

function mobbrEnabledUrl(tab, badgeText) {
    var icon = browserButton.state(tab).icon;
    browserButton.state(tab, {icon: icon, badge: badgeText});
}

function showGreenIcon(tab) {
    var badgeText = browserButton.state(tab).badge;
    browserButton.state(tab, {icon: "./icons/icon-green.png", badge: badgeText});
}