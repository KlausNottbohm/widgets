function viewModel() {
    var self = this;
    self.mShowJson = ko.observable(false);
    self.onShowJsonClick = () => { self.mShowJson(!self.mShowJson()); };

    // read in #scriptTag
    let myTestData = createFakeJson(); //JSON.stringify(telekomJSON);    

    self.mJsonData = ko.observable(myTestData);
    self.records = ko.observableArray();
    showData(myTestData);

    self.onLoadFile = function (file) {
        if (!file) {
            return;
        }
        loadFileAsync(file);
    }
    async function loadFileAsync(file) {
        let text = await file.text();
        showData(text);
    }
    function showData(text) {
        let myJsonPretty = text;

        //console.log(text);
        self.mJsonData(myJsonPretty);
        let myArray = JsonToDateEntries(text);
        let myPasses = dateEntriesToRecords(myArray);
        self.records(myPasses);
    }

};

/**
 * convert date entries to pass records: passEnd[(mDate, mData)]
 * @param {any} myArray
 */
function dateEntriesToRecords(myArray) {
    let myPasses = [];
    for (let iEle of myArray) {
        let myPassExists = false;
        for (let iInner of myPasses) {
            // diff in msecs
            let myDiff = Math.abs(iInner.mEndDate.getTime() - iEle.mEndDate.getTime());
            // same minute?
            if (myDiff < 60 * 1000) {
                myPassExists = true;
                iInner.records.push(iEle);
                break;
            }
        }
        if (!myPassExists) {
            let myPass = { mEndDate: iEle.mEndDate, initialVolume: iEle.initialVolume, records: [iEle] };
            myPasses.push(myPass);
        }
    }
    return myPasses;
}

/**
 * convert json string to records format (passEnd(mDate, mData))
 * @param {any} pJson
 */
function JsonToDateEntries(pJson) {
    let myObject = JSON.parse(pJson);
    myObject.sort(function (left, right) { return left.mDate - right.mDate; });
    // remainingSeconds: 1055447
    // usedAt: 1620191668000
    // usedPercentage: 33
    // initialVolume: 2684354560
    // usedVolume: 880088349
    let myRecords = [];

    for (let iEle of myObject) {
        let myDate = new Date(iEle.mDate);
        console.log("");
        let myEndDate = calcEndDate(myDate, iEle.mData.remainingSeconds);
        let myData = {
            initialVolume: iEle.mData.initialVolume,
            remainingSeconds: iEle.mData.remainingSeconds,
            usedAt: iEle.mData.usedAt,
            //usedPercentage: iEle.mData.usedPercentage,
            usedVolume: iEle.mData.usedVolume,
            mDate: myDate,
            remainingDataPercentage: 100 - 100 * (iEle.mData.usedVolume / iEle.mData.initialVolume),  //100 - iEle.mData.usedPercentage,
            remainingTimePercentage: 100 * iEle.mData.remainingSeconds / (30 * 24 * 60 * 60),
            mEndDate: myEndDate
        };
        myRecords.push(myData);
        // #region console output
        //console.log(`myDate ${myDate}`);
        //console.log(`myEndDate ${myEndDate}`);
        //console.log(`initialVolume ${myData.initialVolume}`);
        //console.log(`remainingSeconds ${myData.remainingSeconds}`);
        //console.log(`usedAt ${myData.usedAt}`);
        //console.log(`usedPercentage ${myData.usedPercentage}`);
        //console.log(`usedVolume ${myData.usedVolume}`);
        // #endregion
    }
    return myRecords;
}
/**
 * create fake json string
 * */
function createFakeJson() {
    let myEndDate = new Date(2021, 3, 18, 16);
    let myHoursBeforeEnd1 = 2;
    let myHoursBeforeEnd2 = 20 * 24;
    let myFakeData1 = {
        mDate: (myEndDate.getTime() - myHoursBeforeEnd1 * 1000 * 60 * 60),
        mData: {
            initialVolume: 200000000,
            remainingSeconds: myHoursBeforeEnd1 * 60 * 60,
            usedAt: (new Date(2021, 3, 20, 18)).getTime(),
            usedVolume: 50000000
        }
    };
    telekomJSON.push(myFakeData1);
    let myFakeData2 = {
        mDate: (myEndDate.getTime() - myHoursBeforeEnd2 * 1000 * 60 * 60),
        mData: {
            initialVolume: 200000000,
            remainingSeconds: myHoursBeforeEnd2 * 60 * 60,
            usedAt: (new Date(2021, 3, 1, 18)).getTime(),
            usedVolume: 500000
        },
    };
    telekomJSON.push(myFakeData2);
    let myTestData = JSON.stringify(telekomJSON, null, 2);
    return myTestData;
}
/**
 * calc end date from current + remaining seconds
 * @param {any} myDate
 * @param {any} remainingSeconds
 */
function calcEndDate(myDate, remainingSeconds) {
    return new Date(myDate.getTime() + 1000 * remainingSeconds);
}
