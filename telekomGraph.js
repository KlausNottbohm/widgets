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

    //const conGrayout = Color.darkGray();
    const conPercentageLow = 10;
    const conRemainingDaysLow = 1 / 2;
    const conPercentageVeryLow = 1;
    const conRemainingHoursVeryLow = 6;
    const conDaysPerPackage = 31;

    //const colorLow = new Color('#FAD643', 1); // < 5
    //const colorMed = new Color('#E8B365', 1); // < 20
    //const colorHigh = new Color('#DD5045', 1); // < 200
    //const colorUltra = new Color('#8E0000', 1); // >= 200

    const DAY_IN_SECONDS = 24 * 60 * 60;//86400000;
    const DAY_IN_MILLISECONDS = DAY_IN_SECONDS * 1000;//86400000;
    //const lineWeight = 2;
    const vertLineWeight = 18;

    const widgetHeight = 338;
    const widgetWidth = 720;
    const graphLow = 200;
    const graphHeight = 100;
    const spaceBetweenDays = 22;
    const bedsGraphBaseline = 290;
    const bedsPaddingLeft = 32;
    //const bedsPaddingRight = 32;
    //const bedsLineWidth = 12;

    let widget = await createWidget();
    //widget.url = conTelekomURL;

    await widget.presentMedium()

    Script.setWidget(widget)
    Script.complete()

    async function createWidget() {
        // local did not reliably work on 11.11.2021
        //let fm = FileManager.local()
        let fm = FileManager.iCloud()

        //try         {
        //let fresh, myStoredData;
        let { fresh, myStoredData, wifiProblem } = await getStoredData(fm);
        if (wifiProblem) {
            // for wifi problem show error text (all other exceptions not caught)
            const errorList = new ListWidget();
            errorList.addText(wifiProblem);
            return errorList;
        }
        //showObject(myResult, "myResult");
        //if (conIsTest && myStoredData.accessTime < new Date().getTime() - 2 * DAY_IN_MILLISECONDS) {
        //    // do not store fake entry
        //    fresh = false;
        //    let myDaysBefore = 1;
        //    let myEndDate = new Date(myStoredData.usedAt + myStoredData.remainingSeconds * 1000 - myDaysBefore * DAY_IN_MILLISECONDS);
        //    let myStartData = { usedPercentage: 99, remainingSeconds: myDaysBefore * DAY_IN_SECONDS, usedAt: myEndDate };
        //    myStoredData = myStartData;
        //    showObject(myStoredData, "conIsTest");
        //}
        await notifyIfNeeded(myStoredData);

        // #region get myNewHistory
        let myStoredDatas = await readAndUpdateStoredDatas(fm, fresh ? myStoredData : undefined);

        console.log("Show data: " + myStoredDatas.length);
        let myHistoryDatas = getHistoryData(myStoredDatas);

        // #endregion


        const widget = new ListWidget();
        widget.backgroundColor = conWidgetBackgroundColor;
        widget.url = conTelekomURL;

        let drawContext = new DrawContext();
        drawContext.size = new Size(widgetWidth, widgetHeight);
        drawContext.opaque = false;

        showHeader(widget, fresh);

        showStoredData(myStoredData, drawContext);

        showHistoryDatas(myHistoryDatas, drawContext);

        if (drawContext) {
            //let myDrawStack = list.addStack();
            widget.setPadding(0, 0, 0, 0);
            widget.backgroundImage = (drawContext.getImage());
        }

        return widget; //{ widget: widget, drawContext: drawContext };

    }
    function showHistoryDatas(myHistoryDatas, drawContext) {
        let min = 0;
        let max = 100;

        let diff = max - min;

        console.log(`myNewHistory.length: ${myHistoryDatas.length}`);
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
            //console.log(`${i} x: ${point1.x}- y: ${point1.y}`);
            let dayColor;

            if (dayOfWeek === 0 || dayOfWeek === 6) {
                dayColor = conAccentColor2;
            } else {
                dayColor = conAccentColor1;
            }
            const conFontSize = 18;
            //console.log(`${i} ${day} x: ${spaceBetweenDays * i + 20}- y: ${(graphLow - 40) - (graphHeight * delta)}`);
            let myShowPercent = (i - myHistoryDatas.length + 1) % 3;
            if (myShowPercent === 0) {
                const myRestPercentRect = new Rect(spaceBetweenDays * i + 38, (graphLow - 20) - (graphHeight * delta), 60, 23);
                drawTextR(drawContext, myRestPercentage + "%", myRestPercentRect, conAccentColor1, Font.systemFont(conFontSize));
            }
            const dayRect = new Rect(spaceBetweenDays * i + 40, graphLow + 15, 50, 23);
            drawTextR(drawContext, day, dayRect, dayColor, Font.systemFont(conFontSize));
        }
    }

    function showStoredData(myStoredData, drawContext) {
        let { myRestData, myRestTime, myEndDate } = getRestInfo(myStoredData);

        //const bedsRight = widgetWidth - bedsPaddingRight;
        //const freeBedsWidth = 0; //(bedsRight / beds) * freeBeds;
        //const covidBedsWidth = (bedsRight / beds) * cases;
        let myTextColor = conAccentColor1;
        //if (myRestData < myRestTime) {
        //    myTextColor = Color.red();
        //}
        let myRestDataRect = new Rect(bedsPaddingLeft, bedsGraphBaseline - 40, widgetWidth / 2 - 100, 26);
        drawContext.setFont(Font.mediumSystemFont(26));
        drawContext.setTextColor(myTextColor);
        drawContext.drawTextInRect(myStoredData.data.usedVolumeStr + " / " + myStoredData.data.initialVolumeStr, myRestDataRect);

        //const lineUsedVolume = list.addText(myStoredData.data.usedVolumeStr + " / " + myStoredData.data.initialVolumeStr)
        //lineUsedVolume.font = Font.mediumSystemFont(12)
        let myEndDateRect = new Rect(bedsPaddingLeft + widgetWidth / 2 - 90, bedsGraphBaseline - 40, widgetWidth / 2, 26);
        let myDateString = `Runs until ${myEndDate.toLocaleString("DE-de")}`;
        drawContext.drawTextInRect(myDateString, myEndDateRect);

        let myAppTime = `App refresh: ${niceDateString(new Date())}`;
        let myServerTime = `Server refresh: ${niceDateString(new Date(myStoredData.data.usedAt))}`;
        //let myServerTime = `Server refresh: ${new Date(myStoredData.data.usedAt).toLocaleString("DE-de")}`;
        //showObject(myStoredData, "myServerTime");
        //console.log(`usedAt ${myStoredData.data.usedAt}- myServerTime${myServerTime}`);
        let myWidth = 220;
        drawContext.setFont(Font.mediumSystemFont(22));
        let myAppInfoRect = new Rect(bedsPaddingLeft, bedsGraphBaseline - 0, widgetWidth - myWidth, 26);
        drawContext.drawTextInRect(myServerTime, myAppInfoRect);

        let myVersionInfoRect = new Rect(bedsPaddingLeft + widgetWidth - myWidth, bedsGraphBaseline - 0, myWidth, 26);
        drawContext.setFont(Font.italicSystemFont(20));
        drawContext.drawTextInRect(conVersion, myVersionInfoRect);
    }

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

    /**
     * 
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
        //if (!myEndDate) {
        //    const errorList = new ListWidget();
        //    errorList.addText("Please disable WiFi for initial execution (no data cached)");
        //    return errorList;
        //}
        let myRestSeconds = (myEndDate.getTime() - new Date().getTime()) / 1000;
        // pack runs 31 days
        const conTotalSeconds = conDaysPerPackage * DAY_IN_SECONDS;
        let myRestTime = 100 * myRestSeconds / conTotalSeconds;
        //let myFixed = myRestTime >= 10 ? 0 : 1;

        //let myCompare = ">=";
        //let myAlert = "-> ok";
        if (myRestData < myRestTime) {
            myCompare = "<";
            myAlert = "!";
        }
        //let myRestText = `Rest data ${myRestData.toFixed(0)}% ${myCompare} rest time: ${myRestTime.toFixed(myFixed)}% ${myAlert}`;
        return { myRestData, myRestTime, myEndDate };
    }

    /**
     * read latest value from server or file
     * @param {FileManager} fm
     * @param {string} path
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
        /** {data: ServerData, accessTime} */
        //let myStoredData;
        ///** ServerData */
        //let myServerdata;
        ///** indicate read from server*/
        //let fresh = false;
        try {
            // Fetch data from pass.telekom.de
            let myServerdata = await r.loadJSON();
            //showObject(data, "r.loadJSON");
            let myStoredData = { version: `Written by telekom.js version: ${conVersion}`, data: myServerdata, accessTime: new Date().getTime(), accessString: new Date().toString() };
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
            //fresh = true;
            //showObject(myStoredData, "getData.myStoredData ");
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

        //console.log("storeHistory");
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

        // replace with new array
        //myStoredDatas = myNewStoredDatas;

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

    /**
     * 
     * @param {StoredData[]} pStoredDatas
     */
    function getHistoryData(pStoredDatas) {
        // #region get myNewHistory
        // history
        let myHistoryDatas = [];

        console.log("Show data: " + pStoredDatas.length);
        // set true, if test for red needed
        if (pStoredDatas.length >= 0) {
            let myFirstDataEntry = pStoredDatas[0];
            let myEndDate = calcEndDate(myFirstDataEntry);
            console.log(`myFirstDataEntry: ${getDateStringFromEntry(myFirstDataEntry)} - end time: ${myEndDate.toLocaleString()}`);
            let myStartDate = new Date(myEndDate.getTime() - conDaysPerPackage * DAY_IN_MILLISECONDS);
            console.log(`myStartDate: ${myStartDate.toLocaleString()}`);

            let myStartData = { usedPercentage: 0, remainingSeconds: conDaysPerPackage * DAY_IN_SECONDS, usedAt: myStartDate.getTime() };
            let myOldestEntry = { data: myStartData, accessTime: myStartDate.getTime(), accessString: new Date(myStartDate.getTime()).toString() };
            showObject(myOldestEntry, "myOldestEntry");

            myHistoryDatas = [{ entry: myOldestEntry, dateString: getDateStringFromEntry(myOldestEntry), date: new Date(myOldestEntry.accessTime) }];
            let myIndex = 0;
            let myNowString = getDateStringFromDate(new Date());
            let myNextDay = new Date(myOldestEntry.accessTime + DAY_IN_MILLISECONDS);

            while (getDateStringFromDate(myNextDay).localeCompare(myNowString) <= 0) {
                for (let i = myIndex; i < pStoredDatas.length; i++) {
                    let myCurr = pStoredDatas[i];
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
                if (conIsTest && getDateStringFromDate(myNextDay) === myNowString) {
                    myOldestEntry.data.usedPercentage = 99;
                    //showObject(myNextEntry, `Test Entry`);
                }
                myHistoryDatas.push({ entry: myOldestEntry, dateString: getDateStringFromDate(myNextDay), date: myNextDay });
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
}