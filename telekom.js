// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: brown; icon-glyph: magic;
const conVersion = "V221114telekom";

const apiUrl = "https://pass.telekom.de/api/service/generic/v1/status";
const conTelekomURL = "https://pass.telekom.de";

// antiquewhite
const conAntiqueWhite = new Color("#faebd7");
const conGrayout = Color.darkGray();
const conPercentageLow = 10;
const conRemainingDaysLow = 1 / 2;
const conPercentageVeryLow = 1;
const conRemainingHoursVeryLow = 6;

let widget = await createWidget();
widget.backgroundColor = conAntiqueWhite;
if (!config.runsInWidget) {
    await widget.presentLarge()
}

Script.setWidget(widget)
Script.complete()

async function createWidget() {
    // local did not reliably work on 11.11.2021
    //let fm = FileManager.local()
    let fm = FileManager.iCloud()
    let dir = fm.documentsDirectory()
    let path = fm.joinPath(dir, "scriptable-telekom.json")
    //console.log(`fm.joinPath ${path}`);

    const list = new ListWidget()
    list.addSpacer(10)

    try {
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
        let r = new Request(apiUrl)
        // API only answers for mobile Safari
        r.headers = {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1"
        }
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
                const errorList = new ListWidget();
                errorList.addText("Internal Error: myStoredStringRead !== myStoredStringWrite");
                return errorList;
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
                    const errorList = new ListWidget();
                    errorList.addText("Please disable WiFi for initial execution (1)");
                    return errorList;
                }
                data = myStoredData.data; // ? myStoredData.data : myStoredData;
                if (!data || !data.usedPercentage) {
                    const errorList = new ListWidget();
                    errorList.addText("Please disable WiFi for initial execution (2)");
                    return errorList;
                }
            } catch (errInner) {
                console.error("errInner");
                console.error(errInner);
            }
        }

        // history
        const conHistoryPath = fm.joinPath(dir, "ScriptableTelekomHistory.json");
        // array of myStoredData = { version: `Written by telekom.js version: ${conVersion}`, data: data, accessTime: new Date().getTime(), accessString: new Date().toString() };

        let myHistoryData = await readAndStoreHistory(fm, conHistoryPath, fresh ? myStoredData : undefined);
        console.log("Show data: " + myHistoryData.length);

        if (myHistoryData.length >= 0) {
            let myOldestEntry = myHistoryData[0];
            let myEndDate = calcEndDate(myOldestEntry);
            console.log(`myOldestEntry: ${getDateStringFromEntry(myOldestEntry)} - end time: ${myEndDate.toLocaleString()}`);

            let myNewHistory = [{ entry: myOldestEntry, dateString: getDateStringFromEntry(myOldestEntry), date: new Date(myOldestEntry.accessTime) }];
            let myIndex = 0;
            let myNowString = getDateStringFromDate(new Date());
            let myNextDay = new Date(myOldestEntry.accessTime + 24 * 60 * 60 * 1000);

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
                myNewHistory.push({ entry: myOldestEntry, dateString: getDateStringFromDate(myNextDay), date: myNextDay });
                myNextDay = new Date(myNextDay.getTime() + 24 * 60 * 60 * 1000);
            }
            for (let iEle of myNewHistory) {
                let myRestSeconds = (myEndDate.getTime() - iEle.date.getTime()) / 1000;
                // pack runs 31 days
                const conTotalSeconds = 31 * 24 * 60 * 60;
                let myRestTime = 100 * myRestSeconds / conTotalSeconds;

                console.log(`${iEle.dateString}: data: ${100 - iEle.entry.data.usedPercentage}% time: ${myRestTime.toFixed()}%`);
            }
        }
        else {
            console.log("No data");
        }


        // now data contains data from server or from local file
        //showObject(data, "Data");
        showLink(list, "Rest data/time", conTelekomURL);
        let myRestData = 100 - data.usedPercentage;

        // time = msec
        let myEndDate = calcEndDate(myStoredData);
        if (!myEndDate) {
            const errorList = new ListWidget();
            errorList.addText("Please disable WiFi for initial execution (no data cached)");
            return errorList;
        }
        let myRestSeconds = (myEndDate.getTime() - new Date().getTime()) / 1000;
        // pack runs 31 days
        const conTotalSeconds = 31 * 24 * 60 * 60;
        let myRestTime = 100 * myRestSeconds / conTotalSeconds;
        let myFixed = myRestTime >= 10 ? 0 : 1;

        let myCompare = ">=";
        let myAlert = "";
        if (myRestData < myRestTime) {
            myCompare = "<";
            myAlert = "!";
        }
        let myRestText = `${myRestData.toFixed(0)}% ${myCompare} ${myRestTime.toFixed(myFixed)}% ${myAlert}`;
        const lineRestText = list.addText(myRestText);

        //showLink(list, "Used data");

        //const line2 = list.addText(data.usedPercentage + "%")
        lineRestText.font = Font.boldSystemFont(20);

        lineRestText.textColor = Color.green();
        if (myRestData < myRestTime) {
            lineRestText.textColor = Color.red();
        }

        const myRemainingData = 100 - data.usedPercentage;
        // notify if less than LowDays left
        const conRemainingSecondsLow = 60 * 60 * 24 * conRemainingDaysLow;
        const conRemainingSecondsVeryLow = 60 * 60 * conRemainingHoursVeryLow;
        if (myRemainingData <= 0 || (myRestSeconds <= 0)) {
            let notify1 = new Notification();
            //let myRemainingHours = (myRestSeconds / (60 * 60)).toFixed(0);
            notify1.title = "Telekom data empty!";
            let myString = "Stop WLAN and click here to go to Telekom App";
            notify1.body = myString;
            notify1.openURL = conTelekomURL;
            await notify1.schedule();
        }
        else if (myRemainingData <= conPercentageVeryLow || (myRestSeconds <= conRemainingSecondsVeryLow)) {
            let notify1 = new Notification();
            let myRemainingHours = (myRestSeconds / (60 * 60)).toFixed(0);
            let myString = "Remaining: " + myRemainingData.toString() + "% - " + myRemainingHours + " hours";
            notify1.title = "Telekom data very low!";
            notify1.body = myString;
            notify1.openURL = conTelekomURL;
            await notify1.schedule();
        }
        else if (myRemainingData <= conPercentageLow || (myRestSeconds <= conRemainingSecondsLow)) {
            let notify1 = new Notification();
            notify1.title = "Remaining Telekom data low";
            if (myRestSeconds < 60 * 60 * 24) {
                // less than 1 day-> show hours
                let myRemaininghours = (myRestSeconds / (60 * 60)).toFixed(0);
                let myString = "Remaining: " + myRemainingData.toString() + "% - " + myRemaininghours + " hours";
                notify1.body = myString;
            }
            else {
                let myRemainingDays = (myRestSeconds / (60 * 60 * 24)).toFixed(0);
                let myString = "Remaining: " + myRemainingData.toString() + "% - " + myRemainingDays + " days";
                notify1.body = myString;
            }
            notify1.openURL = conTelekomURL;
            await notify1.schedule();
        }

        const lineUsedVolume = list.addText(data.usedVolumeStr + " / " + data.initialVolumeStr)
        lineUsedVolume.font = Font.mediumSystemFont(12)

        list.addSpacer(16)

        let lineUntilTitle, lineEndDate, lineEndHour

        let myUntilStack = list.addStack();
        myUntilStack.spacing = 4;
        lineUntilTitle = myUntilStack.addText("Runs until:");
        lineUntilTitle.font = Font.mediumSystemFont(12);

        // calc end of current pack
        lineEndDate = myUntilStack.addDate(myEndDate);
        lineEndDate.font = Font.mediumSystemFont(12);
        // show hour
        lineEndHour = myUntilStack.addDate(myEndDate);
        lineEndHour.applyTimeStyle();
        lineEndHour.font = Font.mediumSystemFont(12);

        list.addSpacer(4);
        let myDateColor = Color.black();
        // Gray out if local data instead of Telekom API data:
        if (!fresh) {
            myDateColor = conGrayout;
            //             lineRestText.textColor = conGrayout;
            lineUsedVolume.textColor = conGrayout;
            if (data.remainingTimeStr) {
                lineUntilTitle.textColor = conGrayout
                lineEndDate.textColor = conGrayout
                lineEndHour.textColor = conGrayout
            }
        }

        // Add time of last widget refresh:
        addDateLine(new Date(), "App refresh", myDateColor);
        addDateLine(new Date(data.usedAt), "Server refresh", myDateColor);

        // version right aligned
        let myVersiontext = list.addText(`${conVersion}`);
        myVersiontext.font = Font.italicSystemFont(10);
        myVersiontext.rightAlignText();
    }
    catch (err) {
        list.addText("error: " + err);
        console.error("Err2");
        console.error(err);
        //showObject(err, "Err2");
    }

    return list
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

        console.log("After sort");
        for (let iEle of myHistoryData) {
            console.log(`${iEle.accessString}: ${iEle.data.usedPercentage}%`);
        }
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
