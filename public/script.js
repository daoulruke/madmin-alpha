
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

        var req = new XMLHttpRequest();

        req.onreadystatechange = function () {
            if (req.readyState==4) {

                const data = JSON.parse(req.responseText);

                // content
                const paths = data.paths;
                console.log(paths);

                let ul = document.createElement("ul");

                Object.entries(paths).forEach(([key, value]) => {
                    let li = document.createElement("li");
                    li.innerHTML = `<a href="${key}">${key}</a>`;
                    ul.appendChild(li);
                });

                document.getElementById('content').appendChild(ul);

                //raw
                const raw = JSON.stringify(data, undefined, 4);
                document.getElementById('raw').innerHTML = raw;

            }
        }

        url = apiUrl + '/openapi';

        req.open("GET", url, true);
        req.setRequestHeader('X-Authorization', 'Bearer ' + accessToken);
        req.send();

    }

};