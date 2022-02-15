
var authUrl = 'https://auth.ud.ax/authorize'; // url of 'auth.php' from php-api-auth
var clientId = 'gfi2y7zSyKYcvSDBELaKTfOC0MkLgDk8'; // client id as defined in php-api-auth
var audience = 'https://api.ud.ax'; // api audience as defined in php-api-auth
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
        li.innerHTML = `/<a href="#" onclick="navigateTo('${`/records/${subject}`}')">${subject}</a>`;
        current_path.appendChild(li);
    }

    const subjectId = urlSegments[3];
    if (subjectId) {
        var li = document.createElement("li");
        li.innerHTML = `/<a href="#" onclick="navigateTo('${`/records/${subject}/${subjectId}`}')">${subjectId}</a>`;
        current_path.appendChild(li);
    }

    const join = urlSegments[4];
    if (join) {
        var li = document.createElement("li");
        li.innerHTML = `/<a href="#" onclick="navigateTo('${`/records/${subject}/${subjectId}/${join}`}')">${join}</a>`;
        current_path.appendChild(li);
    }

};

// Fetch userinfo
let userinfo = null;
let activeAccount = null;

let getUserinfo = async () => {
    userinfo = await _fetch(`${apiUrl}/userinfo`)
        .then(response => response.json());
    console.log("userinfo", userinfo);
    localStorage.setItem("userinfo", JSON.stringify(userinfo));
    // document.getElementById('userinfo').innerHTML = JSON.stringify(userinfo);
    // //document.getElementById('menu-link-active-user').innerHTML = userinfo.admin_persons_id;
    // document.getElementById('menu-link-active-user').innerHTML = userinfo.email_address;
    // if(typeof userinfo.record_admin_firms_id != "undefined") {
    //   document.getElementById('menu-link-active-firm').innerHTML = userinfo.record_admin_firms_id;
    // }

    // START - Accounts menu link
    // Active account
    activeAccount = userinfo.accounts.find(v => v.active);
    if (activeAccount) {
        //document.querySelector("#menu-link-active-account").innerHTML = `${activeAccount.firm_id.name} | ${activeAccount.person_id.name}`;
        document.querySelector("#menu-link-active-account").innerHTML = `${activeAccount.account_name}`;
    }
    // Accounts dropdown
    document.querySelector("#menu-link-accounts-dropdown").innerHTML = "";
    for (const account of (userinfo.accounts || [])) {
        if (account.active) continue;
        var li = document.createElement("li");
        li.classList.add("pure-menu-item");
        var a = document.createElement("a");
        a.classList.add("pure-menu-link");
        a.classList.add("accounts-dropdown-item");
        a.dataset.account_id = account.id;
        a.innerHTML = `${account.account_name}`;
        li.appendChild(a);
        document.querySelector("#menu-link-accounts-dropdown").appendChild(li);
    }
    const onAccountClick = async (e) => {
        const account_id = e.target.dataset.account_id;
        if (account_id) {
            await _fetch(`${apiUrl}/userinfo/active`, {
                method: "PUT",
                body: JSON.stringify({ account_id })
            }).then(response => response.json());
            await getUserinfo();
            changeSubdomain(activeAccount.subdomain);
        }
    };
    document.querySelectorAll(".accounts-dropdown-item")
        .forEach(v => v.addEventListener("click", onAccountClick));
    // END - Accounts menu link
};

let subdomainCheck = async () => {
    const subdomain = location.host.split(".").length > 2 ? location.host.split(".")[0] : null;
    // Check if subdomain matches with active account's subdomain
    if (activeAccount && subdomain != activeAccount.subdomain) {
        // If not matched, search for other user's accounts
        let account = userinfo.accounts.find(v => subdomain && v.subdomain == subdomain);
        // If an account is found, switch into this account
        if (account) {
            await _fetch(`${apiUrl}/userinfo/active`, {
                method: "PUT",
                body: JSON.stringify({ account_id: account.id })
            }).then(response => response.json());
        }
        // If no account is found, use active account
        else {
            account = activeAccount;
        }
        // Redirect to account's subdomain
        changeSubdomain(account.subdomain);
        // Not matched, needs redirect
        return false;
    }
    // Matched OR no subdomain
    return true;
};
let changeSubdomain = (subdomain = null) => {
    hostSegments = location.host.split(".");
    // Remove subdomain in url
    if (hostSegments.length > 2) hostSegments.shift();
    // Add new subdomain in url
    if (subdomain) hostSegments.unshift(subdomain);
    console.log(`${location.protocol}//${hostSegments.join(".")}${location.pathname}`);
    location.replace(`${location.protocol}//${hostSegments.join(".")}${location.pathname}`);
    // Fix - infinite loop if no account is found
    setTimeout(() => location.reload(), 500);
};

// Fetch openapi
let openapi = null;
let getOpenapi = async () => {
    openapi = await _fetch(`${apiUrl}/openapi`)
        .then(response => response.json());
    // listPaths();
};

// Display openapi
let listPaths = () => {
    // #content
    const paths = [];
    for ([key, value] of Object.entries(openapi.paths)) {
        // Collect list paths
        if (value.get && value.get.operationId.includes("list")) {
            // Remove relationship paths
            const subject = value.get.description.split(" ")[1];
            if (subject.match(/^([a-z]+)$/) || ["pending_approvals"].includes(subject)) {
                paths.push(key);
            }
        }
    }

    const ul = document.createElement("ul");

    paths.sort();
    paths.forEach(outputPaths);

    function outputPaths(path) {
        const li = document.createElement("li");
        li.innerHTML = `<a href="#" onclick="navigateTo('${path}')">${path}</a>`;
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

    // #current_path
    updatePath(location.pathname);
};

// Fetch and display records
let getRecords = async (url) => {
    const urlSegments = url.split("/");

    const records = await _fetch(`${apiUrl}${url}`)
        .then(response => response.json())
        .then(response => response.records);

    if (urlSegments[2] === "pending_approvals") {
        listPendingApprovals(records);
        return;
    }

    // #content
    const table = document.createElement("table");
    table.classList.add('pure-table');
    table.classList.add('pure-table-bordered');

    var thead = document.createElement("thead");
    thead.innerHTML = `<tr><td></td><td class="text-right"><button class="pure-button pure-bg-link" onclick="navigateTo('/')">BACK</button><button class="pure-button pure-bg-dark" onclick="navigateTo('${url}/create')">CREATE</button></td></tr>`;
    table.appendChild(thead);

    var tbody = document.createElement("tbody");
    table.appendChild(tbody);

    for (const record of records) {
        const tr = document.createElement("tr");
        let recordUrl = `${url}/${record.id}`;
        // For join records
        if (urlSegments.length > 4) {
            recordUrl = `/records/${urlSegments[4]}/${record.id}`;
        }
        tr.innerHTML = `<td><a href="#" onclick="navigateTo('${recordUrl}')">${record.id}</a></td><td>${record.name}</td>`;
        tbody.appendChild(tr);
    }

    document.getElementById('content').innerHTML = table.outerHTML;

    // #raw
    const raw = JSON.stringify(records, undefined, 4);
    document.getElementById('raw').innerHTML = raw;

    // #current_path
    updatePath(url);
};

let listPendingApprovals = (records) => {
    // #content
    const table = document.createElement("table");
    table.classList.add('pure-table');
    table.classList.add('pure-table-bordered');
    var thead = document.createElement("thead");
    thead.innerHTML = `<tr><td></td><td class="text-right" colspan="100"><button class="pure-button pure-bg-link" onclick="navigateTo('/')">BACK</button></td></tr>`;
    table.appendChild(thead);
    var tbody = document.createElement("tbody");
    table.appendChild(tbody);
    for (const record of records) {
        const tr = document.createElement("tr");
        for ([key, value] of Object.entries(record)) {
            const td = document.createElement("td");
            if (key == "id") {
                td.innerHTML = `<a href="#" class="populate-pending-approval" data-route="${record.route}" data-method="${record.method}" data-data='${record.data}'>${value}</a>`;
            } else {
                td.innerHTML = value;
            }
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    }
    document.getElementById('content').innerHTML = table.outerHTML;
    const populatePendingApproval = (e) => {
        const data = e.target.dataset.data;
        localStorage.setItem("form_values", data);
        const route = e.target.dataset.route;
        const method = e.target.dataset.method;
        const redirect = `${route}/${method == 'POST' ? "create" : "update"}`
        navigateTo(redirect);
    };
    document.querySelectorAll(".populate-pending-approval")
        .forEach(v => v.addEventListener("click", populatePendingApproval));

    // #raw
    const raw = JSON.stringify(records, undefined, 4);
    document.getElementById('raw').innerHTML = raw;

    // #current_path
    updatePath(location.pathname);
};

// Fetch and display related records
let getRelatedRecords = async (subject, subjectId, join) => {
    try {
        const path = `/records/${subject}/${subjectId}/${join}`;

        const response = await Promise.all([
            _fetch(`${apiUrl}/records/${join}`)
                .then(response => response.json())
                .then(response => response.records),
            _fetch(`${apiUrl}${path}`)
                .then(response => response.json())
                .then(response => response.records)
        ]);
        const records = response[0];
        const relatedRecords = response[1];

        // #content
        const table = document.createElement("table");
        table.classList.add('pure-table');
        table.classList.add('pure-table-bordered');

        const thead = document.createElement("thead");
        thead.innerHTML = `<tr><td><input type="checkbox" class="cb-attach-detach-all" /></td><td></td><td class="text-right"><button class="pure-button pure-bg-dark" onclick="navigateTo('/records/${subject}/${subjectId}')">BACK</button><button class="pure-button pure-bg-dark" onclick="navigateTo('${path}/create')">CREATE</button></td></tr>`;
        table.appendChild(thead);

        const tbody = document.createElement("tbody");
        table.appendChild(tbody);

        for (const record of records) {
            const tr = document.createElement("tr");
            tr.innerHTML = `<td><input type="checkbox" value="${record.id}" class="cb-attach-detach" ${!!relatedRecords.find(v => v.id == record.id) ? 'checked' : ''} /></td><td><a href="#" onclick="navigateTo('/records/${join}/${record.id}')">${record.id}</a></td><td>${record.name}</td>`;
            tbody.appendChild(tr);
        }

        document.getElementById('content').innerHTML = table.outerHTML;

        // Update batch checkbox
        const syncBatchCheckbox = function(records) {
            const checkedIds = [];
            for (checkbox of document.querySelectorAll(".cb-attach-detach")) {
                if (checkbox.checked) checkedIds.push(checkbox.value);
            }
            const isAllChecked = records.reduce((acc, record) => {
                if (acc) acc = !!checkedIds.find(checkedId => checkedId == record.id);
                return acc;
            }, true);
            if (isAllChecked) {
                document.querySelector(".cb-attach-detach-all").checked = true;
            } else {
                document.querySelector(".cb-attach-detach-all").checked = false;
            }
        };
        syncBatchCheckbox(records);

        // Add event listeners
        document.querySelector(".cb-attach-detach-all").addEventListener("click", function() {
            // Only attach detached records and vice versa
            const attachDetachIds = [];

            if (this.checked) {
                document.querySelectorAll(".cb-attach-detach")
                    .forEach(el => {
                        if (!el.checked) {
                            el.checked = true;
                            attachDetachIds.push(el.value);
                        }
                    });
            } else {
                document.querySelectorAll(".cb-attach-detach")
                    .forEach(el => {
                        if (el.checked) {
                            el.checked = false;
                            attachDetachIds.push(el.value);
                        }
                    });
            }
            // console.log(attachDetachIds);
            attachOrDetachRecord(this.checked ? "attach" : "detach", subject, subjectId, join, attachDetachIds.join(","));
        });
        document.querySelectorAll(".cb-attach-detach")
            .forEach(el => {
                el.addEventListener("click", function() {
                    // console.log(this.checked, this.value);
                    syncBatchCheckbox(records);
                    attachOrDetachRecord(this.checked ? "attach" : "detach", subject, subjectId, join, this.value);
                });
            });

        // #raw
        const raw = JSON.stringify(records, undefined, 4);
        document.getElementById('raw').innerHTML = raw;

        // #current_path
        updatePath(path);
    } catch (err) {
        throw err;
    }
};

// Fetch and display records
let getRecord = async (url) => {
    let subject = url.split("/")[2];
    let subjectId = url.split("/")[3];

    if(subject.substr(subject.length - 1) != 's') {
        //subject = subject + 's';
    }

    let columnReferences = {};

    if (openapi.components.schemas[`read-${subject}`]) {
        Object.entries(openapi.components.schemas[`read-${subject}`].properties).forEach(([k, v]) => {
            if (v["x-references"]) columnReferences[k] = v["x-references"];
        });
    }

    // Join includes column references, logs, ...
    let joins = [
        ... new Set([
            ...Object.values(columnReferences).map(v => v),
        ]),
        // "logs"
    ];

    let joinQuery = joins.map(v => `join=${v}`).join("&");
    const record = await _fetch(`${apiUrl}${url}?${joinQuery}`)
        .then(response => response.json());

    // START - #content
    const card = document.createElement("div");
    card.classList.add('pure-form');
    card.classList.add('pure-form-aligned');

    for ([key, value] of Object.entries(record)) {

        // Hide hasMany relationships
        if (joins.includes(key)) continue;

        const div = document.createElement("div");
        div.classList.add('pure-control-group');

        const label = document.createElement("label");
        label.setAttribute('for', key);
        label.classList.add('pure-bg-light');

        var label_text = key.split('_');
        label_text = label_text.join(' ');
        label.innerHTML = label_text.toUpperCase();

        div.appendChild(label);

        const span = document.createElement("span");

        // Display reference name
        if (columnReferences[key] && value) {

            if(columnReferences[key].substr(columnReferences[key].length - 1) != 's') {
                //columnReferences[key] = columnReferences[key] + 's';
            }

            span.innerHTML = `<a href="#" onclick="navigateTo('${`/records/${columnReferences[key]}/${value.id}`}')">${value.name}</a>`;

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
    back_button.classList.add("pure-bg-link");
    back_button.setAttribute("onclick", `navigateTo('/records/${subject}')`);
    actions.appendChild(back_button);

    if (!record.archived && !record.deleted) {
        const update_button = document.createElement("button");
        update_button.setAttribute('id', 'update_button');
        update_button.setAttribute('onclick', `navigateTo('${url}/update')`);
        update_button.innerHTML = 'UPDATE';
        update_button.classList.add("pure-button");
        update_button.classList.add("pure-bg-dark");
        actions.appendChild(update_button);
    }

    if (!record.deleted) {
        if (record.archived) {
            const restoreRecord = document.createElement("button");
            restoreRecord.setAttribute('id', 'restoreRecord');
            restoreRecord.setAttribute('onclick', 'restoreRecord()');
            restoreRecord.innerHTML = 'RESTORE';
            restoreRecord.classList.add("pure-button");
            restoreRecord.classList.add("pure-bg-yellow");
            actions.appendChild(restoreRecord);
        } else {
            const archiveRecord = document.createElement("button");
            archiveRecord.setAttribute('id', 'archiveRecord');
            archiveRecord.setAttribute('onclick', 'archiveRecord()');
            archiveRecord.innerHTML = 'ARCHIVE';
            archiveRecord.classList.add("pure-button");
            archiveRecord.classList.add("pure-bg-orange");
            actions.appendChild(archiveRecord);
        }
    }

    if (record.deleted) {
        const recover_button = document.createElement("button");
        recover_button.setAttribute('id', 'recover_button');
        recover_button.setAttribute('onclick', 'recoverRecord()');
        recover_button.innerHTML = 'RECOVER';
        recover_button.classList.add("pure-button");
        recover_button.classList.add("pure-bg-black");
        actions.appendChild(recover_button);
    } else {
        const delete_button = document.createElement("button");
        delete_button.setAttribute('id', 'delete_button');
        delete_button.setAttribute('onclick', 'deleteRecord()');
        delete_button.innerHTML = 'DELETE';
        delete_button.classList.add("pure-button");
        delete_button.classList.add("pure-bg-red");
        actions.appendChild(delete_button);
    }

    card.appendChild(actions);

    // Related links
    var div = document.createElement("div");
    div.innerHTML = "<br /><b>RELATED DATA</b>";
    card.appendChild(div);

    if (openapi.components.schemas[`read-${subject}`]) {
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
            div.innerHTML = `<a href="#" onclick="navigateTo('${`${url}/${join}`}')">${`${url}/${join}`}</a>`;
            // div.innerHTML = `<a href="#" onclick="getRelatedRecords('${subject}', '${subjectId}', '${join}')">${`${url}/${join}`}</a>`;
            card.appendChild(div);
        }
    }

    // Logs
    var div = document.createElement("div");
    div.innerHTML = "<br /><b>LOGS</b>";
    card.appendChild(div);
    let logs = await _fetch(`${apiUrl}/records/http_requests?filter=route,cs,${location.pathname}&filter=method,neq,GET`)
        .then(response => response.json())
        .then(response => response.records);
    if (logs.length) {
        // Order by ID desc
        logs = logs.sort((a, b) => b.id - a.id);
        var table = document.createElement("table");
        var tbody = document.createElement("tbody");
        for (log of logs) {
            var tr = document.createElement("tr");
            tr.innerHTML = `<tr><td>[${log.method}] - ${log.route}</td></tr>`;
            tbody.appendChild(tr);
        }
        table.appendChild(tbody);
        card.appendChild(table);
    }

    document.getElementById('content').innerHTML = card.outerHTML;
    // END - #content

    // #raw
    const raw = JSON.stringify(record, undefined, 4);
    document.getElementById('raw').innerHTML = raw;

    // #current_path
    updatePath(url);
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
    setForm("create", subject);

    // #current_path
    updatePath(url);
};

// Fetch and display records
let updateRecord = async (url) => {
    // Reset #msg
    displayMsg();

    const subject = url.split("/")[2];
    const subjectId = url.split("/")[3];

    const record = await _fetch(`${apiUrl}/records/${subject}/${subjectId}`)
        .then(response => response.json());

    // #content
    if(subject.substr(subject.length - 1) != 's') {
        //subject = subject + 's';
    }
    setForm("update", subject, record);

    // #current_path
    updatePath(url);
};

let setForm = async (mode, subject, record = null) => {
    // Pre-populate form with default values
    if (localStorage.getItem("form_values")) {
        record = JSON.parse(localStorage.getItem("form_values"));
        localStorage.removeItem("form_values");
    }

    if (record) {
        for ([key, value] of Object.entries(record)) {
            // Convert objects to json string
            if (typeof value === "object") {
                record[key] = JSON.stringify(value);
            }
            // Remove null
            if (value == null) delete record[key];
        }
    }

    if (subject === "accounts") {
        setAccountsForm(record);
        return;
    }

    const form = document.createElement("form");
    form.setAttribute('id', `${mode}_form`);
    form.classList.add('pure-form');
    form.classList.add('pure-form-aligned');

    const fieldset = document.createElement("fieldset");
    form.appendChild(fieldset);

    const fields = openapi['components']['schemas']['read-'+subject]['properties'];

    // #raw
    const raw = JSON.stringify(fields, undefined, 4);
    document.getElementById('raw').innerHTML = raw;

    const hiddenFields = ["admin", "archived", "deleted"];

    for ([key, field] of Object.entries(fields)) {

        if (hiddenFields.includes(key)) continue;

        const div = document.createElement("div");
        div.classList.add('pure-control-group');
        div.classList.add('pure-bg-light');

        const label = document.createElement("label");
        label.setAttribute('for', key);

        var label_text = key.split('_');
        label_text = label_text.join(' ');
        label.innerHTML = label_text.toUpperCase();

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

        // Disable restricted columns
        if (mode == 'update' && field.admin && record && !!!record.admin) {
            input.setAttribute('disabled', true);
        }

        // Hide fields on create
        if (mode == 'create' && ["id"].includes(key)) {
            continue;
        }

        if (record) {
            if (key == 'id') {
                input.setAttribute('disabled', true);
            }
            if (record[key]) {
                input.setAttribute('value', `${record[key]}`);
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

    div.innerHTML = `<a class="pure-button pure-bg-link" href="#" onclick="navigateTo('${location.pathname}')">CANCEL</a><button class="pure-button pure-bg-green" onclick="submitForm('${mode}_form')">${mode == 'update' ? 'UPDATE' : 'CREATE'}</button>`;
    fieldset.appendChild(div);

    document.getElementById('content').innerHTML = form.outerHTML;

    // Google map places input
    if (["locations"].includes(subject)) {
        var gmapInput = document.createElement("input");
        gmapInput.style = "width:100%";
        var gmapAutocomplete = new google.maps.places.Autocomplete(gmapInput);
        gmapAutocomplete.addListener("place_changed", () => {
            const place = gmapAutocomplete.getPlace();
            console.log(place);
            var map = {
                street_number: ["street_number"],
                street_name: ["street_address", "route"],
                city: [
                    "locality",
                    "sublocality",
                    "sublocality_level_1",
                    "sublocality_level_2",
                    "sublocality_level_3",
                    "sublocality_level_4"
                ],
                region: [
                    "administrative_area_level_1",
                    "administrative_area_level_2",
                    "administrative_area_level_3",
                    "administrative_area_level_4",
                    "administrative_area_level_5"
                ],
                country: ["country"],
                // code: ["postal_code"]
            };
            // Name
            document.querySelector("input[name='name']").value = place.name || "";
            // Latitude/Longitude
            if (place.geometry && place.geometry.location) {
                var input = document.querySelector("input[name='latitude']");
                if (input) input.value = place.geometry.location.lat();
                var input = document.querySelector("input[name='longitude']");
                if (input) input.value = place.geometry.location.lng();
            }
            // Address Components
            for ([key, types] of Object.entries(map)) {
                for (type of types) {
                    const addressComponent = place.address_components.find(v => v.types.includes(type));
                    if (addressComponent) {
                        var input = document.querySelector(`input[name='${key}']`)
                        if (input) input.value = addressComponent.long_name;
                    }
                }
            }
        });
        document.querySelector("#gmap").innerHTML = "";
        document.querySelector("#gmap").appendChild(gmapInput);
    }
};

var generateSelect = async (inputName, inputLabel, source, selected, appendTo) => {
    console.log(selected)
    var div = document.createElement("div");
    div.classList.add('pure-control-group');
    div.classList.add('pure-bg-light');

    var label = document.createElement("label");
    label.setAttribute('for', inputName);
    label.innerHTML = inputLabel;
    div.appendChild(label);

    var input = document.createElement("select");
    input.setAttribute('id', inputName);
    input.setAttribute('name', inputName);
    div.appendChild(input);

    var option = document.createElement("option");
    option.value = "";
    option.text = "Please select";
    input.appendChild(option);

    var records = await _fetch(`${apiUrl}/records/${source}`)
        .then(response => response.json())
        .then(response => response.records);
    records.forEach(v => {
        var option = document.createElement("option");
        option.value = v.id;
        option.text = v.name;
        // Set current user as default option
        if (option.value == selected) option.setAttribute("selected", "selected");
        input.appendChild(option);
    });

    appendTo.appendChild(div);
};

var generateDataList = async (inputName, inputLabel, source, selected, appendTo) => {
    var div = document.createElement("div");
    div.classList.add('pure-control-group');
    div.classList.add('pure-bg-light');

    var label = document.createElement("label");
    label.setAttribute('for', inputName);
    label.innerHTML = inputLabel;
    div.appendChild(label);

    var input = document.createElement("input");
    input.setAttribute('id', inputName);
    input.setAttribute('name', inputName);
    input.setAttribute("list", `${inputName}-datalist`);
    div.appendChild(input);

    var datalist = document.createElement("datalist");
    datalist.setAttribute("id", `${inputName}-datalist`);
    var records = await _fetch(`${apiUrl}/records/${source}`)
        .then(response => response.json())
        .then(response => response.records);
    records.forEach(v => {
        var option = document.createElement("option");
        option.value = v.name;
        option.dataset.value = v.id;
        datalist.appendChild(option);
    });
    div.appendChild(datalist);

    appendTo.appendChild(div);

    const onSelect = (value, dataValue) => {
        var selected = document.querySelector(`#${inputName}-datalist option[value="${value}"]`);
        if (selected) {
            document.querySelector(`#${inputName}`).value = value;
            document.querySelector(`#${inputName}`).dataset.value = dataValue;
        }
    };
    setTimeout(() => {
        // Set default
        const record = records.find(v => v.id == selected);
        if (record) onSelect(record.name, record.id);
        document.querySelector(`#${inputName}`).addEventListener("input", (e) => {
            onSelect(e.target.value, selected.dataset.value);
        });
    }, 1000);
};

let setAccountsForm = async (account = null) => {

    const form = document.createElement("form");
    form.setAttribute('id', account ? 'update_form' : 'create_form');
    form.classList.add('pure-form');
    form.classList.add('pure-form-aligned');

    const fieldset = document.createElement("fieldset");
    form.appendChild(fieldset);

    // Account Holder
    await generateSelect("account_holder", "Account Holder", "persons", activeAccount ? activeAccount.person_id.id : null, fieldset);

    // Account Person
    //await generateDataList("persons_id", "Account Person", "persons", account ? account.person_id : null, fieldset);
    await generateSelect("persons_id", "Account Person", "persons", account ? account.person_id : null, fieldset);

    // Account Firm
    //await generateDataList("firms_id", "Account Firm", "firms", account ? account.firm_id : null, fieldset);
    await generateSelect("firms_id", "Account Firm", "firms", account ? account.firm_id : null, fieldset);

    var div = document.createElement("div");
    div.classList.add('pure-control-group');
    div.innerHTML = `<a class="pure-button pure-bg-link" href="#" onclick="navigateTo('${location.pathname}')">CANCEL</a><button class="pure-button pure-bg-green" onclick="submitForm('${account ? 'update_form' : 'create_form'}')">${account ? 'UPDATE' : 'CREATE'}</button>`;
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

        const data = {};
        for ([key, value] of formData.entries()) {
            data[key] = value;
        }
        // Replace to data-value
        for ([key, value] of Object.entries(data)) {
            var input = document.querySelector(`#${key}`);
            if (input && input.dataset.value) data[key] = input.dataset.value;
        }
        // Parse json string
        for ([key, value] of Object.entries(data)) {
            try {
                data[key] = JSON.parse(value);
            } catch (err) {
                data[key] = value;
            }
        }
        // Set empty string to null
        for ([key, value] of Object.entries(data)) {
            if (value === "") {
                data[key] = null;
            } else {
                data[key] = value;
            }
        }

        // var json = JSON.stringify(Object.fromEntries(formData));
        var json = JSON.stringify(data);

        // var accessToken = localStorage.getItem('accessToken');

        // var request = new XMLHttpRequest();
        // request.open("PUT", url + window.location.pathname);
        // request.setRequestHeader('X-Authorization', 'Bearer ' + accessToken);
        // request.send(json);

        if (form_id == 'create_form') {
            var response = await _fetch(url + window.location.pathname.replace("/create", ""), {
                method: "POST",
                body: json
            });
        }

        if (form_id == 'update_form') {
            var response = await _fetch(url + window.location.pathname.replace("/update", ""), {
                method: "PUT",
                body: json
            });
        }

        if (response.ok) {

            const responseJson = await response.json();
            console.log(responseJson);

            if (form_id == 'create_form') {
                var successMsg = `[${response.status}] Record has been created.`;
                var returnPath = `/records/${location.pathname.split("/")[2]}/${responseJson}`;
                if (responseJson.message) {
                    var successMsg = `[${response.status}] ${responseJson.message}`;
                    var returnPath = `/records/${location.pathname.split("/")[2]}`;
                }
                // For related records
                if (location.pathname.split("/").length > 4) {
                    // var returnPath = location.pathname;
                    var returnPath = `/records/${location.pathname.split("/")[4]}/${responseJson}`;
                    if (responseJson.message) {
                        var returnPath = `/records/${location.pathname.split("/")[4]}`;
                    }
                    // navigateTo(returnPath);
                    // return;
                }
            }

            if (form_id == 'update_form') {
                var successMsg = `[${response.status}] Record has been updated.`;
                // var returnPath = window.location.pathname;
                var returnPath = `/records/${location.pathname.split("/")[2]}/${location.pathname.split("/")[3]}`;
                if (responseJson.message) {
                    var successMsg = `[${response.status}] ${responseJson.message}`;
                }
            }

            if (form_id == 'delete_form') {
                var returnPath = window.location.pathname;
                var successMsg = `[${response.status}] Record has been deleted.`;
            }

            // Update userinfo
            // if (
            //     location.pathname.split("/").length === 4 &&
            //     location.pathname.split("/")[2] == "persons" &&
            //     location.pathname.split("/")[3] == userinfo.id
            // ) {
            //     getUserinfo();
            // }

            // Go back to read view
            navigateTo(returnPath);

            // Reload on every manual account change
            if (["persons", "firms"].includes(location.pathname.split("/")[2])) {
                localStorage.setItem("msg", successMsg);
                setTimeout(() => location.reload(), 500);
                return;
            }

            displayMsg(successMsg);
        } else {

            // Remove previous error msgs
            document.querySelectorAll(".error_msg")
                .forEach(el => el.remove());
            // Reset #msg
            displayMsg();

            // Display errors
            const responseError = await response.json();

            switch (responseError.code) {
                case 1013:
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
                default:
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
            navigateTo(returnPath);
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
            navigateTo(returnPath);
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
            navigateTo(returnPath);
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
            navigateTo(returnPath);
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

let attachOrDetachRecord = async (attachOrDetach, subject, subjectId, attach, attachId) => {
    try {
        let response = null;

        if (attachOrDetach == 'attach') {
            response = await _fetch(`${apiUrl}/records/${subject}/${subjectId}/${attach}/${attachId}`, {
                method: "PUT"
            });
        } else {
            response = await _fetch(`${apiUrl}/records/${subject}/${subjectId}/${attach}/${attachId}`, {
                method: "DELETE"
            });
        }

        if (response && response.ok) {
            await response.json();
            displayMsg(`[${response.status}] Record has been ${attachOrDetach}ed.`);
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
};

let displayMsg = (msg = null, color = "green") => {
    document.querySelector("#msg").innerHTML = "";
    if (msg) {
        const span = document.createElement("span");
        span.style.color = color;
        span.textContent = msg;
        document.querySelector("#msg").appendChild(span);
    }
};

// START - Basic router
let navigateTo = (path) => {
    if (event) event.preventDefault();
    console.log("navigate to", path);
    // Reset #msg
    displayMsg();
    // Reset #gmap
    document.querySelector("#gmap").innerHTML = "";
    window.history.pushState(
        {},
        document.title,
        path
    );
};
let navigateBack = () => {
    window.history.back();
};
// END - Basic router

let logout = () => {
    localStorage.removeItem("accessToken");
    location.href = `https://auth.ud.ax/logout?returnTo=${location.origin}`;
};

window.onload = async function () {

    // var accessToken = localStorage.getItem("accessToken");
    // if (!accessToken) {
        var match = RegExp('[#&]access_token=([^&]*)').exec(window.location.hash);
        var accessToken = match && decodeURIComponent(match[1].replace(/\+/g, ' '));
    // }

    if (!localStorage.getItem("path")) {
        localStorage.setItem("path", location.pathname);
    }

    if (!accessToken) {

        // document.location = authUrl+'?audience='+audience+'&response_type=token&client_id='+clientId+'&redirect_uri='+document.location.origin;
        document.location = `${authUrl}?audience=${audience}&scope=openid profile email&response_type=token&client_id=${clientId}&redirect_uri=${document.location.origin}`;

    } else {

        document.location.hash = '';

        localStorage.setItem('accessToken', accessToken);
        document.getElementById('token').innerHTML = accessToken;

        // document.querySelector("#menu-link-exit").setAttribute("href", `https://auth.ud.ax/logout?returnTo=${location.origin}`);
        document.querySelector("#menu-link-exit").addEventListener("click", logout);

        // Fetch wrapper with default options
        _fetch = async (url, options = {}) => {
            try {

                const response = await fetch(url, {
                    headers: {
                        'X-Authorization': `Bearer ${accessToken}`
                    },
                    ...options
                });

                // Response interceptor
                if (!response.ok) {
                    const responseData = await response.clone().json();
                    switch (responseData.code) {
                        case 1012:
                            logout();
                            break;
                    }
                }

                return response;

            } catch (err) {
                throw err;
            }
        };

        // START - Basic router
        // Fire event when pushState is called since onpopstate doesn't trigger on pushState
        (function(history) {
            var pushState = history.pushState;
            history.pushState = function(state) {
                if (typeof history.onpushstate == "function") {
                    history.onpushstate({state: state});
                }
                return pushState.apply(history, arguments);
            };
        })(window.history);
        //
        window.onpopstate = history.onpushstate = () => {
            // We wait so that location.pathname will be updated to current uri
            setTimeout(() => {
                subdomainCheck();
                const path = location.pathname;
                switch (true) {
                    case /^\/records\/([a-z_]+)$/.test(path):
                        getRecords(path);
                        break;
                    case /^\/records\/([a-z_]+)\/create$/.test(path):
                        createRecord(path);
                        break;
                    case /^\/records\/([a-z_]+)\/([0-9]+)$/.test(path):
                        getRecord(path);
                        break;
                    case /^\/records\/([a-z_]+)\/([0-9]+)\/update$/.test(path):
                        updateRecord(path);
                        break;
                    case /^\/records\/([a-z_]+)\/([0-9]+)\/([a-z_]+)$/.test(path):
                        getRelatedRecords(path.split("/")[2], path.split("/")[3], path.split("/")[4]);
                        break;
                    case /^\/records\/([a-z_]+)\/([0-9]+)\/([a-z_]+)\/create$/.test(path):
                        createRecord(path);
                        break;
                    default:
                        listPaths();
                }
            }, 500);
        };
        // END - Basic router

        await getUserinfo();
        const isSubdomainMatched = await subdomainCheck();
        // Continue only when subdomain is matched with active account's subdomain OR no subdomain
        if (isSubdomainMatched) {
            await getOpenapi();
            navigateTo(localStorage.getItem("path") || location.pathname);
            localStorage.removeItem("path");

            if (localStorage.getItem("msg")) displayMsg(localStorage.getItem("msg"));
            localStorage.removeItem("msg");
        }
    }

};
