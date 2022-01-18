
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
        li.innerHTML = `/<a href="#" onclick="getRecords('${`/records/${subject}`}')">${subject}</a>`;
        current_path.appendChild(li);
    }

    const subjectId = urlSegments[3];
    if (subjectId) {
        var li = document.createElement("li");
        li.innerHTML = `/<a href="#" onclick="getRecord('${`/records/${subject}/${subjectId}`}')">${subjectId}</a>`;
        current_path.appendChild(li);
    }

    const join = urlSegments[4];
    if (join) {
        var li = document.createElement("li");
        li.innerHTML = `/<a href="#" onclick="getRecords('${`/records/${subject}/${subjectId}/${join}`}')">${join}</a>`;
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
    // Reset #msg
    displayMsg();

    // #content
    const paths = [];
    for ([key, value] of Object.entries(openapi.paths)) {
        paths.push(key);
    }

    const ul = document.createElement("ul");

    paths.sort();
    paths.forEach(outputPaths);

    function outputPaths(path) {
        const li = document.createElement("li");
        li.innerHTML = `<a href="#" onclick="getRecords('${path}')">${path}</a>`;
        ul.appendChild(li);
    }

    document.getElementById('content').innerHTML = ul.outerHTML;

    /*
    const ul = document.createElement("ul");
    for ([key, value] of Object.entries(openapi.paths)) {
        const li = document.createElement("li");
        li.innerHTML = `<a href="#" onclick="getRecords('${key}')">${key}</a>`;
        ul.appendChild(li);
    }
    document.getElementById('content').innerHTML = ul.outerHTML;
    */

    // #raw
    const raw = JSON.stringify(openapi, undefined, 4);
    document.getElementById('raw').innerHTML = raw;

    // #current_path
    // const current_path = document.getElementById("current_path");
    // if (current_path.childNodes[2]) current_path.removeChild(current_path.childNodes[2]);
    // if (current_path.childNodes[3]) current_path.removeChild(current_path.childNodes[3]);

    // url bar
    window.history.replaceState(
        {},
        document.title,
        `${location.protocol}//${location.host}`
    );

    // #current_path
    updatePath(location.pathname);
};

// Fetch and display records
let getRecords = async (url) => {
    // Reset #msg
    displayMsg();

    const urlSegments = url.split("/");

    //const records = await _fetch(`${apiUrl}${fetchUrl}?filter=name,cs,test`)
    const records = await _fetch(`${apiUrl}${url}`)
        .then(response => response.json())
        .then(response => response.records);

    // #content
    const table = document.createElement("table");
    table.classList.add('pure-table');
    table.classList.add('pure-table-bordered');

    var thead = document.createElement("thead");
    thead.innerHTML = `<tr><td></td><td></td><td class="text-right"><button class="pure-button pure-bg-dark" onclick="navigate('back')">BACK</button><button class="pure-button pure-bg-dark" onclick="createRecord('${url}')">CREATE</button></td></tr>`;
    table.appendChild(thead);

    var tbody = document.createElement("tbody");
    table.appendChild(tbody);

    for (record of records) {
        const tr = document.createElement("tr");
        let recordUrl = `${url}/${record.id}`;
        // For join records
        if (urlSegments.length > 4) {
            recordUrl = `/records/${urlSegments[4]}/${record.id}`;
        }
        tr.innerHTML = `<td><input type="checkbox"/></td><td><a href="#" onclick="getRecord('${recordUrl}')">${record.id}</a></td><td>${record.name}</td>`;
        tbody.appendChild(tr);
    }

    document.getElementById('content').innerHTML = table.outerHTML;

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

    // Reset #msg
    displayMsg();

    let subject = url.split("/")[2];

    if(subject.substr(subject.length - 1) != 's') {
        //subject = subject + 's';
    }

    let columnReferences = {};

    Object.entries(openapi.components.schemas[`read-${subject}`].properties).forEach(([k, v]) => {
        if (v["x-references"]) columnReferences[k] = v["x-references"];
    });

    let joinQuery = [... new Set(Object.values(columnReferences).map(v => v))].map(v => `join=${v}`).join("&");
    const record = await _fetch(`${apiUrl}${url}?${joinQuery}`)
        .then(response => response.json());

    // START - #content
    const card = document.createElement("div");
    card.classList.add('pure-form');
    card.classList.add('pure-form-aligned');

    for ([key, value] of Object.entries(record)) {

        const div = document.createElement("div");
        div.classList.add('pure-control-group');

        const label = document.createElement("label");
        label.setAttribute('for', key);
        label.innerHTML = key;
        div.appendChild(label);

        const span = document.createElement("span");

        // Display reference name
        if (columnReferences[key] && value) {

            if(columnReferences[key].substr(columnReferences[key].length - 1) != 's') {
                //columnReferences[key] = columnReferences[key] + 's';
            }

            span.innerHTML = `<a href="#" onclick="getRecord('${`/records/${columnReferences[key]}/${value.id}`}')">${value.name}</a>`;

        } else {

            span.innerHTML = value;

        }

        div.appendChild(span);
        card.appendChild(div);

    }

    const actions = document.createElement("div");
    actions.setAttribute('id', 'actions');

    const back_button = document.createElement("button");
    back_button.setAttribute('id', 'back_button');
    back_button.setAttribute('href', '/');
    back_button.innerHTML = 'BACK';
    back_button.classList.add("pure-button");
    back_button.classList.add("pure-bg-dark");
    actions.appendChild(back_button);

    const update_button = document.createElement("button");
    update_button.setAttribute('id', 'update_button');
    update_button.setAttribute('onclick', 'updateRecord("'+url+'")');
    update_button.innerHTML = 'UPDATE';
    update_button.classList.add("pure-button");
    update_button.classList.add("pure-bg-dark");
    actions.appendChild(update_button);

    const delete_button = document.createElement("button");
    delete_button.setAttribute('id', 'delete_button');
    delete_button.setAttribute('onclick', 'deleteRecord()');
    delete_button.innerHTML = 'DELETE';
    delete_button.classList.add("pure-button");
    delete_button.classList.add("pure-bg-red");
    actions.appendChild(delete_button);

    const recover_button = document.createElement("button");
    recover_button.setAttribute('id', 'recover_button');
    recover_button.setAttribute('onclick', 'recoverRecord()');
    recover_button.innerHTML = 'RECOVER';
    recover_button.classList.add("pure-button");
    recover_button.classList.add("pure-bg-green");
    actions.appendChild(recover_button);

    const archiveRecord = document.createElement("button");
    archiveRecord.setAttribute('id', 'archiveRecord');
    archiveRecord.setAttribute('onclick', 'archiveRecord()');
    archiveRecord.innerHTML = 'ARCHIVE';
    archiveRecord.classList.add("pure-button");
    archiveRecord.classList.add("pure-bg-orange");
    actions.appendChild(archiveRecord);

    const restoreRecord = document.createElement("button");
    restoreRecord.setAttribute('id', 'restoreRecord');
    restoreRecord.setAttribute('onclick', 'restoreRecord()');
    restoreRecord.innerHTML = 'RESTORE';
    restoreRecord.classList.add("pure-button");
    restoreRecord.classList.add("pure-bg-green");
    actions.appendChild(restoreRecord);

    card.appendChild(actions);

    // Related links
    var div = document.createElement("div");
    div.innerHTML = "<br /><b>RELATED DATA</b>";
    card.appendChild(div);

    const referenced = openapi.components.schemas[`read-${subject}`].properties.id["x-referenced"];
    const joins = referenced.reduce((acc, val) => {
        const x_y = val.split(".")[0];
        const x = x_y.split("_")[0];
        const y = x_y.split("_")[1];
        if (y && x == subject && !acc.includes(y)) acc.push(y);
        return acc;
    }, []);

    for (join of joins) {
        var div = document.createElement("div");
        div.innerHTML = `<a href="#" onclick="getRecords('${`${url}/${join}`}')">${`${url}/${join}`}</a>`;
        card.appendChild(div);
    }

    document.getElementById('content').innerHTML = card.outerHTML;
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

    // Reset #msg
    displayMsg();

    const urlSegments = url.split("/");

    // #content
    let subject = url.split("/")[2];
    // For join records
    if (urlSegments.length > 4) {
        subject = urlSegments[4];
    }
    setForm("create_form", subject);
};

// Fetch and display records
let updateRecord = async (url) => {
    // Reset #msg
    displayMsg();

    const record = await _fetch(`${apiUrl}${url}`)
        .then(response => response.json());

    // #content
    const subject = url.split("/")[2];
    if(subject.substr(subject.length - 1) != 's') {
        //subject = subject + 's';
    }
    setForm("update_form", subject, record);
};

let setForm = async (formId, subject, record = null) => {

    const form = document.createElement("form");
    form.setAttribute('id', formId);
    form.classList.add('pure-form');
    form.classList.add('pure-form-aligned');

    const fieldset = document.createElement("fieldset");
    form.appendChild(fieldset);

    const fields = openapi['components']['schemas']['read-'+subject]['properties'];

    // #raw
    const raw = JSON.stringify(fields, undefined, 4);
    document.getElementById('raw').innerHTML = raw;

    for ([key, field] of Object.entries(fields)) {

        const div = document.createElement("div");
        div.classList.add('pure-control-group');

        const label = document.createElement("label");
        label.setAttribute('for', key);
        label.innerHTML = key;
        div.appendChild(label);

        var input = document.createElement("input");

        // Change to select
        if (field["x-references"]) {

            input = document.createElement("select");

            // Collect options
            const optionRecords = await _fetch(`${apiUrl}/records/${field["x-references"]}`)
                .then(response => response.json())
                .then(response => response.records);
            // Append options
            var option = document.createElement("option");
                option.value = "";
                option.text = "Please select";
                input.appendChild(option);
            for (const optionRecord of optionRecords) {
                var option = document.createElement("option");
                option.value = optionRecord.id;
                option.text = optionRecord.name;
                // Select default option
                if (record && record[key] == option.value) {
                    option.setAttribute("selected", "selected");
                }
                input.appendChild(option);
            }

        }

        input.setAttribute('id', key);
        input.setAttribute('name', key);
        input.setAttribute('type', 'text');

        // Update
        if (record) {
            if (key == 'id' || key == 'admin_person_id') {
                input.setAttribute('readonly', true);
            }

            if (record[key]) {
                input.setAttribute('value', `${record[key]}`);
            } else {
                input.setAttribute('value', null);
            }
        }
        // Create
        else {
            if (key == 'id' || key == 'admin_person_id') {
                continue;
            }
        }

        div.appendChild(input);

        const span = document.createElement("span");
        span.classList.add('pure-form-message-inline');
        div.appendChild(span);

        fieldset.appendChild(div);

    }

    const div = document.createElement("div");
    div.classList.add('pure-control-group');

    div.innerHTML = `<a class="pure-button pure-bg-dark" href="/">CANCEL</a><button class="pure-button pure-bg-green" onclick="submitForm('${formId}')">${record ? 'UPDATE' : 'CREATE'}</button>`;
    fieldset.appendChild(div);

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

        // var accessToken = localStorage.getItem('accessToken');

        // var request = new XMLHttpRequest();
        // request.open("PUT", url + window.location.pathname);
        // request.setRequestHeader('X-Authorization', 'Bearer ' + accessToken);
        // request.send(json);

        if(form_id == 'create_form') {
            var response = await _fetch(url + window.location.pathname, {
                method: "POST",
                body: json
            });
        }

        if(form_id == 'update_form') {
            var response = await _fetch(url + window.location.pathname, {
                method: "PUT",
                body: json
            });
        }

        if (response.ok) {

            const responseJson = await response.json();
            console.log(responseJson);

            if(form_id == 'create_form') {
                var returnPath = window.location.pathname + '/' + responseJson;
                var successMsg = `[${response.status}] Record has been created.`;
                // For join records
                if (location.pathname.split("/").length > 4) {
                    var returnPath = location.pathname;
                    getRecords(returnPath);
                    return;
                }
            }

            if(form_id == 'update_form') {
                var returnPath = window.location.pathname;
                var successMsg = `[${response.status}] Record has been updated.`;
            }

            if(form_id == 'delete_form') {
                var returnPath = window.location.pathname;
                var successMsg = `[${response.status}] Record has been deleted.`;
            }

            // Go back to read view
            getRecord(returnPath);

            displayMsg(successMsg);

        } else {

            // Remove previous error msgs
            document.querySelectorAll(".error_msg")
                .forEach(el => el.remove());
            // Reset #msg
            displayMsg();

            // Display errors
            const responseError = await response.json();

            // code 1013 === validation error
            if (responseError.code == 1013) {
                const validationErrors = responseError.details || {};
                console.log(validationErrors);
                for ([key, value] of Object.entries(validationErrors)) {
                    const input = document.querySelector(`[name='${key}']`);
                    const span = document.createElement("span");
                    span.classList.add("error_msg");
                    span.style.color = "red";
                    span.textContent  = value;
                    input.parentElement.appendChild(span);
                }
            }

            // code 9999 === unknown error
            if (responseError.code == 9999) {
                const validationErrors = responseError.message || {};
                console.log(validationErrors);

                displayMsg(`[${response.status}] ${responseError.message}`, "red");
            }

        }

    } catch (err) {

        throw err;

    }

}


let deleteRecord = async () => {

    // Prevent the form from submitting.
    event.preventDefault();

    try {

        // Set url for submission and collect data.
        const url = apiUrl;

        var response = await _fetch(url + window.location.pathname, {
            method: "DELETE"
        });

        if (response.ok) {

            const responseJson = await response.json();
            console.log(responseJson);

            var returnPath = window.location.pathname;
            var successMsg = `[${response.status}] Record has been deleted.`;

            // Go back to read view
            getRecord(returnPath);
            displayMsg(successMsg);

        } else {

            // Remove previous error msgs
            document.querySelectorAll(".error_msg")
                .forEach(el => el.remove());
            // Reset #msg
            displayMsg();

            // Display errors
            const responseError = await response.json();

            // code 1013 === validation error
            if (responseError.code == 1013) {
                const validationErrors = responseError.details || {};
                console.log(validationErrors);
                for ([key, value] of Object.entries(validationErrors)) {
                    const input = document.querySelector(`[name='${key}']`);
                    const span = document.createElement("span");
                    span.classList.add("error_msg");
                    span.style.color = "red";
                    span.textContent  = value;
                    input.parentElement.appendChild(span);
                }
            }

            // code 9999 === unknown error
            if (responseError.code == 9999) {
                const validationErrors = responseError.message || {};
                console.log(validationErrors);

                displayMsg(`[${response.status}] ${responseError.message}`, "red");
            }

        }

    } catch (err) {

        throw err;

    }

}

// The 3 methods below can be merged together?

let recoverRecord = async () => {
    // Prevent the form from submitting.
    event.preventDefault();

    try {
        // Set url for submission and collect data.
        const url = apiUrl;
        var response = await _fetch(url + window.location.pathname + "/recover", {
            method: "PUT"
        });

        if (response.ok) {
            await response.json();
            var returnPath = window.location.pathname;
            var successMsg = `[${response.status}] Record has been recovered.`;
            // Go back to read view
            getRecord(returnPath);
            displayMsg(successMsg);
        } else {
            // Reset #msg
            displayMsg();
            // Display errors
            const responseError = await response.json();
            // code 9999 === unknown error
            if (responseError.code == 9999) {
                displayMsg(`[${response.status}] ${responseError.message}`, "red");
            }
        }
    } catch (err) {
        throw err;
    }
}

let archiveRecord = async () => {
    // Prevent the form from submitting.
    event.preventDefault();

    try {
        // Set url for submission and collect data.
        const url = apiUrl;
        var response = await _fetch(url + window.location.pathname + "/archive", {
            method: "PUT"
        });

        if (response.ok) {
            await response.json();
            var returnPath = window.location.pathname;
            var successMsg = `[${response.status}] Record has been archived.`;
            // Go back to read view
            getRecord(returnPath);
            displayMsg(successMsg);
        } else {
            // Reset #msg
            displayMsg();
            // Display errors
            const responseError = await response.json();
            // code 9999 === unknown error
            if (responseError.code == 9999) {
                displayMsg(`[${response.status}] ${responseError.message}`, "red");
            }
        }
    } catch (err) {
        throw err;
    }
}

let restoreRecord = async () => {
    // Prevent the form from submitting.
    event.preventDefault();

    try {
        // Set url for submission and collect data.
        const url = apiUrl;
        var response = await _fetch(url + window.location.pathname + "/restore", {
            method: "PUT"
        });

        if (response.ok) {
            await response.json();
            var returnPath = window.location.pathname;
            var successMsg = `[${response.status}] Record has been restored.`;
            // Go back to read view
            getRecord(returnPath);
            displayMsg(successMsg);
        } else {
            // Reset #msg
            displayMsg();
            // Display errors
            const responseError = await response.json();
            // code 9999 === unknown error
            if (responseError.code == 9999) {
                displayMsg(`[${response.status}] ${responseError.message}`, "red");
            }
        }
    } catch (err) {
        throw err;
    }
}

let displayMsg = (msg = null, color = "green") => {
    document.querySelector("#msg").innerHTML = "";
    if (msg) {
        const span = document.createElement("span");
        span.style.color = color;
        span.textContent = msg;
        document.querySelector("#msg").appendChild(span);
    }
};

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
                        'X-Authorization': `Bearer ${accessToken}`
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