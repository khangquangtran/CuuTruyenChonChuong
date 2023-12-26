//// NO LONGER NEEDED. WILL BE REMOVED IN FUTURE VERSION, IF REALLY NO NEED.


// const hostnames = [
//     "cuutruyen.net",
//     "hetcuutruyen.net",
//     "cuutruyent9sv7.xyz"
// ];

// // TODO 1: Extract hostname, mangaId and chapterId to sendMessage to background script
// // TODO 2: Keep track of new page loaded when Chương Trước/Chương Sau is pressed

// // sendChapterInfoToBackground()

// async function sendChapterInfoToBackground() {
//     // console.log("Enter sendChapterInfoToBackground");
//     const currentHostname = document.location.hostname;
//     const currentPathname = document.location.pathname;
//     console.log(currentHostname);
    
//     // console.log("Check hostname, found? " + checkProperHostname(currentHostname));
//     // console.log("Check pathname, valid? " + checkProperPathname(currentPathname));
//     // console.log("Manga: " + parseMangaAndChapter(currentPathname).manga);
//     // console.log("Chapter: " + parseMangaAndChapter(currentPathname).chapter);
    
//     if (!checkProperHostname(currentHostname)) {
//         return; // Not at Cứu Truyện sites
//     }
//     if (!checkProperPathname(currentPathname)) {
//         // Use this data to let popup.js know that no need to popup??
//         await chrome.storage.local.set({ cuutruyenHostname: "" });
//         return; // Not at chapter page
//     }

//     const { manga, chapter } = parseMangaAndChapter(currentPathname);
//     // console.log("Typeof manga id: " + typeof(manga));
//     // console.log("Typeof chapter id: " + typeof(chapter));

//     // Set new Cứu Truyện hostname, for API purpose
//     await chrome.storage.local.set({ cuutruyenHostname: currentHostname });

//     await chrome.runtime.sendMessage({  
//         mangaId: manga, 
//         chapterId: chapter
//     });
// }

// function checkProperHostname(aHostname) {
//     // console.log("Enter checkProperHostname");
//     if (hostnames.includes(aHostname)) {
//         return true;
//     }
//     return false;
// }

// function checkProperPathname(aPathname) {
//     // console.log("Enter checkProperPathname");
//     const splitPathname = aPathname.split('/');
//     if (splitPathname.length !== 5) {
//         return false;
//     }
//     return true;
// }

// function parseMangaAndChapter(aPathname) {
//     // console.log("Enter parseMangaAndChapter");

//     if (checkProperPathname(aPathname)) {
//         const splitPathname = aPathname.split('/');
//         return { 
//             manga: parseInt(splitPathname[2]), 
//             chapter: parseInt(splitPathname[4])
//         };
//     }
//     return { manga: 0, chapter: 0 }
// }
