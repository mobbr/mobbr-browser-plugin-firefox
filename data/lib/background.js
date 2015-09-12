var mobbrEnabledUrlBadgeText = '1';

function getHost(url) {
    var parser = document.createElement('a');
    parser.href = url;
    return parser.hostname;
}

function hostFound(host, api_connections) {
    for (var i = 0; i < api_connections.length; i++) {
        var conn = api_connections[i];
        if(conn.hasOwnProperty('host') && conn.host.toLowerCase() == host) {
            return true;
        }
    }
    return false;
}

var detectApi_cache = new LRUCache(20);
function detectApi(url) {
    var host = getHost(url).toLowerCase();
    var cached_val = detectApi_cache.get(host);
    if(cached_val != undefined)	{
        if(cached_val) {
            self.port.emit("detectedApi", mobbrEnabledUrlBadgeText);
        }
        return;
    }

    var options = {
        url: 'https://api.mobbr.com/api_v1/api/api_connections',
        method: 'GET',
        headers: {Accept: 'application/json'}
    };

    nanoajax.ajax(options, function (code, responseText) {
        if(code == 200) {
            if(hostFound(host, JSON.parse(responseText)["result"])) {
                self.port.emit("detectedApi", mobbrEnabledUrlBadgeText);
                detectApi_cache.set(host, true);
            }
            else {
                detectApi_cache.set(host, false);
            }
        }
    });
}

var detectPayment_cache = new LRUCache(20);
function detectPayment(url) {
    var cached_val = detectPayment_cache.get(url);
    if(cached_val != undefined)	{
        if(cached_val) {
            self.port.emit("detectedPayment");
        }
        return;
    }

    var options = {
        url: 'https://api.mobbr.com/api_v1/balances/uri?url='+url,
        method: 'GET',
        headers: {Accept: 'application/json'}
    };

    nanoajax.ajax(options, function (code, responseText) {
        if(code == 200) {
            var response = JSON.parse(responseText);
            if(response.result.total_amount > 0) {
                self.port.emit("detectedPayment");
                detectPayment_cache.set(url, true);
            }
            else {
                detectPayment_cache.set(url, false);
            }
        }
    });
}

self.port.on("detectApi", function(url) {
    detectApi(url);
});

self.port.on("detectPayment", function(url) {
    detectPayment(url);
});