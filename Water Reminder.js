// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: tint;
/*******************************************
 *                                         *
 *        __      __    _                  *
 *        \ \    / /_ _| |_ ___ _ _        *
 *         \ \/\/ / _` |  _/ -_) '_|       *
 *    ___   \_/\_/\__,_|\__\___|_|         *
 *   | _ \___ _ __ (_)_ _  __| |___ _ _    *
 *   |   / -_) '  \| | ' \/ _` / -_) '_|   *
 *   |_|_\___|_|_|_|_|_||_\__,_\___|_|     *
 *                                         *
 *                                         *
 * Used to remind yourself to drink enough *
 * water and track your water intake over  *
 *                 a day.                  *
 *   Of course you can record your water   *
 *  with the Shortcuts app and save it to  *
 *  Health, but I don't want to save that  *
 * data forever and there is no option to  *
 *  bulk delete it. Furthermore Shortcuts  *
 *      can't schedule notifications.      *
 *                                         *
 *   - Highly customiseable (look below)   *
 *     - Record your intake in a rich      *
 *              notification               *
 *   - Data gets overridden after a day    *
 *     - Everything is stored locally      *
 *      - Supports multiple languages      *
 *             - Log with Siri             *
 *                                         *
 *      Current supported languages:       *
 *                - English                *
 *                - German                 *
 *                                         *
 *  To add a language, see the bottom of   *
 *   the script. Simply copy the lang.en   *
 *  part and paste it at the language key  *
 * you want to add. If you don't know what *
 *    the language code of your device     *
 *          language is, execute           *
 *    "log(Device.language())" in a new    *
 * script and it prints the language code  *
 *             in the console.             *
 *  If you have added a language, please   *
 *  post it on talk.automators.fm in the   *
 * topic "Water Reminder". Also look there *
 *              for updates.               *
 *                                         *
 *   To log your water intake with Siri,   *
 *    just add for each amount a custom    *
 * phrase in the script settings with the  *
 *  argument "amount" and the the amount   *
 *       you want to add, e.g. "0.5"       *
 *                                         *
 *   Made by schl3ck (Reddit, Automators   *
 *                  Talk)                  *
 *         Released in April 2019          *
 *                                         *
 *              Version v1.1               *
 *                                         *
 * Changelog is at the end of this script  *
 *                                         *
 *******************************************/



// time format: hh.mm as decimal number in 24h format; 9.05 is 9:05 am, 23.3 is 11:30 pm, 14.60 doesn’t exist, but will be converted to 3 pm, 9.90 to 10:30 am
// when do you want to get the first notification on each day? if you don’t run this script on each day in the morning, you won’t get any notifications on that day. This first notification is thought to be a quick way to run this script
let startOfDay = 6.00;
// until when you want to get notifications
let endOfDay = 22.30;
// in minutes; how often you want to get notified
let interval = 60;
// in minutes; when you don't drink within this time, another notification will be send
let fastInterval = 10;
// how often you want to get notified in fastInterval time steps
let nFastReminders = 2;
// if you record a water intake, all notifications in these next minutes get removed. If this is a main reminder, all his repeats (fast reminders) will also get removed
let deleteThreshold = 10;

// the unit you want to use, current: litres = L
let unit = "L";
// your daily goal
let goal = 2.5;	
// you should not drink more than this, because it isn’t healthy anymore. Only displays a warning, but it can't stop you from drinking more
let max = 3.75;

// the sound of the notifications. One of [default, accept, alert, complete, event, failure, piano_error, piano_success, popup] or what the Notification.sound documentation says
let sound = "alert";
// the sound for the first notification in the morning; mainly used to turn off the sound while you're still asleep
let soundForFirstNotif = null;
// whether or not to keep the current notification if this script is run inside a notification; mainly used as a quick way to record an intake instead of opening the app
let keepCurrentNotif = true;
// the presets in the notification
// you can create arbitrary fractions with superscript digits \u2070, \u00b9, \u00b2, \u00b3, \u2074 - \u2079 and fraction slash \u2044 and subscript digits \u2080 - \u2089 e.g. 5/8 is \u2075\u2044\u2088
// these choices will be sorted in ascending order of their value
let presets = {
	"\u215b": 1/8,
	"\u00bc": 1/4,
	"\u2153": 1/3,
	"\u00bd": 1/2,
	"\u2154": 2/3,
	"\u00be": 3/4,
	"1": 1
};

// advanced options

// how wide the range is in which it should be rounded to the nearest integer
let epsilon = 0.001;
// After this time, a new day starts and the data from the last day is discarded
let newDay = 4.00;			// 4 am

// Whether to use moment.js
// Toggles only the displaying of times written in words like "3 hours ago"
let useMoment = false;
// path to moment.js when it is enabled
let momentPath = "lib/moment";
// if you don't have moment.js installed, see: https://github.com/schl3ck/scriptable-moment/blob/master/README.md

// end of config ============================

let moment;
if (useMoment) {
	moment = importModule(momentPath);
	// the locale for the time display
	// comment the next two lines, if you want to force english
	let momentLocale = Device.language();
	moment.locale(momentLocale);
}

let lang = getLanguage();
//let my = "klaus".toLocaleUpperCase();

let fm = FileManager.local();
let file = fm.joinPath(fm.documentsDirectory(), "waterReminder.json");
// let tmpFile = fm.joinPath(fm.temporaryDirectory(), "waterReminder.tmp");

function getDate(num) {
	let d = new Date();
	d.setHours(parseInt(num));
	d.setMinutes((num % 1) * 100);
	d.setSeconds(0);
	d.setMilliseconds(0);
	return d;
}
function jsonReviver(k, v) {
	return v && v.type &&
		v.type.toLowerCase() === "date" && 
		v.value ? 
			new Date(v.value) : 
			k === "drunken" && v === null ?
				0 :
				v;
}
Object.defineProperty(Date.prototype, "toJSON", {
	enumerable: false,
	configurable: true,
	writable: true,
	value: function () {
		return {type: "date", value: this.getTime()};
	}
});
if (!Date.prototype.addSeconds) {
	 Object.defineProperty(Date.prototype, "addSeconds", {
		enumerable: false,
		configurable: true,
		writable: true,
		value: function (seconds) {
			this.setSeconds(this.getSeconds() + seconds);
		}
	});
}
if (!Date.prototype.addMinutes) {
	Object.defineProperty(Date.prototype, "addMinutes", {
		enumerable: false,
		configurable: true,
		writable: true,
		value: function (minutes) {
			this.setMinutes(this.getMinutes() + minutes);
		}
	});
}
if (!Date.prototype.addDays) {
	 Object.defineProperty(Date.prototype, "addDays", {
		enumerable: false,
		configurable: true,
		writable: true,
		value: function (days) {
			this.setDate(this.getDate() + days);
		}
	});
}

// log("path: " + tmpFile);
// log("exists: " + fm.fileExists(tmpFile))
// 
// if (fm.fileExists(tmpFile)) {
// 	fm.remove(tmpFile);
// } else {
// 	main();
// }
// 
// module.exports = main;
// 
// async function main() {
// 	
// log("running main");

let scriptName = Script.name();
let choices = Object.keys(presets);
choices.sort((a, b) => presets[a] - presets[b]);

if (newDay > startOfDay) {
	newDay = startOfDay;
}
newDay = getDate(newDay);
startOfDay = getDate(startOfDay);
startOfDay.addDays(1);
endOfDay = getDate(endOfDay);

let data = JSON.parse(fm.readString(file), jsonReviver);

if (data) {
	data.firstRun = new Date(data.firstRun);
	data.drunken = data.drunken || 0;
	data.last && data.last.date && (data.last.date = new Date(data.last.date));
}

(await Notification.allPending()).filter(n => n.threadIdentifier === scriptName && !n.nextTriggerDate).forEach(n => n.remove());

let scheduledNotifs = false;

async function scheduleNotifs(resetData = false) {
	log(lang.schedulingNotifications);
	
	let d = new Date();
	d.setSeconds(0);
	d.setMilliseconds(0);
	
	// either we have no data recorded yet or we have a new day and it is past newDay
	if (resetData) {
		data = {
			firstRun: new Date(d),
			drunken: 0,
			yesterday: data && Math.round(data.drunken * 100) / 100,
			last: data && data.last
		};
		save();
	}
	
	// schedule all notifications for the whole day
	d.addMinutes(interval);
	let notif;
	log(lang.scheduledNotifications);
	async function createNotification(date) {
		notif = new Notification();
		notif.title = Script.name();
		notif.body = lang.notificationBody;
		notif.openURL = URLScheme.forRunningScript();
		notif.scriptName = Script.name();
		notif.sound = (date === startOfDay) ? soundForFirstNotif : sound;
		notif.threadIdentifier = Script.name();
		
		log(date.toLocaleString())
		notif.setTriggerDate(date);
		await notif.schedule();
	}
	while (d < endOfDay) {
		await createNotification(d);
		for (let j = 1; j <= nFastReminders; j++) {
			let next = new Date(d);
			next.addMinutes(fastInterval * j)
			await createNotification(next);
		}
		d.addMinutes(interval);
	}
	await createNotification(startOfDay);
	scheduledNotifs = true;
}


if (!data || 
	(data.firstRun.getDate() !== (new Date()).getDate() && 
		new Date() >= newDay && 
		(await Notification.allPending())
			.filter(n => n.threadIdentifier === scriptName)
			.length === 0
	)) {
	
	await scheduleNotifs(true);
}

let drunkenObj = {
	a: Math.round(data.drunken * 1000) / 1000, 
	u: unit
};
let toGoObj = {
	a: Math.round((goal - data.drunken) * 1000) / 1000,
	u: unit
};
let drunkenString = lang.progressToday.replace(/%([au])/g, (m, p1) => drunkenObj[p1]);
if (data.drunken >= max)
	drunkenString += " " + lang.drunkenTooMuch;
else if (data.drunken >= goal)
	drunkenString += " " + lang.goalReached;
else
	drunkenString += " " + lang.drinkMore.replace(/%([au])/g, (m, p1) => toGoObj[p1]);
if (data.drunken === 0)
	drunkenString = lang.nothingDrunken;

if (data.yesterday) {
	drunkenObj.a = data.yesterday;
	drunkenString += "\n" + lang.yesterdayDrunken.replace(/%([au])/g, (m, p1) => drunkenObj[p1]);
}

let nextNotif = (await Notification.allPending()).filter((n) => n.threadIdentifier === scriptName);
nextNotif.sort((a, b) => a.nextTriggerDate - b.nextTriggerDate);
// log(nextNotif)
nextNotif = nextNotif.length && nextNotif[0];
	
let ui = new UITable();
let row, cell;
let dismissable = false && config.runsInApp;

ui.showSeparators = true;

// =============== Siri ==================
if (config.runsWithSiri && args.siriShortcutArguments && args.siriShortcutArguments.amount) {
	await record(+args.siriShortcutArguments.amount);
	Script.complete();
	return;
}
// =============== /Siri ==================


row = new UITableRow();
row.isHeader = true;
row.height = 80;
ui.addRow(row);
row.addText(drunkenString).centerAligned();

if (data.last) {
	drunkenObj.a = data.last.amount;
	drunkenObj.d = fmtDate(data.last.date);
	row = new UITableRow();
	row.height = 60;
	row.addText(lang.lastTime.replace(/%([aud])/g, (m, p1) => drunkenObj[p1])).centerAligned();
	ui.addRow(row);
}

if (nextNotif) {
	row = new UITableRow();
	row.height = 60;
	row.addText(lang.nextNotification.replace("%d", fmtDate(nextNotif.nextTriggerDate))).centerAligned();
	ui.addRow(row);
	
}


row = new UITableRow();
row.height = 60;
row.dismissOnSelect = dismissable;
row.onSelect = async () => {
	try {
		
	if (nextNotif) {
		await Notification.removePending((await Notification.allPending()).filter(n => n.threadIdentifier === scriptName && !(keepCurrentNotif && args.notification && n.identifier === args.notification.identifier)).map(n => n.identifier));
	} else {
		scheduleNotifs();
	}
	
	} catch (err) {
		logError(`${err.name}: ${err.message} on line ${err.lineNumber || err.line}:${err.columnNumber || err.column}`);
	}
	
	printDone();
};
row.addText(nextNotif ? lang.disableNotifications : lang.scheduleNewNotifications).centerAligned();
ui.addRow(row);


row = new UITableRow();
row.dismissOnSelect = false;
row.onSelect = () => ask();
row.addText(lang.customAmount).centerAligned();
ui.addRow(row);

choices.forEach((p) => {
	row = new UITableRow();
	row.dismissOnSelect = dismissable;
	row.onSelect = () => {
		try {
			record(p);
		} catch (err) {
			logError(`${err.name}: ${err.message} on line ${err.lineNumber || err.line}:${err.columnNumber || err.column}`);
		}
	};
	let obj = {
		a: p,
		u: unit
	};
	row.addText(lang.amountAndUnit.replace(/%([au])/g, (m, p1) => obj[p1])).centerAligned();
	ui.addRow(row);
});


await ui.present();
Script.complete();
// log("finished main");

// } // end main()


function save() {
	let str = JSON.stringify(data);
	log(str)
	fm.writeString(file, str);
}

function fmtDate(date) {
// 	log(date)
// 	log(new Error().stack)
	let n = new Date().getDate();
	let d = date.getDate();
	
	let str = "";
	if (n - 1 === d) str += lang.lastDay;
	else if (n + 1 === d) str += lang.nextDay;
	else if (n !== d) str += date.toLocaleDateString();
	
	if (str) str += ", ";
	
	str += date.toLocaleTimeString().replace(/^(\d\d?:\d\d):\d\d(.*)$/, "$1$2");
	
	if (useMoment) {
		let m = moment(date);
		str += ", ";
		str += m.fromNow();
	}
	
	
// 	log("done fmtDate, returning: " + str);
	return str;
}


function printDone(rows, onUndo) {
	if (true || config.runsInNotification) {
		ui.removeAllRows();
		
		row = new UITableRow();
		row.addText(lang.done).centerAligned();
		ui.addRow(row);
		
		if (rows) {
			rows.forEach((r) => {
				row = new UITableRow();
				row.addText(r).centerAligned();
				ui.addRow(row);
			});
		}
		
		if (onUndo) {
			row = new UITableRow();
			row.dismissOnSelect = false;
			row.onSelect = onUndo;
			row.backgroundColor = Color.red();
			cell = row.addText(lang.undo);
			cell.centerAligned();
			cell.titleColor = Color.white();
			ui.addRow(row);
		}
		
// 		row = new UITableRow();
// 		row.backgroundColor = Color.green();
// 		row.addText("Run again").centerAligned();
// 		row.dismissOnSelect = false;
// 		row.onSelect = () => {
// 			fm.writeString(tmpFile, "1");
// 			importModule(scriptName)();
// 		};
// 		ui.addRow(row);
		
		
		ui.reload();
		
		let n = args.notification;
		!keepCurrentNotif && Notification.removeDelivered([n.identifier]);
	} else {
		log(lang.done);
		if (rows) {
			for (let r of rows) {
				log(r);
			}
		}
	}
}

async function record(add) {
	
	let previous = JSON.parse(JSON.stringify(data), jsonReviver);
	
	let str = add;
	if (add in presets)
		add = presets[add];

	data.drunken += add;
	let dot = ("" + data.drunken).indexOf(".");
	if (data.drunken % 1 > 1 - epsilon || data.drunken % 1 < epsilon) {
		data.drunken = Math.round(data.drunken);
	} else if (dot >= 0) {
		let N = ("" + epsilon).split("").filter(i => i === "0").length;
		let s = ("" + data.drunken);
		let nZero = 0;
		for (let i = dot + 1; i < s.length; i++) {
			if (s[i] === "0") nZero++;
			else nZero = 0;
			
			if (nZero >= N) {
				data.drunken = parseFloat(s.substring(0, i));
				break;
			}
		}
	}
	
	data.last = {
		amount: str,
		date: new Date()
	};
	
	// remove pending notifications until next interval and remove all delivered notifications that are from this script
	let nextFullInterval = new Date(data.firstRun);
	let now = new Date();
	while (nextFullInterval < now && nextFullInterval < startOfDay) nextFullInterval.addMinutes(interval);
	// include notifications within the next deleteThreshold minutes
	now.addMinutes(deleteThreshold);
	nextFullInterval = nextFullInterval < now ? now : nextFullInterval;
	// don't include startOfDay notification
	nextFullInterval = startOfDay < nextFullInterval ? startOfDay : nextFullInterval;
	
	Notification.removeDelivered(
		(await Notification.allDelivered())
			.filter(notif => 
				notif.threadIdentifier === scriptName &&
				!(keepCurrentNotif && 
				Notification.current() && notif.identifier === Notification.current().identifier
				)
			)
			.map(notif => notif.identifier)
	);
	Notification.removePending(
		(await Notification.allPending())
			.filter(notif => 
				notif.threadIdentifier === Script.name() && 
				notif.nextTriggerDate < nextFullInterval
			)
			.map(notif => notif.identifier)
	);
	
	
	// save file
	save();
	drunkenObj.a = str;
	let obj2 = {
		a: Math.round(data.drunken * 1000) / 1000,
		u: unit
	};
	let enableUndo = true;
	
// =============== Siri ==================
	if (config.runsWithSiri) {
		let str = lang.added.replace(/%([au])/g, (m, p1) => drunkenObj[p1]) + ". " + lang.progressToday.replace(/%([au])/g, (m, p1) => obj2[p1]);
		Speech.speak(str);
		enableUndo = false;
	}
	printDone([
		lang.saved,
		lang.added.replace(/%([au])/g, (m, p1) => drunkenObj[p1]),
		lang.totalAfterAdd.replace(/%([au])/g, (m, p1) => obj2[p1])
	], !enableUndo ? null : () => {
		data = previous;
		save();
		obj2 = {
			a: Math.round(data.drunken * 1000) / 1000,
			u: unit
		};
		printDone([
			lang.saved,
			lang.undoneAdd.replace(/%([au])/g, (m, p1) => drunkenObj[p1]),
			lang.totalAfterAdd.replace(/%([au])/g, (m, p1) => obj2[p1])
		]);
	});
}

function ask(amount) {
	amount = amount || "";
	
	ui.removeAllRows();
	
	row = new UITableRow();
	row.isHeader = true;
	row.height = 60;
	row.addText(lang.enterAmount, drunkenString).centerAligned();
	ui.addRow(row);
	
	row = new UITableRow();
	ui.addRow(row);
	row.addText((amount || 0).toString()).centerAligned();
	
	for (let i = 1; i <= 9; i++) {
		if (i % 3 === 1) {
			row = new UITableRow();
			ui.addRow(row);
		}
		
		let j = i;
		cell = row.addButton("" + i);
		cell.centerAligned();
		cell.onTap = () => {
			ask("" + amount + j);
		};
	}
	
	row = new UITableRow();
	ui.addRow(row);
	
	cell = row.addButton(".");
	cell.centerAligned();
	cell.onTap = () => {
		ask((amount || 0) + ".");
	};
	
	cell = row.addButton("0");
	cell.centerAligned();
	cell.onTap = () => {
		ask((amount.length === 0 ? "" : amount) + "0");
	};
	
	cell = row.addButton("⌫");
	cell.centerAligned();
	cell.onTap = () => {
		ask(amount.slice(0, -1));
	};
	
	row = new UITableRow();
	row.dismissOnSelect = dismissable;
	row.onSelect = () => {
		record(+amount);
	};
	row.addText(lang.ok).centerAligned();
	ui.addRow(row);
	
	ui.reload();
}


function getLanguage() {
	let lang = {
		en: {
			nothingDrunken: "You have not drunken anything today. Have your first gulp!",
			schedulingNotifications: "Scheduling Notifications",
			scheduledNotifications: "Notifications scheduled for:",
			notificationBody: "Don't forget to drink! Have you drunken already? Open this notification and choose how much!",
			progressToday: "You have drunken %a %u so far today!",
			drunkenTooMuch: "Watch your consumption! Don’t drink much more because it isn't healthy!",
			goalReached: "You did it! You reached your goal! Congratulations!",
			drinkMore: "Only %a %u to go. Keep drinking water!",
			yesterdayDrunken: "Yesterday: %a %u",
			lastTime: "The last time you have drunken %a %u at %d",
			nextNotification: "The next notification is scheduled for %d",
			disableNotifications: "Disable notifications for today and tomorrow morning",
			scheduleNewNotifications: "Schedule notifications",
			customAmount: "Custom amount",
			lastDay: "yesterday",
			nextDay: "tomorrow",
			done: "Done",
			undo: "Undo",
			saved: "Saved!",
			added: "Added %a %u",
			totalAfterAdd: "Total is now %a %u",
			undoneAdd: "Undone adding of %a %u",
			enterAmount: "Please enter how much",
			ok: "OK",
			amountAndUnit: "%a %u"
		},
		de: {
			nothingDrunken: "Du hast heute noch nichts getrunken. Nimm den ersten Schluck!",
			schedulingNotifications: "Erstelle Benachrichtigungen",
			scheduledNotifications: "Benachrichtigungen sind geplant für:",
			notificationBody: "Vergiss nicht zu trinken oder hast du schon etwas getrunken? Öffne diese Benachrichtigung und wähle wie viel!",
			progressToday: "Du hast heute schon %a %u getrunken!",
			drunkenTooMuch: "Pass auf, wieviel du heute noch trinkst, weil es ungesund sein kann, so viel zu trinken!",
			goalReached: "Du hast es geschafft! Du hast dein Ziel erreicht! Glückwunsch!",
			drinkMore: "Dir fehlen nur mehr %a %u. Bleib dran!",
			yesterdayDrunken: "Gestern: %a %u",
			lastTime: "Das letzte mal hast du %a %u getrunken. Das war um %d",
			nextNotification: "Die nächstes Benachrichtigung ist für %d geplant",
			disableNotifications: "Schalte alle Benachrichtigungen für heute und morgen früh aus",
			scheduleNewNotifications: "Erstelle Benachrichtigungen",
			customAmount: "Menge eingeben",
			lastDay: "gestern",
			nextDay: "morgen",
			done: "Fertig",
			undo: "Rückgängig",
			saved: "Gespeichert!",
			added: "%a %u hinzugefügt",
			totalAfterAdd: "Gesamt: %a %u",
			undoneAdd: "Hinzufügen von %a %u rückgängig machen",
			enterAmount: "Bitte gib die Menge ein",
			ok: "OK",
			amountAndUnit: "%a %u"
		}
	};
	return lang[Device.language()] || lang.en;
}


/********** Changelog **********

v1.1 - 2019-05-12
Added support for logging with Siri
Fixed printing "undefined" instead of "yesterday" in front of time stamps

v1.0 - 2019-04-09
Initial release


*/
