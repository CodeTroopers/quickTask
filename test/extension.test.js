let chai = require("chai");
let vscode = require('vscode');
let loaders = require('../loaders.js');
let fs = require('fs');

chai.should();

let rootPath = vscode.workspace.rootPath;

let globalConfig = {
	excludeGlob: "**/node_modules",
	npmGlob: ["**/package.json"],
	enableNpm: 1,
	useYarn: false,
	gulpGlob: ["**/gulpfile.js"],
	enableGulp: 1,
	enableVsTasks: 1,
	enableBatchFile: true,
	enablePython: true
};

function loaderTest(done, builder, type, rst) {
	let check = function () {
		let list = loaders.generateFromList(rst, type, "");
		list.should.be.eql(test.taskList);

		done();
	}

	let test = new builder(globalConfig, check);

	test.loadTask();
}

function watcherTest(done, builder, taskFile) {
	let test = new builder(globalConfig, () => console.log("On finish"));

	test.onChanged = function () {
		watcher.dispose();
		done();
	}

	let watcher = test.setupWatcher();

	let content = fs.readFileSync(taskFile, "utf-8");
	fs.writeFileSync(taskFile, content, "utf-8");
}

suite("Npm", function () {
	this.timeout(8000);

	test("Npm loader", function (done) {
		let rst = [
			"npm run postinstall",
			"npm run test",
			"npm run Install"
		];

		loaderTest(done, loaders.npmLoader, "npm", rst);
	});

	test("Npm watcher", function (done) {
		watcherTest(done, loaders.npmLoader, rootPath + "\\package.json");
	});
});

suite("gulp", function () {
	this.timeout(5000);

	test("gulp loader", function (done) {
		let rst = [
			"gulp watch",
			"gulp default",
			"gulp copy"
		];

		loaderTest(done, loaders.gulpLoader, "gulp", rst);
	});

	test("gulp watcher", function (done) {
		watcherTest(done, loaders.gulpLoader, rootPath + "\\gulpfile.js");
	});
});

suite("vs loader", function () {
	test("VS first load", function (done) {
		let rst = ["run", "test"];

		loaderTest(done, loaders.vsLoader, "vs", rst);
	});

	test("VS watcher", function (done) {
		watcherTest(done, loaders.vsLoader, rootPath + "\\.vscode\\tasks.json");
	});
});

suite("script", function () {
	this.timeout(5000);

	let testBat = rootPath + "\\a.bat";
	try {
		//fs.accessSync(testBat, fs.constants.F_OK);
		fs.unlinkSync(testBat);
	}
	catch (e) {}

	test("script loader", function (done) {
		let rst = [rootPath + "\\test.bat", "python " + rootPath + "\\test.py"];

		loaderTest(done, loaders.scriptLoader, "script", rst);
	});

	test("script watcher", function (done) {
		let test = new loaders.scriptLoader(globalConfig, () => console.log("On finish"));

		test.onChanged = function () {
			fs.unlinkSync(testBat);
			watcher.dispose();
			done();
		}

		let watcher = test.setupWatcher(true);
		fs.writeFileSync(testBat, "test" + Date.now(), "utf-8");
	});
});

suite("user", function () {
	test("user loader", function () {
		let check = function () {
			let cfg = vscode.workspace.getConfiguration('quicktask').get("defaultTasks");
			test.taskList.should.eql(loaders.generateFromList(cfg, "user"));
		}

		let test = new loaders.defaultLoader(globalConfig, check);

		test.loadTask();
	});

	test("user watcher", function (done) {
		let test = new loaders.scriptLoader(globalConfig, () => console.log("On finish"));

		test.onChanged = function () {
			watcher.dispose();
			done();
		}

		let watcher = test.setupWatcher();

		let cfg = ["npm update", "npm i --save-dev"];
		vscode.workspace.getConfiguration('quicktask').update("defaultTasks", cfg, false);
	});
});
