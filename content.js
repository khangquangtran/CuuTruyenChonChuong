// TODO - DONE: Thêm danh sách chương ở cụm nút Chương Sau/Chương Trước ở đầu chương trong giao diện chương truyện.
// TODO - DONE: Thêm danh sách chương ở cụm nút Chương Sau/Chương Trước ở cuối chương trong giao diện chương truyện.
// TODO: Thêm danh sách chương ngay trên thanh số chương-bình luận khi đang lướt trang hình trong giao diện chhương truyện.
// TODO - DONE: Thêm đánh dấu "đã đọc" trong các danh sách chương nêu trên.
// TODO - DONE: Thêm đánh dấu "đã đọc" ngay sau số chương trong giao diện chương tryện.

const hostnames = [
	"cuutruyen.net",
	"hetcuutruyen.net",
	"cuutruyent9sv7.xyz"
];

let extensionSavedOptions = {
	PgUpPgDn: {
		ChuyenChuong: true,
		CuonTrang: false
	},
	XoaTruyen: false,
	XoaDaDocTruyen: false
}

let isZenUI = false;

watchHrefChanges();

function watchHrefChanges() {
	let previousHref = window.location.href;
	
	const observer = new MutationObserver(async () => {
		// console.log("Enter observer callback");
		const currentHref = window.location.href;
		const currentBodyStyle = {
			position: window.getComputedStyle(document.body).position,
			top: window.getComputedStyle(document.body).top,
		};

		chrome.runtime.onMessage.addListener(async function({message}, sender, sendResponse) {
			console.log("Save notification from options script, forwarded by background script");
		
			if (message === "saveOptions") {
				console.log("Save notification from options script");
				extensionSavedOptions = await chrome.storage.local.get('savedOptions').then((response) => response.savedOptions);
		
				console.log(extensionSavedOptions);
			}
		});

		// watchUiChanges();
		if (currentBodyStyle.position === 'static' 
			&& currentBodyStyle.top === 'auto') {

			if (!checkProperPage(currentHref)) {
				// console.log("Not at Cứu Truyện chapter sites");
				return;
			}
			// console.log("At Cứu Truyện chapter sites");
			// console.log(`Href changed: ${previousHref} to ${currentHref}`);

			const buttons = document.querySelectorAll("button");
			let uiButtons = [];

			buttons.forEach(function(button) {
			if (button.textContent.includes('UI')) {
				uiButtons.push(button);
			}
			});
			// console.log("Number of UI buttons:", uiButtons.length);

			const activeButton = Array.from(uiButtons).find(button => !button.classList.contains("bg-opacity-50"));

			if (activeButton) {
				// console.log("Active UI is:", activeButton.innerText);
				// console.log(activeButton.classList); 
				await handleAddSelectListAndMarkRead(activeButton.innerText);
			}
			else {
				await handleAddSelectListAndMarkRead("");
			}
			// await handleAddSelectListAndMarkRead("");

			uiButtons[0].addEventListener("click", async function () {
				// console.log("Enter UI button callback");
				const activeButton = uiButtons[0];

				// console.log("Active UI switched to:", activeButton.innerText);
				// console.log(activeButton.classList); 

				uiButtons.pop();
				await updateUIState(activeButton.innerText); // Update UI elements based on the active UI type
			});
			uiButtons[1].addEventListener("click", async function () {
				// console.log("Enter UI button callback");
				const activeButton = uiButtons[1];

				// console.log("Active UI switched to:", activeButton.innerText);
				// console.log(activeButton.classList); 

				uiButtons.shift();
				await updateUIState(activeButton.innerText); // Update UI elements based on the active UI type
			});
			
			previousHref = currentHref;
		}
	});

	const config = {
		attributes: true,
		childList: false
	};
	observer.observe(document.body, config);
}

async function updateUIState(uiButtonText) {
	await handleAddSelectListAndMarkRead(uiButtonText);

	const buttons = document.querySelectorAll("button");
	let uiButtons = [];

	buttons.forEach(function(button) {
	if (button.textContent.includes('UI')) {
		uiButtons.push(button);
	}
	});
	// console.log("Number of UI buttons:", uiButtons.length);

	uiButtons[0].addEventListener("click", async function () {
			// console.log("Enter UI button callback");
			const activeButton = uiButtons[0];

			// console.log("Active UI switched to:", activeButton.innerText);
			// console.log(activeButton.classList); 

			uiButtons.pop();
			await updateUIState(activeButton.innerText); // Update UI elements based on the active UI type
	});
	uiButtons[1].addEventListener("click", async function () {
		// console.log("Enter UI button callback");
		const activeButton = uiButtons[1]; 

		// console.log("Active UI switched to:", activeButton.innerText);
		// console.log(activeButton.classList); 

		uiButtons.unshift();
		await updateUIState(activeButton.innerText); // Update UI elements based on the active UI type
	});	
}

async function handleAddSelectListAndMarkRead(uiButtonText) {
	// console.log("Enter handleAddSelectListAndMarkRead", uiButtonText);
	const chapterTitle = document.querySelector("#heading > div > div.mb-12.flex-grow > h1 > span");
	const chapterEndTitle = document.querySelector("#trailing > div > div.mb-12 > h1 > span");

	const chapterTopTitle = document.querySelector("#app > div > div > div > div > main > div.w-full.max-w-screen-sm.mx-auto.px-2.mb-12 > h1 > span");

	if (chapterTitle) {
		chapterTitle.innerHTML = markReadTitle(chapterTitle);
	} 
	if (chapterTopTitle) {
		chapterTopTitle.innerHTML = markReadTitle(chapterTopTitle);
	}

	if (chapterEndTitle) {
		chapterEndTitle.innerHTML = markReadTitle(chapterEndTitle);
	}

	const navigationButtonHeadingGroup = document.querySelector("#heading > div > div.mb-12.flex-grow > div");
	const navigationButtonTrailingGroup = document.querySelector("#trailing > div > div.mb-12 > div");

	const navigationButtonTopGroup = document.querySelector('[class="flex items-stretch flex-col gap-2"]');
	const navigationButtonBottomGroup = document.querySelector('[class="text-gray-600 text-sm flex flex-col items-center mt-12');

	if (uiButtonText === "") {
		if (navigationButtonHeadingGroup) {
			// console.log("Heading");
			// console.log(navigationButtonHeadingGroup.innerHTML);
			navigationButtonHeadingGroup.innerHTML = await addChapterSelectList(navigationButtonHeadingGroup, "Heading");

			// console.log(navigationButtonHeadingGroup.innerHTML);
			const chapterSelectListHeading = document.getElementById("ChonChuongSelectHeading");
			if (chapterSelectListHeading) {
				// console.log("Select drop-down list available. Heading");
				// console.log("Add listener for clicking");
				chapterSelectListHeading.addEventListener('click', function() {
					updateChapterSelectListOptions("Heading");
				});
				// updateOptions
			}
		} else if (navigationButtonTopGroup) {
			// console.log("Top");
			// console.log(navigationButtonTopGroup.innerHTML);
			navigationButtonTopGroup.innerHTML = await addChapterSelectList(navigationButtonTopGroup, "Top");

			// console.log(navigationButtonTopGroup.innerHTML);
			const chapterSelectListTop = document.getElementById("ChonChuongSelectTop");
			if (chapterSelectListTop) {
				// console.log("Select drop-down list available. Top");
				// console.log("Add listener for clicking");
				chapterSelectListTop.addEventListener('click', function() {
					updateChapterSelectListOptions("Top");
				});
				// updateOptions
			}
		}

		if (navigationButtonTrailingGroup) {
			// console.log("Trailing");
			// console.log(navigationButtonTrailingGroup.innerHTML);
			navigationButtonTrailingGroup.innerHTML = await addChapterSelectList(navigationButtonTrailingGroup, "Trailing");

			// console.log(navigationButtonTrailingGroup.innerHTML);

			const chapterSelectListTrailing = document.getElementById("ChonChuongSelectTrailing");
			if (chapterSelectListTrailing) {
				// console.log("Select drop-down list available. Trailing");
				// console.log("Add listener for clicking");
				chapterSelectListTrailing.addEventListener('click', function() {
					updateChapterSelectListOptions("Trailing");
				});
				// updateOptions
			}
		} 
		else if (navigationButtonBottomGroup) {
			// console.log("Bottom");
			// console.log(navigationButtonBottomGroup.innerHTML);
			navigationButtonBottomGroup.innerHTML = await addChapterSelectList(navigationButtonBottomGroup, "Bottom");

			// console.log(navigationButtonBottomGroup.innerHTML);

			const chapterSelectListBottom = document.getElementById("ChonChuongSelectBottom");
			if (chapterSelectListBottom) {
				// console.log("Select drop-down list available. Bottom");
				// console.log("Add listener for clicking");
				chapterSelectListBottom.addEventListener('click', function() {
					updateChapterSelectListOptions("Bottom");
				});
				// updateOptions
			}
		}
	}
	else if (uiButtonText.toLowerCase() === "classic ui") {
		// console.log(uiButtonText.toLowerCase());
		if (navigationButtonTopGroup) {
			// console.log("Top");
			// console.log(navigationButtonTopGroup.innerHTML);
			navigationButtonTopGroup.innerHTML = await addChapterSelectList(navigationButtonTopGroup, "Top");

			// console.log(navigationButtonTopGroup.innerHTML);

			const chapterSelectListTop = document.getElementById("ChonChuongSelectTop");
			if (chapterSelectListTop) {
				// console.log("Select drop-down list available. Top");
				// console.log("Add listener for clicking");
				chapterSelectListTop.addEventListener('click', function() {
					updateChapterSelectListOptions("Top");
				});
				// updateOptions
			}
		}
		if (navigationButtonBottomGroup) {
			// console.log("Bottom");
			// console.log(navigationButtonBottomGroup.innerHTML);
			navigationButtonBottomGroup.innerHTML = await addChapterSelectList(navigationButtonBottomGroup, "Bottom");

			// console.log(navigationButtonBottomGroup.innerHTML);

			const chapterSelectListBottom = document.getElementById("ChonChuongSelectBottom");
			if (chapterSelectListBottom) {
				// console.log("Select drop-down list available. Bottom");
				// console.log("Add listener for clicking");
				chapterSelectListBottom.addEventListener('click', function() {
					updateChapterSelectListOptions("Bottom");
				});
				// updateOptions
			}
		}
	}
	else if (uiButtonText.toLowerCase() === "zen ui") {
		// console.log(uiButtonText.toLowerCase());
		if (navigationButtonHeadingGroup) {
			// console.log("Heading");
			// console.log(navigationButtonHeadingGroup.innerHTML);
			navigationButtonHeadingGroup.innerHTML = await addChapterSelectList(navigationButtonHeadingGroup, "Heading");

			// console.log(navigationButtonHeadingGroup.innerHTML);

			const chapterSelectListHeading = document.getElementById("ChonChuongSelectHeading");
			if (chapterSelectListHeading) {
				// console.log("Select drop-down list available. Heading");
				// console.log("Add listener for clicking");
				chapterSelectListHeading.addEventListener('click', function() {
					updateChapterSelectListOptions("Heading");
				});
				// updateOptions
			}
		}
		if (navigationButtonTrailingGroup) {
			// console.log("Trailing");
			// console.log(navigationButtonTrailingGroup.innerHTML);
			navigationButtonTrailingGroup.innerHTML = await addChapterSelectList(navigationButtonTrailingGroup, "Trailing");

			// console.log(navigationButtonTrailingGroup.innerHTML);

			const chapterSelectListTrailing = document.getElementById("ChonChuongSelectTrailing");
			if (chapterSelectListTrailing) {
				// console.log("Select drop-down list available. Trailing");
				// console.log("Add listener for clicking");
				chapterSelectListTrailing.addEventListener('click', function() {
					updateChapterSelectListOptions("Trailing");
				});
				// updateOptions
			}
		} 
	}
}

function checkProperPage(url){
	const pattern = new RegExp(`https?://(${hostnames[0]}|${hostnames[1]}|${hostnames[2]})/mangas/(?![0/]+$)(.+)/chapters/(?![0/]+$)(.+)/?$`);

	return pattern.test(url);
}

function parsePathname(pathname) {
	const pattern = new RegExp(`/mangas/(?<manga>.*)/chapters/(?<chapter>.*)/?$`);

	const match = pattern.exec(pathname);
	if (match && match.groups) {
		const { manga, chapter } = match.groups;
		// console.log("Manga and Chapter found");
		// console.log(parseInt(manga), parseInt(chapter));
		return { manga: parseInt(manga), chapter: parseInt(chapter) };
	}

	// console.log("Error: Manga and/or Chapter not found");
	return { manga: 0, chapter: 0 }
}

function markReadTitle(chapterTitleElement) {
	let html = "";

	if (chapterTitleElement && !chapterTitleElement.innerText.includes("(Đã đọc)"))
	{
		html = `${chapterTitleElement.innerHTML} <span style="color: yellow">(Đã đọc)</span>`
	} else if (chapterTitleElement){
		html = `${chapterTitleElement.innerHTML}`;
	}

	return html;
}

async function addChapterSelectList(navigationButtonGroup, headingOrTrailing) {
	let html = "";

	// console.log(window.location);
	if (navigationButtonGroup && !navigationButtonGroup.innerHTML.includes(`<select id="ChonChuongSelect${headingOrTrailing}"`)) {
		// console.log("Adding the select drop-down list", headingOrTrailing);
		
		const myChapterList = await chrome.storage.local.get('chapterList').then((response) => response.chapterList);
		// console.log(myChapterList);

		html = constructChapterSelectList(navigationButtonGroup, window.location, myChapterList, headingOrTrailing);
		// console.log("Select drop-down list constructed", headingOrTrailing);
		// console.log(html);
		return html;
	} else if (navigationButtonGroup) {
		return (html = `${navigationButtonGroup.innerHTML}`);
	}

	return html;
}

function constructChapterSelectList(navigationButtonGroup, windowLocation, chapterList, headingOrTrailing) {
	let html = "";
	const currentHostname = windowLocation.hostname;
	const currentPathname = windowLocation.pathname;

	// console.log(currentHostname, currentPathname);
	if (!hostnames.includes(currentHostname)){
		// console.log("Not at Cứu Truyện sites");
		return `${navigationButtonGroup.innerHTML}`;
	}
	// console.log("At Cứu Truyện sites");

	const { manga, chapter } = parsePathname(currentPathname);

	// console.log(manga, chapter);
	if (manga === 0 || chapter === 0) {
		// console.log("MangaId/ChapterId INVALID");
		return `${navigationButtonGroup.innerHTML}`;
	}

	const mangaIndex = chapterList.findIndex((item) => item.mangaId === manga)

	if (mangaIndex === -1) {
		// console.log("Not found mangaId", manga);
		return `${navigationButtonGroup.innerHTML}`;
	}
	const chapterIndex = chapterList[mangaIndex].chapters.findIndex((item) => item === chapter);
	if (headingOrTrailing === "Bottom") 
	{
		// html += '<div class="flex items-stretch flex-col gap-2">';
	}
	html += `
		<select id="ChonChuongSelect${headingOrTrailing}" onChange="window.location.href=this.value" autofocus>
			<option value="https://${currentHostname}/mangas/${manga}/chapters/${chapter}" id="readselect" selected="selected">
				Chương ${chapterList[mangaIndex].chapterNumbers[chapterIndex]} (Đã đọc) : ${chapterList[mangaIndex].chapterNames[chapterIndex]}
			</option>
		</select>
	`;
	if (headingOrTrailing === "Bottom") 
	{
		// html += '</div>';
		return html + `${navigationButtonGroup.innerHTML}`;
	}
	// console.log(html);
	return html + `${navigationButtonGroup.innerHTML}`;
}

async function updateChapterSelectListOptions(headingOrTrailing) {
	// console.log("Update on click ..."); 
	await chrome.runtime.sendMessage({message: "getInfo"});

	// const activeChapterData = await chrome.storage.local.get('activeChapterData').then((response) => response.activeChapterData);

	const chapterSelectList = document.getElementById(`ChonChuongSelect${headingOrTrailing}`);
	// console.log("Length of select list:", chapterSelectList.length)

	// console.log(window.location);

	const currentHostname = window.location.hostname;
	const currentPathname = window.location.pathname;

	// console.log(currentHostname, currentPathname);
	if (!hostnames.includes(currentHostname)){
		// console.log("Not at Cứu Truyện sites");
		return html;
	}
	// console.log("At Cứu Truyện sites");

	const { manga, chapter } = parsePathname(currentPathname);

	// console.log(manga, chapter);
	if (manga === 0 || chapter === 0) {
		// console.log("MangaId/ChapterId INVALID");
		return html;
	}

	const myChapterList = await chrome.storage.local.get('chapterList').then((response) => response.chapterList);
	// console.log(myChapterList);

	const mangaIndex = myChapterList.findIndex((item) => item.mangaId === manga);

	if (mangaIndex === -1) {
		// console.log("Not found mangaId", manga);
		return html;
	}

	let isChapterListSorted = await chrome.storage.local.get('chapterListSorted').then((response) => response.chapterListSorted);
	if (myChapterList[mangaIndex].chapters.length === chapterSelectList.length
		&& isChapterListSorted === true) {
		// console.log("No need to update");
		isChapterListSorted = false;
		return;
	}
	chapterSelectList.innerHTML = ""; // Clear existing options

	myChapterList[mangaIndex].chapters.map(function(aChapter, index) {
		const id = myChapterList[mangaIndex].readChapters.includes(aChapter) ? "readselect" : "noreadselect";

		const newOption = document.createElement('option');
		newOption.value = `https://${currentHostname}/mangas/${manga}/chapters/${aChapter}`;
		// console.log(`Chương ${myChapterList[mangaIndex].chapterNumbers[index]} ${id === "readselect" ? "(Đã đọc)" : ""} : ${myChapterList[mangaIndex].chapterNames[index]}`);
		newOption.text = `Chương ${myChapterList[mangaIndex].chapterNumbers[index]} ${id === "readselect" ? "(Đã đọc)" : ""} : ${myChapterList[mangaIndex].chapterNames[index]}`;
		newOption.id = id;

		if (aChapter === chapter) {
			newOption.selected = "selected"
		}
		chapterSelectList.appendChild(newOption);
	});

	await chrome.storage.local.set({ chapterListSorted: isChapterListSorted });
}

chrome.storage.onChanged.addListener(async function (changes, namespace) {
	// console.log("A change in local storage");
	if (namespace === "local") {
		// console.log("Update savedOptions");
		extensionSavedOptions = await chrome.storage.local.get('savedOptions').then((response) => response.savedOptions);
	}
});

function checkZenUIState() {
	const UIButton = document.querySelector('[class="block border-4 rounded-lg p-2 flex-1 bg-gray-900 bg-opacity-50 hover:cursor-pointer transition border-transparent"]');

	if (UIButton) {
		// console.log("Found UI button");
		if (UIButton.innerText.toLowerCase().includes("zen")) {
			isZenUI = false;
		}
		else {
			isZenUI = true;
		}
	}

	// console.log("Is Zen UI now:", isZenUI);
}

document.addEventListener('keydown', PageUpPageDownOverride, true);

async function PageUpPageDownOverride(event) {
	// console.log("A key is pressed");

	// console.log(extensionSavedOptions);
	// checkZenUIState();

	// Kiểm tra tùy chọn được lưu
	if (extensionSavedOptions.PgUpPgDn.CuonTrang === false) {
		return;
	}

	if (event.key === "PageUp") {
		// PageUp
		// console.log("Override PageUp key");
		event.stopImmediatePropagation(); // Prevent Cứu Truyện's overridden PageUp behavior
		event.preventDefault(); // Prevent default PageUp behavior
		
		window.scrollBy(0, -window.innerHeight * 2/3.0); // Scroll up by one page
	}
	if (event.key === "PageDown") {
		// PageDown
		// console.log("Override PageDown key");
		event.stopImmediatePropagation(); // Prevent Cứu Truyện's overridden PageDown behavior
		event.preventDefault(); // Prevent default PageDown behavior
		
		window.scrollBy(0, window.innerHeight * 2/3.0); // Scroll down by one page
	}

	// Replacement for the PageUp and PageDown keys (needing some other keys to handle go to previous/next chapters)

	const currentHostname = window.location.hostname;
	const currentPathname = window.location.pathname;

	// console.log(currentHostname, currentPathname);
	if (!hostnames.includes(currentHostname)){
		// console.log("Not at Cứu Truyện sites");
		return;
	}
	// console.log("At Cứu Truyện sites");

	const { manga, chapter } = parsePathname(currentPathname);

	const myChapterList = await chrome.storage.local.get('chapterList').then((response) => response.chapterList);

	// console.log({myChapterList});

	const mangaIndex = myChapterList.findIndex((item) => item.mangaId === manga);

	if (mangaIndex === -1) {
		// console.log("Manga not found");
		return;
	}

	const chapterIndex = myChapterList[mangaIndex].chapters.findIndex((item) => item === chapter);

	if (chapterIndex === -1) {
		// console.log("Chapter not found");
		return;
	}

	// Assume sortOrder === "descending" (refer to sortOrder in background script).
	// Swap the + and - if change sortOrder to "ascending".
	let nextChapterId = myChapterList[mangaIndex].chapters[chapterIndex - 1];
	let previousChapterId = myChapterList[mangaIndex].chapters[chapterIndex + 1];

	const nextChapterHref = `https://${currentHostname}/mangas/${manga}/chapters/${nextChapterId}`;
	const previousChapterHref = `https://${currentHostname}/mangas/${manga}/chapters/${previousChapterId}`;

	// To next chapter (equivalent to Cứu Truyện's customized behavior for PageUp)
	if (event.key === "Insert") {
		// Insert
		// console.log("Override Insert key");
		event.stopImmediatePropagation(); // Prevent any overridden Insert behavior
		event.preventDefault(); // Prevent default Insert behavior
		
		gotoChapter(nextChapterHref);
	}
	// To previous chapter (equivalent to Cứu Truyện's customized behavior for PageDown)
	if (event.key === "Delete") {
		// Delete
		// console.log("Override Delete key");
		event.stopImmediatePropagation(); // Prevent any overridden Delete behavior
		event.preventDefault(); // Prevent default Delete behavior
		
		gotoChapter(previousChapterHref);
	}
}

async function gotoChapter(chapterUrl) {
	window.location.href = chapterUrl;
}