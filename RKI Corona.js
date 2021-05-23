// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-brown; icon-glyph: id-card;
// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-gray; icon-glyph: magic;
// Licence: Robert Koch-Institut (RKI), dl-de/by-2-0
//

// ---------------------------
// do not edit after this line
// ---------------------------

// #region draw constants
const lineWeight = 2;
const vertLineWeight = 36;
const accentColor1 = new Color('#33cc33', 1);
const accentColor2 = Color.lightGray();

// colors for incidence highlighting
const colorLow = new Color('#FAD643', 1); // < 50
const colorMed = new Color('#E8B365', 1); // < 100
const colorHigh = new Color('#DD5045', 1); // < 200
const colorUltra = new Color('#8E0000', 1); // >= 200

const widgetHeight = 338;
const widgetWidth = 720;
const graphLow = 200;
const graphHeight = 100;
const spaceBetweenDays = 47.5;
const bedsGraphBaseline = 290;
const bedsPaddingLeft = 32;
const bedsPaddingRight = 32;
const bedsLineWidth = 12;
// #endregion

let drawContext = new DrawContext();
drawContext.size = new Size(widgetWidth, widgetHeight);
drawContext.opaque = false;

let widget = await createWidget();
widget.setPadding(0, 0, 0, 0);
widget.backgroundImage = (drawContext.getImage());
await widget.presentMedium();

Script.setWidget(widget);
Script.complete();

function getPath() {
    let fm = FileManager.local();
    let dir = fm.documentsDirectory();
    let path = fm.joinPath(dir, "covid19latlon.json");
    return { fm, path };
}

async function createWidget() {
    const list = new ListWidget();
    list.backgroundColor = new Color('#191a1d', 1);

    //let location;
    let myArgs = args.widgetParameter;
    //myArgs = "49.0,8.5";

    let location = await getLocation(myArgs);
    //location.latitude = location.latitude - 0.2;

    try {
        var { cityName, beds, freeBeds, cases, myCityDataWithIncidences } = await getDataFromServer(location);

        drawTitle(cityName);

        //  Draw graph for ICU beds
        drawBedInfo(beds, freeBeds, cases);

        drawIncidences(myCityDataWithIncidences);

    } catch (e) {
        const errorList = new ListWidget();
        errorList.backgroundColor = new Color('#ffffff', 1);
        //errorList.color = Color.white();
        errorList.addText(e);
        return errorList;
    }

    return list;
}

// #region drawing functions
/**
* Draw incidence graph
* @param {any} pCityDataFeatures
*/
function drawIncidences(pCityDataFeatures) {
    // Draw incidence graph
    drawContext.setFont(Font.mediumSystemFont(22));
    drawContext.setTextAlignedCenter();

    let min, max, diff;
    min = Number.MAX_VALUE;

    for (let i = 0; i < pCityDataFeatures.length; i++) {
        let aux = pCityDataFeatures[i].attributes.Incidence;

        // min = (aux < min || min == undefined ? aux : min);
        max = (aux > max || max === undefined ? aux : max);
        min = (aux < min || min === undefined ? aux : min);
    }
    // set min to zero if bars should calibrate to lower 0
    min = 0;
    diff = max - min;

    //const highestIndex = cityData.features.length - 1;

    for (let i = 0; i < pCityDataFeatures.length; i++) {
        drawIncidenceBar(i, pCityDataFeatures[i].attributes, min, diff);
    }
}

/**
 * draw incidence bar at position pPosition
 * @param {any} pPosition
 * @param {any} pCityAttribute
 * @param {any} min
 * @param {any} diff
 */
function drawIncidenceBar(pPosition, pCityAttribute, min, diff) {
    const day = (new Date(pCityAttribute.Meldedatum)).getDate();
    const dayOfWeek = (new Date(pCityAttribute.Meldedatum)).getDay();
    const cases = pCityAttribute.Incidence;
    const delta = (cases - min) / diff;

    // Vertical Line
    let drawColor;

    if (cases < 50) {
        drawColor = colorLow;
    } else if (cases < 100) {
        drawColor = colorMed;
    } else if (cases < 200) {
        drawColor = colorHigh;
    } else {
        drawColor = colorUltra;
    }

    const point1 = new Point(spaceBetweenDays * pPosition + 50, graphLow - (graphHeight * delta));
    const point2 = new Point(spaceBetweenDays * pPosition + 50, graphLow + 10);
    drawLine(point1, point2, vertLineWeight, drawColor);

    let dayColor;

    if (dayOfWeek === 0 || dayOfWeek === 6) {
        dayColor = accentColor2;
    } else {
        dayColor = Color.white();
    }

    const casesRect = new Rect(spaceBetweenDays * pPosition + 20, (graphLow - 40) - (graphHeight * delta), 60, 23);
    const dayRect = new Rect(spaceBetweenDays * pPosition + 27, graphLow + 15, 50, 23);

    drawTextR(cases, casesRect, dayColor, Font.systemFont(21));
    drawTextR(day, dayRect, dayColor, Font.systemFont(21));
}

function drawBedInfo(beds, freeBeds, cases) {
    const bedsRight = widgetWidth - bedsPaddingRight;
    const freeBedsWidth = (bedsRight / beds) * freeBeds;
    const covidBedsWidth = (bedsRight / beds) * cases;

    // Line representing all beds
    drawLine(new Point(bedsPaddingLeft, bedsGraphBaseline), new Point(bedsRight, bedsGraphBaseline), bedsLineWidth, new Color('#939598', 1));
    let bedsRect = new Rect(bedsPaddingLeft, bedsGraphBaseline - 40, bedsRight - freeBedsWidth - bedsPaddingLeft - 10, 26);
    drawContext.setFont(Font.mediumSystemFont(26));
    drawContext.drawTextInRect('🛏 ' + beds + ' Intensivbetten'.toUpperCase(), bedsRect);

    // Portion representing free beds
    drawLine(new Point(bedsRight - freeBedsWidth, bedsGraphBaseline), new Point(bedsRight, bedsGraphBaseline), bedsLineWidth, new Color('#4D8802', 1));
    drawLine(new Point(bedsRight - freeBedsWidth, bedsGraphBaseline), new Point(bedsRight - freeBedsWidth, bedsGraphBaseline - 2 * bedsLineWidth), 3, new Color('#4D8802', 1));
    drawContext.setFont(Font.mediumSystemFont(22));
    let freeRect = new Rect(bedsPaddingLeft, bedsGraphBaseline - 35, bedsRight - freeBedsWidth - bedsPaddingLeft - 10, 22);
    drawContext.setTextAlignedRight();
    drawContext.drawTextInRect(freeBeds + ' frei', freeRect);

    // Portion representing covid patients
    drawLine(new Point(bedsPaddingLeft, bedsGraphBaseline), new Point(bedsPaddingLeft + covidBedsWidth, bedsGraphBaseline), bedsLineWidth, new Color('#F6522E', 1));
    drawLine(new Point(bedsPaddingLeft + covidBedsWidth, bedsGraphBaseline), new Point(bedsPaddingLeft + covidBedsWidth, bedsGraphBaseline + 2 * bedsLineWidth), 3, new Color('#F6522E', 1));
    let covidRect = new Rect(bedsPaddingLeft + covidBedsWidth + 10, bedsGraphBaseline + 10, bedsRight - covidBedsWidth, 22);
    drawContext.setTextAlignedLeft();
    drawContext.drawTextInRect(cases + ' COVID-19', covidRect);
    return { covidBedsWidth, bedsRight };
}

function drawTitle(cityName) {
    drawContext.setTextColor(Color.white());
    drawContext.setFont(Font.mediumSystemFont(26));
    drawContext.drawText('🦠 7-Tage-Inzidenz'.toUpperCase() + ' ' + cityName, new Point(25, 25));
}

function drawTextR(text, rect, color, font) {
    drawContext.setFont(font);
    drawContext.setTextColor(color);
    drawContext.drawTextInRect(new String(text).toString(), rect);
}

function drawLine(point1, point2, width, color) {
    const path = new Path();
    path.move(point1);
    path.addLine(point2);
    drawContext.addPath(path);
    drawContext.setStrokeColor(color);
    drawContext.setLineWidth(width);
    drawContext.strokePath();
}
// #endregion

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
    const myEinwohnerZahlBy100000 = locationAttrs.EWZ / 100000;
    const county = locationAttrs.county;
    const freeBeds = diviAttrs.betten_frei;
    const beds = diviAttrs.betten_gesamt;
    const usedBeds = diviAttrs.betten_belegt;
    const cases = diviAttrs.faelle_covid_aktuell;

    const myDate21DaysBack = new Date(new Date().getTime() - 21 * DAY_IN_MICROSECONDS);
    const myDate21DaysBackString = ('0' + (myDate21DaysBack.getMonth() + 1)).slice(-2) + '-' + ('0' + myDate21DaysBack.getDate()).slice(-2) + '-' + myDate21DaysBack.getFullYear();

    let cityData = await getCityData(county, myDate21DaysBackString);
    // calculate incidence in place.
    let myCityDataWithIncidences = calcIncidences(cityData, myEinwohnerZahlBy100000);
    return { cityName, beds, freeBeds, cases, myCityDataWithIncidences };

    /**
    * calc Incidences for last 7 AnzahlFall and store in Incidence
    * @param {any} cityData
    * @param {any} myEinwohnerZahlBy100000
    */
    function calcIncidences(pCityData, myEinwohnerZahlBy100000) {
        let myCityDataWithIncidences = pCityData.features.slice();
        for (let i = myCityDataWithIncidences.length - 1; i >= 6; i--) {
            let sum = 0;

            for (let j = 0; j < 7; j++) {
                sum += myCityDataWithIncidences[i - j].attributes.AnzahlFall;
            }

            sum /= myEinwohnerZahlBy100000;
            myCityDataWithIncidences[i].attributes.Incidence = Math.round(sum);
        }

        myCityDataWithIncidences.splice(0, 6);
        return myCityDataWithIncidences;
    }
}

async function getCityData(county, minDate) {
    const apiUrlData = `https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/Covid19_RKI_Sums/FeatureServer/0/query?where=Landkreis+LIKE+%27%25${encodeURIComponent(county)}%25%27+AND+Meldedatum+%3E+%27${encodeURIComponent(minDate)}%27&objectIds=&time=&resultType=none&outFields=*&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnDistinctValues=false&cacheHint=false&orderByFields=Meldedatum&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&sqlFormat=none&f=json&token=`;
    console.log("apiUrlData");
    console.log(apiUrlData);

    const cityData = await new Request(apiUrlData).loadJSON();
    if (!cityData || !cityData.features || !cityData.features.length) {
        throw "getCityData: Keine Statistik gefunden";
    }
    return cityData;
}

async function getDiviData(location) {
    // Intensivbetten
    const diviApiUrl = (location) => `https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/DIVI_Intensivregister_Landkreise/FeatureServer/0/query?where=1%3D1&outFields=*&geometry=${location.longitude.toFixed(3)}%2C${location.latitude.toFixed(3)}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelWithin&returnGeometry=false&outSR=4326&f=json`;

    let diviLocationData = await new Request(diviApiUrl(location)).loadJSON();
    if (!diviLocationData || !diviLocationData.features || !diviLocationData.features.length) {
        throw "getDiviData: Keine DIVI - Ergebnisse für den aktuellen Ort gefunden"
    }
    return diviLocationData;
}

async function getLocationData(location) {
    // Landkreis Inzidenz
    const apiUrl = (location) => `https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_Landkreisdaten/FeatureServer/0/query?where=1%3D1&outFields=GEN,EWZ,cases,death_rate,deaths,cases7_per_100k,cases7_bl_per_100k,BL,county&geometry=${location.longitude.toFixed(3)}%2C${location.latitude.toFixed(3)}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelWithin&returnGeometry=false&outSR=4326&f=json`;

    const locationData = await new Request(apiUrl(location)).loadJSON();
    console.log(apiUrl(location));
    if (!locationData || !locationData.features || !locationData.features.length) {
        throw "getLocationData: Keine Ergebnisse für den aktuellen Ort gefunden";
    }
    showObject(locationData.features[0].attributes, "locationData");
    return locationData;
}
// #endregion

// #region location functions
const saveIncidenceLatLon = (location) => {
    let { fm, path } = getPath();
    fm.writeString(path, JSON.stringify(location));
};

const getSavedIncidenceLatLon = () => {
    let { fm, path } = getPath();
    let data = fm.readString(path);
    return JSON.parse(data);
};

/**
 * get location from string ("latitude,longitude") or from current location 
 * @param {any} myArgs
 */
async function getLocation(myArgs) {
    let location;
    if (myArgs) {
        const fixedCoordinates = myArgs.split(',').map(function (str) { return parseFloat(str); });
        location = {
            latitude: fixedCoordinates[0],
            longitude: fixedCoordinates[1]
        };
        console.log('get fixed lat/lon ' + location.latitude + " " + location.longitude);
    } else {
        Location.setAccuracyToThreeKilometers();
        try {
            location = await Location.current();
            console.log('get current lat/lon ' + location.latitude + " " + location.longitude);
            saveIncidenceLatLon(location);
        } catch (e) {
            console.log('using saved lat/lon ' + location.latitude + " " + location.longitude);
            location = getSavedIncidenceLatLon();
        }
    }
    return location;
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