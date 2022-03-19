
// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
const conVersion = "V220319";

const conDocArchURL = "https://docarchive.azurewebsites.net/app/document";

// antiquewhite
const conAntiqueWhite = new Color("#faebd7");
const conNameLength = 25;
const conTableFontSize = 14;
const conMaxRows = 2;

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
else {
    await widget.presentMedium();
}

Script.setWidget(widget)
Script.complete()

async function createWidget() {
    const list = new ListWidget();
    list.url = conDocArchURL;
    list.addSpacer(5);
    let myTitle = list.addText("DocArch overdue check");
    myTitle.font = Font.title1();

    try {
        let { myUser, myPassword } = getUserParameter();
        let myUserLine = list.addText("for: " + myUser);
        myUserLine.font = Font.subheadline();
        list.addSpacer(15);
        let myOverdueDocs = await getOverdueDocuments(myUser, myPassword);
        let myOverdueCount = myOverdueDocs.length; //await getOverdueCount(myUser, myPassword);
        console.log(`createWidget getOverdueCount: ${myOverdueCount}`);

        let myOverdueText = myOverdueCount > 0 ? `${myOverdueCount} overdue documents` : "No overdue documents";
        const myOverdueTextline = list.addText(myOverdueText);
        myOverdueTextline.font = Font.boldSystemFont(18);

        if (myOverdueCount > 0) {
            if (myOverdueCount > conMaxRows) {
                for (var i = 0; i < conMaxRows; i++) {
                    let iDoc = myOverdueDocs[i];
                    addDocRow(iDoc);
                }
                addRowWithName("...more");
            }
            else {
                for (let iDoc of myOverdueDocs) {
                    addDocRow(iDoc);
                }
            }
            let myLastNotify = 0;
            let fm = FileManager.local();
            let file = fm.joinPath(fm.documentsDirectory(), "OverdueDocs.json");

            try {
                myLastNotify = JSON.parse(fm.readString(file));
                log("myLastNotify: " + new Date(myLastNotify).toString());
            } catch (e) {
                log("FileManager error: " + e);
            }
            let myMSInADay = 24 * 60 * 60 * 1000;
            let myNow = new Date().getTime();
            if (myNow - myLastNotify > myMSInADay) {
                log("myLastNotify more than a day: " + new Date(myLastNotify).toString());
                // show only once a day
                let notify = new Notification();
                notify.title = `DocArch overdue check`;
                notify.body = myOverdueText;
                notify.openURL = conDocArchURL;
                //notify.setDailyTrigger(8, 0, false);
                await notify.schedule();
                fm.writeString(file, JSON.stringify(myNow));
            }

            showLink(list, "DocArch App", conDocArchURL);
            myOverdueTextline.textColor = Color.red();
        }
        else {
            myOverdueTextline.textColor = Color.green();
        }
        list.addSpacer(14);
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
        //let myErrorLine = list.addText(err);
        //myErrorLine.textColor = Color.red();
    }

    return list

    function addDocRow(iDoc) {
        var myRow = addRowWithName(iDoc.mDocument.FriendlyName);
        if (iDoc.mDocument.DueDate) {
            try {
                myRow.addSpacer(15);
                let myDate = new Date(iDoc.mDocument.DueDate);
                let myDateCell = myRow.addText(myDate.toLocaleDateString());
                myDateCell.font = Font.italicSystemFont(conTableFontSize);
                myDateCell.rightAlignText();
            } catch (e) {
                console.log("date error: " + iDoc.mDocument.DueDate);
            }
        }
    }

    function addRowWithName(pDocName) {
        let myRow = list.addStack();
        let myName = pDocName.length <= conNameLength ? pDocName : pDocName.substr(0, conNameLength - 3) + "...";
        let myNameCell = myRow.addText(myName);
        myNameCell.font = Font.boldSystemFont(conTableFontSize);
        return myRow; 
    }
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
            let myObjString = JSON.stringify(pObject, null, 2);
            console.log(myObjString);
        }
    }
}
/** get count of overdue docs on docArchive */
async function getOverdueCount(pUser, pPassword) {
    try {
        //https://docarchive.azurewebsites.net/app/api/getoverduecount?Pusername=klaus@nottbohm.net&ppassword=asdlkj
        const apiUrl = (pUser, pPassword) => `https://docarchive.azurewebsites.net/app/api/getoverduecount?pUserName=${pUser}&pPassword=${pPassword}`;

        let myURL = apiUrl(pUser, pPassword);
        console.log(myURL);
        const myOverdueCountRequest = new Request(myURL);
        //myOverdueCountRequest.allowInsecureRequest = true;

        const myOverdueCount = await myOverdueCountRequest.loadJSON();
        showObject(myOverdueCount, "myOverdueCount");
        console.log("myOverdueCount " + myOverdueCount);
        console.log("myOverdueCount.Status " + myOverdueCount.Status);
        if (myOverdueCount.Status !== "success") {
            throw myOverdueCount.Message;
        }
        console.log("myOverdueCount.InfoObject " + myOverdueCount.InfoObject);
        let myResult = JSON.parse(myOverdueCount.InfoObject);
        console.log("myResult " + myResult);

        const logOutUrl = `https://docarchive.azurewebsites.net/api/Login/Logout`;
        myOverdueCountRequest.url = logOutUrl;
        myOverdueCountRequest.method = "delete";
        let myLogoutResult = await myOverdueCountRequest.loadString();
        console.log("myLogoutResult " + myLogoutResult);

        return myResult;
    } catch (e) {
        console.log("catch getOverdueCount" + e);
        throw e;
    }
}
async function getOverdueDocuments(pUser, pPassword) {
    try {
        //https://docarchive.azurewebsites.net/app/api/GetOverdueDocuments?Pusername=klaus@nottbohm.net&ppassword=asdlkj
        const apiUrl = (pUser, pPassword) => `https://docarchive.azurewebsites.net/app/api/GetOverdueDocumentsInTempSession?pUserName=${pUser}&pPassword=${pPassword}`;

        let myURL = apiUrl(pUser, pPassword);
        console.log(myURL);
        const myOverdueCountRequest = new Request(myURL);

        const myResponse = await myOverdueCountRequest.loadJSON();
        showResponse(myResponse);

        if (myResponse.Status !== "success") {
            throw new Error(myResponse.Message);
        }
        let myDocuments = JSON.parse(myResponse.InfoObject);
        //for (let iDoc of myDocuments) {
        //    console.log(iDoc.mDocumentID);
        //    console.log(iDoc.mDocument.FriendlyName);
        //    console.log(iDoc.mDocument.DueDate);
        //}
        return myDocuments;
    } catch (e) {
        console.log("catch getOverdueCount" + e);
        throw e;
    }
    function showResponse(pResponse) {
        console.log("myOverdueCount.Status " + pResponse.Status);
    }
}

function getUserParameter() {
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
    return { myUser, myPassword };
}
