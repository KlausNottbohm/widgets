// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
const conVersion = "V211031";

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
            myStoredData = { data: data, accessTime: new Date().getTime() };
            showObject(myStoredData, "fm.writeString");
            // Write JSON to iCloud file
            fm.writeString(path, JSON.stringify(myStoredData, null, 2));
            fresh = true;
        }
        catch (err) {
            try {
                // if reading from pass.telekom.de not possible-> read data from iCloud file
                myStoredData = JSON.parse(fm.readString(path), null);
                showObject(fm.readString(path), "fm.readString");
                if (!myStoredData) {
                    const errorList = new ListWidget();
                    errorList.addText("Please disable WiFi for initial execution.");
                    return errorList;
                }
                data = myStoredData.data ? myStoredData.data : myStoredData;
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
        let myRestText = `${myRestData.toFixed(0)}% / ${myRestTime.toFixed(myFixed)}%`;
        const lineRestText = list.addText(myRestText);

        //showLink(list, "Used data");

        //const line2 = list.addText(data.usedPercentage + "%")
        lineRestText.font = Font.boldSystemFont(20);
        lineRestText.textColor = Color.green();
        if (data.usedPercentage >= 75) {
            lineRestText.textColor = Color.orange();
        }
        else if (data.usedPercentage >= 90) {
            lineRestText.textColor = Color.red();
        }

        const myRemainingData = 100 - data.usedPercentage;
        // notify if less than LowDays left
        const conRemainingSecondsLow = 60 * 60 * 24 * conRemainingDaysLow;
        const conRemainingSecondsVeryLow = 60 * 60 * conRemainingHoursVeryLow;
        if (myRemainingData <= conPercentageVeryLow || (myRestSeconds <= conRemainingSecondsVeryLow)) {
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
            notify1.title = "Remaining Telekom data";
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
            lineRestText.textColor = conGrayout;
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
