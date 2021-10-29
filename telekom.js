// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
const conVersion = "V211029-2";

const apiUrl = "https://pass.telekom.de/api/service/generic/v1/status";
const conTelekomURL = "https://pass.telekom.de";

// antiquewhite
const conAntiqueWhite = new Color("#faebd7");
const conGrayout = Color.darkGray();
const conPercentageLow = 10;
const conRemainingDaysLow = 2;
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
    let fm = FileManager.local()
    let dir = fm.documentsDirectory()
    let path = fm.joinPath(dir, "scriptable-telekom.json")
    //console.log(`fm.joinPath ${path}`);

    const list = new ListWidget()
    list.addSpacer(10)

    try {
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

        let data, fresh = 0;
        try {
            // Fetch data from pass.telekom.de
            data = await r.loadJSON();
            //let myStoredData = { data: data, accessTime = new Date().getTime() };
            // Write JSON to iCloud file
            fm.writeString(path, JSON.stringify(data, null, 2));
            fresh = 1;
        }
        catch (err) {
            try {
                // if reading from pass.telekom.de not possible-> read data from iCloud file
                //let myStoredData = JSON.parse(fm.readString(path), null);
                //if (!myStoredData) {
                //    const errorList = new ListWidget();
                //    errorList.addText("Please disable WiFi for initial execution.");
                //    return errorList;
                //}
                //data = myStoredData.data ? myStoredData.data : myStoredData;
                //let myAccessTime = myStoredData.accessTime ? myStoredData.accessTime : data.usedAt;
                data = JSON.parse(fm.readString(path), null);
                if (!data || !data.usedPercentage) {
                    const errorList = new ListWidget();
                    errorList.addText("Please disable WiFi for initial execution.");
                    return errorList;
                }
            } catch (errInner) {
                console.error("errInner");
                console.error(errInner);
            }
        }

        // now data contains data from server or from local file
        //showObject(data, "Data");
        showLink(list, "Rest data/time", conTelekomURL);
        let myRestData = 100 - data.usedPercentage;

        // time = msec
        let myRestSeconds = (calcEndDate(data) - new Date()) / 1000;
        // pack runs 31 days
        const conTotalSeconds = 31 * 24 * 60 * 60;
        let myRestTime = 100 * myRestSeconds / conTotalSeconds;
        let myFixed = myRestTime >= 10 ? 0 : 1;
        let myRestText = `${myRestData.toFixed(0)}% / ${myRestTime.toFixed(myFixed)}%`;
        const line2 = list.addText(myRestText);

        //showLink(list, "Used data");

        //const line2 = list.addText(data.usedPercentage + "%")
        line2.font = Font.boldSystemFont(20);
        line2.textColor = Color.green();
        if (data.usedPercentage >= 75) {
            line2.textColor = Color.orange();
        }
        else if (data.usedPercentage >= 90) {
            line2.textColor = Color.red();
        }

        const myRemainingData = 100 - data.usedPercentage;
        // notify if less than LowDays left
        const conRemainingSecondsLow = 60 * 60 * 24 * conRemainingDaysLow;
        const conRemainingSecondsVeryLow = 60 * 60 * conRemainingHoursVeryLow;
        if (myRemainingData <= conPercentageVeryLow || (data.remainingSeconds && data.remainingSeconds <= conRemainingSecondsVeryLow)) {
            let notify1 = new Notification();
            let myRemainingHours = (data.remainingSeconds / (60 * 60)).toFixed(0);
            let myString = "Remaining: " + myRemainingData.toString() + "% - " + myRemainingHours + " hours";
            notify1.title = "Telekom data very low!";
            notify1.body = myString;
            notify1.openURL = conTelekomURL;
            await notify1.schedule();
        }
        else if (myRemainingData <= conPercentageLow || (data.remainingSeconds && data.remainingSeconds <= conRemainingSecondsLow)) {
            let notify1 = new Notification();
            notify1.title = "Remaining Telekom data";
            if (data.remainingSeconds < 60 * 60 * 24) {
                // less than 1 day-> show hours
                let myRemaininghours = (data.remainingSeconds / (60 * 60)).toFixed(0);
                let myString = "Remaining: " + myRemainingData.toString() + "% - " + myRemaininghours + " hours";
                notify1.body = myString;
            }
            else {
                let myRemainingDays = (data.remainingSeconds / (60 * 60 * 24)).toFixed(0);
                let myString = "Remaining: " + myRemainingData.toString() + "% - " + myRemainingDays + " days";
                notify1.body = myString;
            }
            notify1.openURL = conTelekomURL;
            await notify1.schedule();
        }

        const line3 = list.addText(data.usedVolumeStr + " / " + data.initialVolumeStr)
        line3.font = Font.mediumSystemFont(12)

        list.addSpacer(16)

        let line4, line5, line6
        if (data.remainingSeconds) {
            let myUntilStack = list.addStack();
            myUntilStack.spacing = 4;
            line4 = myUntilStack.addText("Runs until:");
            line4.font = Font.mediumSystemFont(12);

            // calc end of current pack
            let myEndDate = new Date(new Date(data.usedAt).getTime() + data.remainingSeconds * 1000);
            line5 = myUntilStack.addDate(myEndDate);
            line5.font = Font.mediumSystemFont(12);
            // show hour
            line6 = myUntilStack.addDate(myEndDate);
            line6.applyTimeStyle();
            line6.font = Font.mediumSystemFont(12);
        }
        list.addSpacer(4);
        let myDateColor = Color.black();
        // Gray out if local data instead of Telekom API data:
        if (fresh === 0) {
            myDateColor = conGrayout;
            line2.textColor = conGrayout
            line3.textColor = conGrayout
            if (data.remainingTimeStr) {
                line4.textColor = conGrayout
                line5.textColor = conGrayout
            }
        }

        // Add time of last widget refresh:
        addDateLine(new Date(), "App refresh", myDateColor);
        let myDateFooter = addDateLine(new Date(data.usedAt), "Server refresh", myDateColor);
        myDateFooter.addSpacer(50);
        let myLine = myDateFooter.addText(`${conVersion}`);
        myLine.font = Font.italicSystemFont(10);
    }
    catch (err) {
        list.addText("error")
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
 * calc end date from current + remaining seconds
 * @param {any} data
 */
function calcEndDate(data) {
    // usedAt = msec
    let myEndDate = data.usedAt + data.remainingSeconds * 1000;
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
            for (var key in pObject) {
                console.log(key + ": " + pObject[key]);
            }
        }
        else if (typeof pObject === "function") {
            console.log("Object is a function");
        }
        else {
            console.log(`${pObject}`);
        }
    }
}
