chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason === "install") {
        console.log("Đã cài Cứu Truyện - Chọn Chương");
    } else if (details.reason === "update") {
        console.log("Đã cập nhật Cứu Truyện - Chọn Chương");  
    }

    buildInitialChapterList(details.reason);
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    // console.log("Enter onMessage, listener, callback");
    if (request.mangaId && request.chapterId) {
        // console.log("Manga id: " + request.mangaId);
        // console.log("Chapter id: " + request.chapterId);

        const chapterData = {
            mangaId: request.mangaId,
            chapterId: request.chapterId
        }
        buildChapterList(chapterData);
    }
});

// TODO: Build list of mangas and corresponding chapters

async function buildInitialChapterList(reason) {
    // console.log("Enter buildInitialChapterList");

    if (reason === "update") {
    // TODO: Use existing chapter list, if existing; otherwise, create empty chapter list
        const existingChapterList = await chrome.storage.local.get('chapterList');
        if (existingChapterList) {
            // console.log("Found existing chapter list at updating");
            return; // There exists a chapterList => no need to create a new one.
        }
        
        const myChapterList = [];
        await chrome.storage.local.set({ chapterList: myChapterList });
    }

    if (reason == "install") {
    // TODO: Create empty chapter list
        // console.log("Create empty chapter list at installation");
        const myChapterList = [];
        await chrome.storage.local.set({ chapterList: myChapterList });
    }
}

async function buildChapterList(chapterData) {
    // console.log("Enter buildChapterList");
    // console.log("Manga id: " + chapterData.mangaId);
    // console.log("Chapter id: " + chapterData.chapterId);
    // const myChapterList = await chrome.storage.local.get(['chapterList']);
    // console.log(myChapterList);

    fetchChapters(chapterData);
}

async function fetchChapters(chapterData) {
    try {
        // Function 1
        await fetchCurrentChapter(chapterData);
    
        // Function 2
        // TODO: What conditions to stop fetchNextChapter early?
        await fetchNextChapter(chapterData);
    
        // Function 3
        // TODO: What conditions to stop fetchPreviousChapter early?
        await fetchPreviousChapter(chapterData);
    
        // console.log("All fetchXChapter functions completed in order");
        const myChapterList = await chrome.storage.local.get('chapterList').then((response) => response.chapterList);
        // console.log(myChapterList);

        chrome.runtime.onConnect.addListener(function (port) {
            if (port.name === 'getInfo') {
                port.postMessage({ 
                    message: "sendInfo", 
                    payload: { chapterData } 
                });
            }
        });
    } catch (error) {
        console.error("An error occurred:", error);
    }
}

async function fetchCurrentChapter(chapterData) {
    // console.log("Enter fetchCurrentChapter");

    const cuutruyenApiChapterUrl = await chrome.storage.local.get('cuutruyenHostname').then((response) => "https://" + response.cuutruyenHostname + "/api/v2/chapters/");
    // console.log(cuutruyenApiChapterUrl);
    // console.log("cuutruyenApiChapterUrl: " + cuutruyenApiChapterUrl);

    // console.log("Complete API URL: " + cuutruyenApiChapterUrl + chapterData.chapterId.toString());
    const apiResponse = await fetch(cuutruyenApiChapterUrl + chapterData.chapterId.toString()).then((response) => response.json());
    const data = apiResponse.data;

    // console.log(apiResponse);
    // console.log(data);

    const chapterName = data.name;
    const chapterNumber = data.number;

    const myChapterList = await chrome.storage.local.get('chapterList').then((response) => response.chapterList);
    // console.log(myChapterList);

    if (!myChapterList.length) {
        // Empty chapterList
        // console.log("Empty chapter list");
        myChapterList.push({ 
            mangaId: chapterData.mangaId,
            chapters: [ chapterData.chapterId ],
            readChapters: [ chapterData.chapterId ],
            chapterNames: [ chapterName !== null ? chapterName : "" ],
            chapterNumbers: [ chapterNumber ]
        })
        await chrome.storage.local.set({ chapterList: myChapterList });
        return;
    }

    const mangaIndex = myChapterList.findIndex((item) => item.mangaId === chapterData.mangaId)

    // console.log("MangaIndex: " + mangaIndex);
    if (mangaIndex === -1) {
        // console.log("Non-empty chapter list. Failed to find manga id in storage");
        myChapterList.push({ 
            mangaId: chapterData.mangaId,
            chapters: [ chapterData.chapterId ],
            readChapters: [ chapterData.chapterId ],
            chapterNames: [ chapterName !== null ? chapterName : "" ],
            chapterNumbers: [ chapterNumber ]
        })
        await chrome.storage.local.set({ chapterList: myChapterList });
        return;
    }

    const chapterIndex = myChapterList[mangaIndex].chapters.findIndex((item) => item === chapterData.chapterId);

    // console.log("ChapterIndex: " + chapterIndex);
    if (chapterIndex === -1) {
        // console.log("Non-empty chapter list. Found manga id in storage. Failed to find chapter id in storage.");
        myChapterList[mangaIndex].chapters.push(chapterData.chapterId);
        myChapterList[mangaIndex].readChapters.push(chapterData.chapterId);
        myChapterList[mangaIndex].chapterNames.push(chapterName !== null ? chapterName : "");
        myChapterList[mangaIndex].chapterNumbers.push(chapterNumbers);
        await chrome.storage.local.set({ chapterList: myChapterList });
        return;
    }

    const readChapterIndex = myChapterList[mangaIndex].readChapters.findIndex((item) => item === chapterData.chapterId);

    // console.log("ReadChapterIndex: " + readChapterIndex);
    if (readChapterIndex === -1) {
        // console.log("Non-empty chapter list. Found manga id in storage. Found chapter id in storage. Failed to find read chapter id in storage");
        myChapterList[mangaIndex].readChapters.push(chapterData.chapterId);
        await chrome.storage.local.set({ chapterList: myChapterList });
        return;
    }
}

async function fetchNextChapter(chapterData) {
    // console.log("Enter fetchNextChapter");

    const cuutruyenApiChapterUrl = await chrome.storage.local.get('cuutruyenHostname').then((response) => "https://" + response.cuutruyenHostname + "/api/v2/chapters/");
    // console.log(cuutruyenApiChapterUrl);
    // console.log("cuutruyenApiChapterUrl: " + cuutruyenApiChapterUrl);

    // console.log("Complete API URL: " + cuutruyenApiChapterUrl + chapterData.chapterId.toString());
    const apiResponse = await fetch(cuutruyenApiChapterUrl + chapterData.chapterId.toString()).then((response) => response.json());
    const data = apiResponse.data;

    // console.log(apiResponse);
    // console.log(data);

    // const mangaId = data.manga.id;
    const nextChapterId = data.next_chapter_id;
    const nextChapterName = data.next_chapter_name;
    const nextChapterNumber = data.next_chapter_number;

    if (nextChapterId === null)
    {
        // console.log("Last chapter");
        return; // Last chapter
    }

    const myChapterList = await chrome.storage.local.get('chapterList').then((response) => response.chapterList);
    // console.log(myChapterList);

    const mangaIndex = myChapterList.findIndex((item) => item.mangaId === chapterData.mangaId)

    // console.log("Next Chapter. MangaIndex: " + mangaIndex);
    if (mangaIndex === -1) {
        // console.log("Non-empty chapter list. Failed to find manga id in storage");
        myChapterList.push({ 
            mangaId: chapterData.mangaId,
            chapters: [ nextChapterId ],
            chapterNames: [ nextChapterName !== null ? nextChapterName : "" ],
            chapterNumbers: [ nextChapterNumber ]
        })
        await chrome.storage.local.set({ chapterList: myChapterList });
        return;
    }

    const chapterIndex = myChapterList[mangaIndex].chapters.findIndex((item) => item === nextChapterId);
    // console.log("Next Chapter. ChapterIndex: " + chapterIndex);
    if (chapterIndex === -1) {
        // console.log("Non-empty chapter list. Found manga id in storage. Failed to find chapter id in storage.");
        myChapterList[mangaIndex].chapters.unshift(nextChapterId);
        myChapterList[mangaIndex].chapterNames.unshift(nextChapterName !== null ? nextChapterName : "");
        myChapterList[mangaIndex].chapterNumbers.unshift(nextChapterNumber);
        await chrome.storage.local.set({ chapterList: myChapterList });
    }

    const nextChapterData = {
        mangaId: chapterData.mangaId,
        chapterId: nextChapterId
    }

    await fetchNextChapter(nextChapterData);
}

async function fetchPreviousChapter(chapterData) {
    // console.log("Enter fetchPreviousChapter");

    const cuutruyenApiChapterUrl = await chrome.storage.local.get('cuutruyenHostname').then((response) => "https://" + response.cuutruyenHostname + "/api/v2/chapters/");
    // console.log(cuutruyenApiChapterUrl);
    // console.log("cuutruyenApiChapterUrl: " + cuutruyenApiChapterUrl);

    // console.log("Complete API URL: " + cuutruyenApiChapterUrl + chapterData.chapterId.toString());
    const apiResponse = await fetch(cuutruyenApiChapterUrl + chapterData.chapterId.toString()).then((response) => response.json());
    const data = apiResponse.data;

    // console.log(apiResponse);
    // console.log(data);

    // const mangaId = data.manga.id;
    const previousChapterId = data.previous_chapter_id;
    const previousChapterName = data.previous_chapter_name;
    const previousChapterNumber = data.previous_chapter_number;

    if (previousChapterId === null)
    {
        // console.log("First chapter");
        return; // First chapter
    }

    const myChapterList = await chrome.storage.local.get('chapterList').then((response) => response.chapterList);
    // console.log(myChapterList);

    const mangaIndex = myChapterList.findIndex((item) => item.mangaId === chapterData.mangaId)

    // console.log("Previous Chapter. MangaIndex: " + mangaIndex);
    if (mangaIndex === -1) {
        // console.log("Non-empty chapter list. Failed to find manga id in storage");
        myChapterList.push({ 
            mangaId: chapterData.mangaId,
            chapters: [ previousChapterId ],
            chapterNames: [ previousChapterName !== null ? previousChapterName : "" ],
            chapterNumbers: [ previousChapterNumber ]
        })
        await chrome.storage.local.set({ chapterList: myChapterList });
    }

    const chapterIndex = myChapterList[mangaIndex].chapters.findIndex((item) => item === previousChapterId);
    // console.log("Previous Chapter. ChapterIndex: " + chapterIndex);
    if (chapterIndex === -1) {
        // console.log("Non-empty chapter list. Found manga id in storage. Failed to find chapter id in storage.");
        myChapterList[mangaIndex].chapters.push(previousChapterId);
        myChapterList[mangaIndex].chapterNames.push(previousChapterName !== null ? previousChapterName : "");
        myChapterList[mangaIndex].chapterNumbers.push(previousChapterNumber);
        await chrome.storage.local.set({ chapterList: myChapterList });
    }

    const previousChapterData = {
        mangaId: chapterData.mangaId,
        chapterId: previousChapterId
    }

    await fetchPreviousChapter(previousChapterData);
}
