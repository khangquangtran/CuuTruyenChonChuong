// // Default options, at install
// const savedOptions = {
//     PgUpPgDn: {
//         ChuyenChuong: true,
//         CuonTrang: false
//     },
//     XoaTruyen: false,
//     XoaDaDocTruyen: false
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
    const extensionSavedOptions = await chrome.storage.local.get('savedOptions').then((response) => response.savedOptions);

    // TODO - DONE: Query the 2 options of PgUpPgDn and set the checked attribute accordingly
    const chuyenChuongElement = document.getElementById("ChuyenChuongRadio");
    const cuonTrangElement = document.getElementById("CuonTrangRadio");

    chuyenChuongElement.checked = extensionSavedOptions.PgUpPgDn.ChuyenChuong ? true : false;
    cuonTrangElement.checked = extensionSavedOptions.PgUpPgDn.CuonTrang ? true : false;

    // TODO - DONE: Query the 2 options of XoaTruyen and XoaDaDocTruyen and set the checked attribute accordingly
    const xoaTruyenElement = document.getElementById("XoaTruyenCheckbox");
    xoaTruyenElement.checked = extensionSavedOptions.XoaTruyen ? true : false;
    
    const xoaDaDocChuongElement = document.getElementById("XoaDaDocChuongCheckbox");
    xoaDaDocChuongElement.checked = extensionSavedOptions.XoaDaDocChuong ? true : false;
});

document.getElementById("SaveOptionsPgUpPgDnBtn").addEventListener("click", async function () {
    isAllSaved.PgUpPgDn = false;
    await saveOptions('PgUpPgDn', 'SaveOptionsPgUpPgDnBtn', isAllSaved, 'SaveAllOptionsBtn');
});

document.getElementById("SaveOptionsXoaTruyenBtn").addEventListener("click", async function () {
    isAllSaved.XoaTruyen = false;
    await saveOptions('XoaTruyen', 'SaveOptionsXoaTruyenBtn', isAllSaved, 'SaveAllOptionsBtn');
});

document.getElementById("SaveOptionsXoaDaDocChuongBtn").addEventListener("click", async function () {
    isAllSaved.XoaDaDocChuong = false;
    await saveOptions('XoaDaDocChuong', 'SaveOptionsXoaDaDocChuongBtn', isAllSaved, 'SaveAllOptionsBtn');
});

document.getElementById("SaveAllOptionsBtn").addEventListener("click", async function () {
    await saveAllOptions(isAllSaved, 'SaveAllOptionsBtn');
});

// Add event listeners to PgUpPgDn radio options
// TODO - DONE: Enable save button when new option chosen, compared to saved options
// TODO: Disable save button when no change in option, compared to saved options
var PgUpPgDnOptions = document.getElementsByName('PgUpPgDn');
PgUpPgDnOptions.forEach(function (aPgUpPgDnOption) {
    aPgUpPgDnOption.addEventListener('change', function () {
        isAllSaved.PgUpPgDn = false;
        document.getElementById('SaveOptionsPgUpPgDnBtn').disabled = false;
        document.getElementById('SaveAllOptionsBtn').disabled = false;
    });
});

// Add event listeners to XoaTruyen checkbox
// TODO - DONE: Enable save button when new option chosen, compared to saved options
// TODO: Disable save button when no change in option, compared to saved options
var XoaTruyenOption = document.getElementsByName('XoaTruyen');
XoaTruyenOption[0].addEventListener('change', function () {
    isAllSaved.XoaTruyen = false;
    document.getElementById('SaveOptionsXoaTruyenBtn').disabled = false;
    document.getElementById('SaveAllOptionsBtn').disabled = false;
});

// Add event listeners to XoaDaDocChuong checkbox
// TODO - DONE: Enable save button when new option chosen, compared to saved options
// TODO: Disable save button when no change in option, compared to saved options
var XoaDaDocChuongOption = document.getElementsByName('XoaDaDocChuong');
XoaDaDocChuongOption[0].addEventListener('change', function () {
    isAllSaved.XoaDaDocChuong = false;
    document.getElementById('SaveOptionsXoaDaDocChuongBtn').disabled = false;
    document.getElementById('SaveAllOptionsBtn').disabled = false;
});

async function saveOptions(optionGroupName, saveBtnId, allSaved, saveAllBtnId) {
    // console.log("About to save new option", optionGroupName);
    // console.log({optionGroupName}, {saveBtnId});

    let currentSavedOptions = await chrome.storage.local.get('savedOptions').then((response) => response.savedOptions);
    
    // {
    //     PgUpPgDn: {
    //         ChuyenChuong: true,
    //         CuonTrang: false
    //     },
    //     XoaTruyen: false,
    //     XoaDaDocTruyen: false
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

        currentSavedOptions.XoaDaDocChuong = selectedOption;

        allSaved.XoaDaDocChuong = true;
    }

    // Disable the Save button after saving
    document.getElementById(saveBtnId).disabled = true;

    // Enable or disable the "Save All" button based on changes in any group
    // console.log("About to disable Save All button, if possible");
    // console.log({ allSaved });
    document.getElementById(saveAllBtnId).disabled = checkAllSaved(allSaved);

    await chrome.storage.local.set({ savedOptions: currentSavedOptions });

    // console.log(optionGroupName + ' Saved!');
}

async function saveAllOptions(allSaved, saveAllBtnId) {
    // console.log("About to save all options");

    const optionSavePairs = [
        ["PgUpPgDn", "SaveOptionsPgUpPgDnBtn"],
        ["XoaTruyen", "SaveOptionsXoaTruyenBtn"],
        ["XoaDaDocChuong", "SaveOptionsXoaDaDocChuongBtn"]
    ]

    optionSavePairs.forEach(async function (aPair) {
        await saveOptions(aPair[0], aPair[1], isAllSaved, saveAllBtnId)
    });
    
    // Disable the Save All button after saving
    document.getElementById("SaveAllOptionsBtn").disabled = true;

    // console.log('All Options Saved!');
}

function checkAllSaved(allSaved) {
    // console.log("Check if all saved");
    // console.log(Object.values(allSaved).every((saved) => saved === true))
    return Object.values(allSaved).every((saved) => saved === true);
}
