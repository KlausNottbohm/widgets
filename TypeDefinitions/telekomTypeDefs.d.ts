
/** data as read from telekom server */
declare interface ServerData {
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
    usedPercentage: number;
    remainingSeconds: number;
    /** server time (mSecs) */
    usedAt: number;
    usedVolume: number;
    usedVolumeStr: string;
    initialVolumeStr: string;
}

/** data as read and stored from files */
declare interface StoredData {
    version: string;
    /**as read from server */
    data: ServerData;
    /** creation date of this entry, can be different from ServerData.usedAt */
    accessTime: number;
    accessString: string;
}

/** transient data for displaying history */
declare interface HistoryData {
    entry: StoredData;
    dateString: string;
    date: Date;
}
