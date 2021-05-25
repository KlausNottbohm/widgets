const conHockenheimLocation = "49.315939, 8.541975";
const conAlfeld = "51.989063, 9.828675";
const conHeidelberg = "49.388432, 8.671077";
const conSpeyer = "49.315910, 8.444430";
const conKarlsruhe = "49.232416, 8.459519";
const myNow = conKarlsruhe;

window.onload = (event) => {
    console.log('page is fully loaded');

    let myVM = new viewModel();
    ko.applyBindings(myVM);
};

function viewModel() {
    var self = this;

    //const conCookieName = "LocationString";
    self.cityName = ko.observable();
    self.myEinwohnerZahl = ko.observable();
    self.beds = ko.observable();
    self.freeBeds = ko.observable();
    self.cases = ko.observable();
    self.location = ko.observable();
    self.myCityDataWithIncidences = ko.observable();

    //let myCookie = getCookie(conCookieName);
    //if (!myCookie) {
    //    myCookie = myNow;
    //}
    let myLocations = [conHockenheimLocation, conHeidelberg, conKarlsruhe, conAlfeld, conSpeyer];
    let myLocationsString = myLocations.join("\n");
    self.mLocationString = ko.observable(myLocationsString);
    //self.mLocationString.subscribe(function (pVal) {
    //    setCookie(conCookieName, pVal);
    //});
    self.mCurrentLocation = ko.observable();

    self.mJsonString = ko.observable("");
    self.mShowJson = ko.observable(false);
    self.onShowJsonClick = () => { self.mShowJson(!self.mShowJson()); };

    self.onLocationClick = function () {
        let myLocations = [];
        let myLines = self.mLocationString().split("\n");
        for (let iLine of myLines) {
            mySplit = iLine.split(";");
            myLocations = myLocations.concat(mySplit);
        }
        let myLocString = myLocations.length > 0 ? myLocations[myLocations.length - 1] : undefined;
        InitializeData(myLocString);
    }
    self.onCurrentLocationClick = function () {
        InitializeData();
    }

    //InitializeData(conHockenheimLocation);
    InitializeData(conHockenheimLocation);

    async function InitializeData(pLocationString) {
        let location = await getLocation(pLocationString);
        //let myCurrLocation = await getLocationCurrent();
        //self.mLocationString(location.latitude + "," + location.longitude);
        showObject(location, "location from getLocationCurrent");

        setDataFromLocation(location);
    }

    async function setDataFromLocation(pLocation) {

        try {
            var { cityName, myEinwohnerZahl, beds, freeBeds, cases, myCityDataWithIncidences } = await getDataFromServer(pLocation);
            self.cityName(cityName);
            self.location(pLocation);
            self.myEinwohnerZahl(myEinwohnerZahl.toLocaleString("DE"));
            self.beds(beds);
            self.freeBeds(freeBeds);
            self.cases(cases);
            self.myCityDataWithIncidences(myCityDataWithIncidences);
            self.mJsonString(JSON.stringify(myCityDataWithIncidences, null, 2));

        } catch (e) {
            alert(e);
        }
    }
};

// #region server functions
/**
 * get RKI data for certain location: { cityName, beds, freeBeds, cases, myCityDataWithIncidences };
 * @param {any} location
 */
async function getDataFromServer(location) {
    const DAY_IN_MICROSECONDS = 24 * 60 * 60 * 1000;

    let locationData = await getLocationData(location);

    let diviLocationData = await getDiviData(location);

    const locationAttrs = locationData.features[0].attributes;
    const diviAttrs = diviLocationData.features[0].attributes;

    const cityName = locationAttrs.GEN;

    const myEinwohnerZahl = locationAttrs.EWZ;
    const county = locationAttrs.county;
    const freeBeds = diviAttrs.betten_frei;
    const beds = diviAttrs.betten_gesamt;
    const usedBeds = diviAttrs.betten_belegt;
    const cases = diviAttrs.faelle_covid_aktuell;

    const conDaysBack = 60;
    const myDateDaysBack = new Date(new Date().getTime() - conDaysBack * DAY_IN_MICROSECONDS);
    const myDateDaysBackString = ('0' + (myDateDaysBack.getMonth() + 1)).slice(-2) + '-' + ('0' + myDateDaysBack.getDate()).slice(-2) + '-' + myDateDaysBack.getFullYear();

    let cityData = await getCityData(county, myDateDaysBackString);
    // calculate incidence in place.
    let myCityDataWithIncidences = calcIncidences(cityData, myEinwohnerZahl);
    return { cityName, myEinwohnerZahl, beds, freeBeds, cases, myCityDataWithIncidences };

    /**
    * calc Incidences for last 7 AnzahlFall and store in Incidence
    * @param {any} cityData
    * @param {any} pEinwohnerZahl
    */
    function calcIncidences(pCityData, pEinwohnerZahl) {
        let myCityDataWithIncidences = pCityData.features.slice();
        for (let i = myCityDataWithIncidences.length - 1; i >= 6; i--) {
            let sum = 0;

            for (let j = 0; j < 7; j++) {
                sum += myCityDataWithIncidences[i - j].attributes.AnzahlFall;
            }

            sum /= pEinwohnerZahl / 100000;
            myCityDataWithIncidences[i].attributes.Incidence = Math.round(sum);
        }

        myCityDataWithIncidences.splice(0, 6);
        return myCityDataWithIncidences;
    }
}

async function getCityData(county, minDate) {
    const cityUrlData = `https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/Covid19_RKI_Sums/FeatureServer/0/query?where=Landkreis+LIKE+%27%25${encodeURIComponent(county)}%25%27+AND+Meldedatum+%3E+%27${encodeURIComponent(minDate)}%27&objectIds=&time=&resultType=none&outFields=*&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnDistinctValues=false&cacheHint=false&orderByFields=Meldedatum&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&sqlFormat=none&f=json&token=`;
    console.log("cityUrlData");
    console.log(cityUrlData);

    const cityData = await fetchJson(cityUrlData);
    if (!cityData || !cityData.features || !cityData.features.length) {
        throw "getCityData: Keine Statistik gefunden";
    }
    return cityData;
}

async function getDiviData(location) {
    // Intensivbetten
    const diviApiUrl = (location) => `https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/DIVI_Intensivregister_Landkreise/FeatureServer/0/query?where=1%3D1&outFields=*&geometry=${location.longitude.toFixed(3)}%2C${location.latitude.toFixed(3)}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelWithin&returnGeometry=false&outSR=4326&f=json`;
    console.log("diviApiUrl(location)");
    console.log(diviApiUrl(location));

    let diviLocationData = await fetchJson(diviApiUrl(location));
    if (!diviLocationData || !diviLocationData.features || !diviLocationData.features.length) {
        throw "getDiviData: Keine DIVI - Ergebnisse für den aktuellen Ort gefunden"
    }
    return diviLocationData;
}

async function getLocationData(location) {
    // Landkreis Inzidenz
    const apiUrl = (location) => `https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_Landkreisdaten/FeatureServer/0/query?where=1%3D1&outFields=GEN,EWZ,cases,death_rate,deaths,cases7_per_100k,cases7_bl_per_100k,BL,county&geometry=${location.longitude.toFixed(3)}%2C${location.latitude.toFixed(3)}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelWithin&returnGeometry=false&outSR=4326&f=json`;

    const locationData = await fetchJson(apiUrl(location));
    console.log(apiUrl(location));
    if (!locationData || !locationData.features || !locationData.features.length) {
        throw "getLocationData: Keine Ergebnisse für den aktuellen Ort gefunden";
    }
    showObject(locationData.features[0].attributes, "locationData");
    return locationData;
}
// #region fetch functions
async function fetchJson(myAPIURL) {
    let myData = await fetchWithPureJS(myAPIURL);
    return myData;
};
///**
// * fetch in Scriptable
// * @param {any} apiUrlData
// */
//function fetchWithScriptable(apiUrlData) {
//    return new Request(apiUrlData).loadJSON();
//}

async function fetchWithPureJS(pAPIURL) {
    let myResponse = await fetch(pAPIURL);
    let myJson = await myResponse.json();
    //let myData = JSON.parse(myJson);
    return myJson;
}
// #endregion
// #endregion

// #region location functions
const saveIncidenceLatLon = (location) => {
    //let { fm, path } = getPath();
    //fm.writeString(path, JSON.stringify(location));
};

const getSavedIncidenceLatLon = () => {
    //let { fm, path } = getPath();
    //let data = fm.readString(path);
    //return JSON.parse(data);
    const myArgs = "49.0,8.5";

    return getLocationFromString(myArgs);
};

function getPath() {
    let fm = FileManager.local();
    let dir = fm.documentsDirectory();
    let path = fm.joinPath(dir, "covid19latlon.json");
    return { fm, path };
}

/**
 * get location from string ("latitude,longitude") or from current location 
 * @param {any} myArgs
 */
async function getLocation(myArgs) {
    let location;
    if (myArgs) {
        let location = getLocationFromString(myArgs);
        console.log('get lat/lon from args ' + location.latitude + " " + location.longitude);
        return location;
    } else {
        try {
            let location = await getLocationCurrent();
            console.log('get current lat/lon ' + location.latitude + " " + location.longitude);
            //saveIncidenceLatLon(location);
            return location;
        } catch (e) {
            console.log('using saved lat/lon ' + location.latitude + " " + location.longitude);
            location = getSavedIncidenceLatLon();
        }
    }
    return location;
}

// this is how it is done in Scriptable
//function getLocationScriptable() {
//    Location.setAccuracyToThreeKilometers();
//    return Location.current();
//}

function getLocationFromString(pArgs) {
    const fixedCoordinates = pArgs.split(',').map(function (str) { return parseFloat(str); });
    let location = {
        latitude: fixedCoordinates[0],
        longitude: fixedCoordinates[1]
    };
    return location;
}
/**
 * get geo location in browser
 */
function getLocationCurrent() {
    let myLocPromise = new Promise(function (resolve, reject) {
        // https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API
        if (!navigator.geolocation) {
            reject('Geolocation is not supported by your browser');
        } else {
            navigator.geolocation.getCurrentPosition(success, error);
        }

        function success(position) {
            resolve(position.coords);
        }

        function error() {
            reject('Unable to retrieve your location');
        }
    });
    return myLocPromise;
}
// #endregion

/**
 * show members of pObject
 * @param {any} pObject
 */
function showObject(pObject, title) {
    let myTitle = title ? title : "No title";
    console.log(`showObject ${myTitle}: ${new Date().toLocaleString()}`);
    console.log(`type- ${typeof (pObject)}`);
    if (pObject === null) {
        console.log("object is null");
    }
    else {
        if (typeof pObject === "object") {
            for (var key in pObject) {
                console.log(key + ": " + pObject[key]);
            }
        }
        else if (typeof pObject === "function") {
            console.log("Object is a function");
        }
        else {
            console.log(`${pObject}`);
        }
    }
}

/**
* set cookie
* https://www.w3schools.com/js/js_cookies.asp
* @param {string} cname cookie name
* @param {string} cvalue cookie value
* @param {number} exDays number of days to expire (default 360 days)
* @param {number} exHours number of hours to expire (default 360 days)
* @param {number} exMinutes number of minutes to expire (default 360 days) 
*/
function setCookie(cname, cvalue, exDays, exHours, exMinutes){
    if (exDays === undefined) {
        exDays = 360;
    }
    if (exHours === undefined) {
        exHours = 0;
    }
    if (exMinutes === undefined) {
        exMinutes = 0;
    }
    var myPlus = (exDays * 24 * 60 * 60 * 1000) + exHours * 60 * 60 * 1000 + exMinutes * 60 * 1000;
    var d = new Date();
    d.setTime(d.getTime() + myPlus);
    var expires = "expires=" + d.toUTCString();
    var myValue = cvalue === null ? null : encodeURIComponent(cvalue);
    //if (cname === "qknordField") {
    //    console.log(myValue);
    //    confirm(cname + "-" + myValue);
    //}
    document.cookie = cname + "=" + myValue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}