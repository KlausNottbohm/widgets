// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-purple; icon-glyph: magic;

// show cheapest Tankstelle in radius
//
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
const conVersion = "V220409Tank";

const widgetHeight = 18;
const widgetWidth = 1720;

/**default radius */
const conRadius = 10;
let radius = conRadius, fixedLocation, latitude, longitude, myLocation;
/** name to show for fuel type. tb translated to myFuelType = |diesel|e5|e10 */
let brand = "Diesel";
/** property name in service json */
let myFuelType = "diesel";

let widgetInput = args.widgetParameter;
let apiKey = "ea6a2788-eb7c-d68d-914e-b11a471d56cb";

const backColor = Color.dynamic(new Color('FFFFFF'), new Color('111111'));
const backColor2 = Color.dynamic(new Color('EEEEEE'), new Color('222222'));
const textColor = Color.dynamic(new Color('000000'), new Color('EDEDED'));
// 0xC7DECA
const conOtherColor = new Color('C7DECA');

const conNormalFont = Font.lightSystemFont(12);

const apiURL = (location, radius, apiKey) => `https://creativecommons.tankerkoenig.de/json/list.php?lat=${location.latitude.toFixed(3)}&lng=${location.longitude.toFixed(3)}&rad=${radius}&sort=dist&type=all&apikey=${apiKey}`

if (widgetInput !== null) {
    console.log(`widgetInput ${widgetInput}`);
    [radius, brand, fixedLocation, latitude, longitude] = widgetInput.split(",");

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
if (brand.toLowerCase() === "e5") {
    myFuelType = "e5";
}
else if (brand.toLowerCase() === "e10") {
    myFuelType = "e10";
}

let station = await loadStation(apiKey, radius, fixedLocation, myLocation)
let widget = await createWidget(station)

if (!config.runsInWidget) {
    await widget.presentLarge()
}

Script.setWidget(widget)
Script.complete()

async function getCurrentLocation() {
    try {
        Location.setAccuracyToThreeKilometers();
        let location = await Location.current();
        console.log('get current lat/lon ' + location?.latitude + " " + location?.longitude);
        return location;
    } catch (e) {
        let location = getDefaultLocation();
        console.log('using saved lat/lon ' + location?.latitude + " " + location?.longitude);
        return location;
    }
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
    data.stations = data.stations.filter(function (pVal) { return !!pVal[myFuelType]; });
    //console.log("");
    //console.log("nach sort");
    //console.log(data);
    return data;
}

function getDefaultLocation() {
    let location = { latitude: 49.0, longitude: 8.5 };
    return location;
};

function formatValue(value) {
    if (!value) {
        return '-'
    }
    let price = value.toFixed(2);

    return price + "€"
}

async function createWidget(data) {

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

    let myTitleStack = list.addStack();
    let myTitle1 = myTitleStack.addText(`Günstigste Tankstelle`);
    myTitle1.font = Font.boldRoundedSystemFont(15)
    myTitle1.textColor = Color.red()
    myTitle1.centerAlignText();

    myTitleStack.addSpacer();
    let myTitle = myTitleStack.addText(`Umkreis ${radius} km`);
    myTitle.font = Font.blackSystemFont(15);
    myTitle.textColor = Color.black()
    myTitle.centerAlignText();

    selectedStations.sort(function (left, right) {
        // sort by price, then radius
        let myComp = left[myFuelType] - right[myFuelType];
        if (myComp === 0) {
            myComp = left.radius - right.radius;
        }
        return myComp;
    });

    const myCheapest = selectedStations[0];
    let open = myCheapest.isOpen ? `open` : 'closed';

    drawCheapest(myCheapest);

    // show next 3 cheapest
    showOtherStations(selectedStations.slice(1, 4), `Andere ${brand}-Preise`, conOtherColor);

    // sort by total cost
    selectedStations.sort(function (left, right) {
        return calcTotal(left) - calcTotal(right);
    });
    // show first 3 by total cost
    showOtherStations(selectedStations.slice(0, 3), `Nach ${brand}-Kosten incl. Anfahrt`, new Color('DFDFDF'));

    // add footer
    addFooter(list);

    return list;

    function showOtherStations(pStations, pTitle, pColor) {
        //let myColor = Color.lightGray();
        let myHorizontalLine = drawLine(new Point(0, 10), new Point(widgetWidth, 10), 10, Color.black());
        list.addImage(myHorizontalLine.getImage());

        list.addSpacer(5);
        let myOtherStack = list.addStack();
        myOtherStack.backgroundColor = pColor;
        myOtherStack.layoutVertically();

        let myTitleStackOther = myOtherStack.addStack();
        let myTitleOther = myTitleStackOther.addText(pTitle);//(`Nach total cost ${brand}-Preise im Umkreis von ${radius} km`);
        myTitleOther.font = Font.boldRoundedSystemFont(15);
        myTitleOther.textColor = Color.red();
        myTitleOther.centerAlignText();

        for (let iStation of pStations) {
            myOtherStack.addSpacer(3);
            drawOther(myOtherStack, iStation);
        }
    }

    /**
     * calc price + cost for driving to station
     * @param {any} pStation
     */
    function calcTotal(pStation) {
        // price for tank full
        let myTankPrice = 50 * pStation[myFuelType];
        // cost to drive back and forth
        let myDriveCost = pStation.dist * 2 * 0.2;
        let myTotal = myTankPrice + myDriveCost;
        //console.log(`myTotal ${myTotal}`);
        return myTotal;
    }

    function drawCheapest(pStation) {
        let myMapURL = createGoogleMapMarkerByAddress(pStation);
        console.log(`myMapURL ${myMapURL}`);
        let firstLineStack = list.addStack();
        firstLineStack.url = myMapURL;

        let myName = getName(pStation);
        let stationName = firstLineStack.addText(myName)
        stationName.lineLimit = 2;
        stationName.font = Font.boldSystemFont(12)
        stationName.textColor = textColor

        firstLineStack.addSpacer()
        let stationOpen = firstLineStack.addText(open)
        stationOpen.font = Font.mediumSystemFont(10)
        stationOpen.rightAlignText()

        list.addSpacer(3);
        let addressStack = list.addStack();
        addressStack.url = myMapURL;

        addAddressPart(pStation.place + ", ");
        addAddressPart(pStation.street);
        addAddressPart(" " + pStation.houseNumber);
        //addAddressPart(` (${attr.dist} km)`);
        //addLink(addressStack, ``, myMapURL, conNormalFont);

        addLink(addressStack, `(${pStation.dist} km)`, myMapURL, conNormalFont);

        list.addSpacer(5);

        let dieselStack = list.addStack();
        let dieselLabel = dieselStack.addText("Diesel:");
        dieselLabel.font = Font.boldSystemFont(12);
        dieselLabel.textColor = textColor;

        dieselStack.addSpacer();
        let dieselPrice = dieselStack.addText(formatValue(pStation.diesel));
        dieselPrice.font = Font.italicSystemFont(12);
        dieselPrice.textColor = textColor;

        list.addSpacer(1);

        let e5Stack = list.addStack();
        let e5Label = e5Stack.addText("Benzin E5:");
        e5Label.font = Font.boldSystemFont(12);
        e5Label.textColor = textColor;

        e5Stack.addSpacer();
        let e5Price = e5Stack.addText(formatValue(pStation.e5));
        e5Price.font = Font.italicSystemFont(12);
        e5Price.textColor = textColor;

        list.addSpacer(1);

        let e10Stack = list.addStack();
        let e10Label = e10Stack.addText("Benzin E10:");
        e10Label.font = Font.boldSystemFont(12);
        e10Label.textColor = textColor;

        e10Stack.addSpacer();
        let e10Price = e10Stack.addText(formatValue(pStation.e10));
        e10Price.font = Font.italicSystemFont(12);
        e10Price.textColor = textColor;
        return addressStack;

        /**
         * add text in conNormalFont and textColor to addressStack
         * @param {any} pText
         */
        function addAddressPart(pText) {
            addTextToStack(addressStack, pText);
        }
    }

    function drawOther(pOtherStack, pStation) {
        let myMapURL = createGoogleMapMarkerByAddress(pStation);
        console.log(`myMapURL ${myMapURL}`);
        let firstLineStack = pOtherStack.addStack();
        firstLineStack.url = myMapURL;

        let myName = getName(pStation);
        let stationName = firstLineStack.addText(myName);
        stationName.font = Font.boldSystemFont(12);
        stationName.textColor = textColor;
        firstLineStack.addSpacer(5);

        addTextToStack(firstLineStack, pStation.place);
        firstLineStack.addSpacer(5);
        addLink(firstLineStack, `(${pStation.dist} km)`, myMapURL, conNormalFont);

        firstLineStack.addSpacer();
        let stationOpen = firstLineStack.addText(formatValue(pStation[myFuelType]));
        stationOpen.font = Font.italicSystemFont(12);
        stationOpen.rightAlignText();
    }

    /**
     * shorten name to 20 chars
     * @param {any} pStation
     */
    function getName(pStation) {
        let myName = pStation.brand ? pStation.brand : pStation.name;
        let stationName = myName.length <= 20 ? myName : myName.slice(0, 17) + "...";
        return stationName;
    }

    /**
     * create google map url from one station object
     * @param {any} pStation
     */
    function createGoogleMapMarkerByCoord(pStation) {
        // https://stackoverflow.com/questions/1801732/how-do-i-link-to-google-maps-with-a-particular-longitude-and-latitude
        const createMapUrl = (pLat, pLong) => `https://www.google.com/maps/search/?api=1&query=${pLat},${pLong}`;
        let myMapURL = createMapUrl(pStation.lat, pStation.lng);
        return myMapURL;
    }
    function createGoogleMapMarkerByAddress(pStation) {
        // https://developers.google.com/maps/documentation/urls/get-started
        let myQuery = `${pStation.street} ${pStation.houseNumber}, ${pStation.place}`;
        let myEncQuery = encodeURIComponent(myQuery);
        const createMapUrl = (pQ) => `https://www.google.com/maps/search/?api=1&query=${pQ}`;
        let myMapURL = createMapUrl(myEncQuery);
        // does not work in scriptable
        //let myIOSQuery = `comgooglemaps://?q=${myEncQuery}`;
        return myMapURL;
    }
    /**
     *  add text in conNormalFont and textColor
     * @param {any} pAddressStack
     * @param {any} pText
     */
    function addTextToStack(pAddressStack, pText) {
        let myText = pAddressStack.addText(pText);
        myText.font = conNormalFont;
        myText.textColor = textColor;
    }
}

/**
 * add footer with last update time and version
 * @param {any} list
 */
function addFooter(list) {
    list.addSpacer(14);
    let myDateColor = Color.black();
    let myFooter = list.addStack();
    // Add time of last widget refresh:
    addDateLine(myFooter, new Date(), "App refresh", myDateColor);

    // version right aligned
    myFooter.addSpacer();
    let myVersiontext = myFooter.addText(`${conVersion}`);
    myVersiontext.font = Font.italicSystemFont(10);
    myVersiontext.rightAlignText();

    function addDateLine(footer, pDate, pTitle, pColor) {
        //const footer = pList.addStack();
        //footer.layoutHorizontally();
        let myTitle = footer.addText(pTitle);
        myTitle.font = Font.mediumSystemFont(10);
        myTitle.textColor = pColor;
        let myHoursSince = (new Date() - pDate) / (1000 * 60 * 60);
        if (myHoursSince <= 24) {
            // if today, show time
            addDateOrTime(true);
        }
        else {
            // if older show day
            addDateOrTime(false);
        }

        function addDateOrTime(pShowTime) {
            footer.addSpacer(4);
            let timeLabel = footer.addDate(pDate);
            timeLabel.font = Font.italicSystemFont(10);
            if (pShowTime) {
                timeLabel.applyTimeStyle();
            }
            timeLabel.textColor = pColor;
        }
    }
}

function addLink(widget, title, pURL, pFont, pColor) {
    widget.addSpacer(8)
    // Add button to open documentation 
    // option: arrow.forward (see https://github.com/SFSafeSymbols/SFSafeSymbols/blob/stable/Sources/SFSafeSymbols/Symbols/SFSymbol%2B2.0.swift)
    //let linkSymbol = SFSymbol.named("arrow.up.forward")
    let linkSymbol = SFSymbol.named("arrow.forward")
    let footerStack = widget.addStack()
    let linkStack = footerStack.addStack()
    // if the widget is small, link does not work!
    linkStack.url = pURL;
    let linkElement = linkStack.addText(title)
    linkElement.font = pFont ? pFont : Font.title2(); //Font.mediumSystemFont(13)
    linkElement.textColor = pColor ? pColor : Color.blue()
    linkStack.addSpacer(3)
    let linkSymbolElement = linkStack.addImage(linkSymbol.image)
    linkSymbolElement.imageSize = new Size(15, 15);
    linkSymbolElement.tintColor = Color.blue();
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
