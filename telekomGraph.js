// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: brown; icon-glyph: magic;
/// <reference path="TypeDefinitions/scriptable.d.ts" />
run();

/**wrapped all in function to remedy const access to other js files by eslint */
async function run() {

    // #region constant definitions
    const conVersion = "V221118graph";

    /** possible values: 
     * undefined or "": real data
     * "low": show data until last day with low data in between
     * "empty": volume empty before end time
     * "after": last read is after package expiration
     * "new": last read is with new package
     * */
    const conIsTest = ""; //"empty";

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
    // light blue: #ADD8E6
    const conLightBlue = new Color("#ADD8E6");
    // middle blue : #6190E6
    const conMiddleBlue = new Color("#6190E6");
    /**color for link */
    const conLinkColor = conMiddleBlue; // conAntiqueWhite Color.blue()
    // light red : #FF7F7F
    /**color for low data value */
    const conAlertColor = new Color("#FF7F7F"); // conAntiqueWhite Color.red()

    const conPercentageLow = 10;
    const conRemainingDaysLow = 1 / 2;
    const conPercentageVeryLow = 1;
    const conRemainingHoursVeryLow = 6;
    const conDaysPerPackage = 31;

    const HOUR_IN_SECONDS = 60 * 60;
    const DAY_IN_SECONDS = 24 * HOUR_IN_SECONDS;
    const DAY_IN_MILLISECONDS = DAY_IN_SECONDS * 1000;

    const widgetHeight = 338;
    const widgetWidth = 720;
    const vertLineWeight = 18;
    const graphLow = 210;
    const graphHeight = 110;
    const spaceBetweenDays = 22;
    // #endregion

    /** generates test data, defined here because of hoisting problem */
    class TestGenerator {
        /**
         * 
         * @param {string} pIsTest
         */
        constructor(pIsTest) {
            try {
                console.log("constructor pIsTest: " + pIsTest);
                this._IsTest = pIsTest;
                this.fresh = true;
                this.createTestStoredDatas();
            } catch (e) {
                console.log("constructor catch: " + e);
            }
        }
        getEndDate = () => new Date(this.startDate.getTime() + conDaysPerPackage * DAY_IN_MILLISECONDS);

        // #region test data
        createTestStoredDatas() {
            console.log("createTestStoredDatas: " + this._IsTest);
            try {
                switch (this._IsTest) {
                    case "new":
                        {
                            // old package expired 2 days ago
                            let myNowTime = new Date().getTime();
                            // 2 days expired, last package before new package is still stored
                            this.startDate = new Date(myNowTime - (conDaysPerPackage + 2) * DAY_IN_MILLISECONDS);

                            let myStoredDatas = [];

                            let myStoredData1 = this.createTestStoredData(this.getEndDate(), new Date(this.startDate.getTime() + 5 * DAY_IN_MILLISECONDS), 50);
                            myStoredDatas.push(myStoredData1);

                            let myStoredData2 = this.createTestStoredData(this.getEndDate(), new Date(this.startDate.getTime() + 10 * DAY_IN_MILLISECONDS), 60);
                            myStoredDatas.push(myStoredData2);

                            console.log(`{myStartDate} {myEndDate} {myStoredDatas.length}: ${this.startDate} ${this.getEndDate()} ${myStoredDatas.length}`);

                            for (let iEle of myStoredDatas) {
                                this.logStoredData(iEle);
                            }
                            this.storedDatas = myStoredDatas;

                            //  new package was purchased 1 day before
                            this.startDate = new Date(myNowTime - DAY_IN_MILLISECONDS);
                            console.log(`new startdate: ${this.startDate} ${this.getEndDate()}`);
                            let myNowDate = new Date();
                            let myUsedPercentage = 80;
                            this.storedData = this.createTestStoredData(this.getEndDate(), myNowDate, myUsedPercentage);
                            this.logStoredData(this.storedData);

                            break;
                        }
                    case "after":
                        {
                            // one hour before expiration
                            let myNowTime = new Date().getTime();
                            // 2 days expired
                            this.startDate = new Date(myNowTime - (conDaysPerPackage + 2) * DAY_IN_MILLISECONDS);

                            let myNowDate = new Date();
                            let myUsedPercentage = 80;
                            this.storedData = this.createTestStoredData(this.getEndDate(), myNowDate, myUsedPercentage);
                            this.logStoredData(this.storedData);

                            let myStoredDatas = [];

                            let myStoredData1 = this.createTestStoredData(this.getEndDate(), new Date(this.startDate.getTime() + 5 * DAY_IN_MILLISECONDS), 50);
                            myStoredDatas.push(myStoredData1);

                            let myStoredData2 = this.createTestStoredData(this.getEndDate(), new Date(this.startDate.getTime() + 10 * DAY_IN_MILLISECONDS), 75);
                            myStoredDatas.push(myStoredData2);

                            console.log(`{myStartDate} {myEndDate} {myStoredDatas.length}: ${this.startDate} ${this.getEndDate()} ${myStoredDatas.length}`)

                            for (let iEle of myStoredDatas) {
                                this.logStoredData(iEle);
                            }
                            this.storedDatas = myStoredDatas;
                            break;
                        }
                    case "low":
                        {
                            // one hour before expiration
                            let myNowTime = new Date().getTime();
                            // 31 days ago + 1 hour
                            this.startDate = new Date(myNowTime - conDaysPerPackage * DAY_IN_MILLISECONDS + HOUR_IN_SECONDS * 1000);

                            let myNowDate = new Date();
                            let myUsedPercentage = 80;
                            this.storedData = this.createTestStoredData(this.getEndDate(), myNowDate, myUsedPercentage);
                            this.logStoredData(this.storedData);

                            let myStoredDatas = [];
                            let myStoredData1 = this.createTestStoredData(this.getEndDate(), new Date(this.startDate.getTime() + 5 * DAY_IN_MILLISECONDS), 50);
                            myStoredDatas.push(myStoredData1);

                            let myStoredData2 = this.createTestStoredData(this.getEndDate(), new Date(this.startDate.getTime() + 10 * DAY_IN_MILLISECONDS), 75);
                            myStoredDatas.push(myStoredData2);

                            console.log(`{myStartDate} {myEndDate} {myStoredDatas.length}: ${this.startDate} ${this.getEndDate()} ${myStoredDatas.length}`)

                            for (let iEle of myStoredDatas) {
                                this.logStoredData(iEle);
                            }
                            this.storedDatas = myStoredDatas;
                            break;
                        }
                    case "empty":
                        {
                            console.log("case empty: " + this._IsTest);
                            // one hour before expiration
                            let myNowTime = new Date().getTime();
                            this.startDate = new Date(myNowTime - (conDaysPerPackage - 10) * DAY_IN_MILLISECONDS);
                            let myStartDate = this.startDate;
                            let myEndDate = this.getEndDate();
                            let myStoredDatas = [];

                            let myNowDate = new Date();
                            let myUsedPercentage = 100;
                            this.storedData = this.createTestStoredData(myEndDate, myNowDate, myUsedPercentage);
                            this.logStoredData(this.storedData);

                            // 50% after 1/3 of time
                            let myStoredData1 = this.createTestStoredData(myEndDate, new Date(myStartDate.getTime() + 10 * DAY_IN_MILLISECONDS), 50);
                            myStoredDatas.push(myStoredData1);

                            let myStoredData2 = this.createTestStoredData(myEndDate, new Date(myStartDate.getTime() + 15 * DAY_IN_MILLISECONDS), 100);
                            myStoredDatas.push(myStoredData2);

                            // {myStartDate} {myEndDate} {myStoredDatas.length}
                            console.log(`{myStartDate} {myEndDate} {myStoredDatas.length}: ${myStartDate} ${myEndDate} ${myStoredDatas.length}`)
                            for (let iEle of myStoredDatas) {
                                console.log(`{usedPercentage} {remainingSeconds} {accessString}: ${iEle.data.usedPercentage} ${iEle.data.remainingSeconds} ${iEle.accessString}`)
                            }

                            this.storedDatas = myStoredDatas;
                            break;
                        }
                    default:
                        throw "unknown test case: " + this._IsTest;
                }
            }
            catch (e) {
                console.log("err in test: " + e);
                throw e;
            }
        }

        /**
         * log StoredData
         * @param {any} pStoredData
         */
        logStoredData(pStoredData) {
            console.log(`myStoredData {usedPercentage} {remainingSeconds} {accessString}: ${pStoredData.data.usedPercentage} ${pStoredData.data.remainingSeconds} ${pStoredData.accessString}`);
        }

        /**
         * 
         * @param {Date} pEndDate
         * @param {Date} pUsedAtDate
         * @param {number} pUsedPercentage
         */
        createTestStoredData(pEndDate, pUsedAtDate, pUsedPercentage) {
            let myRemainingSeconds = (pEndDate.getTime() - pUsedAtDate.getTime()) / 1000;
            let myServerData = createServerData(pUsedPercentage, myRemainingSeconds, pUsedAtDate);
            let myStoredData = createStoredData(myServerData, pUsedAtDate);
            return myStoredData;
        }
        // #endregion
    }
    /** undefined, if !conIsTest  */
    const mTestGenerator = conIsTest ? new TestGenerator(conIsTest) : undefined;

    try {
        let widget = await createWidget();
        await widget.presentMedium()

        Script.setWidget(widget)
        Script.complete()
    } catch (e) {
        console.log(e);
        throw e;
    }

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

        let myHistoryDatas = getHistoryDatas(myStoredDatas);

        const widget = new ListWidget();
        widget.backgroundColor = conWidgetBackgroundColor;
        widget.url = conTelekomURL;

        let myDrawContext = new DrawContext();
        myDrawContext.size = new Size(widgetWidth, widgetHeight);
        myDrawContext.opaque = false;

        showHeader(widget, fresh, myStoredData);

        showStoredData(myStoredData, myDrawContext);

        showHistoryDatas(myHistoryDatas, myDrawContext);

        widget.setPadding(0, 0, 0, 0);
        widget.backgroundImage = (myDrawContext.getImage());

        return widget;
    }

    // #region UI functions
    /**
   * show progress in columns
   * @param {any} myHistoryDatas
   * @param {any} drawContext
   */
    function showHistoryDatas(pHistoryDatas, drawContext) {
        // ensure display of column with 0
        let min = -10;
        let max = 100;

        let diff = max - min;

        // show only last 31 days
        let myHistoryDatas = pHistoryDatas.slice(-conDaysPerPackage);

        let myXPosAdd = 8;
        for (let i = 0; i < myHistoryDatas.length; i++) {
            // { entry: myOldestEntry, dateString: getDateStringFromDate(myNextDay), date: myNextDay }
            let iHistoryData = myHistoryDatas[i];
            const day = iHistoryData.date.getDate();
            const dayOfWeek = iHistoryData.date.getDay();
            var { myRestPercentage, myRestTime } = calcRest(iHistoryData.entry, iHistoryData.date);

            //console.log(`${i} day: ${day}- myRestPercentage: ${myRestPercentage} myRestTime: ${myRestTime.toFixed()}`);

            // Vertical Line
            let drawColor;

            if (myRestPercentage <= 0 || myRestPercentage < myRestTime) {
                drawColor = conAlertColor;
            }
            else {
                drawColor = Color.green();
            }

            // 0<= delta <=1
            const delta = (myRestPercentage - min) / diff;
            const myX = spaceBetweenDays * i + 12 + myXPosAdd;
            const point1 = new Point(myX, graphLow - (graphHeight * delta));
            const point2 = new Point(myX, graphLow);
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
                const myRestPercentRect = new Rect(spaceBetweenDays * i + myXPosAdd, (graphLow - 20) - (graphHeight * delta), 60, 23);
                if (myRestPercentage <= 0) {
                    drawTextR(drawContext, "0!", myRestPercentRect, conAccentColor1, Font.systemFont(conFontSize));
                }
                else {
                    drawTextR(drawContext, myRestPercentage + "%", myRestPercentRect, conAccentColor1, Font.systemFont(conFontSize));
                }
            }
            const dayRect = new Rect(spaceBetweenDays * i + myXPosAdd + 2, graphLow + 5, 50, 23);
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
        const conBottomText = 290;
        const conBottomTextPadding = 32;

        const conLineHeight = 26;
        // conFirstLineBottom greater conLineHeight
        const conFirstLineBottom = 40;
        const conSecondLineBottom = 0;
        const conWidthFirstWordRow1 = widgetWidth / 2 - 100;
        const conStart2ndWordRow1 = conWidthFirstWordRow1 + 10;

        let myRestDataRect = new Rect(conBottomTextPadding, conBottomText - conFirstLineBottom, conWidthFirstWordRow1, conLineHeight);
        drawContext.setFont(Font.mediumSystemFont(26));
        drawContext.setTextColor(myTextColor);
        // expired? show empty data
        let myUsedString = myRestTime > 0 ? myStoredData.data.usedVolumeStr + " / " + myStoredData.data.initialVolumeStr : "No data";
        drawContext.drawTextInRect(myUsedString, myRestDataRect);

        let myEndDateRect = new Rect(conBottomTextPadding + conStart2ndWordRow1, conBottomText - conFirstLineBottom, widgetWidth - conBottomTextPadding - conStart2ndWordRow1, conLineHeight);
        let myDateString = myRestTime <= 0 ? `Expired! ${myEndDate.toLocaleString("DE-de")}` : `Runs until ${myEndDate.toLocaleString("DE-de")}`;
        drawContext.drawTextInRect(myDateString, myEndDateRect);

        //let myAppTime = `App refresh: ${niceDateString(new Date())}`;
        let myServerTime = `Server refresh: ${niceDateString(new Date(myStoredData.data.usedAt))}`;

        const conWidthFirstWordRow2 = widgetWidth / 2 + 150;
        const conStart2ndWordRow2 = conWidthFirstWordRow2 + 10;
        let myWidth = widgetWidth - conBottomTextPadding - conStart2ndWordRow2;

        drawContext.setFont(Font.mediumSystemFont(22));
        let myAppInfoRect = new Rect(conBottomTextPadding, conBottomText - conSecondLineBottom, conWidthFirstWordRow2, conLineHeight);
        drawContext.drawTextInRect(myServerTime, myAppInfoRect);

        let myVersionInfoRect = new Rect(conBottomTextPadding + conStart2ndWordRow2, conBottomText - conSecondLineBottom, myWidth, conLineHeight);
        drawContext.setFont(Font.italicSystemFont(20));
        drawContext.drawTextInRect(conVersion, myVersionInfoRect);
    }
    /**
     * show title or link
     * @param {any} widget
     * @param {any} fresh
     */
    function showHeader(widget, fresh, pStoredData) {
        let myTextArea = widget.addStack();
        myTextArea.topAlignContent();
        myTextArea.size = new Size(widgetWidth, 150);

        let myRest = calcRest(pStoredData, new Date(pStoredData.accessTime));
        if (myRest.myRestTime <= 0 || myRest.myRestPercentage <= 0) {
            // alert!
            showLink(myTextArea, "Package empty! Goto Telekom", conTelekomURL, conLightBlue);
            widget.backgroundColor = Color.red();
        }
        else {
            if (fresh) {
                showLink(myTextArea, "Goto Telekom", conTelekomURL);
            }
            else {
                showTitle(myTextArea, "Telekom Data");
            }
        }
    }

    // #region UI helpers
    /**
   * add link in blue
   * @param {ListWidget} widget
   * @param {string} title
   * @param {string} pURL
   */
    function showLink(widget, title, pURL, pColor) {
        let myLinkColor = pColor ? pColor : conLinkColor;
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
        linkElement.textColor = myLinkColor;
        //linkElement.rightAlignText();
        linkStack.addSpacer(3)
        let linkSymbolElement = linkStack.addImage(linkSymbol.image)
        linkSymbolElement.imageSize = new Size(11, 11)
        linkSymbolElement.tintColor = myLinkColor;
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
     * @param {any} pEntry HistoryData
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
        }
        catch (e) {
            return e + ": " + pDate;
        }
    }

    /**
     * 
     * @param {any} pStoredData StoredData
     * @param {Date} pDate 
     */
    function calcRest(pStoredData, pDate) {
        let myEndDate = calcEndDate(pStoredData);
        if (!myEndDate) {
            throw "calcEndDate undefined";
        }
        let myRestSeconds = (myEndDate.getTime() - pDate.getTime()) / 1000;
        // pack runs 31 days
        const conTotalSeconds = conDaysPerPackage * DAY_IN_SECONDS;
        let myRestTime = 100 * myRestSeconds / conTotalSeconds;

        const myRestPercentage = myRestSeconds <= 0 ? 0 : 100 - pStoredData.data.usedPercentage;

        return { myRestPercentage, myRestTime };
    }

    /**
     * calc end date from current + remaining seconds
     * @param {any} pStoredData StoredData
     */
    function calcEndDate(pStoredData) {
        // usedAt = msec
        if (!pStoredData.data || !pStoredData.accessTime) {
            showObject(pStoredData, "calcEndDate")
            return undefined;
        }
        let myServerData = pStoredData.data;
        let myEndDate = new Date(pStoredData.accessTime + myServerData.remainingSeconds * 1000);
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
        if (mTestGenerator) {
            let myStoredData = mTestGenerator.storedData;
            return { fresh: mTestGenerator.fresh, myStoredData };
        }

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
            let myStoredData = createStoredData(myServerdata, new Date());

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
        if (mTestGenerator) {
            let myStoredDatas = mTestGenerator.storedDatas;
            // sort ascending
            myStoredDatas.sort(function (left, right) { return left.accessTime - right.accessTime; });
            /**purged copy of myStoredDatas */
            let myNewStoredDatas = purgeStoredData(myStoredDatas, pStoredData);
            return myNewStoredDatas;
        }
        else {
            let dir = fm.documentsDirectory()
            const conHistoryPath = fm.joinPath(dir, "ScriptableTelekomHistory.json");

            let myStoredDatas = await readStoredDatas(conHistoryPath);
            /**purged copy of myStoredDatas */
            let myNewStoredDatas = purgeStoredData(myStoredDatas, pStoredData);

            let myStoredDatasString = JSON.stringify(myNewStoredDatas);
            fm.writeString(conHistoryPath, myStoredDatasString);
            return myNewStoredDatas;
        }

        /**
         * 
         * @param {any} pStoredDatas
         * @param {any} pStoredData
         */
        function purgeStoredData(pStoredDatas, pStoredData) {
            let myNewStoredDatas = [];
            for (let i = 0; i < pStoredDatas.length; i++) {
                let myCurr = pStoredDatas[i];
                pushOrReplace(myNewStoredDatas, myCurr);
            }
            if (pStoredData) {
                // add only new data
                console.log(`push new data: ${pStoredData.accessString}: ${pStoredData.data.usedPercentage}%`);
                pushOrReplace(myNewStoredDatas, pStoredData);
                console.log(`push new data-myNewStoredDatas: ${myNewStoredDatas.length}`);
            }
            return myNewStoredDatas;
        }

        /** read from file and sort or use test data*/
        async function readStoredDatas(pHistoryPath) {
            if (fm.fileExists(pHistoryPath)) {
                await fm.downloadFileFromiCloud(pHistoryPath);
                let myHistoryDataString = fm.readString(pHistoryPath);
                if (myHistoryDataString) {
                    let myStoredDatas = JSON.parse(myHistoryDataString);
                    console.log("fileExists: ");
                    for (let iEle of myStoredDatas) {
                        console.log(`${iEle.accessString}: ${iEle.data.usedPercentage}%`);
                    }
                    // sort ascending
                    myStoredDatas.sort(function (left, right) { return left.accessTime - right.accessTime; });
                    return myStoredDatas;
                }
                else {
                    console.log("file does not exist");
                }
            }
            else {
                console.log("file not Exists: ");
            }
            return [];
        }

        /**
         * 
         * @param {{usedVolume:number, accessTime:number}[]} pNewStoredDatas StoredData[]
         * @param {{usedVolume:number, accessTime:number}} pStoredData StoredData
         */
        function pushOrReplace(pNewStoredDatas, pStoredData) {
            if (pNewStoredDatas.length <= 0) {
                //console.log("pushOrReplace: push to new");
                pNewStoredDatas.push(pStoredData);
            }
            else {
                let myPreviousEndDate = calcEndDate(pNewStoredDatas[pNewStoredDatas.length - 1]);
                let myCurrEndDate = calcEndDate(pStoredData);
                console.log(`pushOrReplace {myPreviousEndDate} {myCurrEndDate} ${myPreviousEndDate} ${myCurrEndDate}`);
                if (pNewStoredDatas[pNewStoredDatas.length - 1].usedVolume > pStoredData.usedVolume || myCurrEndDate.getTime() > myPreviousEndDate.getTime() + HOUR_IN_SECONDS * 1000) {
                    // new pass
                    console.log("new pass");
                    // clear pNewStoredDatas and add current item
                    pNewStoredDatas.length = 0;
                    pNewStoredDatas.push(pStoredData);
                    //console.log(`pushOrReplace-pNewStoredDatas: ${pNewStoredDatas.length}`);
                }
                else {
                    if (getDateStringFromMSecs(pNewStoredDatas[pNewStoredDatas.length - 1].accessTime) === getDateStringFromMSecs(pStoredData.accessTime)) {
                        // update with latest entry from day
                        pNewStoredDatas[pNewStoredDatas.length - 1] = pStoredData;
                    }
                    else {
                        pNewStoredDatas.push(pStoredData);
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

            let myRemainingSeconds = conDaysPerPackage * DAY_IN_SECONDS;
            let myUsed = 0;

            let myStartServerData = createServerData(myUsed, myRemainingSeconds, myStartDate);

            let myOldestStoredData = createStoredData(myStartServerData, myStartDate);
            // { data: myStartServerData, accessTime: myStartDate.getTime(), accessString: new Date(myStartDate.getTime()).toString() };
            showObject(myOldestStoredData, "myOldestStoredData");

            let myHistoryData = createHistoryData(myOldestStoredData);
            myHistoryDatas = [myHistoryData];

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

                let myHistoryData = createHistoryData(myOldestStoredData);
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
     * @param {any} pStoredData StoredData
     */
    async function notifyIfNeeded(pStoredData) {
        let myServerData = pStoredData.data;
        let myEndDate = calcEndDate(pStoredData);
        if (!myEndDate) {
            throw "calcEndDate undefined";
        }
        let myRestSeconds = (myEndDate.getTime() - new Date().getTime()) / 1000;

        const myRemainingData = 100 - myServerData.usedPercentage;
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

    // #region create structures

    /**
    //* 
    //* @param {any} pStoredData StoredData
    //*/
    function createHistoryData(pStoredData) {
        return { entry: pStoredData, dateString: getDateStringFromEntry(pStoredData), date: new Date(pStoredData.accessTime) };
    }

    /**
     * 
     * @param {any} pServerdata ServerData
     * @param {Date} pAccessTime
     */
    function createStoredData(pServerdata, pAccessTime) {
        return { version: `Written by telekom.js version: ${conVersion}`, data: pServerdata, accessTime: pAccessTime.getTime(), accessString: pAccessTime.toString() };
    }

    /**
     * 
     * @param {number} pUsedPercentage
     * @param {number} pRemainingSeconds
     * @param {Date} pUsedAt
     * @param {string} pUsedVolumeStr
     */
    function createServerData(pUsedPercentage, pRemainingSeconds, pUsedAt) {
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

        // 6000 MB
        let myInitial = 6000;
        let myUsedVolume = pUsedPercentage * myInitial / 100;
        return { usedPercentage: pUsedPercentage, remainingSeconds: pRemainingSeconds, usedAt: pUsedAt.getTime(), usedVolumeStr: `${myUsedVolume} MB`, initialVolumeStr: `${myInitial} MB` };
    }
    // #endregion

    // #endregion
}