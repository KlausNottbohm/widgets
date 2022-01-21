
// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
const conVersion = "V220120";

const conDocArchURL = "https://docarchive.azurewebsites.net/app/document";

// antiquewhite
const conAntiqueWhite = new Color("#faebd7");
const conGrayout = Color.darkGray();
const conPercentageLow = 10;
const conRemainingDaysLow = 2;
const conPercentageVeryLow = 1;
const conRemainingHoursVeryLow = 6;
let widget;
try {
    widget = await createWidget();
    console.log("createWidget ok");
} catch (e) {
    console.log("createWidget error " + e);
    throw e;
}
widget.backgroundColor = conAntiqueWhite;
if (!config.runsInWidget) {
    await widget.presentLarge()
}

Script.setWidget(widget)
Script.complete()

async function createWidget() {
    const list = new ListWidget();
    list.addSpacer(5);
    let myTitle = list.addText("DocArch overdue check");
    myTitle.font = Font.boldSystemFont(20);

    try {
        let myOverdueCount = await getOverdueCount();
        console.log(`createWidget getOverdueCount: ${myOverdueCount}`);
        list.url = conDocArchURL;

        let myOverdueText = myOverdueCount > 0 ? `${myOverdueCount} overdue documents` : "No overdue documents";
        const myOverdueTextline = list.addText(myOverdueText);

        myOverdueTextline.font = Font.boldSystemFont(14);
        //lineRestText.textColor = Color.green();
        if (myOverdueCount > 0) {
            showLink(list, "DocArch App", conDocArchURL);
            myOverdueTextline.textColor = Color.red();
            let notify = new Notification();
            notify.title = `DocArch overdue check`;
            notify.body = myOverdueText;
            notify.openURL = conDocArchURL;
            await notify.schedule();
        }
        else {
            myOverdueTextline.textColor = Color.green();
        }
        list.addSpacer(4);
        let myDateColor = Color.black();
        // Add time of last widget refresh:
        addDateLine(list, new Date(), "App refresh", myDateColor);
        // version right aligned
        let myVersiontext = list.addText(`${conVersion}`);
        myVersiontext.font = Font.italicSystemFont(10);
        myVersiontext.rightAlignText();
    }
    catch (err) {
        showObject(err, "catch (err)");
        let myErrorHeader = list.addText("Error");
        myErrorHeader.textColor = Color.red();
        let myErrorLine = list.addText(err);
        myErrorLine.textColor = Color.red();
    }

    return list
}

/**
 * adds date to list, date format or time format depending on distance to now. Returns added WidgetStack
 * @param {any} pDate
 * @param {any} pTitle
 * @param {any} pColor
 */
function addDateLine(pList, pDate, pTitle, pColor) {
    const footer = pList.addStack();
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
/** get count of overdue docs on docArchive */
async function getOverdueCount() {
    try {
        //https://docarchive.azurewebsites.net/app/api/getoverduecount?Pusername=klaus@nottbohm.net&ppassword=asdlkj
        const apiUrl = (pUser, pPassword) => `https://docarchive.azurewebsites.net/app/api/getoverduecount?pUserName=${pUser}&pPassword=${pPassword}`;

        let myArgs = args.widgetParameter;
        //myArgs = "klaus@nottbohm.net,asdlkj";
        let myUser = "klaus@nottbohm.net";
        let myPassword = "asdlkj";

        if (myArgs) {
            const myArguments = myArgs.split(',');
            myUser = myArguments[0];
            myPassword = myArguments[1];
            console.log('args: ' + myUser + " " + myPassword);
        }
        else {
            console.log('From constant: ' + myUser + " " + myPassword);
        }
        let myURL = apiUrl(myUser, myPassword);
        console.log(myURL);
        const myOverdueCountRequest = new Request(myURL);
        //myOverdueCountRequest.allowInsecureRequest = true;
        showObject(myOverdueCountRequest, "myOverdueCountRequest");
        //const myOverdueCount = await myOverdueCountRequest.load();
        const myOverdueCount = await myOverdueCountRequest.loadJSON();
        //showObject(myOverdueCount, "myOverdueCount");
        showObject(myOverdueCount, "myOverdueCount");
        console.log("myOverdueCount " + myOverdueCount);
        console.log("myOverdueCount.Status " + myOverdueCount.Status);
        if (myOverdueCount.Status !== "success") {
            throw myOverdueCount.Message;
        }
        console.log("myOverdueCount.InfoObject " + myOverdueCount.InfoObject);
        let myResult = JSON.parse(myOverdueCount.InfoObject);
        console.log("myResult " + myResult);
        return myResult;
    } catch (e) {
        console.log("catch getOverdueCount" + e);
        throw e;
    }
}
