// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: brown; icon-glyph: magic;
/// <reference path="TypeDefinitions/scriptable.d.ts" />
/// <reference path="TypeDefinitions/telekomTypeDefs.d.ts" />

// on IOS 16 you have to close the script and reopen it before running, otherwise it hangs on second call
//    args.widgetParameter:   myTestCase = myArgs[1]; myShowGradient = myArgs[0]; e.g. args could be "grad,empty"
run();

/**wrapped all in function to remedy const access to other js files by eslint */
async function run() {

    // #region constant definitions
    // do not make longer (space restrictions)
    const conVersion = "V221123";
    /**default UI: 
     * nograd: original magenta, grad: gradient, info at bottom, top: gradient, info at top  */
    let myShowUI = "grad";
    /**default test case */
    let myTestCase = "";
    if (args.widgetParameter) {
        let myArgs = args.widgetParameter.split(',');
        myShowUI = myArgs[0];
        myTestCase = myArgs[1];
    }

    /** possible values: 
     * undefined or "": real data
     * "low": show data until last day with low data in between
     * "empty": volume empty before end time
     * "after": last read is after package expiration
     * "new": last read is with new package
     * "wifi": show wifi problem
     * "nohist": no data in history file, curr reading fresh === false
     * "latehist": data in history newer than curr reading
     * */
    const conIsTest = myTestCase ? myTestCase : ""; //"empty";
    const conShowLog = false;
    /** nograd: original magenta, grad: gradient, info at bottom, top: gradient, info at top */
    const conShowGradient = myShowUI !== "nograd";
    const conShowAtTop = myShowUI === "top";
    console.log("myShowUI: " + myShowUI);

    const conMagentaValue = "#E20074"; //
    const conLightMagentaValue = "#FF77FF";
    const conLightRedValue = "#FF7F7F";
    const conRedValue = "#FF0000";
    const conAntiqueWhiteValue = "#faebd7";

    let myAlpha = 0.3;
    let startColor1 = new Color(conMagentaValue, 1.0)
    let startColor = new Color(conMagentaValue, myAlpha)
    let endColor = new Color(conAntiqueWhiteValue, myAlpha)
    let conGradient = new LinearGradient()
    conGradient.colors = [startColor1, startColor, endColor]
    conGradient.locations = [0.0, 0.3, 1]

    let myAlphaA = 0.3;
    let startColorA1 = new Color(conRedValue, 1.0);
    let startColorA = new Color(conRedValue, myAlphaA);
    let endColorA = new Color(conAntiqueWhiteValue, myAlphaA);
    let conGradientAlert = new LinearGradient()
    conGradientAlert.colors = [startColorA1, startColorA, endColorA]
    conGradientAlert.locations = [0.0, 0.3, 1]

    const conAPIUrl = "https://pass.telekom.de/api/service/generic/v1/status";
    const conTelekomURL = "https://pass.telekom.de";

    // antiquewhite : #faebd7
    const conAntiqueWhite = new Color("#faebd7");
    // telekom magenta 0xE20074
    const conMagenta = new Color(conMagentaValue);
    const conWidgetBackgroundColor = conMagenta; //conAntiqueWhite

    // choose a color fitting to conWidgetBackgroundColor (alternatives for conAntiqueWhite after comment signs//)
    /**color for normal font at the bottom*/
    const conAccentColor1 = conShowGradient ? Color.black() : Color.white(); //conAntiqueWhite Color.black()
    /** textcolor at top */
    const conAccentColor1Top = Color.white();
    /**weekend color */
    const conAccentColor2 = Color.lightGray();
    // light blue: #ADD8E6
    const conLightBlue = new Color("#ADD8E6");
    const conVeryLightBlue = new Color("#e6f3f7");
    // middle blue : #6190E6
    const conMiddleBlue = new Color("#6190E6");
    /**color for link */
    const conLinkColor = conShowGradient ? conVeryLightBlue : conLightBlue; // conAntiqueWhite Color.blue()
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
    /** lower bound of graphic */
    const graphLow = conShowAtTop ? 250 : 210;
    const graphHeight = 110;
    const spaceBetweenDays = 22;
    // #endregion

    /** generates test data, defined here because of hoisting problem */
    class TestGenerator {
        /**
         * constructor for test data
         */
        constructor() {
            try {
                console.log("constructor pIsTest: " + conIsTest);
                this._IsTest = conIsTest;
                this.fresh = true;
                this.createTestStoredDatas();
            } catch (e) {
                console.log("constructor catch: " + e);
                this.wifiProblem = e.toString();
            }
        }
        getEndDate = () => addDays(this.startDate, conDaysPerPackage);

        // #region test data
        createTestStoredDatas() {
            console.log("createTestStoredDatas: " + this._IsTest);
            try {
                switch (this._IsTest) {
                    // "latehist": data in history newer than curr reading
                    case "latehist": {
                        // one hour before expiration
                        // 10 days back
                        this.startDate = addDays(new Date(), -10);

                        // older than newest history item
                        let myNowDate = addDays(new Date(), -4);
                        let myUsedPercentage = 80;
                        this.storedData = this.createTestStoredData(this.getEndDate(), myNowDate, myUsedPercentage);
                        logStoredData(this.storedData, "this.storedData");

                        let myStoredDatas = [];

                        let myStoredData1 = this.createTestStoredData(this.getEndDate(), addDays(this.startDate, 2), 50);
                        myStoredDatas.push(myStoredData1);

                        let myStoredData2 = this.createTestStoredData(this.getEndDate(), addDays(this.startDate, 8), 85);
                        myStoredDatas.push(myStoredData2);

                        console.log(`{myStartDate} {myEndDate} {myStoredDatas.length}: ${this.startDate} ${this.getEndDate()} ${myStoredDatas.length}`)

                        for (let iEle of myStoredDatas) {
                            logStoredData(iEle, "let iEle of myStoredDatas");
                        }
                        this.storedDatas = myStoredDatas;
                        break;
                    }
                    // "nohist": no data in history file, curr reading fresh === false
                    case "nohist": {
                        this.storedDatas = [];
                        //  new package was purchased 1 day before

                        this.startDate = addDays(new Date(), -1);
                        console.log(`new startdate: ${this.startDate} ${this.getEndDate()}`);
                        let myNowDate = new Date();
                        let myUsedPercentage = 20;
                        this.storedData = this.createTestStoredData(this.getEndDate(), myNowDate, myUsedPercentage);
                        this.fresh = false;
                        logStoredData(this.storedData);
                        break;
                    }
                    case "wifi":
                        this.wifiProblem = "Please disable WiFi for initial execution(test)";
                        break;
                    case "new":
                        {
                            // old package expired 2 days ago
                            // 2 days expired, last package before new package is still stored
                            this.startDate = addDays(new Date(), -(conDaysPerPackage + 2));

                            let myStoredDatas = [];

                            let myStoredData1 = this.createTestStoredData(this.getEndDate(), addDays(this.startDate, 5), 50);
                            myStoredDatas.push(myStoredData1);

                            let myStoredData2 = this.createTestStoredData(this.getEndDate(), addDays(this.startDate, 10), 60);
                            myStoredDatas.push(myStoredData2);

                            console.log(`{myStartDate} {myEndDate} {myStoredDatas.length}: ${this.startDate} ${this.getEndDate()} ${myStoredDatas.length}`);

                            for (let iEle of myStoredDatas) {
                                logStoredData(iEle);
                            }
                            this.storedDatas = myStoredDatas;

                            //  new package was purchased 1 day before
                            this.startDate = addDays(new Date(), -1);
                            console.log(`new startdate: ${this.startDate} ${this.getEndDate()}`);
                            let myNowDate = new Date();
                            let myUsedPercentage = 80;
                            this.storedData = this.createTestStoredData(this.getEndDate(), myNowDate, myUsedPercentage);
                            logStoredData(this.storedData);

                            break;
                        }
                    case "after":
                        {
                            // one hour before expiration
                            // 2 days expired
                            this.startDate = addDays(new Date(), - (conDaysPerPackage + 2));

                            let myNowDate = new Date();
                            let myUsedPercentage = 80;
                            this.storedData = this.createTestStoredData(this.getEndDate(), myNowDate, myUsedPercentage);
                            logStoredData(this.storedData);

                            let myStoredDatas = [];

                            let myStoredData1 = this.createTestStoredData(this.getEndDate(), new Date(this.startDate.getTime() + 5 * DAY_IN_MILLISECONDS), 50);
                            myStoredDatas.push(myStoredData1);

                            let myStoredData2 = this.createTestStoredData(this.getEndDate(), new Date(this.startDate.getTime() + 10 * DAY_IN_MILLISECONDS), 75);
                            myStoredDatas.push(myStoredData2);

                            console.log(`{myStartDate} {myEndDate} {myStoredDatas.length}: ${this.startDate} ${this.getEndDate()} ${myStoredDatas.length}`)

                            for (let iEle of myStoredDatas) {
                                logStoredData(iEle);
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
                            logStoredData(this.storedData);

                            let myStoredDatas = [];
                            let myStoredData1 = this.createTestStoredData(this.getEndDate(), new Date(this.startDate.getTime() + 5 * DAY_IN_MILLISECONDS), 50);
                            myStoredDatas.push(myStoredData1);

                            let myStoredData2 = this.createTestStoredData(this.getEndDate(), new Date(this.startDate.getTime() + 10 * DAY_IN_MILLISECONDS), 75);
                            myStoredDatas.push(myStoredData2);

                            console.log(`{myStartDate} {myEndDate} {myStoredDatas.length}: ${this.startDate} ${this.getEndDate()} ${myStoredDatas.length}`)

                            for (let iEle of myStoredDatas) {
                                logStoredData(iEle);
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
                            logStoredData(this.storedData);

                            // 50% after 1/3 of time
                            let myStoredData1 = this.createTestStoredData(myEndDate, new Date(myStartDate.getTime() + 10 * DAY_IN_MILLISECONDS), 50);
                            myStoredDatas.push(myStoredData1);

                            let myStoredData2 = this.createTestStoredData(myEndDate, new Date(myStartDate.getTime() + 15 * DAY_IN_MILLISECONDS), 100);
                            myStoredDatas.push(myStoredData2);

                            // {myStartDate} {myEndDate} {myStoredDatas.length}
                            console.log(`{myStartDate} {myEndDate} {myStoredDatas.length}: ${myStartDate} ${myEndDate} ${myStoredDatas.length}`)
                            for (let iEle of myStoredDatas) {
                                logStoredData(iEle, "iEle of myStoredDatas");
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
         * 
         * @param {Date} pEndDate
         * @param {Date} pUsedAtDate
         * @param {number} pUsedPercentage
         */
        createTestStoredData(pEndDate, pUsedAtDate, pUsedPercentage) {
            let myRemainingSeconds = (pEndDate.getTime() - pUsedAtDate.getTime()) / 1000;
            let myServerData = createServerData(pUsedPercentage, myRemainingSeconds, pUsedAtDate);
            let myStoredData = createStoredData(myServerData);
            return myStoredData;
        }
        // #endregion
    }
    /** undefined, if !conIsTest  */
    const mTestGenerator = conIsTest ? new TestGenerator(conIsTest) : undefined;

    try {
        let widget = await createWidget();
        if (!config.runsInWidget) {
            await widget.presentMedium()
        }
        else {
            Script.setWidget(widget)
        }
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
            let myText = errorList.addText(wifiProblem);
            myText.textColor = conMagenta;
            // on tap goto settings: https://github.com/FifiTheBulldog/ios-settings-urls/blob/master/settings-urls.md
            errorList.url = 'app-Prefs:root=WIFI'

            return errorList;
        }
        await notifyIfNeeded(myStoredData);

        let myStoredDatas = await readAndUpdateStoredDatas(fm, myStoredData, fresh);

        let myHistoryDatas = getHistoryDatas(myStoredDatas);

        const widget = new ListWidget();
        widget.url = conTelekomURL;
        if (conShowGradient) {
            widget.backgroundGradient = conGradient;
        }
        else {
            widget.backgroundColor = conWidgetBackgroundColor;
        }
        let myPackageEmpty = checkPackageEmpty(myStoredData);
        if (myPackageEmpty) {
            // alert!
            if (conShowGradient) {
                widget.backgroundGradient = conGradientAlert;
            }
            else {
                widget.backgroundColor = Color.red();
            }
        }
        else {
            if (conShowGradient) {
                widget.backgroundGradient = conGradient;
            }
            else {
                widget.backgroundColor = conWidgetBackgroundColor;
            }
        }

        let myDrawContext = new DrawContext();
        myDrawContext.size = new Size(widgetWidth, widgetHeight);
        myDrawContext.opaque = false;

        let myMainStack = widget.addStack();
        myMainStack.layoutVertically();

        showHeader(myMainStack, fresh, myStoredData);

        if (!conShowAtTop) {
            showStoredDataBottom(myStoredData, myDrawContext);
        }
        else {
            showStoredDataTop(myStoredData, myDrawContext);
        }

        showHistoryDatas(myHistoryDatas, myDrawContext);

        widget.setPadding(0, 0, 0, 0);
        //widget.addImage(myDrawContext.getImage());
        widget.backgroundImage = (myDrawContext.getImage());

        return widget;
    }

    // #region UI functions
    /**
   * show progress in columns
   * @param {HistoryData[]} pHistoryDatas
   * @param {DrawContext} drawContext
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
     * @param {StoredData} pStoredData StoredData
     * @param {DrawContext} drawContext
     */
    function showStoredDataBottom(pStoredData, drawContext) {
        let { myRestData, myRestTime, myEndDate } = getRestInfo(pStoredData);

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
        const conWidthFirstWordRow1 = widgetWidth / 2 - 70;
        const conStart2ndWordRow1 = conWidthFirstWordRow1 + 10;

        let myRestDataRect = new Rect(conBottomTextPadding, conBottomText - conFirstLineBottom, conWidthFirstWordRow1, conLineHeight);
        // if test show here
        let myInitialVolume = conIsTest ? `Test ${conIsTest}` : pStoredData.data.initialVolumeStr;
        // expired? show empty data
        let myUsedString = myRestTime > 0 ? `Used ${pStoredData.data.usedVolumeStr} / ${myInitialVolume}` : `No data / ${myInitialVolume}`;
        drawTextR(drawContext, myUsedString, myRestDataRect, myTextColor, Font.mediumSystemFont(26));

        let myEndDateRect = new Rect(conBottomTextPadding + conStart2ndWordRow1, conBottomText - conFirstLineBottom, widgetWidth - 2 * conBottomTextPadding - conStart2ndWordRow1, conLineHeight);
        let myDateString = myRestTime <= 0 ? `Expired! ${dateStringNoSeconds(myEndDate)}` : `Expires ${dateStringNoSeconds(myEndDate)}`;
        drawTextR(drawContext, myDateString, myEndDateRect, myTextColor, Font.mediumSystemFont(26), true);

        let myRefreshString = `Refresh Server: ${niceDateString(new Date(pStoredData.data.usedAt))}/ App: ${niceDateString(new Date())}`;

        const conWidthFirstWordRow2 = widgetWidth / 2 + 200;
        const conStart2ndWordRow2 = conWidthFirstWordRow2 + 10;
        let myWidth = widgetWidth - 2 * conBottomTextPadding - conStart2ndWordRow2;

        let myAppInfoRect = new Rect(conBottomTextPadding, conBottomText - conSecondLineBottom, conWidthFirstWordRow2, conLineHeight);
        drawTextR(drawContext, myRefreshString, myAppInfoRect, myTextColor, Font.mediumSystemFont(22));

        let myVersionInfoRect = new Rect(conBottomTextPadding + conStart2ndWordRow2, conBottomText - conSecondLineBottom, myWidth, conLineHeight);
        drawTextR(drawContext, conVersion, myVersionInfoRect, myTextColor, Font.italicSystemFont(20), true);
    }

    /**
     * show info about current status at bottom
     * @param {StoredData} pStoredData StoredData
     * @param {DrawContext} drawContext
     */
    function showStoredDataTop(pStoredData, drawContext) {
        let { myRestData, myRestTime, myEndDate } = getRestInfo(pStoredData);

        let myTextColor = conAccentColor1;
        let myTextColorUpper = conAccentColor1; //new Color(conAntiqueWhiteValue, 1);
        //if (myRestData < myRestTime) {
        //    myTextColor = Color.red();
        //}
        const conBottomText = 290;
        const conBottomTextPadding = 32;

        const conLineHeight = 26;
        // conFirstLineBottom greater conLineHeight
        const conFirstLineBottom = 220;
        const conSecondLineBottom = 0;
        const conWidthFirstWordRow1 = widgetWidth / 2 - 70;
        const conStart2ndWordRow1 = conWidthFirstWordRow1 + 10;
        //if (conShowGradient !== "top") {
        //    let myRestDataRect = new Rect(conBottomTextPadding, conBottomText - conFirstLineBottom, conWidthFirstWordRow1, conLineHeight);
        //    // if test show here
        //    let myInitialVolume = conIsTest ? `Test ${conIsTest}` : pStoredData.data.initialVolumeStr;
        //    // expired? show empty data
        //    let myUsedString = myRestTime > 0 ? `Used ${pStoredData.data.usedVolumeStr} / ${myInitialVolume}` : `No data / ${myInitialVolume}`;
        //    drawTextR(drawContext, myUsedString, myRestDataRect, myTextColorUpper, Font.mediumSystemFont(26));

        //    let myEndDateRect = new Rect(conBottomTextPadding + conStart2ndWordRow1, conBottomText - conFirstLineBottom, widgetWidth - 2 * conBottomTextPadding - conStart2ndWordRow1, conLineHeight);
        //    let myEndDateStr = dateStringNoSeconds(myEndDate);
        //    let myDateString = myRestTime <= 0 ? `Expired! ${myEndDateStr}` : `Expires ${myEndDateStr}`;
        //    drawTextR(drawContext, myDateString, myEndDateRect, myTextColorUpper, Font.mediumSystemFont(26), true);
        //}

        let myRefreshString = `Refresh Server: ${niceDateString(new Date(pStoredData.data.usedAt))}/ App: ${niceDateString(new Date())}`;

        const conWidthFirstWordRow2 = widgetWidth / 2 + 200;
        const conStart2ndWordRow2 = conWidthFirstWordRow2 + 10;
        let myWidth = widgetWidth - 2 * conBottomTextPadding - conStart2ndWordRow2;

        let myAppInfoRect = new Rect(conBottomTextPadding, conBottomText - conSecondLineBottom, conWidthFirstWordRow2, conLineHeight);
        drawTextR(drawContext, myRefreshString, myAppInfoRect, myTextColor, Font.mediumSystemFont(22));

        let myVersionInfoRect = new Rect(conBottomTextPadding + conStart2ndWordRow2, conBottomText - conSecondLineBottom, myWidth, conLineHeight);
        drawTextR(drawContext, conVersion, myVersionInfoRect, myTextColor, Font.italicSystemFont(20), true);
    }
    /**
     * show title or link
     * @param {WidgetStack} pStack stack with layoutvertical
     * @param {boolean} fresh
     * @param {StoredData} pStoredData
     */
    function showHeader(pStack, fresh, pStoredData) {
        let myHeight = conShowAtTop ? -10 : 150;
        let myTextArea = pStack.addStack();
        myTextArea.topAlignContent();
        myTextArea.size = new Size(widgetWidth, myHeight);

        let myCheck = checkPackageEmpty(pStoredData);
        if (myCheck) {
            // alert!
            showLink(myTextArea, "Package empty! Goto Telekom", conTelekomURL, conLinkColor);
        }
        else {
            if (fresh) {
                showLink(myTextArea, "Goto Telekom", conTelekomURL);
            }
            else {
                showTitle(myTextArea, "Telekom Data");
            }
        }
        if (conShowAtTop) {
            let { myRestData, myRestTime, myEndDate } = getRestInfo(pStoredData);
            // if test show here
            let myInitialVolume = conIsTest ? `Test ${conIsTest}` : pStoredData.data.initialVolumeStr;
            // expired? show empty data
            let myUsedString = myRestTime > 0 ? `Used ${pStoredData.data.usedVolumeStr} / ${myInitialVolume}` : `No data / ${myInitialVolume}`;
            let myEndDateStrNice = dateStringNoSeconds(myEndDate);
            let myDateString = myRestTime <= 0 ? `Expired! ${myEndDateStrNice}` : `Expires ${myEndDateStrNice}`;

            let myUsedArea = pStack.addStack();
            myUsedArea.size = new Size(widgetWidth, 120);
            showText(myUsedArea, myUsedString);
            myUsedArea.addSpacer(24)

            showText(myUsedArea, myDateString);
        }
    }

    // #region UI helpers
    /**
     * 
     * @param {StoredData} pStoredData
     */
    function checkPackageEmpty(pStoredData) {
        let myRest = calcRest(pStoredData, new Date(pStoredData.accessTime));
        return myRest.myRestTime <= 0 || myRest.myRestPercentage <= 0;
    }
    /**
   * add link in blue
   * @param {WidgetStack} pStack
   * @param {string} title
   * @param {string} pURL
   * @param {Color} pColor optional Color, default = conLinkColor
   */
    function showLink(pStack, title, pURL, pColor) {
        let myLinkColor = pColor ? pColor : conLinkColor;
        pStack.addSpacer(8)
        // Add button to open documentation
        let linkSymbol = SFSymbol.named("arrow.up.forward")
        let footerStack = pStack.addStack()
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
     * show text
     * @param {WidgetStack} pStack stack for line: layouthorizontal
     * @param {string} pText
     * @param {Color} pColor optional Color, default = conAccentColor1Top
     */
    function showText(pStack, pText, pColor) {
        //pStack.addSpacer(8)
        let footerStack = pStack.addStack()
        let linkStack = footerStack.addStack()
        let linkElement = linkStack.addText(pText)
        linkElement.font = Font.mediumSystemFont(13)
        let myLinkColor = pColor ? pColor : conAccentColor1Top;
        linkElement.textColor = myLinkColor;
        linkStack.addSpacer(3)
        footerStack.topAlignContent();
        return footerStack;
    }

    /**
     * add title in black
     * @param {WidgetStack} pStack
     * @param {string} title
     * @param {Color} pColor optional Color, default = conAccentColor1Top
     */
    function showTitle(pStack, title, pColor) {
        pStack.addSpacer(8)
        let footerStack = pStack.addStack()
        let linkStack = footerStack.addStack()
        let linkElement = linkStack.addText(title)
        linkElement.font = Font.title2(); //Font.mediumSystemFont(13)
        let myLinkColor = pColor ? pColor : conAccentColor1Top;
        linkElement.textColor = myLinkColor;
        linkStack.addSpacer(3)
        footerStack.topAlignContent();
        return footerStack;
    }
    /**
     * 
     * @param {DrawContext} drawContext
     * @param {string} text
     * @param {Rect} rect
     * @param {Color} color
     * @param {Font} font
     * @param {boolean} IsRightAligned
     */
    function drawTextR(drawContext, text, rect, color, font, IsRightAligned) {
        drawContext.setFont(font);
        drawContext.setTextColor(color);
        IsRightAligned ? drawContext.setTextAlignedRight() : drawContext.setTextAlignedLeft();
        drawContext.drawTextInRect(new String(text).toString(), rect);
        drawContext.setTextAlignedLeft();
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
    /**
     * 
     * @param {any} pStoredData StoredData
     */
    function getRestInfo(pStoredData) {
        let myRestData = 100 - pStoredData.data.usedPercentage;

        let myEndDate = calcEndDate(pStoredData);
        let myRestSeconds = (myEndDate.getTime() - new Date().getTime()) / 1000;
        // pack runs 31 days
        const conTotalSeconds = conDaysPerPackage * DAY_IN_SECONDS;
        let myRestTime = 100 * myRestSeconds / conTotalSeconds;

        return { myRestData, myRestTime, myEndDate };
    }

    /**
     * string yyyy-mm-dd  from StoredData entry
     * @param {StoredData} pStoredData StoredData
     */
    function getDateStringFromStoredData(pStoredData) {
        return getDateStringFromMSecs(pStoredData.accessTime);
    }
    /**
     * string yyyy-mm-dd  from mSecs
     * @param {number} pDateMSecs
     */
    function getDateStringFromMSecs(pDateMSecs) {
        return getDateStringFromDate(new Date(pDateMSecs));
    }
    /**
     * string yyyy-mm-dd from date
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
     * @param {StoredData} pStoredData StoredData
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
     * @param {StoredData} pStoredData StoredData
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
     * log StoredData
     * @param {StoredData} pStoredData
     * @param {string|undefined} pTitle optional title
     */
    function logStoredData(pStoredData, pTitle) {
        if (!conShowLog) {
            return;
        }
        let myTitle = pTitle ? pTitle : "";
        consoleLog(`${myTitle}: StoredData {usedPercentage} {remainingSeconds} {accessString}: ${pStoredData.data.usedPercentage} ${pStoredData.data.remainingSeconds} ${pStoredData.accessString}`);
    }

    /**
     * conditional console.log
     * @param {any} pTitle
     */
    function consoleLog(pTitle) {
        if (!conShowLog) {
            return;
        }
        let myTitle = pTitle ? pTitle : "";
        console.log(myTitle);
    }

    /**
     * show members of pObject
     * @param {any} pObject
     * @param {string} title
     * @param {boolean} pIsDebug
     */
    function showObject(pObject, title, pIsDebug) {
        if (pIsDebug && !conShowLog) {
            return;
        }
        let myTitle = title ? title : "No title";
        console.log(`showObject ${myTitle}`);
        console.log(`type- ${typeof (pObject)}`);
        if (pObject === null) {
            console.log("object is null");
        }
        else {
            if (typeof pObject === "object") {
                let myObjString = JSON.stringify(pObject, null, 2);
                console.log("obj: " + myObjString);
            }
            else if (typeof pObject === "function") {
                console.log("Object is a function");
            }
            else {
                console.log(`no obj:  ${pObject}`);
            }
        }
    }

    /**
     * add pToAddDays days to pDate
     * @param {Date} pDate
     * @param {number} pToAddDays
     */
    function addDays(pDate, pToAddDays) {
        let myResult = new Date(pDate.getTime() + pToAddDays * DAY_IN_MILLISECONDS);
        return myResult;
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
            if (mTestGenerator.wifiProblem) {
                return { wifiProblem: mTestGenerator.wifiProblem };
            }
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
            //showObject(myServerdata, "myServerdata");
            if (!myServerdata || !myServerdata.usedPercentage) {
                showObject(myServerdata, "Server Problem: invalid data");
                return { wifiProblem: "Server Problem: invalid data" };
            }
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
            console.log(err.toString());
            // Server error, if phone is on wifi, not LTE:
            // Error: Die Daten konnten nicht gelesen werden, da sie nicht das korrekte Format haben.
            let myIndex = err.toString().toUpperCase().indexOf("FORMAT");
            if (myIndex < 0) {
                // no request error
                throw "catch err: " + err;
            }
            // if reading from pass.telekom.de not possible-> read data from iCloud file
            let myStoredData = readFromFile(path);
            showObject(myStoredData, "fm.readString");
            if (!myStoredData) {
                return { wifiProblem: "Please disable WiFi for initial execution (1)" }
            }
            myServerdata = myStoredData.data; // ? myStoredData.data : myStoredData;
            if (!myServerdata || !myServerdata.usedPercentage) {
                return { wifiProblem: "Please disable WiFi for initial execution (2)" }
            }
            return { fresh: false, myStoredData };
        }
        /**
        * @param {string} path
         * @returns {StoredData}
         * */
        function readFromFile(path) {
            let myStoredData = JSON.parse(fm.readString(path), null);
            return myStoredData;
        }
    }

    /**
     * return ascending history
     * @param {FileManager} fm
     * @param {string} conHistoryPath
     * @param {StoredData} pStoredData: StoredData
     * @param {boolean} pFresh
     */
    async function readAndUpdateStoredDatas(fm, pStoredData, pFresh) {
        let dir = fm.documentsDirectory()
        const conHistoryPath = fm.joinPath(dir, "ScriptableTelekomHistory.json");
        logStoredData(pStoredData, "pStoredData");
        let myStoredDatas = await readStoredDatas();
        for (let iEle of myStoredDatas) {
            logStoredData(iEle, "myStoredDatas");
        }

        if (pFresh && pStoredData) {
            // fresh data beats stored history
            myStoredDatas = myStoredDatas.filter(function (pVal) { return pVal.accessTime <= pStoredData.accessTime });
            for (let iEle of myStoredDatas) {
                logStoredData(iEle, "myStoredDatas.filter");
            }
        }
        if ((pFresh || myStoredDatas.length <= 0) && pStoredData) {
            myStoredDatas.push(pStoredData);
            for (let iEle of myStoredDatas) {
                logStoredData(iEle, "myStoredDatas.push");
            }
        }
        // sort ascending
        myStoredDatas.sort(function (left, right) { return left.accessTime - right.accessTime; });

        /**purged copy of myStoredDatas */
        let myNewStoredDatas = purgeStoredData(myStoredDatas, pStoredData);

        if (!mTestGenerator) {
            // non test data is written back to file
            let myStoredDatasString = JSON.stringify(myNewStoredDatas);
            fm.writeString(conHistoryPath, myStoredDatasString);
        }
        for (let iEle of myNewStoredDatas) {
            logStoredData(iEle, "myNewStoredDatas");
        }
        return myNewStoredDatas;

        /** read from history file or test data
         * @returns{Promise<StoredData[]>}
         * */
        async function readStoredDatas() {
            if (mTestGenerator) {
                return mTestGenerator.storedDatas;
            }
            else {
                let myStoredDatas = await readFromFileStoredDatas(conHistoryPath);
                return myStoredDatas;
            }
        }

        /**
         * 
         * @param {StoredData[]} pStoredDatas sorted array of StoredData
         * @returns {StoredData[]}
         */
        function purgeStoredData(pStoredDatas) {
            let myNewStoredDatas = [];
            for (let i = 0; i < pStoredDatas.length; i++) {
                let iStoredData = pStoredDatas[i];
                pushOrReplace(myNewStoredDatas, iStoredData);
            }
            return myNewStoredDatas;
        }

        /** read from file
         * @param {string} pHistoryPath
         * @returns {Promise<StoredData[]>}
         */
        async function readFromFileStoredDatas(pHistoryPath) {
            if (fm.fileExists(pHistoryPath)) {
                await fm.downloadFileFromiCloud(pHistoryPath);
                let myHistoryDataString = fm.readString(pHistoryPath);
                if (myHistoryDataString) {
                    let myStoredDatas = JSON.parse(myHistoryDataString);
                    console.log("fileExists: ");
                    for (let iEle of myStoredDatas) {
                        consoleLog(`${iEle.accessString}: ${iEle.data.usedPercentage}%`);
                    }
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
         * push, replace or clear pNewStoredDatas (destructive on pNewStoredDatas)
         * @param {StoredData[]} pNewStoredDatas StoredData[]
         * @param {StoredData} pStoredData StoredData
         */
        function pushOrReplace(pNewStoredDatas, pStoredData) {
            if (pNewStoredDatas.length <= 0) {
                //console.log("pushOrReplace: push to new");
                pNewStoredDatas.push(pStoredData);
            }
            else {
                let myPreviousEndDate = calcEndDate(pNewStoredDatas[pNewStoredDatas.length - 1]);
                let myCurrEndDate = calcEndDate(pStoredData);
                //                 console.log(`pushOrReplace {myPreviousEndDate} {myCurrEndDate} ${myPreviousEndDate} ${myCurrEndDate}`);
                if (myCurrEndDate.getTime() > myPreviousEndDate.getTime() + HOUR_IN_SECONDS * 1000) {
                    // new pass
                    consoleLog("new pass");
                    // clear pNewStoredDatas and add current item
                    pNewStoredDatas.length = 0;
                    pNewStoredDatas.push(pStoredData);
                    //console.log(`pushOrReplace-pNewStoredDatas: ${pNewStoredDatas.length}`);
                }
                else {
                    if (getDateStringFromStoredData(pNewStoredDatas[pNewStoredDatas.length - 1]) === getDateStringFromStoredData(pStoredData)) {
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
     * @returns {HistoryData[]}
     */
    function getHistoryDatas(pStoredDatas) {
        // #region get myNewHistory
        // history
        let myHistoryDatas = [];

        consoleLog("Show data: " + pStoredDatas.length);
        // set true, if test for red needed
        if (pStoredDatas.length >= 0) {
            let myFirstStoredData = pStoredDatas[0];
            let myEndDate = calcEndDate(myFirstStoredData);
            consoleLog(`myFirstStoredData: ${getDateStringFromStoredData(myFirstStoredData)} - end time: ${myEndDate.toLocaleString()}`);
            let myStartDate = addDays(myEndDate, -conDaysPerPackage);
            consoleLog(`myStartDate: ${myStartDate.toLocaleString()}`);

            let myRemainingSeconds = conDaysPerPackage * DAY_IN_SECONDS;
            let myUsed = 0;

            let myStartServerData = createServerData(myUsed, myRemainingSeconds, myStartDate);
            let myOldestStoredData = createStoredData(myStartServerData);
            showObject(myOldestStoredData, "myOldestStoredData", true);

            let myHistoryData = createHistoryData(myOldestStoredData);
            myHistoryDatas = [myHistoryData];

            let myIndex = 0;
            let myNowString = getDateStringFromDate(new Date());
            let myNextDay = addDays(new Date(myOldestStoredData.accessTime), 1);

            while (getDateStringFromDate(myNextDay).localeCompare(myNowString) <= 0) {
                for (let i = myIndex; i < pStoredDatas.length; i++) {
                    let myCurrStoredData = pStoredDatas[i];
                    if (getDateStringFromStoredData(myCurrStoredData).localeCompare(getDateStringFromDate(myNextDay)) <= 0) {
                        myIndex = i;
                        myOldestStoredData = myCurrStoredData;
                    }
                    else {
                        break;
                    }
                }
                let myHistoryData = createHistoryData(myOldestStoredData, myNextDay);
                myHistoryDatas.push(myHistoryData);
                myNextDay = addDays(myNextDay, 1);
            }
            // pack runs 31 days
            const conTotalSeconds = conDaysPerPackage * DAY_IN_SECONDS;

            for (let iEle of myHistoryDatas) {
                let myRestSeconds = (myEndDate.getTime() - iEle.date.getTime()) / 1000;
                let myRestTime = 100 * myRestSeconds / conTotalSeconds;
                consoleLog(`${iEle.dateString}: data: ${100 - iEle.entry.data.usedPercentage}% time: ${myRestTime.toFixed()}%`);
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
     * @param {StoredData} pStoredData StoredData
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
     * history data has a possible different date from StoredData.accessTime
     * @param {StoredData} pStoredData StoredData
     * @param {Date} pDate
     * @returns {HistoryData}
     */
    function createHistoryData(pStoredData, pDate) {
        let myDate = pDate ? pDate : new Date(pStoredData.accessTime);
        return {
            entry: pStoredData,
            dateString: myDate.toString(),
            date: myDate
        };
    }

    /**
     * StoredData has a possible different accessTime from ServerData.usedAt
     * @param {ServerData} pServerdata ServerData
     * @param {Date} pAccessTime
     * @returns {StoredData}
     */
    function createStoredData(pServerdata, pAccessTime) {
        let myAccessTime = pAccessTime ? pAccessTime : new Date(pServerdata.usedAt);
        return {
            version: `Written by telekom.js version: ${conVersion}`,
            data: pServerdata,
            accessTime: myAccessTime.getTime(),
            accessString: myAccessTime.toString()
        };
    }

    /**
     * subset of data sent from server
     * @param {number} pUsedPercentage
     * @param {number} pRemainingSeconds
     * @param {Date} pUsedAt
     * @param {string} pUsedVolumeStr
     * @returns {ServerData}
     */
    function createServerData(pUsedPercentage, pRemainingSeconds, pUsedAt) {
        // 6000 MB
        const conInitialVolume = 6000;
        let myUsedVolume = pUsedPercentage * conInitialVolume / 100;
        return {
            usedPercentage: pUsedPercentage,
            remainingSeconds: pRemainingSeconds,
            usedAt: pUsedAt.getTime(),
            usedVolume: myUsedVolume,
            usedVolumeStr: niceVolumeString(myUsedVolume),
            initialVolumeStr: niceVolumeString(conInitialVolume)
        };
        /**
         * 
         * @param {number} pVolume
         */
        function niceVolumeString(pVolume) {
            let myInitString = `${pVolume} MB`;
            if (pVolume > 100) {
                myInitString = `${(pVolume / 1000).toFixed(1)} GB`;
            }
            return myInitString;
        }
    }
    // #endregion

    // #endregion
}

/**
 * 
 * @param {Date} myEndDate
 */
function dateStringNoSeconds(myEndDate) {
    let myEndDateStr = myEndDate.toLocaleString("DE-de");
    let myEndDateStrNice = myEndDateStr.slice(0, myEndDateStr.length - 3);
    return myEndDateStrNice;
}
