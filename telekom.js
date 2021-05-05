// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: magic;
const apiUrl = "https://pass.telekom.de/api/service/generic/v1/status";
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


let widget = await createWidget()
widget.backgroundColor = new Color("#777777")
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
    list.addSpacer(16)

    try {
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

        const line1 = list.addText("Telekom")
        line1.font = Font.mediumSystemFont(12)

        const line2 = list.addText(data.usedPercentage + "%")
        line2.font = Font.boldSystemFont(20);
        line2.textColor = Color.green();
        if (data.usedPercentage >= 75) {
            line2.textColor = Color.orange();
        }
        else if (data.usedPercentage >= 90) {
            line2.textColor = Color.red();
        }
        const conNotifyPercentage = 90;
        if (data.usedPercentage >= conNotifyPercentage) {
            let notify1 = new Notification();
            let myRemaining = 100 - data.usedPercentage;
            let myString = "Remaining data less than " + myRemaining.toString() + "%";
            notify1.title = "Low Telekom data";
            notify1.body = myString;
            await notify1.schedule();
        }

        // notify if less than 2 days left
        const conRemainingDays = 2;
        const conRemainingSeconds = 60 * 60 * 24 * conRemainingDays;
        if (data.remainingSeconds && data.remainingSeconds <= conRemainingSeconds) {
            let notify1 = new Notification();
            notify1.title = "Telekom data expiration";
            notify1.body = "Remaining time less than " + conRemainingDays + " days";
            await notify1.schedule();
        }

        const line3 = list.addText(data.usedVolumeStr + " / " + data.initialVolumeStr)
        line3.font = Font.mediumSystemFont(12)

        list.addSpacer(16)

        let line4, line5
        if (data.remainingSeconds) {
            line4 = list.addText("Remaining until:");
            line4.font = Font.mediumSystemFont(12);

            // calc end of current pack
            let myEndDate = new Date(new Date(data.usedAt).getTime() + data.remainingSeconds * 1000);
            line5 = list.addDate(myEndDate);
            line5.font = Font.mediumSystemFont(12);
        }
        list.addSpacer(4);

        // Gray out if local data instead of Telekom API data:
        if (fresh === 0) {
            line1.textColor = Color.darkGray()
            line2.textColor = Color.darkGray()
            line3.textColor = Color.darkGray()
            if (data.remainingTimeStr) {
                line4.textColor = Color.darkGray()
                line5.textColor = Color.darkGray()
            }
        }
        // Add time of last widget refresh:
        addDateLine(new Date(), "App refresh", true);
        addDateLine(new Date(data.usedAt), "Server refresh");
    }
    catch (err) {
        list.addText("Error fetching JSON from https://pass.telekom.de/api/service/generic/v1/status")
        showObject(err);
    }

    return list

    function addDateLine(pDate, pTitle, pShowTime) {
        const footer = list.addStack();
        footer.layoutHorizontally();
        let myTitle = footer.addText(pTitle);
        myTitle.font = Font.mediumSystemFont(10);
        //timeLabel.centerAlignText();
        myTitle.textColor = Color.black();

        footer.addSpacer(4)
        //const now = pDate; //new Date();
        let timeLabel = footer.addDate(pDate);
        timeLabel.font = Font.mediumSystemFont(10);
        if (pShowTime) {
            timeLabel.applyTimeStyle();
        }
        //timeLabel.centerAlignText();
        timeLabel.textColor = Color.darkGray();
    }
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
