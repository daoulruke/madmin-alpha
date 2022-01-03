
var authUrl = 'https://sitevitals-beta.au.auth0.com/authorize'; // url of 'auth.php' from php-api-auth
var clientId = '7FKABiIsVFrGmquJm5k1kf9MKbt1xw2F'; // client id as defined in php-api-auth
var audience = 'https://api.sitevitals-beta.com'; // api audience as defined in php-api-auth
var apiUrl = 'https://api.halcyon-beta.com'; // api audience as defined in php-api-auth

// Fetch wrapper
let _fetch = null;

// Fetch and display openapi
let getOpenapi = async () => {
    const openapi = await _fetch(`${apiUrl}/openapi`);

    // #content
    const ul = document.createElement("ul");
    for ([key, value] of Object.entries(openapi.paths)) {
        const li = document.createElement("li");
        li.innerHTML = `<a href="#" onclick="getRecords('${key}')">${key}</a>`;
        ul.appendChild(li);
    }
    document.getElementById('content').innerHTML = ul.outerHTML;

    // #raw
    const raw = JSON.stringify(openapi, undefined, 4);
    document.getElementById('raw').innerHTML = raw;
};

// Fetch and display records
let getRecords = async (url) => {
    const records = await _fetch(`${apiUrl}${url}`)
        .then(response => response.records);

    // #content
    const ul = document.createElement("ul");
    for (record of records) {
        const li = document.createElement("li");
        li.innerHTML = `<a href="#" onclick="getRecord('${url + `/${record.id}`}')">${record.name}</a>`;
        ul.appendChild(li);
    }
    document.getElementById('content').innerHTML = ul.outerHTML;

    // #raw
    const raw = JSON.stringify(records, undefined, 4);
    document.getElementById('raw').innerHTML = raw;
};

// Fetch and display records
let getRecord = async (url) => {
    const record = await _fetch(`${apiUrl}${url}`);

    // #content
    const ul = document.createElement("ul");
    for ([key, value] of Object.entries(record)) {
        const li = document.createElement("li");
        li.innerHTML = `${key}: ${value}`;
        ul.appendChild(li);
    }
    document.getElementById('content').innerHTML = ul.outerHTML;

    // #raw
    const raw = JSON.stringify(record, undefined, 4);
    document.getElementById('raw').innerHTML = raw;
};

window.onload = function () {

    var match = RegExp('[#&]access_token=([^&]*)').exec(window.location.hash);
    var accessToken = match && decodeURIComponent(match[1].replace(/\+/g, ' '));

    if (!accessToken) {

        document.location = authUrl+'?audience='+audience+'&response_type=token&client_id='+clientId+'&redirect_uri='+document.location.href;

    } else {

        document.location.hash = '';

        // Fetch wrapper with default options
        _fetch = (url, options = {}) => {
            return fetch(url, {
                headers: {
                    "X-Authorization": `Bearer ${accessToken}`
                },
                ...options
            }).then(response => response.json());
        };

        getOpenapi();
    }

};