const hostnames = [
	"cuutruyen.net",
	"hetcuutruyen.net",
	"cuutruyent9sv7.xyz"
];

// With new structure for chapterList, no longer need this variable. Will remove later.
// "ascending" => Chương 1, Chương 2, Chương 3, ... Chương Cuối
// "descending" => Chương Cuối, ..., Chương 3, Chương 2, Chương 1
const sortOrder = "descending";

chrome.runtime.onInstalled.addListener(async function (details) {
	if (details.reason === "install") {
		console.log("Đã cài Cứu Truyện - Chọn Chương");
	} else if (details.reason === "update") {
		console.log("Đã cập nhật Cứu Truyện - Chọn Chương");
	}

	buildInitialChapterList(details.reason);
	setInitialSavedOptions(details.reason);

	const chapterData = {
		cuutruyenHostname: "",
		mangaId: "",
		chapterId: "",
		chapterOrder: ""
	}
	await chrome.storage.local.set({ activeChapterData: chapterData });
	await chrome.storage.local.set({ chapterListSorted: false });
});

chrome.webNavigation.onHistoryStateUpdated.addListener(function (details) {
	// console.log(`History state updated in tab ${details.tabId} to ${details.url}`);
	if(details.frameId === 0) {
		// Fires only when details.url === currentTab.url
		chrome.tabs.get(details.tabId, async function(tab) {
			if(details.url !== null && tab.url === details.url) {
				// console.log("onHistoryStateUpdated");

				if (hostnames.findIndex((item) => tab.url.indexOf(item) !== -1) === -1) {
					// console.log("Not at Cuu Truyen sites");
					return;
				}
				// console.log("At Cuu Truyen sites");
				const { hostname, manga, chapter } = parseUrl(tab.url);
				// console.log(hostname, manga, chapter);

				const message = { 
					message: "sendInfo"
				};

				if (hostname) {
					// console.log(hostname, manga, chapter);
				
					const chapterData = {
						cuutruyenHostname: hostname,
						mangaId: manga,
						chapterId: chapter
					}
					await chrome.storage.local.set({ activeChapterData: chapterData });
					
					const myChapterList = await chrome.storage.local.get('chapterList').then((response) => response.chapterList);

					if (manga && chapter) { // Build chapter list from the current chapter
						// console.log("About to build chapter list");
						buildChapterList(chapterData);
						await chrome.storage.local.set({ chapterListSorted: false });
						if (await sortAndStoreChaperList(chapterData, sortOrder)) {
							await chrome.storage.local.set({ chapterListSorted: true });
						}
						else {
							await chrome.storage.local.set({ chapterListSorted: false });
						}
					}
					else if (manga) { // Build chapter list from the last chapter
						// console.log("About to build chapter list from last chapter");
						await chrome.storage.local.set({ chapterListSorted: false });
						buildChapterListFromLastChapter(chapterData);
						if (await sortAndStoreChaperList(chapterData, sortOrder)) {
							await chrome.storage.local.set({ chapterListSorted: true });
						}
						else {
							await chrome.storage.local.set({ chapterListSorted: false });
						}
					}
					else { // Build manga list: No need to do => Just use the chapter list
						// console.log("Manga list");
						if (Object.keys(myChapterList).length === 0)
						{
							// console.log("Empty chapter list");
							const chapterData = {
								cuutruyenHostname: "",
								mangaId: "",
								chapterId: ""
							}
							await chrome.storage.local.set({ activeChapterData: chapterData });
						}
					}
				} else {
					const chapterData = {
						cuutruyenHostname: "",
						mangaId: "",
						chapterId: ""
					}
					await chrome.storage.local.set({ activeChapterData: chapterData });
				}

				// await chrome.storage.local.set({ postMessage: message });
				chrome.runtime.onConnect.addListener(async function (port) {
					// console.log("Send message to popup script. onHistoryStateUpdated");                
					// console.log("Before postMessage:", message);
					if (port.name === 'getInfo') {
						port.postMessage(message);
					}
				});
			}
		});
	}
});

chrome.runtime.onConnect.addListener(async function (port) {
	// console.log("Send message to popup script");
	
	if (port.name === 'getInfo') {
		// Function BELOW: Will raise error if inspecting the popup.
		// Otherwise, normal use (clicking the extension icon) raises NO ERROR.
		chrome.tabs.query({ active: true, currentWindow: true }, async function (tabs) {
			const currentTab = tabs[0];

			const { hostname, manga, chapter } = parseUrl(currentTab.url);
			const message = {
				message: "sendInfo"
			}
			const myChapterList = await chrome.storage.local.get('chapterList').then((response) => response.chapterList);

			if (Object.keys(myChapterList).length !== 0 && hostname) {
				// console.log("At Cứu Truyện sites");
				const chapterData = {
					cuutruyenHostname: hostname,
					mangaId: manga,
					chapterId: chapter
				}
				await chrome.storage.local.set({ chapterListSorted: false });
				await chrome.storage.local.set({ activeChapterData: chapterData });
				if (await sortAndStoreChaperList(chapterData, sortOrder)) {
					await chrome.storage.local.set({ chapterListSorted: true });
				}
				else {
					await chrome.storage.local.set({ chapterListSorted: false });
				}
			} else {
				// console.log("Not at Cứu Truyện sites");
				const chapterData = {
					cuutruyenHostname: "",
					mangaId: "",
					chapterId: ""
				}
				await chrome.storage.local.set({ activeChapterData: chapterData });
			}
			// console.log("Before postMessage:", message);
			await port.postMessage(message);
		});
	};
});

chrome.runtime.onMessage.addListener(async function({message}, sender, sendResponse) {
	// console.log(sender.tab ?
	// 			"from a content script:" + sender.tab.url :
	// 			"from the extension");
	if (message === "getInfo") {
		// Function BELOW: Will raise error if inspecting the popup.
		// Otherwise, normal use (clicking the extension icon) raises NO ERROR.
		const currentTab = sender;

		const { hostname, manga, chapter } = parseUrl(currentTab.url);

		const myChapterList = await chrome.storage.local.get('chapterList').then((response) => response.chapterList);

		if (Object.keys(myChapterList).length !== 0 && hostname) {
			// console.log("At Cứu Truyện sites");
			const chapterData = {
				cuutruyenHostname: hostname,
				mangaId: manga,
				chapterId: chapter
			}
			await chrome.storage.local.set({ chapterListSorted: false });
			await chrome.storage.local.set({ activeChapterData: chapterData });
			if (await sortAndStoreChaperList(chapterData, sortOrder)) {
				await chrome.storage.local.set({ chapterListSorted: true });
			}
			else {
				await chrome.storage.local.set({ chapterListSorted: false });
			}
		} else {
			// console.log("Not at Cứu Truyện sites");
			const chapterData = {
				cuutruyenHostname: "",
				mangaId: "",
				chapterId: ""
			}
			await chrome.storage.local.set({ activeChapterData: chapterData });
		}
	}
});

function parseUrl(url) {
	// console.log("Enter parseUrl");
	for (const aHostname of hostnames) {
		const pattern = new RegExp(`https://${aHostname}/mangas/(?<manga>.*)/chapters/(?<chapter>.*)`);
		
		const match = pattern.exec(url);
		if (match && match.groups) {
			const { manga, chapter } = match.groups;
			// console.log("Manga and Chapter found");
			// console.log(aHostname, parseInt(manga), parseInt(chapter));
			return { hostname: aHostname, manga: parseInt(manga), chapter: parseInt(chapter) };
		}       
	}
	for (const aHostname of hostnames) {
		const pattern = new RegExp(`https://${aHostname}/mangas/(?<manga>.*)`);
		
		const match = pattern.exec(url);
		if (match && match.groups) {
			const { manga } = match.groups;
			// console.log("Manga and Chapter found");
			// console.log(aHostname, parseInt(manga));
			return { hostname: aHostname, manga: parseInt(manga), chapter: 0 };
		}       
	}
	for (const aHostname of hostnames) {
		const pattern = new RegExp(`https://${aHostname}`);
		
		const match = pattern.test(url);
		if (match)
		{
			// console.log("At Cứu Truyện sites");
			return { hostname: aHostname, manga: 0, chapter: 0 };
		}      
	}
	// console.log("Error: Manga and/or Chapter not found");
	return { hostname: "", manga: 0, chapter: 0 };
}

// TODO - DONE: Build list of mangas and corresponding chapters

async function buildInitialChapterList(reason) {
	// console.log("Enter buildInitialChapterList");

	if (reason === "update") {
	// Use existing chapter list, if existing; otherwise, create empty chapter list
		const existingChapterList = await chrome.storage.local.get('chapterList').then((response) => response.chapterList);
		if (existingChapterList) {
			// console.log("Found existing chapter list at updating");

			// TODO: Convert chapterList into new format
			try {
				await convertChapterListToNewStructure(existingChapterList);
			}
			catch (error) {
				console.error("Error in converting chapterList to new structure:", error);
			}
			return; // There exists a chapterList => no need to create a new one.
		}

		const myChapterList = {};
		await chrome.storage.local.set({ chapterList: myChapterList });
	}

	if (reason === "install") {
	// Create empty chapter list
		// console.log("Create empty chapter list at installation");
		const myChapterList = {};
		await chrome.storage.local.set({ chapterList: myChapterList });
	}
}

async function setInitialSavedOptions(reason) {
	// console.log("Enter setInitialOptions");

	if (reason === "update") {
	// Use existing saved options, if existing; otherwise, create empty chapter list
		const existingSavedOptions = await chrome.storage.local.get('savedOptions');

		if (existingSavedOptions) {
			// console.log("Found existing saved options at updating");
			return; // There exist saved options => no need to create a new one.
		}

		const savedOptions = {
			PgUpPgDn: {
				ChuyenChuong: true,
				CuonTrang: false
			},
			XoaTruyen: false,
			XoaDaDocChuong: false
		};
		await chrome.storage.local.set({ savedOptions: savedOptions });
	}

	if (reason === "install") {
	// Create new saved options
		// Default options, at install
		const savedOptions = {
			PgUpPgDn: {
				ChuyenChuong: true,
				CuonTrang: false
			},
			XoaTruyen: false,
			XoaDaDocChuong: false
		};
		await chrome.storage.local.set({ savedOptions: savedOptions });
	}
}

async function convertChapterListToNewStructure(existingChapterList) {
	// console.log("Convert chapterList to new structure");

	if (!Array.isArray(existingChapterList)) {
		// console.log("Chapter list already of new structure. Abort conversion...");
		return;
	}
	// console.log("Chapter list still of old structure. Continue conversion...");
	
	let newStructureChapterList = {};

	if (existingChapterList.length === 0) {
		// Empty chapter list. Actually checked during extension installation/update.
		// console.log("Empty chapter list");
		existingChapterList = newStructureChapterList;
		return;
	}

	for (let listIndex = 0; listIndex < existingChapterList.length; listIndex++) {
		const mangaDetails = existingChapterList[listIndex];
		const mangaId = mangaDetails.mangaId;

		newStructureChapterList[mangaId] = {
			mangaName: mangaDetails.mangaName
		};

		for (let chapterIndex = 0; chapterIndex < mangaDetails.chapterOrders.length; chapterIndex++) {
			const chapterOrder = mangaDetails.chapterOrders[chapterIndex];
			const chapterId = mangaDetails.chapters[chapterIndex];
			const chapterName = mangaDetails.chapterNames[chapterIndex];
			const chapterNumber = mangaDetails.chapterNumbers[chapterIndex];
			const read = mangaDetails.readChapters.includes(chapterId) ? true : false;

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

	// console.log({ newStructureChapterList });

	await chrome.storage.local.set({ chapterList: newStructureChapterList });

	// console.log("Finish converting chapterList to new structure");
}

async function buildChapterList(chapterData) {
	const isFromLastChapter = false;
	await fetchChapters(chapterData, isFromLastChapter);
	if (await sortAndStoreChaperList(chapterData, sortOrder)) {
		await chrome.storage.local.set({ chapterListSorted: true });
	}
	else {
		await chrome.storage.local.set({ chapterListSorted: false });
	}
}

async function buildChapterListFromLastChapter(chapterData) {
	const cuutruyenApiMangaUrl = "https://" + chapterData.cuutruyenHostname + "/api/v2/mangas/";

	const mangaApiResponse = await fetch(cuutruyenApiMangaUrl + chapterData.mangaId.toString()).then((response) => response.json());
	const mangaData = mangaApiResponse.data;

	const newestChapterId = mangaData.newest_chapter_id;
	const chaptersCount = mangaData.chapters_count;

	const myChapterList = await chrome.storage.local.get('chapterList').then((response) => response.chapterList);

	if (myChapterList.hasOwnProperty(chapterData.mangaId)) {
		const numberOfKeys = Object.keys(myChapterList[chapterData.mangaId]).length;
		const storedChapterCount = numberOfKeys - 1; //Taking advantage of automatic sort of Object numeric property
		const keysArray = Object.keys(myChapterList[chapterData.mangaId]);
		const lastChapterOrder = parseInt(keysArray[storedChapterCount - 1]);

		// console.log({ numberOfKeys });
		// console.log({ storedChapterCount });
		// console.log({ lastChapterOrder });
		if (chaptersCount === storedChapterCount) {
			const highestChapterId = myChapterList[chapterData.mangaId][lastChapterOrder].chapterId;
			// Number of keys = N
			// Number of chapters stored = N-1
			// Index of key mangaName = N-1
			// Index of key highest chapterOrder = N-2

			if (newestChapterId === highestChapterId) {
				// console.log("Stop fetching chapter. Already built");
				return;
			}
		}
	}

	const currentChapterData = {
		cuutruyenHostname: chapterData.cuutruyenHostname,
		mangaId: chapterData.mangaId,
		chapterId: newestChapterId
	}

	// console.log("Build from last");
	// console.log(currentChapterData);

	const isFromLastChapter = true;
	await fetchChaptersFromLastChapter(currentChapterData, isFromLastChapter);
	if (await sortAndStoreChaperList(currentChapterData, sortOrder)) {
		await chrome.storage.local.set({ chapterListSorted: true });
	}
	else {
		await chrome.storage.local.set({ chapterListSorted: false });
	}
}

async function fetchChapters(chapterData, isFromLastChapter) {
	try {
		// Function 1
		await fetchCurrentChapter(chapterData, isFromLastChapter);
	
		// Function 2
		// TODO: What conditions to stop fetchNextChapter early?
		await fetchNextChapter(chapterData);

		// Function 3
		// TODO: What conditions to stop fetchPreviousChapter early?
		await fetchPreviousChapter(chapterData);

		// console.log("All fetchXChapter functions completed in order");
		// const myChapterList = await chrome.storage.local.get('chapterList').then((response) => response.chapterList);
		// console.log(myChapterList);
	} catch (error) {
		console.error("An error occurred:", error);
	}
}

async function fetchChaptersFromLastChapter(chapterData, isFromLastChapter) {
	try {
		// Function 1
		await fetchCurrentChapter(chapterData, isFromLastChapter);

		// Function 2
		// TODO: What conditions to stop fetchPreviousChapter early?
		await fetchPreviousChapter(chapterData);

		// console.log("All fetchXChapter functions completed in order");
		// const myChapterList = await chrome.storage.local.get('chapterList').then((response) => response.chapterList);
		// console.log(myChapterList);
	} catch (error) {
		console.error("An error occurred:", error);
	}
}

async function fetchCurrentChapter(chapterData, isFromLastChapter) {
	// console.log("Enter fetchCurrentChapter");

	const activeChapterData = await chrome.storage.local.get('activeChapterData').then((response) => response.activeChapterData);

	if (activeChapterData.cuutruyenHostname === ""
		&& activeChapterData.mangaId === "" 
		&& activeChapterData.chapterId === "")
	{
		return;
	}

	const cuutruyenApiChapterUrl = "https://" + chapterData.cuutruyenHostname + "/api/v2/chapters/";
	// console.log(cuutruyenApiChapterUrl);
	// console.log("cuutruyenApiChapterUrl: " + cuutruyenApiChapterUrl);

	// console.log("Complete API URL: " + cuutruyenApiChapterUrl + chapterData.chapterId.toString());

	const apiResponse = await fetch(cuutruyenApiChapterUrl + chapterData.chapterId.toString()).then((response) => response.json());
	const data = apiResponse.data;

	// console.log(apiResponse);
	// console.log(data);

	const mangaId = data.manga.id;
	const mangaName = data.manga.name;
	const chapterName = data.name;
	const chapterNumber = data.number;
	const chapterOrder = data.order;

	const myChapterList = await chrome.storage.local.get('chapterList').then((response) => response.chapterList);
	// console.log(myChapterList);

	if (!Object.keys(myChapterList).length) {
		// Empty chapter list
		// console.log("Empty chapter list");

		myChapterList[mangaId] = {
			mangaName: mangaName
		}
		myChapterList[mangaId][chapterOrder] = {
			chapterId: chapterData.chapterId,
			chapterName: chapterName !== null ? chapterName : "",
			chapterNumber: chapterNumber,
			read: isFromLastChapter ? false : true
		}

		await chrome.storage.local.set({ chapterList: myChapterList });
		// console.log(myChapterList);
		return;
	}

	if (!myChapterList.hasOwnProperty(mangaId)) {
		// console.log("Non-empty chapter list. Failed to find manga id in storage");

		myChapterList[mangaId] = {
			mangaName: mangaName
		}
		myChapterList[mangaId][chapterOrder] = {
			chapterId: chapterData.chapterId,
			chapterName: chapterName !== null ? chapterName : "",
			chapterNumber: chapterNumber,
			read: isFromLastChapter ? false : true
		}

		await chrome.storage.local.set({ chapterList: myChapterList });
		// console.log(myChapterList);
		return;
	}

	if (!myChapterList[mangaId].hasOwnProperty(chapterOrder)
		|| 
		(myChapterList[mangaId][chapterOrder].chapterId !== chapterData.chapterId
		|| myChapterList[mangaId][chapterOrder].chapterName !== chapterName
		|| myChapterList[mangaId][chapterOrder].chapterNumber !== chapterNumber)
		) {
		// console.log("Non-empty chapter list. Found manga id in storage. Failed to find chapter in storage.", myChapterList[mangaId].hasOwnProperty(chapterOrder));
		// console.log("Or: Non-empty chapter list. Found manga id in the storage. A change in chapter id");

		myChapterList[mangaId][chapterOrder] = {
			chapterId: chapterData.chapterId,
			chapterName: chapterName !== null ? chapterName : "",
			chapterNumber: chapterNumber,
			read: isFromLastChapter ? false : true
		}

		await chrome.storage.local.set({ chapterList: myChapterList });
		// console.log(myChapterList);
		return;
	}

	if (myChapterList[mangaId].hasOwnProperty(chapterOrder)
		&& myChapterList[mangaId][chapterOrder].read === false) {
		// Update read status
		// console.log("Update read status");
		myChapterList[mangaId][chapterOrder].read = true;

		await chrome.storage.local.set({ chapterList: myChapterList });
		// console.log(myChapterList);
		return;
	}
}

async function fetchNextChapter(chapterData) {
	// console.log("Enter fetchNextChapter");

	const activeChapterData = await chrome.storage.local.get('activeChapterData').then((response) => response.activeChapterData);

	if (activeChapterData.cuutruyenHostname === ""
		&& activeChapterData.mangaId === "" 
		&& activeChapterData.chapterId === "")
	{
		return;
	}

	const cuutruyenApiMangaUrl = "https://" + chapterData.cuutruyenHostname + "/api/v2/mangas/";

	const mangaApiResponse = await fetch(cuutruyenApiMangaUrl + chapterData.mangaId.toString()).then((response) => response.json());
	const mangaData = mangaApiResponse.data;

	const mangaId = mangaData.id; // mangaId === chapterData.mangaId
	const chaptersCount = mangaData.chapters_count;
	const newestChapterId = mangaData.newest_chapter_id;

	const myChapterList = await chrome.storage.local.get('chapterList').then((response) => response.chapterList);

	// Attempt to ealry stop the fetching of next chapter
	if (myChapterList.hasOwnProperty(mangaId)) {
		const numberOfKeys = Object.keys(myChapterList[mangaId]).length;
		const storedChapterCount = numberOfKeys - 1; //Taking advantage of automatic sort of Object numeric property

		const keysArray = Object.keys(myChapterList[chapterData.mangaId]);
		const lastChapterOrder = parseInt(keysArray[storedChapterCount - 1]);

		// console.log({ numberOfKeys });
		// console.log({ storedChapterCount });
		// console.log({ lastChapterOrder });
		if (chaptersCount === storedChapterCount) {
			const highestChapterId = myChapterList[mangaId][lastChapterOrder].chapterId;
			// Number of keys = N
			// Number of chapters stored = N-1
			// Index of key mangaName = N-1
			// Index of key highest chapterOrder = N-2

			if (newestChapterId === highestChapterId) {
				// console.log("Stop fetching chapter. Already built");
				return;
			}
		}
	}

	const cuutruyenApiChapterUrl = "https://" + chapterData.cuutruyenHostname + "/api/v2/chapters/";
	
	// console.log(cuutruyenApiChapterUrl);
	// console.log("cuutruyenApiChapterUrl: " + cuutruyenApiChapterUrl);

	// console.log("Complete API URL: " + cuutruyenApiChapterUrl + chapterData.chapterId.toString());
	const apiResponse = await fetch(cuutruyenApiChapterUrl + chapterData.chapterId.toString()).then((response) => response.json());
	const data = apiResponse.data;

	// console.log(apiResponse);
	// console.log(data);

	// const mangaId = data.manga.id;
	const mangaName = data.manga.name;
	const nextChapterId = data.next_chapter_id;
	const nextChapterName = data.next_chapter_name;
	const nextChapterNumber = data.next_chapter_number;
	const nextChapterOrder = data.order + 1;

	if (nextChapterId === null)
	{
		// console.log("Last chapter");
		return; // Last chapter
	}

	// console.log(myChapterList);

	// console.log("Next Chapter. MangaId: " + mangaId);
	if (!myChapterList.hasOwnProperty(mangaId)) {
		// console.log("Non-empty chapter list. Failed to find manga id in storage");

		myChapterList[mangaId] = {
			mangaName: mangaName
		}
		myChapterList[mangaId][nextChapterOrder] = {
			chapterId: nextChapterId,
			chapterName: nextChapterName !== null ? nextChapterName : "",
			chapterNumber: nextChapterNumber,
			read: false
		}

		await chrome.storage.local.set({ chapterList: myChapterList });
		// console.log(myChapterList);
		// return;
	}

	if (!myChapterList[mangaId].hasOwnProperty(nextChapterOrder)
		|| myChapterList[mangaId][nextChapterOrder].chapterId !== nextChapterId) {
		// console.log("Non-empty chapter list. Found manga id in storage. Failed to find chapter in storage.", myChapterList[mangaId].hasOwnProperty(nextChapterOrder));

		myChapterList[mangaId][nextChapterOrder] = {
			chapterId: nextChapterId,
			chapterName: nextChapterName !== null ? nextChapterName : "",
			chapterNumber: nextChapterNumber,
			read: false
		}

		await chrome.storage.local.set({ chapterList: myChapterList });
		// console.log(myChapterList);
		// return;
	}

	if (myChapterList[mangaId].hasOwnProperty(nextChapterOrder)
		&& 
		(myChapterList[mangaId][nextChapterOrder].chapterId !== nextChapterId
		|| myChapterList[mangaId][nextChapterOrder].chapterName !== nextChapterName
		|| myChapterList[mangaId][nextChapterOrder].chapterNumber !== nextChapterNumber)
		) {
		// console.log("Non-empty chapter list. Found manga id in the storage. A change in chapter");

		let readStatus = false;
		if (myChapterList[mangaId][nextChapterOrder].chapterNumber === nextChapterNumber) {
			const readStatus = myChapterList[mangaId][nextChapterOrder].read;
		}
		myChapterList[mangaId][nextChapterOrder] = {
			chapterId: nextChapterId,
			chapterName: nextChapterName !== null ? nextChapterName : "",
			chapterNumber: nextChapterNumber,
			read: readStatus
		}

		await chrome.storage.local.set({ chapterList: myChapterList });
		// console.log(myChapterList);
		// return;
	}

	const nextChapterData = {
		cuutruyenHostname: chapterData.cuutruyenHostname,
		mangaId: chapterData.mangaId,
		chapterId: nextChapterId
	}

	await fetchNextChapter(nextChapterData);
}

async function fetchPreviousChapter(chapterData) {
	// console.log("Enter fetchPreviousChapter");

	const activeChapterData = await chrome.storage.local.get('activeChapterData').then((response) => response.activeChapterData);

	if (activeChapterData.cuutruyenHostname === ""
		&& activeChapterData.mangaId === "" 
		&& activeChapterData.chapterId === "")
	{
		return;
	}

	const cuutruyenApiChapterUrl = "https://" + chapterData.cuutruyenHostname + "/api/v2/chapters/";
	// console.log(cuutruyenApiChapterUrl);
	// console.log("cuutruyenApiChapterUrl: " + cuutruyenApiChapterUrl);

	// console.log("Complete API URL: " + cuutruyenApiChapterUrl + chapterData.chapterId.toString());
	const apiResponse = await fetch(cuutruyenApiChapterUrl + chapterData.chapterId.toString()).then((response) => response.json());
	const data = apiResponse.data;

	// console.log(apiResponse);
	// console.log(data);

	const mangaId = data.manga.id; // mangaId === chapterData.chapterId
	const mangaName = data.manga.name;
	const previousChapterId = data.previous_chapter_id;
	const previousChapterName = data.previous_chapter_name;
	const previousChapterNumber = data.previous_chapter_number;
	const previousChapterOrder = data.order - 1;

	if (previousChapterId === null)
	{
		// console.log("First chapter");
		return; // First chapter
	}

	const myChapterList = await chrome.storage.local.get('chapterList').then((response) => response.chapterList);
	// console.log(myChapterList);

	// console.log("Previous Chapter. MangaId: " + mangaId);
	if (!myChapterList.hasOwnProperty(mangaId)) {
		// console.log("Non-empty chapter list. Failed to find manga id in storage");

		myChapterList[mangaId] = {
			mangaName: mangaName
		}
		myChapterList[mangaId][previousChapterOrder] = {
			chapterId: previousChapterId,
			chapterName: previousChapterName !== null ? previousChapterName : "",
			chapterNumber: previousChapterNumber,
			read: false
		}

		await chrome.storage.local.set({ chapterList: myChapterList });
		// console.log(myChapterList);
		// return;
	}

	if (!myChapterList[mangaId].hasOwnProperty(previousChapterOrder)
		) {
		// console.log("Non-empty chapter list. Found manga id in storage. Failed to find chapter in storage.", myChapterList[mangaId].hasOwnProperty(previousChapterOrder));

		myChapterList[mangaId][previousChapterOrder] = {
			chapterId: previousChapterId,
			chapterName: previousChapterName !== null ? previousChapterName : "",
			chapterNumber: previousChapterNumber,
			read: false
		}

		await chrome.storage.local.set({ chapterList: myChapterList });
		// console.log(myChapterList);
		// return;
	}
	
	if (myChapterList[mangaId].hasOwnProperty(previousChapterOrder)
		&& 
		(myChapterList[mangaId][previousChapterOrder].chapterId !== previousChapterId
		|| myChapterList[mangaId][previousChapterOrder].chapterName !== previousChapterName
		|| myChapterList[mangaId][previousChapterOrder].chapterNumber !== previousChapterNumber)
		) {
		// console.log("Non-empty chapter list. Found manga id in the storage. A change in chapter");

		let readStatus = false;
		if (myChapterList[mangaId][previousChapterOrder].chapterNumber === previousChapterNumber) {
			const readStatus = myChapterList[mangaId][previousChapterOrder].read;
		}
		myChapterList[mangaId][previousChapterOrder] = {
			chapterId: previousChapterId,
			chapterName: previousChapterName !== null ? previousChapterName : "",
			chapterNumber: previousChapterNumber,
			read: readStatus
		}

		await chrome.storage.local.set({ chapterList: myChapterList });
		// console.log(myChapterList);
		// return;
	}

	const previousChapterData = {
		cuutruyenHostname: chapterData.cuutruyenHostname,
		mangaId: chapterData.mangaId,
		chapterId: previousChapterId
	}

	await fetchPreviousChapter(previousChapterData);
}

// With new structure for chapterList, no longer need this function. Will remove later.
async function sortAndStoreChaperList(chapterData, ascOrDes) {
	// // const activeChapterData = await chrome.storage.local.get('activeChapterData').then((response) => response.activeChapterData);

	// // if (activeChapterData.cuutruyenHostname === ""
	// // 	&& activeChapterData.mangaId === "" 
	// // 	&& activeChapterData.chapterId === "")
	// // {
	// // 	return;
	// // }

	// let myChapterList = await chrome.storage.local.get('chapterList').then((response) => response.chapterList);
	// // console.log(myChapterList);

	// const mangaIndex = myChapterList.findIndex((item) => item.mangaId === chapterData.mangaId);

	// if (mangaIndex === -1) {
	// 	return false;
	// }
	// let chapterOrderList = myChapterList[mangaIndex].chapterOrders;
	// const chapterIdList = myChapterList[mangaIndex].chapters;
	// const chapterNameList = myChapterList[mangaIndex].chapterNames;
	// const chapterNumberList = myChapterList[mangaIndex].chapterNumbers;
	// const readChapterList = myChapterList[mangaIndex].readChapters;

	// // Create an array of indices
	// let indices = chapterOrderList.map((element, index) => index);

	// if (ascOrDes === "ascending") {
	// 	// Find the maximum element in the chapterIdList
	// 	const minElement = Math.min(...chapterIdList);

	// 	// Sort the indices based on the values in chapterOrderList
	// 	indices.sort((index_a, index_b) => chapterOrderList[index_a] - chapterOrderList[index_b]);
	// 	readChapterList.sort((readChapter_a, readChapter_b) => readChapter_a - readChapter_b);
	// }
	// else if (ascOrDes === "descending") {
	// 	// Sort the indices based on the values in chapterOrderList
	// 	indices.sort((index_a, index_b) => chapterOrderList[index_b] - chapterOrderList[index_a]);
	// 	readChapterList.sort((readChapter_a, readChapter_b) => readChapter_b - readChapter_a);
	// }

	// // Rearrange elements in all arrays based on the sorted indices
	// const sortChapterOrderList = indices.map(index => chapterOrderList[index]);
	// const sortChapterIdList = indices.map(index => chapterIdList[index]);
	// const sortChapterNameList = indices.map(index => chapterNameList[index]);
	// const sortChapterNumberList = indices.map(index => chapterNumberList[index]);

	// myChapterList[mangaIndex].chapterOrders = sortChapterOrderList;
	// myChapterList[mangaIndex].chapters = sortChapterIdList;
	// myChapterList[mangaIndex].chapterNames = sortChapterNameList;
	// myChapterList[mangaIndex].chapterNumbers = sortChapterNumberList;
	// myChapterList[mangaIndex].readChapters = readChapterList;

	// // console.log(myChapterList[mangaIndex]);
	// await chrome.storage.local.set({ chapterList: myChapterList });
	return true;
}
