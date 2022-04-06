// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: magic;
// V220405Tank
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

const widgetHeight = 18;
const widgetWidth = 1720;

/**default radius */
const conRadius = 5;
let radius = conRadius, fixedLocation, latitude, longitude, myLocation, brand = "diesel"
let widgetInput = args.widgetParameter;
let apiKey = "ea6a2788-eb7c-d68d-914e-b11a471d56cb";

const backColor = Color.dynamic(new Color('FFFFFF'), new Color('111111'));
const backColor2 = Color.dynamic(new Color('EEEEEE'), new Color('222222'));
const textColor = Color.dynamic(new Color('000000'), new Color('EDEDED'));

const apiURL = (location, radius, apiKey) => `https://creativecommons.tankerkoenig.de/json/list.php?lat=${location.latitude.toFixed(3)}&lng=${location.longitude.toFixed(3)}&rad=${radius}&sort=dist&type=all&apikey=${apiKey}`

if (widgetInput !== null) {
    console.log(`widgetInput ${widgetInput}`);
    [radius, fixedLocation, latitude, longitude, brand] = widgetInput.split("|");

    if (fixedLocation && (!latitude || !longitude)) {
        throw new Error("If fixed location is set you must set latitude and longitude")
    }

    // Set strings to correct types
    radius = radius ? parseInt(radius) : conRadius;
    console.log(`radius ${radius}`);

    if (!brand) {
        brand = "diesel";
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
    myLocation = await getCurrentLocation();
}

let station = await loadStation(apiKey, radius, fixedLocation, myLocation)
let widget = await createWidget(station, brand)

if (!config.runsInWidget) {
    await widget.presentLarge()
}

Script.setWidget(widget)
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

function getDefaultLocation() {
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

    let selectedStations = data.stations;

    const attr = selectedStations[0]

    let open = attr.isOpen ? `open` : 'closed'

    let myTitleStack = list.addStack();
    let myTitle = myTitleStack.addText(`Günstigste Tankstelle im Umkreis von ${radius} km`);
    myTitle.font = Font.boldRoundedSystemFont(15)
    myTitle.textColor = Color.red()
    myTitle.centerAlignText();

    drawCheapest(attr);

    let myHorizontalLine = drawLine(new Point(0, 10), new Point(widgetWidth, 10), 10, Color.black())
    list.addImage(myHorizontalLine.getImage());

    list.addSpacer(5);
    let myOtherStack = list.addStack();
    myOtherStack.backgroundColor = Color.lightGray();
    myOtherStack.layoutVertically();

    let myTitleStackOther = myOtherStack.addStack();
    let myTitleOther = myTitleStackOther.addText(`Andere ${brand}-Preise im Umkreis von ${radius} km`);
    myTitleOther.font = Font.boldRoundedSystemFont(15)
    myTitleOther.textColor = Color.red()
    myTitleOther.centerAlignText();

    let myOtherStations = selectedStations.slice(1, 4);
    for (let iEle of myOtherStations) {
        myOtherStack.addSpacer(3);
        drawOther(myOtherStack, iEle);
    }

    return list;

    function drawCheapest(attr) {
        let myMapURL = createGoogleMapMarkerByAddress(attr);
        console.log(`myMapURL ${myMapURL}`);
        let firstLineStack = list.addStack();
        firstLineStack.url = myMapURL;

        let myName = attr.brand ? attr.brand : attr.name;
        let stationName = firstLineStack.addText(myName)
        stationName.lineLimit = 2;
        stationName.font = Font.boldSystemFont(15)
        stationName.textColor = textColor

        firstLineStack.addSpacer()
        let stationOpen = firstLineStack.addText(open)
        stationOpen.font = Font.mediumSystemFont(10)
        stationOpen.rightAlignText()

        list.addSpacer(3);
        let addressStack = list.addStack();
        addressStack.url = myMapURL;

        addAddressPart(attr.place + ", ");
        addAddressPart(attr.street);
        addAddressPart(" " + attr.houseNumber);
        addAddressPart(` (${attr.dist} km)`);

        list.addSpacer(5);

        let dieselStack = list.addStack();
        let dieselLabel = dieselStack.addText("Diesel:");
        dieselLabel.font = Font.boldSystemFont(12);
        dieselLabel.textColor = textColor;

        dieselStack.addSpacer();
        let dieselPrice = dieselStack.addText(formatValue(attr.diesel));
        dieselPrice.font = Font.italicSystemFont(12);
        dieselPrice.textColor = textColor;

        list.addSpacer(1);

        let e5Stack = list.addStack();
        let e5Label = e5Stack.addText("Benzin E5:");
        e5Label.font = Font.boldSystemFont(12);
        e5Label.textColor = textColor;

        e5Stack.addSpacer();
        let e5Price = e5Stack.addText(formatValue(attr.e5));
        e5Price.font = Font.italicSystemFont(12);
        e5Price.textColor = textColor;

        list.addSpacer(1);

        let e10Stack = list.addStack();
        let e10Label = e10Stack.addText("Benzin E10:");
        e10Label.font = Font.boldSystemFont(12);
        e10Label.textColor = textColor;

        e10Stack.addSpacer();
        let e10Price = e10Stack.addText(formatValue(attr.e10));
        e10Price.font = Font.italicSystemFont(12);
        e10Price.textColor = textColor;
        return addressStack;
        function addAddressPart(pText) {
            addTextToStack(addressStack, pText);
        }

    }

    function drawOther(pOtherStack, pTankstelle) {
        let myMapURL = createGoogleMapMarkerByAddress(pTankstelle);
        console.log(`myMapURL ${myMapURL}`);
        let firstLineStack = pOtherStack.addStack();
        firstLineStack.url = myMapURL;

        let myName = pTankstelle.brand ? pTankstelle.brand : pTankstelle.name;
        let stationName = firstLineStack.addText(myName);
        stationName.font = Font.boldSystemFont(12);
        stationName.textColor = textColor;
        firstLineStack.addSpacer(5);

        addTextToStack(firstLineStack, pTankstelle.place);
        firstLineStack.addSpacer(5);
        addTextToStack(firstLineStack, ` (${pTankstelle.dist} km)`);

        firstLineStack.addSpacer();
        let stationOpen = firstLineStack.addText(formatValue(pTankstelle[brand]));
        stationOpen.font = Font.italicSystemFont(12);
        stationOpen.rightAlignText();

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

    function addTextToStack(pAddressStack, pText) {
        let houseNumber = pAddressStack.addText(pText);
        houseNumber.font = Font.lightSystemFont(12);
        houseNumber.textColor = textColor;
    }
}

function drawLine(point1, point2, width, color) {
    let drawContext = getDrawContext();
    const path = new Path();
    path.move(point1);
    path.addLine(point2);
    drawContext.addPath(path);
    drawContext.setStrokeColor(color);
    drawContext.setLineWidth(width);
    drawContext.strokePath();
    return drawContext;
}

function getDrawContext() {

    let drawContext = new DrawContext();
    drawContext.size = new Size(widgetWidth, widgetHeight);
    drawContext.opaque = false;
    return drawContext;
}
