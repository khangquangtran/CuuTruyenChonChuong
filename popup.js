// TODO: Find a way to delay popup.html until background.js is done with building the chapter list

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
                        mangaId: data_id
                    });
                }))
            });
        }
        else if (activeChapterData.mangaId) {
            // Liệt kê các chương của truyện, tại trang thông tin truyện và tại trang chương truyện
            // console.log("Chapter list");
            document.getElementById("ChonChuongTable").innerHTML = await renderChapter(activeChapterData);

            const currentChapterRow = document.querySelector(`.c${activeChapterData.chapterId}`);

            // Cuộn danh sách chương để chương hiện tại nằm dưới cùng trong vùng nhìn
            currentChapterRow.scrollIntoView({
                behavior: 'smooth',
                block: 'end' }
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
                        mangaId: splitDataId[0],
                        chapterId: splitDataId[1]
                    });
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

    const resultItem = myChapterList.find((item) => item.mangaId == chapterData.mangaId);

    if (!resultItem)
    {
        // console.log("Not found");
        return null;
    }
    // console.log("Found Item") ;

    return resultItem;
}

async function fetchMangas(mangaData) {
    const myChapterList = await chrome.storage.local.get('chapterList').then((response) => response.chapterList);

    const resultMangaList = myChapterList.map((item) => ({
        mangaId: item.mangaId,
        mangaName: item.mangaName
    }));

    if (!resultMangaList)
    {
        // console.log("Not found");
        return null;
    }
    // console.log("Found Item") ;

    return resultMangaList;
}

async function constructTableChapter(mangaChapterList, chapterData) {
    const theadHtml = `
        <thead>
            <tr>
                <th>Chương</th>
                <th>Tên Chương</th>
                <th>Chuyển Chương</th>
            </tr>
        </thead>
    `;
    // console.log("Done thead");

    // console.log(mangaChapterList);
    const tbodyHtml = `
        <tbody>
            ${mangaChapterList.chapters.map(function(chapter, index) {
                // console.log("This chapter", chapter);
                const id = mangaChapterList.readChapters.some((readChapter) => readChapter === chapter) ? "read" : "noread";

                const currentId = chapter === chapterData.chapterId ? chapter : 0;

                return (
                `
                <tr id="${id}" class="c${currentId}">
                    <td>${mangaChapterList.chapterNumbers[index]}</td>
                    <td>${mangaChapterList.chapterNames[index]}</td>
                    <td><button id="gotoChapter" data-id="${mangaChapterList.mangaId}.${chapter}">Đọc</button></td>
                </tr>
                `)
            }).join("")}
        </tbody>
    `;
    // console.log("Done tbody");

    return theadHtml + tbodyHtml;
}

async function constructTableManga(mangaList) {
    const theadHtml = `
        <thead>
            <tr>            
                <th>STT</th>
                <th>Truyện</th>
                <th>Đọc Truyện</th>
            </tr>
        </thead>
    `;
    // console.log("Done thead");

    // console.log(mangaList);
    const tbodyHtml = `
        <tbody>
            ${mangaList.map(function({mangaId, mangaName}, index) {
                // console.log("This manga", mangaId, mangaName);

                return (
                `
                <tr">
                    <td>${index+1}</td>
                    <td>${mangaName}</td>
                    <td><button id="gotoManga" data-id="${mangaId}">Đọc</button></td>
                </tr>
                `)
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
