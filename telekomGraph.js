/// <reference path="TypeDefinitions/scriptable.d.ts" />
// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: brown; icon-glyph: magic;
run();

/**wrapped all in function to remedy const access to other js files by eslint */
async function run() {
    const conVersion = "V221115telekom";

    let conIsTest = false;

    const conAPIUrl = "https://pass.telekom.de/api/service/generic/v1/status";
    const conTelekomURL = "https://pass.telekom.de";

    // antiquewhite : #faebd7
    const conAntiqueWhite = new Color("#faebd7");
    // telekom magenta 0xE20074
    const conMagenta = new Color("#E20074");
    const conWidgetBackgroundColor = conMagenta; //conAntiqueWhite

    // choose a color fitting to conWidgetBackgroundColor (alternatives for conAntiqueWhite after comment signs//)
    /**color for normal font */
    const conAccentColor1 = Color.white(); //conAntiqueWhite Color.black()
    /**weekend color */
    const conAccentColor2 = Color.lightGray();
    // middle blue : #6190E6
    /**color for link */
    const conLinkColor = new Color("#6190E6"); // conAntiqueWhite Color.blue()
    // light red : #FF7F7F
    /**color for low data value */
    const conAlertColor = new Color("#FF7F7F"); // conAntiqueWhite Color.red()

    const conPercentageLow = 10;
    const conRemainingDaysLow = 1 / 2;
    const conPercentageVeryLow = 1;
    const conRemainingHoursVeryLow = 6;
    const conDaysPerPackage = 31;

    const DAY_IN_SECONDS = 24 * 60 * 60;
    const DAY_IN_MILLISECONDS = DAY_IN_SECONDS * 1000;
    const vertLineWeight = 18;

    const widgetHeight = 338;
    const widgetWidth = 720;
    const graphLow = 200;
    const graphHeight = 100;
    const spaceBetweenDays = 22;
    const bedsGraphBaseline = 290;
    const conBottomTextPaddingLeft = 32;

    let widget = await createWidget();

    await widget.presentMedium()

    Script.setWidget(widget)
    Script.complete()

    async function createWidget() {
        // local did not reliably work on 11.11.2021
        //let fm = FileManager.local()
        let fm = FileManager.iCloud()

        let { fresh, myStoredData, wifiProblem } = await getStoredData(fm);
        if (wifiProblem) {
            // for wifi problem show error text (all other exceptions not caught)
            const errorList = new ListWidget();
            errorList.addText(wifiProblem);
            return errorList;
        }
        await notifyIfNeeded(myStoredData);

        let myStoredDatas = await readAndUpdateStoredDatas(fm, fresh ? myStoredData : undefined);

        console.log("Show data: " + myStoredDatas.length);
        let myHistoryDatas = getHistoryDatas(myStoredDatas);

        const widget = new ListWidget();
        widget.backgroundColor = conWidgetBackgroundColor;
        widget.url = conTelekomURL;

        let myDrawContext = new DrawContext();
        myDrawContext.size = new Size(widgetWidth, widgetHeight);
        myDrawContext.opaque = false;

        showHeader(widget, fresh);

        showStoredData(myStoredData, myDrawContext);

        showHistoryDatas(myHistoryDatas, myDrawContext);

        if (myDrawContext) {
            //let myDrawStack = list.addStack();
            widget.setPadding(0, 0, 0, 0);
            widget.backgroundImage = (myDrawContext.getImage());
        }

        return widget; //{ widget: widget, drawContext: drawContext };

    }

    // #region UI functions
    /**
   * show progress in columns
   * @param {any} myHistoryDatas
   * @param {any} drawContext
   */
    function showHistoryDatas(myHistoryDatas, drawContext) {
        let min = 0;
        let max = 100;

        let diff = max - min;

        console.log(`myHistoryDatas.length: ${myHistoryDatas.length}`);
        for (let i = 0; i < myHistoryDatas.length; i++) {
            // { entry: myOldestEntry, dateString: getDateStringFromDate(myNextDay), date: myNextDay }
            const day = myHistoryDatas[i].date.getDate();
            const dayOfWeek = myHistoryDatas[i].date.getDay();
            const myRestPercentage = 100 - myHistoryDatas[i].entry.data.usedPercentage;
            const delta = (myRestPercentage - min) / diff;

            let myEndDate = calcEndDate(myHistoryDatas[i].entry);
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
                drawColor = conAlertColor;
            }
            else {
                drawColor = Color.green();
            }

            const point1 = new Point(spaceBetweenDays * i + 50, graphLow - (graphHeight * delta));
            const point2 = new Point(spaceBetweenDays * i + 50, graphLow + 10);
            drawLine(drawContext, point1, point2, vertLineWeight, drawColor);
            let dayColor;

            if (dayOfWeek === 0 || dayOfWeek === 6) {
                dayColor = conAccentColor2;
            } else {
                dayColor = conAccentColor1;
            }
            const conFontSize = 18;
            let myShowPercent = (i - myHistoryDatas.length + 1) % 3;
            if (myShowPercent === 0) {
                const myRestPercentRect = new Rect(spaceBetweenDays * i + 38, (graphLow - 20) - (graphHeight * delta), 60, 23);
                drawTextR(drawContext, myRestPercentage + "%", myRestPercentRect, conAccentColor1, Font.systemFont(conFontSize));
            }
            const dayRect = new Rect(spaceBetweenDays * i + 40, graphLow + 15, 50, 23);
            drawTextR(drawContext, day, dayRect, dayColor, Font.systemFont(conFontSize));
        }
    }

    /**
     * show info about current status at bottom
     * @param {any} myStoredData
     * @param {any} drawContext
     */
    function showStoredData(myStoredData, drawContext) {
        let { myRestData, myRestTime, myEndDate } = getRestInfo(myStoredData);

        let myTextColor = conAccentColor1;
        //if (myRestData < myRestTime) {
        //    myTextColor = Color.red();
        //}
        let myRestDataRect = new Rect(conBottomTextPaddingLeft, bedsGraphBaseline - 40, widgetWidth / 2 - 100, 26);
        drawContext.setFont(Font.mediumSystemFont(26));
        drawContext.setTextColor(myTextColor);
        drawContext.drawTextInRect(myStoredData.data.usedVolumeStr + " / " + myStoredData.data.initialVolumeStr, myRestDataRect);

        let myEndDateRect = new Rect(conBottomTextPaddingLeft + widgetWidth / 2 - 90, bedsGraphBaseline - 40, widgetWidth / 2, 26);
        let myDateString = `Runs until ${myEndDate.toLocaleString("DE-de")}`;
        drawContext.drawTextInRect(myDateString, myEndDateRect);

        let myAppTime = `App refresh: ${niceDateString(new Date())}`;
        let myServerTime = `Server refresh: ${niceDateString(new Date(myStoredData.data.usedAt))}`;
        let myWidth = 220;
        drawContext.setFont(Font.mediumSystemFont(22));
        let myAppInfoRect = new Rect(conBottomTextPaddingLeft, bedsGraphBaseline - 0, widgetWidth - myWidth, 26);
        drawContext.drawTextInRect(myServerTime, myAppInfoRect);

        let myVersionInfoRect = new Rect(conBottomTextPaddingLeft + widgetWidth - myWidth, bedsGraphBaseline - 0, myWidth, 26);
        drawContext.setFont(Font.italicSystemFont(20));
        drawContext.drawTextInRect(conVersion, myVersionInfoRect);
    }
    /**
     * show title or link
     * @param {any} widget
     * @param {any} fresh
     */
    function showHeader(widget, fresh) {
        let myTextArea = widget.addStack();
        myTextArea.topAlignContent();
        myTextArea.size = new Size(widgetWidth, 150);

        if (fresh) {
            showLink(myTextArea, "Goto Telekom", conTelekomURL);
        }
        else {
            showTitle(myTextArea, "Telekom Data");
        }
    }

    // #region UI helpers
    /**
   * add link in blue
   * @param {ListWidget} widget
   * @param {string} title
   * @param {string} pURL
   */
    function showLink(widget, title, pURL) {
        widget.addSpacer(8)
        // Add button to open documentation
        let linkSymbol = SFSymbol.named("arrow.up.forward")
        let footerStack = widget.addStack()
        let linkStack = footerStack.addStack()
        //linkStack.
        // if the widget is small, link does not work!
        linkStack.url = pURL;
        let linkElement = linkStack.addText(title)
        linkElement.font = Font.title2(); //Font.mediumSystemFont(13)
        linkElement.textColor = conLinkColor;
        //linkElement.rightAlignText();
        linkStack.addSpacer(3)
        let linkSymbolElement = linkStack.addImage(linkSymbol.image)
        linkSymbolElement.imageSize = new Size(11, 11)
        linkSymbolElement.tintColor = conLinkColor;
        footerStack.topAlignContent();
        return footerStack;
    }

    /**
     * add title in black
     * @param {any} widget
     * @param {any} title
     */
    function showTitle(widget, title) {
        widget.addSpacer(8)
        let footerStack = widget.addStack()
        let linkStack = footerStack.addStack()
        let linkElement = linkStack.addText(title)
        linkElement.font = Font.title2(); //Font.mediumSystemFont(13)
        linkElement.textColor = conAccentColor1;
        linkStack.addSpacer(3)
        footerStack.topAlignContent();
        return footerStack;
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
    // #endregion

    // #endregion

    // #region helper functions
    /**
   * show time or date
   * @param {Date} myEndDate
   */
    function niceDateString(myEndDate) {
        let myNow = new Date();
        let myDiff = myNow.getTime() - myEndDate.getTime();
        if (myDiff >= 0 && myDiff < DAY_IN_MILLISECONDS) {
            // same day-> show time
            return myEndDate.toLocaleTimeString("DE-de").slice(0, 5);
        }
        return myEndDate.toLocaleString("DE-de");
    }

    function getRestInfo(myStoredData) {
        let myRestData = 100 - myStoredData.data.usedPercentage;

        let myEndDate = calcEndDate(myStoredData);
        let myRestSeconds = (myEndDate.getTime() - new Date().getTime()) / 1000;
        // pack runs 31 days
        const conTotalSeconds = conDaysPerPackage * DAY_IN_SECONDS;
        let myRestTime = 100 * myRestSeconds / conTotalSeconds;

        return { myRestData, myRestTime, myEndDate };
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
            }
            else if (typeof pObject === "function") {
                console.log("Object is a function");
            }
            else {
                console.log(`${pObject}`);
            }
        }
    }

    // #endregion

    // #region data functions
    /**
   * read latest value from server or file
   * @param {FileManager} fm
   */
    async function getStoredData(fm) {
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
        let dir = fm.documentsDirectory();
        let path = fm.joinPath(dir, "scriptable-telekom.json");

        let r = new Request(conAPIUrl);
        // API only answers for mobile Safari
        r.headers = {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1"
        };

        try {
            // Fetch data from pass.telekom.de
            let myServerdata = await r.loadJSON();
            let myStoredData = { version: `Written by telekom.js version: ${conVersion}`, data: myServerdata, accessTime: new Date().getTime(), accessString: new Date().toString() };
            let myStoredStringWrite = JSON.stringify(myStoredData, null, 2);
            // Write JSON to iCloud file
            fm.writeString(path, myStoredStringWrite);
            let myStoredStringRead = fm.readString(path);
            if (myStoredStringRead !== myStoredStringWrite) {
                showObject(myStoredStringRead, "myStoredStringRead");
                showObject(myStoredStringWrite, "myStoredStringWrite");
                throw "Internal Error: myStoredStringRead !== myStoredStringWrite";
            }
            return { fresh: true, myStoredData };
        }
        catch (err) {
            showObject(err, "catch (err)");
            // if reading from pass.telekom.de not possible-> read data from iCloud file
            let myStoredData = JSON.parse(fm.readString(path), null);
            showObject(myStoredData, "fm.readString");
            if (!myStoredData) {
                return { wifiProblem: "Please disable WiFi for initial execution (1)" }
            }
            myServerdata = myStoredData.data; // ? myStoredData.data : myStoredData;
            if (!myServerdata || !myServerdata.usedPercentage) {
                return { wifiProblem: "Please disable WiFi for initial execution (1)" }
            }
            return { fresh: false, myStoredData };
        }
    }

    /**
     * return ascending history
     * @param {FileManager} fm
     * @param {string} conHistoryPath
     * @param {undefined | {usedVolume:number, accessTime:number}} pStoredData: undefined or server entry
     */
    async function readAndUpdateStoredDatas(fm, pStoredData) {
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
        let dir = fm.documentsDirectory()
        const conHistoryPath = fm.joinPath(dir, "ScriptableTelekomHistory.json");

        let myStoredDatas = await readStoredDatas();

        /**purged copy of myStoredDatas */
        let myNewStoredDatas = [];
        for (let i = 0; i < myStoredDatas.length; i++) {
            let myCurr = myStoredDatas[i];
            pushOrReplace(myNewStoredDatas, myCurr);
        }
        if (pStoredData) {
            // add only new data
            console.log(`push new data: ${pStoredData.accessString}: ${pStoredData.data.usedPercentage}%`);
            pushOrReplace(myNewStoredDatas, pStoredData);
        }

        let myStoredDatasString = JSON.stringify(myNewStoredDatas);
        fm.writeString(conHistoryPath, myStoredDatasString);
        return myNewStoredDatas;

        /** read from file and sort*/
        async function readStoredDatas() {
            let myStoredDatas = [];
            if (fm.fileExists(conHistoryPath)) {
                await fm.downloadFileFromiCloud(conHistoryPath);
                let myHistoryDataString = fm.readString(conHistoryPath);
                if (myHistoryDataString) {
                    myStoredDatas = JSON.parse(myHistoryDataString);
                    console.log("fileExists: ");
                    for (let iEle of myStoredDatas) {
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
            myStoredDatas.sort(function (left, right) { return left.accessTime - right.accessTime; });
            return myStoredDatas;
        }

        /**
         * 
         * @param {{usedVolume:number, accessTime:number}[]} pStoredDatas
         * @param {{usedVolume:number, accessTime:number}} pCurr
         */
        function pushOrReplace(pStoredDatas, pCurr) {
            if (pStoredDatas.length <= 0) {
                //console.log("pushOrReplace: push to new");
                pStoredDatas.push(pCurr);
            }
            else {
                if (pStoredDatas[pStoredDatas.length - 1].usedVolume > pCurr.usedVolume) {
                    // new pass
                    pStoredDatas = [pCurr];
                }
                else {
                    if (getDateStringFromMSecs(pStoredDatas[pStoredDatas.length - 1].accessTime) === getDateStringFromMSecs(pCurr.accessTime)) {
                        // update with latest entry from day
                        pStoredDatas[pStoredDatas.length - 1] = pCurr;
                    }
                    else {
                        pStoredDatas.push(pCurr);
                    }
                }
            }
        }
    }

    /**
     * 
     * @param {StoredData[]} pStoredDatas
     */
    function getHistoryDatas(pStoredDatas) {
        // #region get myNewHistory
        // history
        let myHistoryDatas = [];

        console.log("Show data: " + pStoredDatas.length);
        // set true, if test for red needed
        if (pStoredDatas.length >= 0) {
            let myFirstStoredData = pStoredDatas[0];
            let myEndDate = calcEndDate(myFirstStoredData);
            console.log(`myFirstStoredData: ${getDateStringFromEntry(myFirstStoredData)} - end time: ${myEndDate.toLocaleString()}`);
            let myStartDate = new Date(myEndDate.getTime() - conDaysPerPackage * DAY_IN_MILLISECONDS);
            console.log(`myStartDate: ${myStartDate.toLocaleString()}`);

            let myStartServerData = { usedPercentage: 0, remainingSeconds: conDaysPerPackage * DAY_IN_SECONDS, usedAt: myStartDate.getTime() };
            let myOldestStoredData = { data: myStartServerData, accessTime: myStartDate.getTime(), accessString: new Date(myStartDate.getTime()).toString() };
            showObject(myOldestStoredData, "myOldestStoredData");

            myHistoryDatas = [{ entry: myOldestStoredData, dateString: getDateStringFromEntry(myOldestStoredData), date: new Date(myOldestStoredData.accessTime) }];
            let myIndex = 0;
            let myNowString = getDateStringFromDate(new Date());
            let myNextDay = new Date(myOldestStoredData.accessTime + DAY_IN_MILLISECONDS);

            while (getDateStringFromDate(myNextDay).localeCompare(myNowString) <= 0) {
                for (let i = myIndex; i < pStoredDatas.length; i++) {
                    let myCurr = pStoredDatas[i];
                    if (getDateStringFromEntry(myCurr).localeCompare(getDateStringFromDate(myNextDay)) <= 0) {
                        myIndex = i;
                        myOldestStoredData = myCurr;
                    }
                    else {
                        break;
                    }
                }
                if (conIsTest && getDateStringFromDate(myNextDay) === myNowString) {
                    // to show some red
                    myOldestStoredData.data.usedPercentage = 99;
                }
                myHistoryDatas.push({ entry: myOldestStoredData, dateString: getDateStringFromDate(myNextDay), date: myNextDay });
                myNextDay = new Date(myNextDay.getTime() + 24 * 60 * 60 * 1000);
            }
            // pack runs 31 days
            const conTotalSeconds = 31 * 24 * 60 * 60;

            for (let iEle of myHistoryDatas) {
                let myRestSeconds = (myEndDate.getTime() - iEle.date.getTime()) / 1000;
                let myRestTime = 100 * myRestSeconds / conTotalSeconds;
                console.log(`${iEle.dateString}: data: ${100 - iEle.entry.data.usedPercentage}% time: ${myRestTime.toFixed()}%`);
            }
        }
        else {
            console.log("No data");
        }
        return myHistoryDatas;
        // #endregion

    }

    /**
     * notify on low data or time
     * @param {any} myStoredData
     */
    async function notifyIfNeeded(myStoredData) {
        let data = myStoredData.data;
        let myEndDate = calcEndDate(myStoredData);
        if (!myEndDate) {
            throw "calcEndDate undefined";
        }
        let myRestSeconds = (myEndDate.getTime() - new Date().getTime()) / 1000;

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
    }
    // #endregion
}