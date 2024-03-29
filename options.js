// // Default options, at install
// const savedOptions = {
//     PgUpPgDn: {
//         ChuyenChuong: true,
//         CuonTrang: false
//     },
//     XoaTruyen: false,
//     XoaDaDocChuong: false
// };

// Initial states for options
let initialPgUpPgDnOption = "ChuyenChuong";

let initialXoaTruyenOption = {
	XoaTruyenCheckbox: false
};

let initialXoaDaDocChuongOption = {
	XoaDaDocChuongCheckbox: false
}

let isAllSaved =
{
	PgUpPgDn: true,
	XoaTruyen: true,
	XoaDaDocChuong: true
}

document.addEventListener("DOMContentLoaded", async function () {
	// console.log("DOMContentLoaded");
	await refreshOptionsPage("first");
});

// allOrSome = ["first" | "all" | "PgUpPgDn" | "XoaTruyen" | "XoaDaDocChuong"]
async function refreshOptionsPage(allOrSome) {
	const extensionSavedOptions = await chrome.storage.local.get('savedOptions').then((response) => response.savedOptions);

	// TODO - DONE: Query the 2 options of PgUpPgDn and set the checked attribute accordingly
	if (allOrSome === "first" || allOrSome === "all" || allOrSome === "PgUpPgDn")
	{
		// console.log("Display PgUpPgDn section");
		const chuyenChuongElement = document.getElementById("ChuyenChuongRadio");
		const cuonTrangElement = document.getElementById("CuonTrangRadio");

		chuyenChuongElement.checked = extensionSavedOptions.PgUpPgDn.ChuyenChuong ? true : false;
		cuonTrangElement.checked = extensionSavedOptions.PgUpPgDn.CuonTrang ? true : false;
	}
	// TODO - DONE: Query the 2 options of XoaTruyen and XoaDaDocChuong and set the checked attribute accordingly
	if (allOrSome === "first" || allOrSome === "all" || allOrSome === "XoaTruyen") {
		// console.log("Display XoaTruyen section");
		const xoaTruyenElement = document.getElementById("XoaTruyenCheckbox");
		xoaTruyenElement.checked = extensionSavedOptions.XoaTruyen ? true : false;
	}
	
	if (allOrSome === "first" || allOrSome === "all" || allOrSome === "XoaDaDocChuong") {
		// console.log("Display XoaDaDocChuong section");
		const xoaDaDocChuongElement = document.getElementById("XoaDaDocChuongCheckbox");
		xoaDaDocChuongElement.checked = extensionSavedOptions.XoaDaDocChuong ? true : false;
	}

	if (allOrSome === "first") {
		document.getElementById("SaveOptionsPgUpPgDnButton").addEventListener("click", async function () {
			isAllSaved.PgUpPgDn = false;
			await saveOptions('PgUpPgDn', 'SaveOptionsPgUpPgDnButton', isAllSaved, 'SaveAllOptionsButton');
		});

		document.getElementById("SaveOptionsXoaTruyenButton").addEventListener("click", async function () {
			isAllSaved.XoaTruyen = false;
			await saveOptions('XoaTruyen', 'SaveOptionsXoaTruyenButton', isAllSaved, 'SaveAllOptionsButton');
		});

		document.getElementById("SaveOptionsXoaDaDocChuongButton").addEventListener("click", async function () {
			isAllSaved.XoaDaDocChuong = false;
			await saveOptions('XoaDaDocChuong', 'SaveOptionsXoaDaDocChuongButton', isAllSaved, 'SaveAllOptionsButton');
		});

		document.getElementById("SaveAllOptionsButton").addEventListener("click", async function () {
			await saveAllOptions(isAllSaved, 'SaveAllOptionsButton');
		});

		// Add event listeners to PgUpPgDn radio options
		// TODO - DONE: Enable save button when new option chosen, compared to saved options
		// TODO: Disable save button when no change in option, compared to saved options
		document.getElementsByName('PgUpPgDn').forEach(function (aPgUpPgDnOption) {
			aPgUpPgDnOption.addEventListener('change', function () {
				isAllSaved.PgUpPgDn = false;
				document.getElementById('SaveOptionsPgUpPgDnButton').disabled = false;
				document.getElementById('SaveAllOptionsButton').disabled = false;
			});
		});
	
		// Add event listeners to XoaTruyen checkbox
		// TODO - DONE: Enable save button when new option chosen, compared to saved options
		// TODO: Disable save button when no change in option, compared to saved options
		document.getElementsByName('XoaTruyen')[0].addEventListener('change', function () {
			isAllSaved.XoaTruyen = false;
			document.getElementById('SaveOptionsXoaTruyenButton').disabled = false;
			document.getElementById('SaveAllOptionsButton').disabled = false;
		});
	
		// Add event listeners to XoaDaDocChuong checkbox
		// TODO - DONE: Enable save button when new option chosen, compared to saved options
		// TODO: Disable save button when no change in option, compared to saved options
		document.getElementsByName('XoaDaDocChuong')[0].addEventListener('change', function () {
			isAllSaved.XoaDaDocChuong = false;
			document.getElementById('SaveOptionsXoaDaDocChuongButton').disabled = false;
			document.getElementById('SaveAllOptionsButton').disabled = false;
		});
	}

	const exportButton = document.getElementById('exportButton');
	const importAddButton = document.getElementById('importAddButton');
	const importReplaceButton = document.getElementById('importReplaceButton');

	const importInput = document.getElementById('importInput');
	const importInputButton = document.getElementById('importInputButton');
	const importInputLabel = document.getElementById('importInputLabel');

	if (allOrSome === "first") {
		exportButton.addEventListener('click', exportData);

		importInputButton.style.background = 'lightgray';
		importInputButton.addEventListener('click', function () {
			importInput.click();
		});

		importInput.addEventListener('change', function () {
			if (importInput.value === '' || !importInput.value.includes(".json")) {
				importInput.value = '';
				importInputButton.style.background = 'lightgray';
				importInputLabel.innerText = "Chưa có tệp nào được chọn. | Tệp không phù hợp!";
				importInputLabel.style.color = 'red';

				importAddButton.disabled = true;
				importReplaceButton.disabled = true;
			}
			else {
				importInputButton.style.background = 'green';
				importInputLabel.innerText = importInput.value;
				importInputLabel.style.color = 'black';

				importAddButton.disabled = false;
				importReplaceButton.disabled = false;
			}
		});
		importAddButton.addEventListener('click', async function () {
			await importData("add")
		});
		importReplaceButton.addEventListener('click', async function () {
			await importData("replace")
		});
	}
}

async function saveOptions(optionGroupName, saveButtonId, allSaved, saveAllButtonId) {
	// console.log("About to save new option", optionGroupName);
	// console.log({optionGroupName}, {saveButtonId});

	let currentSavedOptions = await chrome.storage.local.get('savedOptions').then((response) => response.savedOptions);
	
	// {
	//     PgUpPgDn: {
	//         ChuyenChuong: true,
	//         CuonTrang: false
	//     },
	//     XoaTruyen: false,
	//     XoaDaDocChuong: false
	// }

	let selectedOption;

	// Check if options have changed
	let isPgUpPgDnChanged = false;
	let isXoaTruyenChanged = false;
	let isXoaDaDocChuongChanged = false;

	if (optionGroupName === "PgUpPgDn") {
		const chuyenChuongElement = document.getElementById("ChuyenChuongRadio");
		
		selectedOption = chuyenChuongElement.checked === true ? "ChuyenChuong" : "CuonTrang";

		// console.log(selectedOption);

		// console.log("Change in PgUpPgDn");
		isPgUpPgDnChanged = selectedOption !== initialPgUpPgDnOption;
		initialPgUpPgDnOption = selectedOption;

		currentSavedOptions.PgUpPgDn.ChuyenChuong = selectedOption === "ChuyenChuong" ? true : false;
		currentSavedOptions.PgUpPgDn.CuonTrang = selectedOption === "CuonTrang" ? true : false;

		// console.log("Chuyển chương:", selectedOption === "ChuyenChuong" ? "true" : "false");
		// console.log("Cuộn trang:", selectedOption === "CuonTrang" ? "true" : "false")

		allSaved.PgUpPgDn = true;
	}
	else if (optionGroupName === "XoaTruyen") { 
		const xoaTruyenElement = document.getElementById("XoaTruyenCheckbox");
		selectedOption = xoaTruyenElement.checked;

		// console.log(selectedOption);

		// console.log("Change in XoaTruyen");
		isXoaTruyenChanged = selectedOption !== initialXoaTruyenOption;
		initialXoaTruyenOption = selectedOption;

		currentSavedOptions.XoaTruyen = selectedOption;

		allSaved.XoaTruyen = true;
	}
	else if (optionGroupName === "XoaDaDocChuong")
	{
		const xoaTruyenElement = document.getElementById("XoaDaDocChuongCheckbox");
		selectedOption = xoaTruyenElement.checked;

		// console.log(selectedOption);

		// console.log("Change in XoaDaDocChuong");
		isXoaDaDocChuongChanged = selectedOption !== initialXoaDaDocChuongOption;
		initialXoaTruyenOption = selectedOption;

		currentSavedOptions.XoaDaDocChuong = selectedOption;

		allSaved.XoaDaDocChuong = true;
	}

	// Disable the Save button after saving
	document.getElementById(saveButtonId).disabled = true;

	// Disable the "Save All" button based on changes in any group
	// console.log("About to disable Save All button, if possible");
	// console.log({ allSaved });
	document.getElementById(saveAllButtonId).disabled = checkAllSaved(allSaved);

	// console.log({ currentSavedOptions });
	await chrome.storage.local.set({ savedOptions: currentSavedOptions });		
	await refreshOptionsPage(optionGroupName);

	// console.log(optionGroupName + ' Saved!');
}

async function saveAllOptions(allSaved, saveAllButtonId) {
	// console.log("About to save all options");
	let now = new Date();
	let formattedTime = now.toLocaleTimeString();
	
	// console.log(formattedTime);

	const optionSavePairs = [
		["PgUpPgDn", "SaveOptionsPgUpPgDnButton"],
		["XoaTruyen", "SaveOptionsXoaTruyenButton"],
		["XoaDaDocChuong", "SaveOptionsXoaDaDocChuongButton"]
	]

	for (let i = 0; i < optionSavePairs.length; i++) {
		// console.log("Before");
		now = new Date();
		formattedTime = now.toLocaleTimeString();
		// console.log(formattedTime);

		await saveOptions(optionSavePairs[i][0], optionSavePairs[i][1], allSaved, saveAllButtonId);

		// console.log("After");
		now = new Date();
		formattedTime = now.toLocaleTimeString();
		// console.log(formattedTime);
	}
	
	// Disable the Save All button after saving
	document.getElementById("SaveAllOptionsButton").disabled = true;

	await refreshOptionsPage("all");

	now = new Date();
	formattedTime = now.toLocaleTimeString();
	// console.log(formattedTime);

	// console.log('All Options Saved!');
}

function checkAllSaved(allSaved) {
	// console.log("Check if all saved");
	// console.log(Object.values(allSaved).every((saved) => saved === true))
	return Object.values(allSaved).every((saved) => saved === true);
}

function exportData() {
	// console.log("About to export storage.local data to local drive");

	chrome.storage.local.get(null ,function(result) {
		// Retrieve all stored data
		const data = result;
		// console.log("Data to be exported");
		// console.log({ data });

		// Convert the data to JSON format
		const jsonData = JSON.stringify(data, null, 2);

		// Create a Blob object with the JSON data
		const blob = new Blob([jsonData], { type: "application/json" });

		// Create a URL for the Blob object
		const url = URL.createObjectURL(blob);

		// Create a link element (with anchor <a> tag) and simulate a click to download a file
		const link = document.createElement("a");
		link.href = url;
		link.download = "exported_data.json"; // Default name. TODO: Will let user choose name
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	});
}

async function importData(addOrReplace) {
	// console.log("About to import data as", addOrReplace);

	// Get user input from Open dialog
	const importInput = document.getElementById('importInput');
	const importInputButton = document.getElementById('importInputButton');
	const importInputLabel = document.getElementById('importInputLabel');

	// Only use the first chosen file
	const file = importInput.files[0];

	if (file) {
		const reader = new FileReader();

		reader.onload = async (event) => {
			const jsonData = event.target.result;

			try {
				let data = JSON.parse(jsonData);
				// console.log("Imported data:");
				// console.log({ data });

				importInputLabel.innerText = "Đang nhập dữ liệu...";
				importInputLabel.style.color = 'blue';
				await convertChapterListIntoNewStructure(data);
				// console.log("Imported data with chapter list after new structure conversion");
				// console.log(data);

				if (addOrReplace === "replace") {
					await chrome.storage.local.set(data, () => {
						// console.log('Data imported, replace, successfully!');
					});
					await refreshOptionsPage("all");
				}
				else if (addOrReplace === "add") {
					await handleDataMerge(data);
					// console.log('Data imported, add, successfully!');
				}

				importInput.value = '';
				importInputButton.style.background = 'lightgray';
				importInputLabel.innerText = "Nhập dữ liệu thành công!";
				importInputLabel.style.color = 'green';


				importAddButton.disabled = true;
				importReplaceButton.disabled = true;
			}
			catch (error) {
				importInput.value = '';
				importInputButton.style.background = 'lightgray';
				importInputLabel.innerText = "Nhập dữ liệu thất bại!";
				importInputLabel.style.color = 'red';

				importAddButton.disabled = true;
				importReplaceButton.disabled = true;

				console.error("Error in parsing JSON data:", error);
			}
		};
		reader.readAsText(file); // Read the JSON file as text
	}
}
async function convertChapterListIntoNewStructure(importedData) {
	// console.log("Convert imported chapterList to new structure");

	if (!Array.isArray(importedData.chapterList)) {
		// console.log("Chapter list already of new structure. Abort conversion...");
		return;
	}
	// console.log("Chapter list still of old structure. Continue conversion...");

	let newStructureChapterList = {};

	if (importedData.chapterList.length === 0) {
		// Empty imported chapter list
		// console.log("Empty chapter list");
		importedData = newStructureChapterList;
		return;
	}

	const cuutruyenHostnames = await chrome.storage.local.get('cuutruyenHostnames').then((response) => response.cuutruyenHostnames);
	const cuutruyenApiChapterUrl = "https://" + cuutruyenHostnames[0] + "/api/v2/chapters/";

	for (let listIndex = 0; listIndex < importedData.chapterList.length; listIndex++) {
		const mangaDetails = importedData.chapterList[listIndex];
		const mangaId = mangaDetails.mangaId;

		newStructureChapterList[mangaId] = {
			mangaName: mangaDetails.mangaName
		};

		for (let chapterIndex = 0; chapterIndex < mangaDetails.chapters.length; chapterIndex++) {
			const chapterId = mangaDetails.chapters[chapterIndex];
			const chapterName = mangaDetails.chapterNames[chapterIndex];
			const chapterNumber = mangaDetails.chapterNumbers[chapterIndex];
			const read = mangaDetails.readChapters.includes(chapterId) ? true : false;

			// console.log(cuutruyenApiChapterUrl);
			// console.log("cuutruyenApiChapterUrl: " + cuutruyenApiChapterUrl);

			// console.log("Complete API URL: " + cuutruyenApiChapterUrl + chapterId.toString());

			const apiResponse = await fetch(cuutruyenApiChapterUrl + chapterId.toString()).then((response) => response.json());
			const data = apiResponse.data;

			const chapterOrder = data.order;

			newStructureChapterList[mangaId][chapterOrder] = {
				chapterId: chapterId,
				chapterName: chapterName,
				chapterNumber: chapterNumber,
				read: read
			}
		}
		// console.log({ aMangaName: newStructureChapterList[mangaId].mangaName });
		// console.log({ aChapter: newStructureChapterList[mangaId][0] });
	}

	console.log({ newStructureChapterList });

	importedData.chapterList = newStructureChapterList;

	// console.log("Finish converting chapterList to new structure");
}

async function handleDataMerge(data) {
	// console.log("Merge/Update imported data with existing storage.local data");

	// TODO: savedOptions
	const mergedSavedOptions = await chrome.storage.local.get('savedOptions').then((response) => response.savedOptions);
	// console.log({ mergedSavedOptions });

	await handleSavedOptionsData(mergedSavedOptions, data.savedOptions);
	await refreshOptionsPage("all");
	
	// TODO - DONE: chapterList
	// 		TODO - DONE: readChapters
	// 		TODO - DONE: mangaId và mangaName
	// 		TODO - DONE: chapterNames, chapterNumbers, chapterOrders, chapters
	const mergedChapterList = await chrome.storage.local.get('chapterList').then((response) => response.chapterList);

	await handleChapterListData(mergedChapterList, data.chapterList);
}

async function handleSavedOptionsData(existingData, newData) {
	let existingSavedOptions = existingData;

	// console.log("Before merge saved options");
	// console.log({ existingSavedOptions });

	existingData.PgUpPgDn.ChuyenChuong = newData.PgUpPgDn.ChuyenChuong;
	existingData.PgUpPgDn.CuonTrang = newData.PgUpPgDn.CuonTrang;
	existingData.XoaTruyen = newData.XoaTruyen;
	existingData.XoaDaDocChuong = newData.XoaDaDocChuong;

	existingSavedOptions = existingData;

	// console.log("After merge saved options");
	// console.log({ existingSavedOptions });

	await chrome.storage.local.set({ savedOptions: existingData });
	
	// console.log('Saved options imported successfully!');
}

async function handleChapterListData(existingData, newData) {
	let existingChapterList = existingData;

	// console.log("Before merge chapter list");
	// console.log({ existingChapterList });

	if (!Object.keys(newData).length) {
		// console.log("Empty imported chapter list");
	}
	else if (!Object.keys(existingData).length && Object.keys(newData).length) {
		// Empty chapter list
		// console.log("Empty chapter list");

		existingData = newData;

		await chrome.storage.local.set({ chapterList: existingData });
		// console.log(existingData);
	}
	else 
	{
		for (let mangaId in newData) {
			// console.log({ mangaId });
			const intMangaId = parseInt(mangaId);

			if (Object.hasOwn(existingData, mangaId)) {
				for (let chapterOrder in newData[intMangaId]) {
					// If the read status from newData is true, use it.
					// If not, keep the read status from existingData
					// console.log(chapterOrder, { existing: existingData[intMangaId][chapterOrder] });
					// console.log(chapterOrder, { new: newData[intMangaId][chapterOrder] });

					if (!Object.hasOwn(existingData[intMangaId], chapterOrder)) {
						// Really unnecessary.
						// Number of chapter orders in newData <= Number of chapter orders in exisitingData
						// console.log({ chapterOrder });
						// console.log("Not found chapterOrder");
						break;
					}

					if (isNaN(parseInt(chapterOrder))) {
						// Manga name
						// console.log("Not a chapter order. A manga name");
						// console.log({ mangaName: existingData[intMangaId][chapterOrder] });
						break;
					}
					const intChapterOrder = parseInt(chapterOrder);
					// console.log(!Object.hasOwn(existingData[intMangaId][intChapterOrder], 'read'));

					if (!Object.hasOwn(newData[intMangaId][intChapterOrder], 'read')) {
						// mangaName, not chapterOrder
						// console.log("NewData: Not found read property");
						break;
					}
					if (!Object.hasOwn(existingData[intMangaId][intChapterOrder], 'read')) {
						// mangaName, not chapterOrder
						// console.log("ExistingData: Not found read property");
						break;
					}
					
					// Keep the existing read status, unless imported read status is true
					existingData[intMangaId][intChapterOrder].read = 
						newData[intMangaId][intChapterOrder].read
						? newData[intMangaId][intChapterOrder].read
						: existingData[intMangaId][intChapterOrder].read;
				}
				await chrome.storage.local.set({ chapterList: existingData });
			}
			else {
				// console.log("ExistingData: Not found mangaId. Assign from newData");
				existingData[intMangaId] = newData[intMangaId];
				// console.log(intMangaId, { mangaDetails: newData[intMangaId] });
				await chrome.storage.local.set({ chapterList: existingData });
			}
		}
	}

	existingChapterList = existingData;

	// console.log("After merge chapter list");
	// console.log({ existingChapterList });

	await chrome.storage.local.set({ chapterList: existingData });
	
	// console.log('Chapter list imported successfully!');	
}