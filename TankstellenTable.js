// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: magic;
// V220406Tank
// https://github.com/Necriso/ScriptableWidgets/blob/main/tankstellenpreise.js
// Check www.scriptables.net for more widgets
// Use www.scriptdu.de to keep the widget up-to-date
// Usage:
// Add credentials toyour widget parameters:
// API-Key|radius in km|fixedLocation (0 or 1) e.g my-api-key|1|0
// If you want to set a fixed location then the settings should look like:
// radius in km|fixedLocation|latitude|longitude (0 or 1) e.g my-api-key|1|1|54.322|10.1355
// Important: Don't set the radius to big, the tankerkoenig.de endpoint will deliver all stations in the radius which is set,
// but only one is needed to display, so it will take a long time to fetch data.

let radius, fixedLocation, latitude, longitude, myLocation, brand
const conRadius = 5;
let widgetInput = args.widgetParameter;
let apiKey = "ea6a2788-eb7c-d68d-914e-b11a471d56cb";

if (widgetInput !== null) {
    console.log(`widgetInput ${widgetInput}`);
    [radius, fixedLocation, latitude, longitude, brand] = widgetInput.split("|");
    console.log([radius, fixedLocation, latitude, longitude, brand]);

    if (fixedLocation && (!latitude || !longitude)) {
        throw new Error("If fixed location is set you must set latitude and longitude")
    }

    // Set strings to correct types
    radius = radius ? parseInt(radius) : conRadius;
    console.log(`radius ${radius}`);

    if (!brand) {
        brand = false
    }
    if (!fixedLocation) {
        myLocation = await getCurrentLocation();
    } else {
        myLocation = {
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude)
        }
    }
}
else {
    radius = conRadius;
    myLocation = await getCurrentLocation();
}

const backColor = Color.dynamic(new Color('FFFFFF'), new Color('111111'));
const backColor2 = Color.dynamic(new Color('EEEEEE'), new Color('222222'));
const textColor = Color.dynamic(new Color('000000'), new Color('EDEDED'));

const apiURL = (location, radius, apiKey) => `https://creativecommons.tankerkoenig.de/json/list.php?lat=${location.latitude.toFixed(3)}&lng=${location.longitude.toFixed(3)}&rad=${radius}&sort=dist&type=all&apikey=${apiKey}`

let station = await loadStation(apiKey, radius, fixedLocation, myLocation)
let widget = await createWidget(station, brand)

if (!config.runsInWidget) {
    await widget.presentMedium()
}

Script.setWidget()
Script.complete()

async function getCurrentLocation() {
    Location.setAccuracyToThreeKilometers();
    let location;
    try {
        location = await Location.current();
        console.log('get current lat/lon ' + location?.latitude + " " + location?.longitude);
    } catch (e) {
        console.log('using saved lat/lon ' + location?.latitude + " " + location?.longitude);
        location = getDefaultLocation();
    }
    return location;
}

async function loadStation(apiKey, radius, fixedLocation, myLocation) {
    let location

    if (fixedLocation) {
        location = myLocation
    } else {
        location = await Location.current()
    }
    let myURL = apiURL(location, radius, apiKey);
    console.log(myURL)
    const data = await new Request(myURL).loadJSON();

    if (data.stations.length === 0) {
        return { error: 1 }
    }
    //console.log("");
    //console.log("vor sort");
    //console.log(data);
    data.stations.sort(function (left, right) { return left.diesel - right.diesel; });
    //console.log("");
    //console.log("nach sort");
    //console.log(data);
    return data
}

const getDefaultLocation = () => {
    // Hockenheim
    const myArgs = "49.0,8.5";
    return getLocationFromString(myArgs);
};

function formatValue(value) {
    if (!value) {
        return '-'
    }
    let price = value.toFixed(2);

    return price + "€"
}

async function createWidget(data, brand) {

    const list = new ListWidget()
    list.setPadding(0, 4, 1, 4)

    const gradient = new LinearGradient()
    gradient.locations = [0, 1]
    gradient.colors = [
        backColor,
        backColor2
    ]
    list.backgroundGradient = gradient

    if (data.error) {
        let errorMessage = list.addText('No station in selected radius found. Please set a greater radius in widget parameters')
        errorMessage.font = Font.boldSystemFont(12)
        errorMessage.textColor = textColor
        return list
    }

    const stations = data.stations;
    let selectedStations

    if (brand) {
        selectedStations = stations.filter(stations => stations['brand'].toLowerCase() === brand.toLowerCase());
    } else {
        selectedStations = stations
    }

    const attr = selectedStations[0]

    let myTitleStack = list.addStack();
    let myTitle = myTitleStack.addText(`Günstigste Tankstelle im Umkreis von ${radius} km`);
    myTitle.font = Font.boldRoundedSystemFont(12);
    myTitle.textColor = Color.red();
    //myTitleStack.url = "scriptable:///run/TankstellenPreise"
    //myTitleStack.url = "https://www.google.com/maps/search/?api=1&query=<lat>,<lng>"
    //let myMapURL = createGoogleMapMarkerByCoord(attr);
    let myMapURL = createGoogleMapMarkerByAddress(attr);
    console.log(`myMapURL ${myMapURL}`);
    list.url = myMapURL;

    let myTable = new UITable();
    myTable.showSeparators = true;
    let myHeader = new UITableRow();
    myTable.addRow(myHeader);
    let myWidths = [100, 30, 30, 30, 100];

    addHeaderCell(myHeader, "Name", myWidths[0]);
    addHeaderCell(myHeader, "Diesel", myWidths[1]);
    addHeaderCell(myHeader, "E5", myWidths[2]);
    addHeaderCell(myHeader, "E10", myWidths[3]);
    addHeaderCell(myHeader, "Address", myWidths[4]);

    selectedStations = selectedStations.slice(0, 3);
    for (let iRow of selectedStations) {
        createRow(myTable, iRow);
    }


    //await myTable.present(false);

    return myTable;

    function addHeaderCell(pHeader, pText, pWeight) {
        let dieselStack = pHeader.addText(pText);
        dieselStack.textColor = textColor;
        dieselStack.widthWeight = pWeight;
    }

    function createRow(pTable, pTankstelle) {

        let myRow = new UITableRow();
        pTable.addRow(myRow);
        myRow.height = 60;

        let open = pTankstelle.isOpen ? `open` : 'closed';
        let myName = pTankstelle.brand ? pTankstelle.brand : pTankstelle.name;
        let myNameCell = myRow.addText(myName, open);
        myNameCell.titleFont = Font.boldSystemFont(15);
        myNameCell.textColor = textColor;
        myNameCell.widthWeight = myWidths[0];
     
        let dieselStack = myRow.addText(formatValue(pTankstelle.diesel));
        dieselStack.titleFont = Font.systemFont(12);
        dieselStack.textColor = textColor;
        dieselStack.widthWeight = myWidths[1];

        let e5Stack = myRow.addText(formatValue(pTankstelle.e5)); 
        e5Stack.titleFont = Font.systemFont(12);
        e5Stack.textColor = textColor;
        e5Stack.widthWeight = myWidths[2];

        let e10Stack = myRow.addText(formatValue(pTankstelle.e10)); 
        e10Stack.titleFont = Font.systemFont(12);
        e10Stack.textColor = textColor;
        e10Stack.widthWeight = myWidths[3];

        let myAddressText = `${pTankstelle.place}, ${pTankstelle.street} ${pTankstelle.houseNumber} (${pTankstelle.dist} km)`;

        let myAddressField = myRow.addButton(myAddressText);
        myAddressField.titleFont = Font.systemFont(12);
        myAddressField.textColor = textColor;
        myAddressField.widthWeight = myWidths[4];
        myAddressField.onTap = () => {
            let myURL = createGoogleMapMarkerByAddress(pTankstelle);
            Safari.open(myURL);
        };
    }

    /**
     * create google map url from one tankstellen object
     * @param {any} pTankstellenObject
     */
    function createGoogleMapMarkerByCoord(pTankstellenObject) {
        // https://stackoverflow.com/questions/1801732/how-do-i-link-to-google-maps-with-a-particular-longitude-and-latitude
        const createMapUrl = (pLat, pLong) => `https://www.google.com/maps/search/?api=1&query=${pLat},${pLong}`;
        let myMapURL = createMapUrl(pTankstellenObject.lat, pTankstellenObject.lng);
        return myMapURL;
    }
    function createGoogleMapMarkerByAddress(pTankstellenObject) {
        // https://developers.google.com/maps/documentation/urls/get-started
        let myQuery = `${pTankstellenObject.street} ${pTankstellenObject.houseNumber}, ${pTankstellenObject.place}`;
        let myEncQuery = encodeURIComponent(myQuery);
        const createMapUrl = (pQ) => `https://www.google.com/maps/search/?api=1&query=${pQ}`;
        let myMapURL = createMapUrl(myEncQuery);
        // does not work in scriptable
        //let myIOSQuery = `comgooglemaps://?q=${myEncQuery}`;
        return myMapURL;
    }

    function addAddressPart(pText) {
        addTextToStack(addressStack, pText);
    }

    function addTextToStack(pAddressStack, pText) {
        let houseNumber = pAddressStack.addText(pText);
        houseNumber.font = Font.lightSystemFont(12);
        houseNumber.textColor = textColor;
    }
}