const conHockenheimLocation = "49.315939, 8.541975, 'Hockenheim'";
const conAlfeld = "51.989063, 9.828675, 'Alfeld'";
const conHeidelberg = "49.388432, 8.671077, 'Heidelberg'";
const conSpeyer = "49.315910, 8.444430, 'Speyer'";
const conKarlsruhe = "49.232416, 8.459519, 'Karlsruhe'";
const myNow = conKarlsruhe;

const conDaysBack = 21;

window.onload = (event) => {
    console.log('page is fully loaded');

    let myVM = new viewModel();
    ko.applyBindings(myVM);
};

function viewModel() {
    var self = this;

    //const conCookieName = "LocationString";
    self.mLocationData = ko.observable();

    //let myCookie = getCookie(conCookieName);
    //if (!myCookie) {
    //    myCookie = myNow;
    //}
    let myLocations = [conHockenheimLocation, conHeidelberg, conKarlsruhe, conAlfeld, conSpeyer];
    let myLocationsString = myLocations.join("\n");
    self.mLocationString = ko.observable(myLocationsString);
    self.mDaysBack = ko.observable(conDaysBack);
    self.mDaysBack.subscribe(function (pVal) {
        InitializeData(self.mLocationString());
    });

    self.mJsonString = ko.observable("");
    self.mShowJson = ko.observable(false);
    self.onShowJsonClick = () => { self.mShowJson(!self.mShowJson()); };

    self.onLocationClick = function () {
        InitializeData(self.mLocationString());
    }
    self.onCurrentLocationClick = function () {
        InitializeData();
    }

    InitializeData(self.mLocationString());

    async function InitializeData(pLocationString) {
        let locations = await getLocations(pLocationString);

        setDataFromLocation(locations);
    }

    async function setDataFromLocation(pLocations) {

        try {
            let myLocDatas = [];
            for (let iEle of pLocations) {
                //var { cityName, myEinwohnerZahl, beds, freeBeds, cases, myCityDataWithIncidences } = await getDataFromServer(pLocation);
                let myLocData = await getDataFromServer(iEle, self.mDaysBack());
                myLocDatas.push(myLocData);
            }

            self.mJsonString(JSON.stringify(myLocDatas, null, 2));
            self.mLocationData(myLocDatas);

            RenderChart(myLocDatas);
        } catch (e) {
            alert(e);
        }
    }

};
function RenderChart(pCityDataWithIncidences) {
    //<tr data-bind="with:attributes">
    //    <td data-bind="text: (new Date(Meldedatum)).toLocaleDateString('DE')"></td>
    //    <td data-bind="text: Incidence"></td>
    //    <td data-bind="text: AnzahlFall"></td>
    //    <td data-bind="text: AnzahlTodesfall"></td>
    //    <td data-bind="text: SummeFall"></td>
    //    <td data-bind="text: SummeTodesfall"></td>
    //    <td data-bind="text: AnzahlGenesen"></td>
    //    <td data-bind="text: SummeGenesen"></td>
    //</tr>
    let myChartData = pCityDataWithIncidences.map(function (pCity) {
        let myCity = {
            name: pCity.cityName,
            type: "spline",
            //yValueFormatString: "#0.## °C",
            showInLegend: true,
            dataPoints: pCity.myCityDataWithIncidences.map(function (pDay) {
                let myDayData = { x: new Date(pDay.attributes.Meldedatum), y: pDay.attributes.Incidence };
                return myDayData;
            })
        };
        return myCity;
    });

    var chart = new CanvasJS.Chart("chartContainer", {
        animationEnabled: true,
        title: {
            text: "Daily Incidences for Different Cities"
        },
        axisX: {
            valueFormatString: "DD.MMM"
        },
        axisY: {
            title: "Incidence"
        },
        legend: {
            cursor: "pointer",
            fontSize: 16,
            itemclick: toggleDataSeries
        },
        toolTip: {
            shared: true
        },
        data: myChartData
    });

    chart.render();
    function toggleDataSeries(e) {
        if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
            e.dataSeries.visible = false;
        }
        else {
            e.dataSeries.visible = true;
        }
        chart.render();
    }
}


// #region server functions
/**
 * get RKI data for certain location: { cityName, beds, freeBeds, cases, myCityDataWithIncidences };
 * @param {any} location
 */
async function getDataFromServer(location, pDaysBack) {
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

    const myDateDaysBack = new Date(new Date().getTime() - pDaysBack * DAY_IN_MICROSECONDS);
    const myDateDaysBackString = ('0' + (myDateDaysBack.getMonth() + 1)).slice(-2) + '-' + ('0' + myDateDaysBack.getDate()).slice(-2) + '-' + myDateDaysBack.getFullYear();

    let cityData = await getCityData(county, myDateDaysBackString);

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
async function getLocations(myArgs) {
    if (myArgs) {
        let locations = getLocationsFromString(myArgs);
        console.log('get lat/lon from args' + myArgs);
        return locations;
    } else {
        try {
            let location = await getLocationCurrent();
            console.log('get current lat/lon ' + location.latitude + " " + location.longitude);
            //saveIncidenceLatLon(location);
            return [location];
        } catch (e) {
            let location = [getSavedIncidenceLatLon()];
            console.log('using saved lat/lon ' + location.latitude + " " + location.longitude);
            return [location];
        }
    }
}

function getLocationsFromString(pLocationString) {
    let myLines = pLocationString.split("\n");
    let myLocations = myLines.map(function (pLocStr) {
        return getLocationFromString(pLocStr);
    });
    return myLocations;
}

// this is how it is done in Scriptable
//function getLocationScriptable() {
//    Location.setAccuracyToThreeKilometers();
//    return Location.current();
//}

function getLocationFromString(pArgs) {
    const myParts = pArgs.split(',');
    let location = {
        latitude: parseFloat(myParts[0]),
        longitude: parseFloat(myParts[1]),
        name: myParts[2]
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
