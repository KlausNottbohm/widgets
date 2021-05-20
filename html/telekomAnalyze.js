var viewModel = function () {
    var self = this;
    let myTestData = '[{"mDate": 1621530346191,"mData": {"usedVolumeStr": "52,43 MB","remainingTimeStr": "27 Tage 21 Std.","hasOffers": true,"remainingSeconds": 2409929,"usedAt": 1621526313000,"validityPeriod": 5,"usedPercentage": 3,"title": "","initialVolume": 2684354560,"initialVolumeStr": "2,5 GB","passType": 101,"nextUpdate": 10800,"subscriptions": ["speedon","roamLikeHome","tns","m4mBundle","migtest"],"usedVolume": 54978560,"passStage": 1,"passName": "Data Flex 2,5 GB"}},{"mDate": 1621511830853,"mData": {"usedVolumeStr": "28,2 MB","remainingTimeStr": "28 Tage 2 Std.","hasOffers": true,"remainingSeconds": 2428444,"usedAt": 1621491824000,"validityPeriod": 5,"usedPercentage": 2,"title": "","initialVolume": 2684354560,"initialVolumeStr": "2,5 GB","passType": 101,"nextUpdate": 10800,"subscriptions": ["speedon","roamLikeHome","tns","m4mBundle","migtest"],"usedVolume": 29576867,"passStage": 1,"passName": "Data Flex 2,5 GB"}}]';
    self.name = ko.observable(myTestData);
    self.records = ko.observableArray();
    showData(myTestData);

    self.loadFile = function (file) {
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
        let myJsonPretty = text; //JSON.stringify(myObject, null, 2);

        //console.log(text);
        self.name(myJsonPretty);
        let myArray = handleJson(text);
        self.records(myArray);
    }
};



function handleJson(pJson) {
    let myObject = JSON.parse(pJson);
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
    let myRecords = [];
    // remove fakeData after testing
    let myFakeData = {
        initialVolume: 2000000,
        remainingSeconds: 3600,
        usedAt: new Date(2021, 3, 20, 18),
        usedVolume: 500000,
        mDate: new Date(2021, 3, 20, 18),
        mEndDate: new Date(new Date(2021, 3, 20, 18).getTime() + 1000 * 3600)
    };
    myRecords.push(myFakeData);

    for (let iEle of myObject) {
        let myDate = new Date(iEle.mDate);
        console.log("");
        let myEndDate = new Date(myDate.getTime() + 1000 * iEle.mData.remainingSeconds)
        let myData = {
            initialVolume: iEle.mData.initialVolume,
            remainingSeconds: iEle.mData.remainingSeconds,
            usedAt: iEle.mData.usedAt,
            usedPercentage: iEle.mData.usedPercentage,
            usedVolume: iEle.mData.usedVolume,
            mDate: myDate,
            mEndDate: myEndDate
        };
        myRecords.push(myData);
        //console.log(`myDate ${myDate}`);
        //console.log(`myEndDate ${myEndDate}`);
        //console.log(`initialVolume ${myData.initialVolume}`);
        //console.log(`remainingSeconds ${myData.remainingSeconds}`);
        //console.log(`usedAt ${myData.usedAt}`);
        //console.log(`usedPercentage ${myData.usedPercentage}`);
        //console.log(`usedVolume ${myData.usedVolume}`);
    }
    return myRecords;
}
