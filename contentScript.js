function isNexusModsUrl(url) {
    const regex = /^https:\/\/www\.nexusmods\.com\/[^\/]+\/mods\/[^\/]+\?.*tab=files.*$/;
    return regex.test(url);
}
function isNexusModsCollectionUrl(url) {
    const regex = /^https:\/\/next\.nexusmods\.com\/cyberpunk2077\/collections\/.*$/;
    return regex.test(url);
}
const urlParams = new URLSearchParams(location.search);


if (isNexusModsUrl(location.href)) {
    console.log("Mod Download");
    const createNewButton = (uri) => {
        const btnSlowDownloadNow = btnSlowDownload.cloneNode(true);
        btnSlowDownloadNow.onclick = () => {
            location.href = uri;
        };
        btnSlowDownload.replaceWith(btnSlowDownloadNow);
        return btnSlowDownloadNow;
    };

    const ManualDownload = () => {
        // https://www.nexusmods.com/cyberpunk2077/mods/5266?tab=files&file_id=28345#ERROR-download-location-not-found
        if (!urlParams.has("file_id")) {
            return Promise.resolve(false);
        }
        if (!window.current_game_id) {
            return Promise.resolve(false);
        }
        const fileId = urlParams.get("file_id");
        const gameId = window.current_game_id;
        const body = `fid=${fileId}&game_id=${gameId}`;

        return fetch("https://www.nexusmods.com/Core/Libs/Common/Managers/Downloads?GenerateDownloadUrl", {
            headers: {
                accept: "*/*",
                "accept-language": "en-US,en;q=0.9,vi;q=0.8",
                "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                "sec-ch-ua": '"Not.A/Brand";v="8", "Chromium";v="114", "Microsoft Edge";v="114"',
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": '"Windows"',
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "x-kl-ajax-request": "Ajax_Request",
                "x-requested-with": "XMLHttpRequest",
            },
            referrer: location.href,
            referrerPolicy: "strict-origin-when-cross-origin",
            body: body,
            method: "POST",
            mode: "cors",
            credentials: "include",
        })
            .then((response) => response.json())
            .then((data) => data.url);
    };

    const btnSlowDownload = document.querySelector("#slowDownloadButton");
    if (btnSlowDownload) {
        const uri = btnSlowDownload.getAttribute("data-download-url");
        if (uri.includes("#ERROR")) {
            ManualDownload().then((url) => {
                if (url) {
                    createNewButton(url).textContent = "SLOW DOWNLOAD MANUAL";
                }
            });
        } else {
            createNewButton(uri).click();
        }
    }
}
