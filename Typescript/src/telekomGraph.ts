// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: brown; icon-glyph: magic;

import * as scr from "../../TypeDefinitions/scriptable";
run();
interface ServerBase {
    initialVolumeStr: string;
    usedVolumeStr: string;
    usedPercentage: number;
    remainingSeconds: number;
    usedAt: number;
}
/**ServerData */
interface ServerData extends ServerBase {
    // ServerData
    usedVolumeStr: string; //839, 31 MB
    remainingTimeStr: string; //12 Tage 5 Std.
    hasOffers: boolean; //true
    //remainingSeconds: number; // 1055447
    //usedAt: number; //1620191668000
    validityPeriod: number; //5
    //usedPercentage: number; //33
    title: string;
    initialVolume: number; //2684354560
    initialVolumeStr: string; //2, 5 GB
    passType: number; //101
    nextUpdate: number; //10800
    subscriptions: string; //speedon, roamLikeHome, tns, m4mBundle, migtest
    usedVolume: number; //880088349
    passStage: number; //1
    passName: string; //Data Flex 2, 5 GB
}

interface StoredData {
    version: string;
    data: ServerBase;
    accessTime: number;
    accessString: string;
}

interface HistoryData {
    entry: StoredData;
    dateString: string;
    date: Date;
}

/**wrapped all in function to remedy const access to other js files by eslint */
async function run() {
    const conVersion = "V221115telekom";

    const conIsTest = false;

    const conAPIUrl = "https://pass.telekom.de/api/service/generic/v1/status";
    const conTelekomURL = "https://pass.telekom.de";

    // antiquewhite : #faebd7
    const conAntiqueWhite = new Color("#faebd7", 1);
    // telekom magenta 0xE20074
    const conMagenta = new scr.scr.Color("#E20074", 1);
    const conWidgetBackgroundColor = conMagenta; //conAntiqueWhite

    // choose a color fitting to conWidgetBackgroundColor (alternatives for conAntiqueWhite after comment signs//)
    /**color for normal font */
    const conAccentColor1 = scr.scr.Color.white(); //conAntiqueWhite Color.black()
    /**weekend color */
    const conAccentColor2 = scr.scr.Color.lightGray();
    // middle blue : #6190E6
    /**color for link */
    const conLinkColor = new scr.scr.Color("#6190E6", 1); // conAntiqueWhite Color.blue()
    // light red : #FF7F7F
    /**color for low data value */
    const conAlertColor = new scr.scr.Color("#FF7F7F", 1); // conAntiqueWhite Color.red()

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
    widget.url = conTelekomURL;

    await widget.presentMedium()

    scr.scr.Script.setWidget(widget)
    scr.scr.Script.complete()

    async function createWidget() {
        // local did not reliably work on 11.11.2021
        //let fm = FileManager.local()
        let fm = scr.scr.FileManager.iCloud()
        let dir = fm.documentsDirectory()
        let path = fm.joinPath(dir, "scriptable-telekom.json")
        try {
            let fresh: boolean, myStoredData: StoredData;
            try {
                let myResult = await getData(fm, path);
                fresh = myResult.fresh; myStoredData = myResult.myStoredData;
                showObject(myResult, "myResult");
            } catch (e) {
                const errorList = new scr.scr.ListWidget();
                errorList.addText(e);
                return errorList;
            }
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
            const conHistoryPath = fm.joinPath(dir, "ScriptableTelekomHistory.json");
            // array of myStoredData = { version: `Written by telekom.js version: ${conVersion}`, data: data, accessTime: new Date().getTime(), accessString: new Date().toString() };

            let myStoredDatas = await readAndStoreHistory(fm, conHistoryPath, fresh ? myStoredData : undefined);
            console.log("Show data: " + myStoredDatas.length);

            // history
            let myHistoryDatas = getHistoryData(myStoredDatas);
            // #endregion

            const widget = new scr.scr.ListWidget();
            widget.backgroundColor = conWidgetBackgroundColor;

            let drawContext = showStoredData(widget, fresh, myStoredData);

            showDataColumns(myHistoryDatas, drawContext);

            if (drawContext) {
                widget.setPadding(0, 0, 0, 0);
                widget.backgroundImage = (drawContext.getImage());
            }

            return widget; //{ widget: widget, drawContext: drawContext };
        }
        catch (err) {
            const errorList = new scr.scr.ListWidget();
            errorList.addText("error: " + err);
            //throw "Please disable WiFi for initial execution (1)";
            //return errorList;
            //list.addText("error: " + err);
            console.error("Err2");
            console.error(err);
            //showObject(err, "Err2");
            return errorList;
        }
    }

    function showDataColumns(myHistoryDatas: HistoryData[], drawContext: scr.scr.DrawContext) {
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
                drawColor = scr.scr.Color.green();
            }

            const point1 = new scr.scr.Point(spaceBetweenDays * i + 50, graphLow - (graphHeight * delta));
            const point2 = new scr.scr.Point(spaceBetweenDays * i + 50, graphLow + 10);
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
                const myRestPercentRect = new scr.scr.Rect(spaceBetweenDays * i + 38, (graphLow - 20) - (graphHeight * delta), 60, 23);
                drawTextR(drawContext, myRestPercentage + "%", myRestPercentRect, conAccentColor1, scr.scr.Font.systemFont(conFontSize));
            }
            const dayRect = new scr.scr.Rect(spaceBetweenDays * i + 40, graphLow + 15, 50, 23);
            drawTextR(drawContext, day, dayRect, dayColor, scr.scr.Font.systemFont(conFontSize));
        }
    }

    function showStoredData(pWidget: scr.scr.ListWidget, pFresh: boolean, pStoredData: StoredData) {
        let drawContext = new scr.scr.DrawContext();
        drawContext.size = new scr.scr.Size(widgetWidth, widgetHeight);
        drawContext.opaque = false;

        let myTextArea = pWidget.addStack();
        myTextArea.topAlignContent();
        myTextArea.size = new scr.scr.Size(widgetWidth, 150);

        if (pFresh) {
            showLink(myTextArea, "Goto Telekom", conTelekomURL);
        }
        else {
            showTitle(myTextArea, "Telekom Data");
        }

        let { myRestData, myRestTime, myEndDate } = getRestInfo(pStoredData);


        let myTextColor = conAccentColor1;

        let myRestDataRect = new scr.scr.Rect(bedsPaddingLeft, bedsGraphBaseline - 40, widgetWidth / 2 - 100, 26);
        drawContext.setFont(scr.scr.Font.mediumSystemFont(26));
        drawContext.setTextColor(myTextColor);
        drawContext.drawTextInRect(pStoredData.data.usedVolumeStr + " / " + pStoredData.data.initialVolumeStr, myRestDataRect);

        //const lineUsedVolume = list.addText(myStoredData.data.usedVolumeStr + " / " + myStoredData.data.initialVolumeStr)
        //lineUsedVolume.font = Font.mediumSystemFont(12)
        let myEndDateRect = new scr.scr.Rect(bedsPaddingLeft + widgetWidth / 2 - 90, bedsGraphBaseline - 40, widgetWidth / 2, 26);
        let myDateString = `Runs until ${myEndDate.toLocaleString("DE-de")}`;
        drawContext.drawTextInRect(myDateString, myEndDateRect);

        let myAppTime = `App refresh: ${niceDateString(new Date())}`;
        let myServerTime = `Server refresh: ${niceDateString(new Date(pStoredData.data.usedAt))}`;
        //let myServerTime = `Server refresh: ${new Date(myStoredData.data.usedAt).toLocaleString("DE-de")}`;
        //showObject(myStoredData, "myServerTime");
        //console.log(`usedAt ${myStoredData.data.usedAt}- myServerTime${myServerTime}`);
        let myWidth = 220;
        drawContext.setFont(scr.scr.Font.mediumSystemFont(22));
        let myAppInfoRect = new scr.scr.Rect(bedsPaddingLeft, bedsGraphBaseline - 0, widgetWidth - myWidth, 26);
        drawContext.drawTextInRect(myServerTime, myAppInfoRect);

        let myVersionInfoRect = new scr.scr.Rect(bedsPaddingLeft + widgetWidth - myWidth, bedsGraphBaseline - 0, myWidth, 26);
        drawContext.setFont(scr.scr.Font.italicSystemFont(20));
        drawContext.drawTextInRect(conVersion, myVersionInfoRect);
        return drawContext;
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

    function getRestInfo(myStoredData: StoredData) {
        let myRestData = 100 - myStoredData.data.usedPercentage;

        let myEndDate = calcEndDate(myStoredData);
        let myRestSeconds = (myEndDate.getTime() - new Date().getTime()) / 1000;
        // pack runs 31 days
        const conTotalSeconds = conDaysPerPackage * DAY_IN_SECONDS;
        let myRestTime = 100 * myRestSeconds / conTotalSeconds;
        return { myRestData, myRestTime, myEndDate };
    }

    /**
     * read latest value from server or file
     * @param {FileManager} fm
     * @param {string} path
     */
    async function getData(fm: scr.scr.FileManager, path: string) {
        let r = new scr.scr.Request(conAPIUrl);
        // API only answers for mobile Safari
        r.headers = {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 13_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Mobile/15E148 Safari/604.1"
        };
        /** {data: ServerData, accessTime} */
        //let myStoredData: storedData;
        ///** ServerData */
        //let data: serverData;
        ///** indicate read from server*/
        //let fresh = false;
        try {
            // Fetch data from pass.telekom.de
            let data = (await r.loadJSON()) as ServerData;
            //showObject(data, "r.loadJSON");
            let myStoredData: StoredData = { version: `Written by telekom.js version: ${conVersion}`, data: data, accessTime: new Date().getTime(), accessString: new Date().toString() };
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
            let fresh = true;
            return { fresh, myStoredData };
        }
        catch (err) {
            showObject(err, "catch (err)");
            try {
                // if reading from pass.telekom.de not possible-> read data from iCloud file
                let myStoredData = JSON.parse(fm.readString(path)) as StoredData;
                showObject(myStoredData, "fm.readString");
                if (!myStoredData) {
                    //const errorList = new ListWidget();
                    //errorList.addText("Please disable WiFi for initial execution (1)");
                    throw "Please disable WiFi for initial execution (1)";
                    //return errorList;
                }
                //showObject(myStoredData, "getData.myStoredData catch");
                let data = myStoredData.data; // ? myStoredData.data : myStoredData;
                if (!data || !data.usedPercentage) {
                    //const errorList = new ListWidget();
                    //errorList.addText("Please disable WiFi for initial execution (2)");
                    throw "Please disable WiFi for initial execution (2)";
                    //return errorList;
                }
                let fresh = false;
                return { fresh, myStoredData };

            } catch (errInner) {
                console.error("errInner");
                console.error(errInner);
                throw errInner;
            }
        }
        //showObject(myStoredData, "getData.myStoredData ");
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
    async function readAndStoreHistory(fm: scr.scr.FileManager, conHistoryPath: string, pStoredData: StoredData | undefined) {
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

            let myHistoryDataString = JSON.stringify(myHistoryData);
            fm.writeString(conHistoryPath, myHistoryDataString);
            return myHistoryData;
        } catch (e) {
            console.log("err storeHistory: " + e);
            return [];
        }

        /** read from file */
        async function readHistoryData() {
            //let myHistoryData = new Array<StoredData>();
            if (fm.fileExists(conHistoryPath)) {
                await fm.downloadFileFromiCloud(conHistoryPath);
                let myHistoryDataString = fm.readString(conHistoryPath);
                if (myHistoryDataString) {
                    let myHistoryData = JSON.parse(myHistoryDataString) as StoredData[];
                    console.log("fileExists: ");
                    for (let iEle of myHistoryData) {
                        console.log(`${iEle.accessString}: ${iEle.data.usedPercentage}%`);
                    }
                    // sort ascending
                    myHistoryData.sort(function (left, right) { return left.accessTime - right.accessTime; });
                    return myHistoryData;
                }
                else {
                    console.log("file does not exist");
                    return [];
                }
            }
            else {
                console.log("file not Exists: ");
                return [];
            }
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
    function calcEndDate(pStoredData: StoredData) {
        // usedAt = msec
        if (!pStoredData.data || !pStoredData.accessTime) {
            showObject(pStoredData, "calcEndDate")
            throw "calcEndDate !pStoredData.data || !pStoredData.accessTime";
            //return undefined;
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
    function showLink(widget: scr.scr.WidgetStack, title: string, pURL: string) {
        widget.addSpacer(8)
        // Add button to open documentation
        let linkSymbol = scr.scr.SFSymbol.named("arrow.up.forward")
        let footerStack = widget.addStack()
        let linkStack = footerStack.addStack()
        //linkStack.
        // if the widget is small, link does not work!
        linkStack.url = pURL;
        let linkElement = linkStack.addText(title)
        linkElement.font = scr.scr.Font.title2(); //Font.mediumSystemFont(13)
        linkElement.textColor = conLinkColor;
        //linkElement.rightAlignText();
        linkStack.addSpacer(3)
        let linkSymbolElement = linkStack.addImage(linkSymbol.image)
        linkSymbolElement.imageSize = new scr.scr.Size(11, 11)
        linkSymbolElement.tintColor = conLinkColor;
        footerStack.topAlignContent();
        return footerStack;
    }

    /**
     * add title in black
     * @param {any} widget
     * @param {any} title
     */
    function showTitle(widget: scr.scr.WidgetStack, title: string) {
        widget.addSpacer(8)
        let footerStack = widget.addStack()
        let linkStack = footerStack.addStack()
        let linkElement = linkStack.addText(title)
        linkElement.font = scr.scr.Font.title2(); //Font.mediumSystemFont(13)
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
        const path = new scr.scr.Path();
        path.move(point1);

        path.addLine(point2);
        drawContext.addPath(path);
        drawContext.setStrokeColor(color);
        drawContext.setLineWidth(width);
        drawContext.strokePath();
    }

    async function notifyIfNeeded(myStoredData: StoredData) {
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
            let notify1 = new scr.scr.Notification();
            //let myRemainingHours = (myRestSeconds / (60 * 60)).toFixed(0);
            notify1.title = "Telekom data empty!";
            let myString = "Stop WLAN and click here to go to Telekom App";
            notify1.body = myString;
            notify1.openURL = conTelekomURL;
            await notify1.schedule();
        }
        else if (myRemainingData <= conPercentageVeryLow || (myRestSeconds <= conRemainingSecondsVeryLow)) {
            let notify1 = new scr.scr.Notification();
            let myRemainingHours = (myRestSeconds / (60 * 60)).toFixed(0);
            let myString = "Remaining: " + myRemainingData.toString() + "% - " + myRemainingHours + " hours";
            notify1.title = "Telekom data very low!";
            notify1.body = myString;
            notify1.openURL = conTelekomURL;
            await notify1.schedule();
        }
        else if (myRemainingData <= conPercentageLow || (myRestSeconds <= conRemainingSecondsLow)) {
            let notify1 = new scr.scr.Notification();
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

    function getHistoryData(pStoredDatas: StoredData[]) {
        let myHistoryDatas = new Array<HistoryData>();
        if (pStoredDatas.length >= 0) {
            let myFirstDataEntry = pStoredDatas[0];
            let myEndDate = calcEndDate(myFirstDataEntry);
            console.log(`myFirstDataEntry: ${getDateStringFromEntry(myFirstDataEntry)} - end time: ${myEndDate.toLocaleString()}`);
            let myStartDate = new Date(myEndDate.getTime() - conDaysPerPackage * DAY_IN_MILLISECONDS);
            console.log(`myStartDate: ${myStartDate.toLocaleString()}`);

            let myStartData: ServerBase = { usedPercentage: 0, remainingSeconds: conDaysPerPackage * DAY_IN_SECONDS, usedAt: myStartDate.getTime(), initialVolumeStr: "", usedVolumeStr: "" };
            let myOldestEntry: StoredData = { version: conVersion, data: myStartData, accessTime: myStartDate.getTime(), accessString: new Date(myStartDate.getTime()).toString() };
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
    }
}