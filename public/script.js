
var authUrl = 'https://sitevitals-beta.au.auth0.com/authorize'; // url of 'auth.php' from php-api-auth
var clientId = '7FKABiIsVFrGmquJm5k1kf9MKbt1xw2F'; // client id as defined in php-api-auth
var audience = 'https://api.sitevitals-beta.com'; // api audience as defined in php-api-auth
var apiUrl = 'https://api.halcyon-beta.com'; // api audience as defined in php-api-auth

// Fetch wrapper
let _fetch = null;

// Fetch openapi
let openapi = null;
let getOpenapi = async () => {
    openapi = await _fetch(`${apiUrl}/openapi`);
    listPaths();
};
// Display openapi
let listPaths = () => {
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

    // #current_path
    const current_path = document.getElementById("current_path");
    if (current_path.childNodes[2]) current_path.removeChild(current_path.childNodes[2]);
    if (current_path.childNodes[3]) current_path.removeChild(current_path.childNodes[3]);

    // url bar
    window.history.replaceState(
        {},
        document.title,
        `${location.protocol}//${location.host}`
    );
};

// Fetch and display records
let getRecords = async (url) => {

    const records = await _fetch(`${apiUrl}${url}`)
        .then(response => response.records);

    // #content
    const ul = document.createElement("ul");

    for (record of records) {
        const li = document.createElement("li");
        li.innerHTML = `<a href="#" onclick="getRecord('${url + `/${record.id}`}')">${record.id} ${record.name}</a>`;
        ul.appendChild(li);
    }

    document.getElementById('content').innerHTML = ul.outerHTML;

    // #raw
    const raw = JSON.stringify(records, undefined, 4);
    document.getElementById('raw').innerHTML = raw;

    // #current_path
    const current_path = document.getElementById("current_path");
    if (current_path.childNodes[2]) current_path.removeChild(current_path.childNodes[2]);
    if (current_path.childNodes[3]) current_path.removeChild(current_path.childNodes[3]);
    var li = document.createElement("li");
    li.innerHTML = `<a href="#" onclick="getRecords('${url}')">/${url.split("/")[2]}</a>`;
    current_path.appendChild(li);

    // url bar
    window.history.replaceState(
        {},
        document.title,
        `${location.protocol}//${location.host}${url}`
    );

};

// Fetch and display records
let getRecord = async (url) => {
    const record = await _fetch(`${apiUrl}${url}`);

    // START - #content
    const ul = document.createElement("ul");
    for ([key, value] of Object.entries(record)) {
        const li = document.createElement("li");
        li.innerHTML = `${key}: ${value}`;
        ul.appendChild(li);
    }
    var li = document.createElement("li");
    li.innerHTML = `<input type="button" value="EDIT" onclick="editRecord('${url}')" />`;
    ul.appendChild(li);
    // Related links
    const referenced = openapi.components.schemas[`read-${url.split("/")[2]}`].properties.id["x-referenced"];
    const relatedTables = referenced.reduce((acc, val) => {
        const x_y = val.split(".")[0];
        const x = x_y.split("_")[0];
        if (!acc.includes(x)) acc.push(x);
        return acc;
    }, []);
    var li = document.createElement("li");
    li.innerHTML = "<br /><b>RELATED LINKS</b>";
    ul.appendChild(li);
    for (relatedTable of relatedTables) {
        var li = document.createElement("li");
        li.innerHTML = `<a href="#">${`${url}/${relatedTable}`}</a>`;
        ul.appendChild(li);
    }
    document.getElementById('content').innerHTML = ul.outerHTML;
    // END - #content

    // #raw
    const raw = JSON.stringify(record, undefined, 4);
    document.getElementById('raw').innerHTML = raw;

    // #current_path
    const current_path = document.getElementById("current_path");
    if (current_path.childNodes[3]) current_path.removeChild(current_path.childNodes[3]);
    var li = document.createElement("li");
    li.innerHTML = `<a href="#" onclick="getRecord('${url}')">/${url.split("/")[3]}</a>`;
    current_path.appendChild(li);

    // url bar
    window.history.replaceState(
        {},
        document.title,
        `${location.protocol}//${location.host}${url}`
    );

};


// Fetch and display records
let editRecord = async (url) => {

    document.getElementById('content').innerHTML = '<form>';

    const record = await _fetch(`${apiUrl}${url}`);

    // #content
    const ul = document.createElement("ul");

    for ([key, value] of Object.entries(record)) {
        const li = document.createElement("li");
        if(key == 'id') {
            li.innerHTML = `${key}: ${value}`;
        } else {
            li.innerHTML = `<input type="text" name="${key}" value="${value}" />`;
        }
        ul.appendChild(li);
    }

    var li = document.createElement("li");
    li.innerHTML = `<input type="button" value="SUBMIT" onclick="submitForm('edit_form')" />`;
    ul.appendChild(li);

    const form = document.createElement("form");
    form.setAttribute('id', 'edit_form');
    form.appendChild(ul);

    document.getElementById('content').innerHTML = form.outerHTML;

};

function submitForm(form_id) {

  // Prevent the form from submitting.
  event.preventDefault();

  // Set url for submission and collect data.
  const url = apiUrl;
  const formData = new FormData(document.getElementById(form_id));
  // Build the data object.
 // const data = {};
 // formData.forEach((value, key) => (data[key] = value));
  // Log the data.
 // console.log(data);

var json = JSON.stringify(Object.fromEntries(formData));

 var accessToken = localStorage.getItem('accessToken');

  var request = new XMLHttpRequest();
request.open("PUT", url + window.location.pathname);
request.setRequestHeader('X-Authorization', 'Bearer ' + accessToken);
request.send(json);

}

window.onload = function () {

    var match = RegExp('[#&]access_token=([^&]*)').exec(window.location.hash);
    var accessToken = match && decodeURIComponent(match[1].replace(/\+/g, ' '));

    if (!accessToken) {

        document.location = authUrl+'?audience='+audience+'&response_type=token&client_id='+clientId+'&redirect_uri='+document.location.href;

    } else {

        document.location.hash = '';

        localStorage.setItem('accessToken', accessToken);

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