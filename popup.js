// TODO: Find a way to delay popup.html until background.js is done with building the chapter list

let extensionSavedOptions = {
	PgUpPgDn: {
		ChuyenChuong: true,
		CuonTrang: false
	},
	XoaTruyen: false,
	XoaDaDocChuong: false
}

const port = chrome.runtime.connect({name:"getInfo"});

port.onMessage.addListener(async function ({message}, sender, sendResponse) {
	// console.log("Enter onMessage, listener, callback");

	// alert(message);
	if (message !== "sendInfo")
	{
		window.close();
		return;
	}

	const activeChapterData = await chrome.storage.local.get('activeChapterData').then((response) => response.activeChapterData);
	// alert(activeChapterData.cuutruyenHostname);
 
	if (activeChapterData.cuutruyenHostname !== "") {
		// console.log("Receive payload");

		document.getElementById("ChonChuongTable").innerHTML = "";

		if (!activeChapterData.mangaId && !activeChapterData.mangaId) {
			// Liệt kê các truyện đã đọc, tại trang chủ Cứu Truyện
			// console.log("Manga list");
			document.getElementById("ChonChuongTable").innerHTML = await renderManga(activeChapterData);

			document.querySelectorAll("#gotoManga").forEach((button) => {
				button.addEventListener("click", (() => {
					// console.log("Button Clicked");
					const data_id = button.getAttribute("data-id");
					// console.log("At: " + data_id);
					gotoManga({ 
						cuutruyenHostname: activeChapterData.cuutruyenHostname,
						mangaId: parseInt(data_id)
					});
				}))
			});

			document.querySelectorAll("#removeReadManga").forEach((button) => {
				button.addEventListener("click", (() => {
					// console.log("Button Clicked");
					const data_id = button.getAttribute("data-id");
					// console.log("At: " + data_id);
					removeReadManga({ 
						cuutruyenHostname: activeChapterData.cuutruyenHostname,
						mangaId: parseInt(data_id)
					}, button);
				}))
			});
		}
		else if (activeChapterData.mangaId) {
			// Liệt kê các chương của truyện, tại trang thông tin truyện và tại trang chương truyện
			// console.log("Chapter list");
			document.getElementById("ChonChuongTable").innerHTML = await renderChapter(activeChapterData);

			const currentChapterRow = document.querySelector(`[data-id="c${activeChapterData.chapterId}"]`);

			// Cuộn danh sách chương để chương hiện tại nằm dưới cùng trong vùng nhìn
			currentChapterRow.scrollIntoView({
				behavior: 'smooth',
				block: 'start' }
			);

			document.querySelectorAll("#gotoChapter").forEach((button) => {
				button.addEventListener("click", (() => {
					// console.log("Button Clicked");
					const data_id = button.getAttribute("data-id");
					// console.log(data_id);
					const splitDataId = data_id.split(".");
					// console.log("At: " + splitDataId[0] + "/" + splitDataId[1]);
					gotoChapter({ 
						cuutruyenHostname: activeChapterData.cuutruyenHostname,
						mangaId: parseInt(splitDataId[0]),
						chapterId: parseInt(splitDataId[1])
					});
				}))
			});

			document.querySelectorAll("#removeReadChapter").forEach((button) => {
				button.addEventListener("click", (() => {
					// console.log("Button Clicked");
					const data_id = button.getAttribute("data-id");
					// console.log(data_id);
					const splitDataId = data_id.split(".");
					// console.log("At: " + splitDataId[0] + "/" + splitDataId[1]);
					removeReadChapter({ 
						cuutruyenHostname: activeChapterData.cuutruyenHostname,
						mangaId: parseInt(splitDataId[0]),
						chapterId: parseInt(splitDataId[1])
					}, button);
				}))
			});
		}
	} else {
		// console.log("Receive empty");
		document.getElementById("ChonChuongTable").innerHTML = "";
		const theadHtml = `
			<thead>
				<tr>
					<th>Bạn đang không đọc truyện</th>
				</tr>
			</thead>
		`;
		document.getElementById("ChonChuongTable").innerHTML = theadHtml;
	}
});

chrome.storage.onChanged.addListener(async function (changes, namespace) {
	// console.log("A change in local storage");
	if (namespace === "local") {
		// console.log("Update savedOptions");
		extensionSavedOptions = await chrome.storage.local.get('savedOptions').then((response) => response.savedOptions);
	}
});

async function renderChapter(chapterData) {
	let html = "";

	const currentMangaChapterList = await fetchChapters(chapterData);
	
	if (!currentMangaChapterList) {
		return "";
	}

	html = constructTableChapter(currentMangaChapterList, chapterData);

	return html;  
}

async function renderManga(mangaData) {
	// console.log("Render manga");
	let html = "";

	const currentMangaList = await fetchMangas(mangaData);
	
	if (!currentMangaList) {
		return "";
	}

	html = constructTableManga(currentMangaList);

	return html;  
}

async function fetchChapters(chapterData) {
	const myChapterList = await chrome.storage.local.get('chapterList').then((response) => response.chapterList);

	if (!myChapterList.hasOwnProperty(chapterData.mangaId))
	{
		// console.log("Not found");
		return null;
	}
	// console.log("Found Item") ;
	const resultItem = myChapterList[chapterData.mangaId];

	return resultItem;
}

async function fetchMangas(mangaData) {
	const myChapterList = await chrome.storage.local.get('chapterList').then((response) => response.chapterList);

	const resultMangaList = Object.entries(myChapterList).map(([key, value]) => (
		{
			mangaId: key,
			mangaName: value.mangaName
		}
	));

	// console.log({ resultMangaList });
	if (!resultMangaList)
	{
		// console.log("Not found");
		return null;
	}
	// console.log("Found Item") ;

	return resultMangaList;
}

async function constructTableChapter(mangaChapterList, chapterData) {
	let theadHtml = "";
	if (extensionSavedOptions.XoaDaDocChuong === true){
		theadHtml = `
			<thead>
				<tr>
					<th>Chương</th>
					<th>Tên Chương</th>
					<th>Chuyển Chương</th>
					<th></th>
				</tr>
			</thead>
		`;
	}
	else if (extensionSavedOptions.XoaDaDocChuong === false){
		theadHtml = `
			<thead>
				<tr>
					<th>Chương</th>
					<th>Tên Chương</th>
					<th>Chuyển Chương</th>
				</tr>
			</thead>
		`;
	}
	// console.log("Done thead");

	// console.log(mangaChapterList);

	let html = "";
	const keysArray = Object.keys(mangaChapterList);
	const chapterOrdersArray = keysArray.slice(0, -1).map(function (key) {
		return parseInt(key);
	});
	// console.log({ chapterOrdersArray });
	for (let chapterOrder of chapterOrdersArray) {
		// console.log({ chapterOrder });
		const readClass = mangaChapterList[chapterOrder].read ? "read" : "noread";
		// console.log({ readClass });

		const currentId = mangaChapterList[chapterOrder].chapterId === chapterData.chapterId ? chapterData.chapterId : 0;

		// console.log.log(chapterData.mangaId, ".", chapterData.chapterId);

		if (extensionSavedOptions.XoaDaDocChuong === true) {
			html += 
				`
				<tr class=${readClass} data-id="c${currentId}">
					<td>${mangaChapterList[chapterOrder].chapterNumber}</td>
					<td>${mangaChapterList[chapterOrder].chapterName}</td>
					<td><button id="gotoChapter" data-id="${chapterData.mangaId}.${mangaChapterList[chapterOrder].chapterId}">Đọc</button></td>
					<td><button id="removeReadChapter" data-id="${chapterData.mangaId}.${mangaChapterList[chapterOrder].chapterId}">Xóa</button></td>
				</tr>
				`;
		}
		else if (extensionSavedOptions.XoaDaDocChuong === false) {
			html += 
				`
				<tr class=${readClass} data-id="c${currentId}">
					<td>${mangaChapterList[chapterOrder].chapterNumber}</td>
					<td>${mangaChapterList[chapterOrder].chapterName}</td>
					<td><button id="gotoChapter" data-id="${chapterData.mangaId}.${mangaChapterList[chapterOrder].chapterId}">Đọc</button></td>
				</tr>
				`;
		}
	}

	const tbodyHtml = `
		<tbody>
			${html}
		</tbody>
	`;
	// console.log("Done tbody");

	return theadHtml + tbodyHtml;
}

async function constructTableManga(mangaList) {
	let theadHtml = "";
	if (extensionSavedOptions.XoaTruyen === true) {
		theadHtml = `
			<thead>
				<tr>            
					<th>STT</th>
					<th>Truyện</th>
					<th>Đọc Truyện</th>
					<th></th>
				</tr>
			</thead>
		`;
	}
	else if (extensionSavedOptions.XoaTruyen === false) {
		theadHtml = `
			<thead>
				<tr>            
					<th>STT</th>
					<th>Truyện</th>
					<th>Đọc Truyện</th>
				</tr>
			</thead>
		`;
	}
	// console.log("Done thead");

	// console.log(mangaList);
	const tbodyHtml = `
		<tbody>
			${mangaList.map(function({mangaId, mangaName}, index) {
				// console.log("This manga", mangaId, mangaName);
				if (extensionSavedOptions.XoaTruyen === true) {
					return (
						`
						<tr>
							<td>${index+1}</td>
							<td>${mangaName}</td>
							<td><button id="gotoManga" data-id="${mangaId}">Đọc</button></td>
							<td><button id="removeReadManga" data-id="${mangaId}">Xóa</button></td>
						</tr>
						`)
				}
				else if (extensionSavedOptions.XoaTruyen === false) {
					return (
						`
						<tr>
							<td>${index+1}</td>
							<td>${mangaName}</td>
							<td><button id="gotoManga" data-id="${mangaId}">Đọc</button></td>
						</tr>
						`)
				}
			}).join("")}
		</tbody>
	`;
	// console.log("Done tbody");

	return theadHtml + tbodyHtml;
}

async function gotoChapter(chapterData) {
	const chapterUrl = `https://${chapterData.cuutruyenHostname}/mangas/${chapterData.mangaId}/chapters/${chapterData.chapterId}`;

	window.close();
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		const activeTabId = tabs[0].id;
		// Redirect the active tab
		chrome.tabs.update(activeTabId, { url: chapterUrl });
	});
}

async function gotoManga(mangaData) {
	const mangaUrl = `https://${mangaData.cuutruyenHostname}/mangas/${mangaData.mangaId}`;

	window.close();
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		const activeTabId = tabs[0].id;
		// Redirect the active tab
		chrome.tabs.update(activeTabId, { url: mangaUrl });
	});
}

async function removeReadChapter(chapterData, button) {
	const myChapterList = await chrome.storage.local.get('chapterList').then((response) => response.chapterList);

	// console.log({myChapterList});

	if (!myChapterList.hasOwnProperty(chapterData.mangaId)) {
		// console.log("Manga not found");
		return;
	}
	// console.log({ mangaId: chapterData.mangaId });

	let chapterOrder = Object.keys(myChapterList[chapterData.mangaId]).find(key => myChapterList[chapterData.mangaId][key].chapterId === chapterData.chapterId);

	// console.log({ chapterOrder });
	if (!chapterOrder) {
		// console.log("Chapter not found");
		return;
	}
	chapterOrder = parseInt(chapterOrder);

	myChapterList[chapterData.mangaId][chapterOrder].read = false;

	await chrome.storage.local.set({ chapterList: myChapterList });
	await chrome.storage.local.set({ isChapterListSorted: false });

	// Get the table row reference
	const row = button.parentNode.parentNode;

	// Update the table row id
	row.classList = "noread";
}

async function removeReadManga(mangaData, button) {
	const myChapterList = await chrome.storage.local.get('chapterList').then((response) => response.chapterList);

	// console.log({myChapterList});

	if (!myChapterList.hasOwnProperty(mangaData.mangaId)) {
		// console.log("Manga not found");
		return;
	}

	delete myChapterList[mangaData.mangaId];

	await chrome.storage.local.set({ chapterList: myChapterList });

	// Get the table row reference
	const row = button.parentNode.parentNode;

	// Remove the table row
	const tbody = row.parentNode;
	tbody.removeChild(row);

	// Update the indinces of the other rows
	updateRowIndices(tbody);
}

function updateRowIndices(tbody) {
	// Get all table rows in the table body
	const rows = tbody.querySelectorAll("tr");

	// Update the indices of each row
	rows.forEach(function (row, index) {
		row.querySelector("td:first-child").textContent = index + 1;
	});
}
