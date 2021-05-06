// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.

const apiUrl = "https://pass.telekom.de/api/service/generic/v1/status";

const conGrayout = Color.darkGray();
const conPercentageLow = 10;
const conRemainingDaysLow = 2;
const conPercentageVeryLow = 1;
const conRemainingHoursVeryLow = 6;

let widget = await createWidget();
// antiquewhite
widget.backgroundColor = new Color("#faebd7");
if (!config.runsInWidget) {
    await widget.presentSmall()
}

Script.setWidget(widget)
Script.complete()

async function createWidget(items) {
    let fm = FileManager.local()
    let dir = fm.documentsDirectory()
    let path = fm.joinPath(dir, "scriptable-telekom.json")

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
            // Write JSON to iCloud file
            fm.writeString(path, JSON.stringify(data, null, 2));
            fresh = 1;
        }
        catch (err) {
            showObject(err);
            // Read data from iCloud file
            data = JSON.parse(fm.readString(path), null);
            if (!data || !data.usedPercentage) {
                const errorList = new ListWidget();
                errorList.addText("Please disable WiFi for initial execution.");
                return errorList;
            }
        }

        // now data contains data from server or from local file
        showObject(data);

        const line1 = list.addText("Used data")
        line1.font = Font.title2()

        const line2 = list.addText(data.usedPercentage + "%")
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
        if (myRemainingData <= conPercentageVeryLow || (data.remainingSeconds && data.remainingSeconds <= conRemainingSecondsVeryLow)){
            let notify1 = new Notification();
            let myRemainingHours = (data.remainingSeconds / (60 * 60)).toFixed(0);
            let myString = "Remaining: " + myRemainingData.toString() + "% - " + myRemainingHours + " hours";
            notify1.title = "Telekom data very low!";
            notify1.body = myString;
            await notify1.schedule();
        }
        else if (myRemainingData <= conPercentageLow || (data.remainingSeconds && data.remainingSeconds <= conRemainingSecondsLow)) {
            let notify1 = new Notification();
            let myRemainingDays = (data.remainingSeconds / (60 * 60 * 24)).toFixed(0);
            let myString = "Remaining: " + myRemainingData.toString() + "% - " + myRemainingDays + " days";
            notify1.title = "Remaining Telekom data";
            notify1.body = myString;
            await notify1.schedule();
        }

        const line3 = list.addText(data.usedVolumeStr + " / " + data.initialVolumeStr)
        line3.font = Font.mediumSystemFont(12)

        list.addSpacer(16)

        let line4, line5
        if (data.remainingSeconds) {
            line4 = list.addText("Runs until:");
            line4.font = Font.mediumSystemFont(12);

            // calc end of current pack
            let myEndDate = new Date(new Date(data.usedAt).getTime() + data.remainingSeconds * 1000);
            line5 = list.addDate(myEndDate);
            line5.font = Font.mediumSystemFont(12);
        }
        list.addSpacer(4);
        let myDateColor = Color.black();
        // Gray out if local data instead of Telekom API data:
        if (fresh === 0) {
            myDateColor = conGrayout;
            line1.textColor = conGrayout
            line2.textColor = conGrayout
            line3.textColor = conGrayout
            if (data.remainingTimeStr) {
                line4.textColor = conGrayout
                line5.textColor = conGrayout
            }
        }
        // Add time of last widget refresh:
        addDateLine(new Date(), "App refresh", myDateColor, true);
        addDateLine(new Date(data.usedAt), "Server refresh", myDateColor);
    }
    catch (err) {
        list.addText("Error fetching JSON from https://pass.telekom.de/api/service/generic/v1/status")
        showObject(err);
    }

    return list

    function addDateLine(pDate, pTitle, pColor, pShowTime) {
        const footer = list.addStack();
        footer.layoutHorizontally();
        let myTitle = footer.addText(pTitle);
        myTitle.font = Font.mediumSystemFont(10);
        myTitle.textColor = pColor; 

        footer.addSpacer(4)
        let timeLabel = footer.addDate(pDate);
        timeLabel.font = Font.italicSystemFont(10);
        if (pShowTime) {
            timeLabel.applyTimeStyle();
        }
        timeLabel.textColor = pColor;
    }
}
function newFunction() {
    return Color.darkGray();
}

/**
 * show members of pObject
 * @param {any} pObject
 */
function showObject(pObject) {
    console.log("showObject: " + Date.now.toString());
    if (pObject === null) {
        console.log("object is null");
    }
    else {
        if (typeof pObject === "object") {
            for (var key in pObject) {
                console.log(key + ": " + pObject[key]);
            }
        }
        else {
            console.log(pObject);
        }
    }
}
