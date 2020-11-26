import { strictEqual } from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
// import * as extension from '../../extension';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Sample test', () => {
		strictEqual([1, 2, 3].indexOf(5), -1);
		strictEqual([1, 2, 3].indexOf(0), -1);
	});
});
