// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: brown; icon-glyph: magic;
const conVersion = "V221112telekom";

const apiUrl = "https://pass.telekom.de/api/service/generic/v1/status";
const conTelekomURL = "https://pass.telekom.de";

// antiquewhite
const conAntiqueWhite = new Color("#faebd7");
const conGrayout = Color.darkGray();
const conPercentageLow = 10;
const conRemainingDaysLow = 1 / 2;
const conPercentageVeryLow = 1;
const conRemainingHoursVeryLow = 6;
const conDaysPerPackage = 31;

const colorLow = new Color('#FAD643', 1); // < 5
const colorMed = new Color('#E8B365', 1); // < 20
const colorHigh = new Color('#DD5045', 1); // < 200
const colorUltra = new Color('#8E0000', 1); // >= 200

const DAY_IN_SECONDS = 24 * 60 * 60;//86400000;
const DAY_IN_MICROSECONDS = DAY_IN_SECONDS * 1000;//86400000;
const lineWeight = 2;
const vertLineWeight = 36;
const accentColor1 = Color.black(); //new Color('#33cc33', 1);
const accentColor2 = Color.lightGray();

const widgetHeight = 338;
const widgetWidth = 720;
const graphLow = 200;
const graphHeight = 100;
const spaceBetweenDays = 47.5;
const bedsGraphBaseline = 290;
const bedsPaddingLeft = 32;
const bedsPaddingRight = 32;
const bedsLineWidth = 12;

let myResult = await createWidget();
//showObject(myResult, "createWidget");
let widget = myResult.widget;
widget.backgroundColor = conAntiqueWhite;
if (myResult.drawContext) {
    widget.setPadding(0, 0, 0, 0);
    widget.backgroundImage = (myResult.drawContext.getImage());
}

await widget.presentMedium()

Script.setWidget(widget)
Script.complete()

async function createWidget() {
    // local did not reliably work on 11.11.2021
    //let fm = FileManager.local()
    let fm = FileManager.iCloud()
    let dir = fm.documentsDirectory()
    let path = fm.joinPath(dir, "scriptable-telekom.json")
    try {
        let fresh, myStoredData;
        try {
            let { rfresh, rmyStoredData } = await getData(fm, path);
            fresh = rfresh; myStoredData = rmyStoredData;
        } catch (e) {
            const errorList = new ListWidget();
            errorList.addText(e);
            return { widget: errorList };
        }
        let myNewHistory = [];

        // #region get myNewHistory
        // history
        const conHistoryPath = fm.joinPath(dir, "ScriptableTelekomHistory.json");
        // array of myStoredData = { version: `Written by telekom.js version: ${conVersion}`, data: data, accessTime: new Date().getTime(), accessString: new Date().toString() };

        let myHistoryData = await readAndStoreHistory(fm, conHistoryPath, fresh ? myStoredData : undefined);
        console.log("Show data: " + myHistoryData.length);
        // set true, if test for red needed
        let myTest = false;
        if (myHistoryData.length >= 0) {
            let myFirstDataEntry = myHistoryData[0];
            let myEndDate = calcEndDate(myFirstDataEntry);
            console.log(`myFirstDataEntry: ${getDateStringFromEntry(myFirstDataEntry)} - end time: ${myEndDate.toLocaleString()}`);
            let myStartDate = new Date(myEndDate.getTime() - conDaysPerPackage * DAY_IN_MICROSECONDS);
            console.log(`myStartDate: ${myStartDate.toLocaleString()}`);

            let myStartData = { usedPercentage: 0, remainingSeconds: conDaysPerPackage * DAY_IN_SECONDS };
            let myOldestEntry = { data: myStartData, accessTime: myStartDate.getTime(), accessString: new Date(myStartDate.getTime()).toString() };
            showObject(myOldestEntry, "myOldestEntry");

            myNewHistory = [{ entry: myOldestEntry, dateString: getDateStringFromEntry(myOldestEntry), date: new Date(myOldestEntry.accessTime) }];
            let myIndex = 0;
            let myNowString = getDateStringFromDate(new Date());
            let myNextDay = new Date(myOldestEntry.accessTime + DAY_IN_MICROSECONDS);

            while (getDateStringFromDate(myNextDay).localeCompare(myNowString) <= 0) {
                for (let i = myIndex; i < myHistoryData.length; i++) {
                    let myCurr = myHistoryData[i];
                    if (getDateStringFromEntry(myCurr).localeCompare(getDateStringFromDate(myNextDay)) <= 0) {
                        myIndex = i;
                        myOldestEntry = myCurr;
                    }
                    else {
                        break;
                    }
                }
                //let myNextEntry = myOldestEntry;
                //console.log(`myTest: ${getDateStringFromDate(myNextDay)} ${myNowString} ${getDateStringFromDate(myNextDay) === myNowString}`);
                if (myTest && getDateStringFromDate(myNextDay) === myNowString) {
                    myOldestEntry.data.usedPercentage = 99;
                    //showObject(myNextEntry, `Test Entry`);
                }
                myNewHistory.push({ entry: myOldestEntry, dateString: getDateStringFromDate(myNextDay), date: myNextDay });
                myNextDay = new Date(myNextDay.getTime() + 24 * 60 * 60 * 1000);
            }
            // pack runs 31 days
            const conTotalSeconds = 31 * 24 * 60 * 60;

            for (let iEle of myNewHistory) {
                let myRestSeconds = (myEndDate.getTime() - iEle.date.getTime()) / 1000;
                let myRestTime = 100 * myRestSeconds / conTotalSeconds;
                console.log(`${iEle.dateString}: data: ${100 - iEle.entry.data.usedPercentage}% time: ${myRestTime.toFixed()}%`);
            }
        }
        else {
            console.log("No data");
        }
        // #endregion

        let drawContext = new DrawContext();
        drawContext.size = new Size(widgetWidth, widgetHeight);
        drawContext.opaque = false;

        const widget = new ListWidget();

        let min = 0;
        let max = 100;

        let diff = max - min;

        console.log(`myNewHistory.length: ${myNewHistory.length}`);
        for (let i = 0; i < myNewHistory.length; i++) {
            // { entry: myOldestEntry, dateString: getDateStringFromDate(myNextDay), date: myNextDay }
            const day = myNewHistory[i].date.getDate();
            const dayOfWeek = myNewHistory[i].date.getDay();
            const myRestPercentage = 100 - myNewHistory[i].entry.data.usedPercentage;
            const delta = (myRestPercentage - min) / diff;

            let myEndDate = calcEndDate(myNewHistory[i].entry);
            if (!myEndDate) {
                throw "calcEndDate undefined";
            }
            let myRestSeconds = (myEndDate.getTime() - new Date().getTime()) / 1000;
            // pack runs 31 days
            const conTotalSeconds = conDaysPerPackage * DAY_IN_SECONDS;
            let myRestTime = 100 * myRestSeconds / conTotalSeconds;

            console.log(`${i} day: ${day}- myRestPercentage: ${myRestPercentage} myRestTime: ${myRestTime.toFixed()}`);

            // Vertical Line

            let drawColor;

            if (myRestPercentage < myRestTime) {
                drawColor = Color.red();
            }
            else {
                drawColor = Color.green();
            }

            const point1 = new Point(spaceBetweenDays * i + 50, graphLow - (graphHeight * delta));
            const point2 = new Point(spaceBetweenDays * i + 50, graphLow + 10);
            drawLine(drawContext, point1, point2, vertLineWeight, drawColor);
            //console.log(`${i} x: ${point1.x}- y: ${point1.y}`);

            let dayColor;

            if (dayOfWeek === 0 || dayOfWeek === 6) {
                dayColor = accentColor2;
            } else {
                dayColor = accentColor1;
            }

            const casesRect = new Rect(spaceBetweenDays * i + 37, (graphLow - 40) - (graphHeight * delta), 60, 23);
            //console.log(`${i} ${day} x: ${spaceBetweenDays * i + 20}- y: ${(graphLow - 40) - (graphHeight * delta)}`);
            const dayRect = new Rect(spaceBetweenDays * i + 44, graphLow + 15, 50, 23);

            drawTextR(drawContext, myRestPercentage, casesRect, accentColor1, Font.systemFont(21));
            drawTextR(drawContext, day, dayRect, dayColor, Font.systemFont(21));
        }

        return { widget: widget, drawContext: drawContext };
    }
    catch (err) {
        const errorList = new ListWidget();
        errorList.addText("error: " + err);
        //throw "Please disable WiFi for initial execution (1)";
        //return errorList;
        //list.addText("error: " + err);
        console.error("Err2");
        console.error(err);
        //showObject(err, "Err2");
        return { widget: errorList };
    }
    /**
     * adds date to list, date format or time format depending on distance to now. Returns added WidgetStack
     * @param {any} pDate
     * @param {any} pTitle
     * @param {any} pColor
     */
    function addDateLine(pDate, pTitle, pColor) {
        const footer = list.addStack();
        footer.layoutHorizontally();
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
        return footer;

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

/**
 * read latest value from server or file
 * @param {FileManager} fm
 * @param {string} path
 */
async function getData(fm, path) {
    // ServerData
    // usedVolumeStr: 839, 31 MB
    // remainingTimeStr: 12 Tage 5 Std.
    // hasOffers: true
    // remainingSeconds: 1055447
    // usedAt: 1620191668000
    // validityPeriod: 5
    // usedPercentage: 33
    // title:
    // initialVolume: 2684354560
    // initialVolumeStr: 2, 5 GB
    // passType: 101
    // nextUpdate: 10800
    // subscriptions: speedon, roamLikeHome, tns, m4mBundle, migtest
    // usedVolume: 880088349
    // passStage: 1
    // passName: Data Flex 2, 5 GB
    let r = new Request(apiUrl);
    // API only answers for mobile Safari
    r.headers = {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1"
    };
    /** {data: ServerData, accessTime} */
    let myStoredData;
    /** ServerData */
    let data;
    /** indicate read from server*/
    let fresh = false;
    try {
        // Fetch data from pass.telekom.de
        data = await r.loadJSON();
        //showObject(data, "r.loadJSON");
        myStoredData = { version: `Written by telekom.js version: ${conVersion}`, data: data, accessTime: new Date().getTime(), accessString: new Date().toString() };
        let myStoredStringWrite = JSON.stringify(myStoredData, null, 2);
        // Write JSON to iCloud file
        fm.writeString(path, myStoredStringWrite);
        let myStoredStringRead = fm.readString(path);
        if (myStoredStringRead !== myStoredStringWrite) {
            showObject(myStoredStringRead, "myStoredStringRead");
            showObject(myStoredStringWrite, "myStoredStringWrite");
            //const errorList = new ListWidget();
            //errorList.addText("Internal Error: myStoredStringRead !== myStoredStringWrite");
            throw "Internal Error: myStoredStringRead !== myStoredStringWrite";
            //return errorList;
        }
        fresh = true;
    }
    catch (err) {
        showObject(err, "catch (err)");
        try {
            // if reading from pass.telekom.de not possible-> read data from iCloud file
            myStoredData = JSON.parse(fm.readString(path), null);
            showObject(myStoredData, "fm.readString");
            if (!myStoredData) {
                //const errorList = new ListWidget();
                //errorList.addText("Please disable WiFi for initial execution (1)");
                throw "Please disable WiFi for initial execution (1)";
                //return errorList;
            }
            data = myStoredData.data; // ? myStoredData.data : myStoredData;
            if (!data || !data.usedPercentage) {
                //const errorList = new ListWidget();
                //errorList.addText("Please disable WiFi for initial execution (2)");
                throw "Please disable WiFi for initial execution (2)";
                //return errorList;
            }
        } catch (errInner) {
            console.error("errInner");
            console.error(errInner);
            throw errInner;
        }
    }
    return { fresh, myStoredData };
}

/**
 * string from server entry
 * @param {{accessTime:number}} pEntry
 */
function getDateStringFromEntry(pEntry) {
    return getDateStringFromMSecs(pEntry.accessTime);
}
/**
 * string from mSecs
 * @param {number} pDateMSecs
 */
function getDateStringFromMSecs(pDateMSecs) {
    return getDateStringFromDate(new Date(pDateMSecs));
}
/**
 * string from date
 * @param {Date} pDate
 */
function getDateStringFromDate(pDate) {
    try {
        let myMonthString = ("0" + (pDate.getMonth() + 1)).slice(-2);
        let myDayString = ("0" + (pDate.getDate())).slice(-2);
        return `${pDate.getFullYear()}-${myMonthString}-${myDayString}`;
    } catch (e) {
        return e + ": " + pDate;
    }
}

/**
 * return ascending history
 * @param {FileManager} fm
 * @param {string} conHistoryPath
 * @param {undefined | {usedVolume:number, accessTime:number}} pStoredData: undefined or server entry
 */
async function readAndStoreHistory(fm, conHistoryPath, pStoredData) {
    // ServerData
    // usedVolumeStr: 839, 31 MB
    // remainingTimeStr: 12 Tage 5 Std.
    // hasOffers: true
    // remainingSeconds: 1055447
    // usedAt: 1620191668000
    // validityPeriod: 5
    // usedPercentage: 33
    // title:
    // initialVolume: 2684354560
    // initialVolumeStr: 2, 5 GB
    // passType: 101
    // nextUpdate: 10800
    // subscriptions: speedon, roamLikeHome, tns, m4mBundle, migtest
    // usedVolume: 880088349
    // passStage: 1
    // passName: Data Flex 2, 5 GB
    try {
        //console.log("storeHistory");
        let myHistoryData = await readHistoryData();

        //console.log("After sort");
        //for (let iEle of myHistoryData) {
        //    console.log(`${iEle.accessString}: ${iEle.data.usedPercentage}%`);
        //}
        let myNewHistory = [];
        for (let i = 0; i < myHistoryData.length; i++) {
            let myCurr = myHistoryData[i];
            pushOrReplace(myNewHistory, myCurr);
        }
        if (pStoredData) {
            // add only new data
            console.log(`push new data: ${pStoredData.accessString}: ${pStoredData.data.usedPercentage}%`);
            pushOrReplace(myNewHistory, pStoredData);
        }

        // replace with new array
        myHistoryData = myNewHistory;
        //console.log("After pushOrReplace");
        //for (let iEle of myHistoryData) {
        //    console.log(`${iEle.accessString}: ${iEle.data.usedPercentage}%`);
        //}

        myHistoryDataString = JSON.stringify(myHistoryData);
        fm.writeString(conHistoryPath, myHistoryDataString);
        return myHistoryData;
    } catch (e) {
        console.log("err storeHistory: " + e);
        return [];
    }

    /** read from file */
    async function readHistoryData() {
        let myHistoryData = [];
        if (fm.fileExists(conHistoryPath)) {
            await fm.downloadFileFromiCloud(conHistoryPath);
            let myHistoryDataString = fm.readString(conHistoryPath);
            if (myHistoryDataString) {
                myHistoryData = JSON.parse(myHistoryDataString);
                console.log("fileExists: ");
                for (let iEle of myHistoryData) {
                    console.log(`${iEle.accessString}: ${iEle.data.usedPercentage}%`);
                }
            }
            else {
                console.log("file does not exist");
            }
        }
        else {
            console.log("file not Exists: ");
        }
        // sort ascending
        myHistoryData.sort(function (left, right) { return left.accessTime - right.accessTime; });
        return myHistoryData;
    }

    /**
     * 
     * @param {{usedVolume:number, accessTime:number}[]} pNewHistory
     * @param {{usedVolume:number, accessTime:number}} pCurr
     */
    function pushOrReplace(pNewHistory, pCurr) {
        if (pNewHistory.length <= 0) {
            //console.log("pushOrReplace: push to new");
            pNewHistory.push(pCurr);
        }
        else {
            if (pNewHistory[pNewHistory.length - 1].usedVolume > pCurr.usedVolume) {
                // new pass
                pNewHistory = [pCurr];
            }
            else {
                if (getDateStringFromMSecs(pNewHistory[pNewHistory.length - 1].accessTime) === getDateStringFromMSecs(pCurr.accessTime)) {
                    // update with latest entry from day
                    pNewHistory[pNewHistory.length - 1] = pCurr;
                }
                else {
                    pNewHistory.push(pCurr);
                }
            }
        }
    }
}


/**
 * calc end date from current + remaining seconds
 * @param {any} data
 */
function calcEndDate(pStoredData) {
    // usedAt = msec
    if (!pStoredData.data || !pStoredData.accessTime) {
        showObject(pStoredData, "calcEndDate")
        return undefined;
    }
    let data = pStoredData.data;
    let myEndDate = new Date(pStoredData.accessTime + data.remainingSeconds * 1000);
    return myEndDate;
}

function showLink(widget, title, pURL) {
    widget.addSpacer(8)
    // Add button to open documentation
    let linkSymbol = SFSymbol.named("arrow.up.forward")
    let footerStack = widget.addStack()
    let linkStack = footerStack.addStack()
    // if the widget is small, link does not work!
    linkStack.url = pURL;
    let linkElement = linkStack.addText(title)
    linkElement.font = Font.title2(); //Font.mediumSystemFont(13)
    linkElement.textColor = Color.blue()
    linkStack.addSpacer(3)
    let linkSymbolElement = linkStack.addImage(linkSymbol.image)
    linkSymbolElement.imageSize = new Size(11, 11)
    linkSymbolElement.tintColor = Color.blue()
}

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
            let myObjString = JSON.stringify(pObject, null, 2);
            console.log(myObjString);
            //for (var key in pObject) {
            //    console.log(key + ": " + pObject[key]);
            //    if (pObject[key] === "object") {

            //    }
            //}
        }
        else if (typeof pObject === "function") {
            console.log("Object is a function");
        }
        else {
            console.log(`${pObject}`);
        }
    }
}

function drawTextR(drawContext, text, rect, color, font) {
    drawContext.setFont(font);
    drawContext.setTextColor(color);
    drawContext.drawTextInRect(new String(text).toString(), rect);
}

function drawLine(drawContext, point1, point2, width, color) {
    const path = new Path();
    path.move(point1);

    path.addLine(point2);
    drawContext.addPath(path);
    drawContext.setStrokeColor(color);
    drawContext.setLineWidth(width);
    drawContext.strokePath();
}