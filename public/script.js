
var authUrl = 'https://sitevitals-beta.au.auth0.com/authorize'; // url of 'auth.php' from php-api-auth
var clientId = '7FKABiIsVFrGmquJm5k1kf9MKbt1xw2F'; // client id as defined in php-api-auth
var audience = 'https://api.sitevitals-beta.com'; // api audience as defined in php-api-auth
var apiUrl = 'https://api.ud.ax'; // api audience as defined in php-api-auth

// Fetch wrapper
let _fetch = null;

// Update #current_path
let updatePath = (url) => {
    const urlSegments = url.split("/");
    const current_path = document.getElementById("current_path");

    if (current_path.childNodes[4]) current_path.removeChild(current_path.childNodes[4]);
    if (current_path.childNodes[3]) current_path.removeChild(current_path.childNodes[3]);
    if (current_path.childNodes[2]) current_path.removeChild(current_path.childNodes[2]);

    const subject = urlSegments[2];
    if (subject) {
        var li = document.createElement("li");
        li.innerHTML = `<a href="#" onclick="getRecords('${`/records/${subject}`}')">/${subject}</a>`;
        current_path.appendChild(li);
    }

    const subjectId = urlSegments[3];
    if (subjectId) {
        var li = document.createElement("li");
        li.innerHTML = `<a href="#" onclick="getRecord('${`/records/${subject}/${subjectId}`}')">/${subjectId}</a>`;
        current_path.appendChild(li);
    }

    const join = urlSegments[4];
    if (join) {
        var li = document.createElement("li");
        li.innerHTML = `<a href="#" onclick="getRecords('${`/records/${subject}/${subjectId}/${join}`}')">/${join}</a>`;
        current_path.appendChild(li);
    }
};

// Fetch openapi
let openapi = null;
let getOpenapi = async () => {
    openapi = await _fetch(`${apiUrl}/openapi`)
        .then(response => response.json());
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
    const urlSegments = url.split("/");

    let fetchUrl = url;
    // For join records
    if (urlSegments.length > 4) {
        fetchUrl = url.replace("/records", "");
    }
    //const records = await _fetch(`${apiUrl}${fetchUrl}?filter=name,cs,test`)
    const records = await _fetch(`${apiUrl}${fetchUrl}`)
        .then(response => response.json())
        .then(response => response.records);

    // #content
    const ul = document.createElement("ul");
    for (record of records) {
        const li = document.createElement("li");
        let recordUrl = `${url}/${record.id}`;
        // For join records
        if (urlSegments.length > 4) {
            recordUrl = `/records/${urlSegments[4]}/${record.id}`;
        }
        li.innerHTML = `<a href="#" onclick="getRecord('${recordUrl}')">${record.id} ${record.name}</a>`;
        ul.appendChild(li);
    }


    var li = document.createElement("li");
    li.innerHTML = `<input type="button" value="CREATE" onclick="createRecord('${url}')" />`;
    ul.appendChild(li);
document.getElementById('content').innerHTML = ul.outerHTML;
    // #raw
    const raw = JSON.stringify(records, undefined, 4);
    document.getElementById('raw').innerHTML = raw;

    // #current_path
    updatePath(url);

    // url bar
    window.history.replaceState(
        {},
        document.title,
        `${location.protocol}//${location.host}${url}`
    );
};

// Fetch and display records
let getRecord = async (url) => {
    const record = await _fetch(`${apiUrl}${url}`)
        .then(response => response.json());

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
    var li = document.createElement("li");
    li.innerHTML = "<br /><b>RELATED LINKS</b>";
    ul.appendChild(li);
    const referenced = openapi.components.schemas[`read-${url.split("/")[2]}`].properties.id["x-referenced"];
    const joins = referenced.reduce((acc, val) => {
        const x_y = val.split(".")[0];
        const x = x_y.split("_")[0];
        const y = x_y.split("_")[1];
        console.log(x, y, url.split("/")[2]);
        if (x == url.split("/")[2] && !acc.includes(y)) acc.push(y);
        return acc;
    }, []);
    for (join of joins) {
        var li = document.createElement("li");
        li.innerHTML = `<a href="#" onclick="getRecords('${`${url}/${join}`}')">${`${url}/${join}`}</a>`;
        ul.appendChild(li);
    }
    document.getElementById('content').innerHTML = ul.outerHTML;
    // END - #content

    // #raw
    const raw = JSON.stringify(record, undefined, 4);
    document.getElementById('raw').innerHTML = raw;

    // #current_path
    updatePath(url);

    // url bar
    window.history.replaceState(
        {},
        document.title,
        `${location.protocol}//${location.host}${url}`
    );
};


// Fetch and display records
let createRecord = async (url) => {



    // For join records

        let tableName = url.replace("/records/", "");


        // #raw
        const raw = JSON.stringify(openapi['components']['schemas']['create-'+tableName]['properties'], undefined, 4);
        document.getElementById('raw').innerHTML = raw;



    document.getElementById('content').innerHTML = '<form>';

    const fields = raw;

console.log(fields);
    // #content
    const ul = document.createElement("ul");

    for (const [key, value] of Object.entries(fields)) {
        const li = document.createElement("li");
        if(key != 'id') {
            li.innerHTML = `${key} <input type="text" name="${key}" value="" />`;
        }
        ul.appendChild(li);
    }





    var li = document.createElement("li");
    li.innerHTML = `<input type="button" value="SUBMIT" onclick="submitForm('create_form')" />`;
    ul.appendChild(li);

    const form = document.createElement("form");
    form.setAttribute('id', 'create_form');
    form.appendChild(ul);

    document.getElementById('content').innerHTML = form.outerHTML;

};

// Fetch and display records
let editRecord = async (url) => {

    document.getElementById('content').innerHTML = '<form>';

    const record = await _fetch(`${apiUrl}${url}`)
        .then(response => response.json());

    // #content
    const ul = document.createElement("ul");

    for ([key, value] of Object.entries(record)) {
        const li = document.createElement("li");
        if(key == 'id') {
            li.innerHTML = `${key}: ${value}`;
        } else {
            if(value === null) {
                li.innerHTML = `${key} <input type="text" name="${key}" value="" />`;
            } else {
                li.innerHTML = `${key} <input type="text" name="${key}" value="${value}" />`;
            }

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

let submitForm = async (form_id) => {

    // Prevent the form from submitting.
    event.preventDefault();

    try {
        // Set url for submission and collect data.
        const url = apiUrl;
        const formData = new FormData(document.getElementById(form_id));
        // Build the data object.
        // const data = {};
        // formData.forEach((value, key) => (data[key] = value));
        // Log the data.
        // console.log(data);

        var json = JSON.stringify(Object.fromEntries(formData));

        //  var accessToken = localStorage.getItem('accessToken');

        //   var request = new XMLHttpRequest();
        // request.open("PUT", url + window.location.pathname);
        // request.setRequestHeader('X-Authorization', 'Bearer ' + accessToken);
        // request.send(json);

        if(form_id == 'create_form') {
                const response = await _fetch(url + window.location.pathname, {
                    method: "POST",
                    body: json
                });
                console.log(response);
            }

if(form_id == 'edit_form') {
        const response = await _fetch(url + window.location.pathname, {
            method: "PUT",
            body: json
        });
    }

        if (response.ok) {
            // Go back to read view
            getRecord(window.location.pathname);
        } else {
            // Display errors
            const responseError = await response.json();
            // code 1013 === validation error
            if (responseError.code == 1013) {
                const validationErrors = responseError.details || {};
                console.log(validationErrors);
                for ([key, value] of Object.entries(validationErrors)) {
                    const input = document.querySelector(`[name='${key}']`);
                    const span = document.createElement("span");
                    span.style.color = "red";
                    span.textContent  = value;
                    input.parentElement.appendChild(span);
                }
            }

            if (responseError.code == 9999) {
                const validationErrors = responseError.message || {};
                console.log(validationErrors);
            }
        }
    } catch (err) {
        throw err;
    }
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
        _fetch = async (url, options = {}) => {
            try {
                const response = await fetch(url, {
                    headers: {
                        "X-Authorization": `Bearer ${accessToken}`
                    },
                    ...options
                });
                // const json = response.json();
                // // Handle error
                // if (!response.ok) {
                //     throw new Error(json.message || "");
                // }
                // return json;

                return response;
            } catch (err) {
                throw err;
            }
        };

        getOpenapi();

    }

};