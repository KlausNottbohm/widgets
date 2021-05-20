var viewModel = function () {
    var self = this;
    self.name = ko.observable('Steve Kennedy');
    //let my = readTextFile("c:/hallo/a.txt");
    //let my = readTextFile("a.txt");
    self.loadFile = function (file, event) {
        if (!file) {
            return;
        }
        loadFileAsync(file);
    }
    async function loadFileAsync(file) {
        let text = await file.text();
        let myObject = JSON.parse(text);
        let myJsonPretty = text; //JSON.stringify(myObject, null, 2);
        //console.log(text);
        self.name(myJsonPretty);
        handleJson(text);
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
    for (let iEle of myObject) {
        let myDate = new Date(iEle.mDate);
        console.log("");
        let myData = {
            initialVolume: iEle.mData.initialVolume,
            remainingSeconds: iEle.mData.remainingSeconds,
            usedAt: iEle.mData.usedAt,
            usedPercentage: iEle.mData.usedPercentage,
            usedVolume: iEle.mData.usedVolume,
        };
        let myEndDate = new Date(myDate.getTime() + 1000 * myData.remainingSeconds)
        console.log(`myDate ${myDate}`);
        console.log(`myEndDate ${myEndDate}`);
        console.log(`initialVolume ${myData.initialVolume}`);
        console.log(`remainingSeconds ${myData.remainingSeconds}`);
        console.log(`usedAt ${myData.usedAt}`);
        console.log(`usedPercentage ${myData.usedPercentage}`);
        console.log(`usedVolume ${myData.usedVolume}`);
    }
}
