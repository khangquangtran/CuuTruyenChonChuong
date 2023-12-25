// TODO: Find a way to delay popup.html until background.js is done with building the chapter list



chrome.runtime.connect({name:"getInfo"}).onMessage.addListener(async function ({message, payload}, sender, sendResponse) {
    console.log("Enter onMessage, listener, callback");
    if (payload) {
        // alert("Chapter list built. Ready to render");

        // alert(payload.chapterData.mangaId);

        document.getElementById("ChonChuongTable").innerHTML = await render(payload.chapterData);

        document.querySelectorAll("#goto").forEach((button) => {
            button.addEventListener("click", (() => {
                console.log("Button Clicked");
                const data_id = button.getAttribute("data-id");
                console.log(data_id);
                const splitDataId = data_id.split(".");
                console.log("At: " + splitDataId[0] + "/" + splitDataId[1]);
                gotoChapter({ mangaId: splitDataId[0], chapterId: splitDataId[1] });
            }))
        });
    }
});

async function render(chapterData) {
    let html = "";

    const currentMangaChapterList = await fetchApiChapters(chapterData);
    
    if (!currentMangaChapterList) {
        return "";
    }
    
    html = constructTable(currentMangaChapterList);

    return html;  
}

async function fetchApiChapters(chapterData) {
    const myChapterList = await chrome.storage.local.get('chapterList').then((response) => response.chapterList);

    const resultItem = myChapterList.find((item) => item.mangaId == chapterData.mangaId);

    if (!resultItem)
    {
        // console.log("Not found");
        return null;
    }
    // console.log("Found Item") ;

    // const resultChapters = resultItem.chapters;
    // console.log(resultChapters);

    // console.log(resultItem);
    return resultItem;
}

async function constructTable(mangaChapterList) {
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

    console.log(mangaChapterList);
    const tbodyHtml = `
        <tbody>
            ${mangaChapterList.chapters.map(function(chapter, index) {
                const id = mangaChapterList.readChapters.some((readChapter) => readChapter == chapter) ? "read" : "noread";

                return (
                `
                <tr id="${id}">
                    <td>${mangaChapterList.chapterNumbers[index]}</td>
                    <td>${mangaChapterList.chapterNames[index]}</td>
                    <td><button id="goto" data-id="${mangaChapterList.mangaId}.${chapter}">Đọc</button></td>
                </tr>
                `)
            }).join("")};
        </tbody>
    `;
    // console.log("Done tbody");

    return theadHtml + tbodyHtml;
}

async function gotoChapter(chapterData) {
    console.log(chapterData.mangaId);
    console.log(chapterData.chapterId);
    const chapterUrl = await chrome.storage.local.get('cuutruyenHostname').then((response) => `https://${response.cuutruyenHostname}/mangas/${chapterData.mangaId}/chapters/${chapterData.chapterId}`);

    window.close();
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTabId = tabs[0].id;
        // Redirect the active tab
        chrome.tabs.update(activeTabId, { url: chapterUrl });
    });
}
