
var authUrl = 'https://sitevitals-beta.au.auth0.com/authorize'; // url of 'auth.php' from php-api-auth
var clientId = '7FKABiIsVFrGmquJm5k1kf9MKbt1xw2F'; // client id as defined in php-api-auth
var audience = 'https://api.sitevitals-beta.com'; // api audience as defined in php-api-auth
var apiUrl = 'https://api.halcyon-beta.com'; // api audience as defined in php-api-auth

window.onload = function () {

    var match = RegExp('[#&]access_token=([^&]*)').exec(window.location.hash);
    var accessToken = match && decodeURIComponent(match[1].replace(/\+/g, ' '));

    if (!accessToken) {

        document.location = authUrl+'?audience='+audience+'&response_type=token&client_id='+clientId+'&redirect_uri='+document.location.href;

    } else {

        document.location.hash = '';

        // Fetch wrapper with default options
        var _fetch = (url, options = {}) => {
            return fetch(url, {
                headers: {
                    "X-Authorization": `Bearer ${accessToken}`
                },
                ...options
            }).then(response => response.json());
        };

        _fetch(`${apiUrl}/openapi`)
            .then(response => {
                // #content
                const ul = document.createElement("ul");
                for ([key, value] of Object.entries(response.paths)) {
                    const li = document.createElement("li");
                    li.innerHTML = `<a href="${key}">${key}</a>`;
                    ul.appendChild(li);
                }
                document.getElementById('content').appendChild(ul);

                // #raw
                const raw = JSON.stringify(data, undefined, 4);
                document.getElementById('raw').innerHTML = raw;
            });
    }

};