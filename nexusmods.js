var MOD_DATA = [];
var isDownloading = false;
function IsNexusModsCollectionUrl(url) {
    const regex = /^https:\/\/next\.nexusmods\.com\/cyberpunk2077\/collections\/.*$/;
    return regex.test(url);
}
const ModDownloadCollection = async (gameDomain, collectionSlug) => {
    console.log("Collection Download");
    // https://next.nexusmods.com/cyberpunk2077/collections/kqkhex?tab=mods
    // let gameDomain = data.response.gameDomain;
    // let collectionSlug = data.response.collectionSlug;

    await fetch("https://next.nexusmods.com/api/graphql", {
        headers: {
            accept: "*/*",
            "accept-language": "en-US,en;q=0.9,vi;q=0.8",
            "api-version": "2023-09-05",
            "content-type": "application/json",
            "sec-ch-ua": '"Chromium";v="122", "Not(A:Brand";v="24", "Microsoft Edge";v="122"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"Windows"',
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
        },
        referrer: "https://next.nexusmods.com/" + gameDomain + "/collections/" + collectionSlug + "?tab=mods",
        referrerPolicy: "strict-origin-when-cross-origin",
        body:
            '{"query":"query CollectionRevisionMods ($revision: Int, $slug: String!, $viewAdultContent: Boolean) { collectionRevision (revision: $revision, slug: $slug, viewAdultContent: $viewAdultContent) { externalResources { id, name, resourceType, resourceUrl }, modFiles { fileId, optional, file { fileId, name, scanned, size, sizeInBytes, version, mod { adultContent, author, category, modId, name, pictureUrl, summary, version, game { domainName }, uploader { avatar, memberId, name } } } } } }","variables":{"slug":"' +
            collectionSlug +
            '","viewAdultContent":true},"operationName":"CollectionRevisionMods"}',
        method: "POST",
        mode: "cors",
        credentials: "include",
    })
        .then((r) => r.json())
        .then(async (data) => {
            let modFiles = data.data.collectionRevision.modFiles;
            if (!modFiles) return;

            MOD_DATA = modFiles.map((m) => {
                return { id: m.fileId + "_" + m.file.mod.modId, name: m.file.name, author: m.file.mod.author, category: m.file.mod.category, summary: m.file.mod.summary, link: `https://www.nexusmods.com/${gameDomain}/mods/${m.file.mod.modId}?tab=files&file_id=${m.fileId}&nmm=1` };
            });
            console.log(data);
            let tableBodyData = document.querySelector("#modTable > tbody");
            for (const mod of MOD_DATA) {
                tableBodyData.appendChild(CreateRow({ ...mod, nxm: "" }));
            }
            let length = MOD_DATA.length;
            let promiselist = [];
            for (let i = 0; i < length; i++) {
                const mod = MOD_DATA[i];
                promiselist.push(
                    fetch(mod.link, {
                        headers: {
                            accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                            "accept-language": "en-US,en;q=0.9,vi;q=0.8",
                            "cache-control": "max-age=0",
                            "sec-ch-ua": '"Chromium";v="122", "Not(A:Brand";v="24", "Microsoft Edge";v="122"',
                            "sec-ch-ua-mobile": "?0",
                            "sec-ch-ua-platform": '"Windows"',
                            "sec-fetch-dest": "empty",
                            "sec-fetch-mode": "cors",
                            "sec-fetch-site": "same-origin",
                        },
                        referrerPolicy: "strict-origin-when-cross-origin",
                        body: null,
                        method: "GET",
                        mode: "cors",
                        credentials: "include",
                    })
                        .then((response) => response.text())
                        .then((text) => {
                            const parser = new DOMParser();
                            const htmlDoc = parser.parseFromString(text, "text/html");
                            const buttonsWithDataUrl = htmlDoc.querySelector("button[data-download-url]");
                            const downloadUrl = buttonsWithDataUrl.getAttribute("data-download-url");
                            let downloadEle = tableBodyData.querySelector("[data-id='" + mod.id + "'] [data-id='nxmLink']");
                            mod.nxm = downloadUrl;
                            downloadEle.href = downloadUrl;
                            downloadEle.textContent = downloadUrl;
                        })
                );
                if (i % 5 == 0 || i == length - 1) {
                    await Promise.all(promiselist);
                    promiselist.length = [];
                }
            }
        });
};
const GetCollectionName = (url) => {
    if (!url) return;
    fetch(url, {
        headers: {
            accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            "accept-language": "en-US,en;q=0.9,vi;q=0.8",
            "cache-control": "max-age=0",
            "sec-ch-ua": '"Chromium";v="122", "Not(A:Brand";v="24", "Microsoft Edge";v="122"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"Windows"',
            "sec-fetch-dest": "document",
            "sec-fetch-mode": "navigate",
            "sec-fetch-site": "same-origin",
            "sec-fetch-user": "?1",
            "upgrade-insecure-requests": "1",
        },
        referrerPolicy: "strict-origin-when-cross-origin",
        body: null,
        method: "GET",
        mode: "cors",
        credentials: "include",
    })
        .then((r) => r.text())
        .then((text) => {
            const parser = new DOMParser();
            const htmlDoc = parser.parseFromString(text, "text/html");
            let title = htmlDoc.querySelector("title").textContent;
            let collectionName = title.split(" | ")[0];
            document.querySelector("#collectionName").textContent = collectionName;
        });
};
const GetModLink = async () => {
    btnGetMod.disabled = true;
    btnDownloadMod.style.display = "none";
    let modurl = document.querySelector("#collectionLink")?.value;
    if (!modurl) return;
    if (!IsNexusModsCollectionUrl(modurl)) return;
    // https://next.nexusmods.com/cyberpunk2077/collections/kqkhex?tab=mods
    // gameDomain=cyberpunk2077
    // collectionSlug=kqkhex
    let splitUrl = modurl.split("/");
    let gameDomain = splitUrl[3];
    let collectionSlug = splitUrl[5];
    let index = collectionSlug.indexOf("?");
    if (index !== -1) {
        collectionSlug = collectionSlug.substring(0, index);
    }
    document.querySelectorAll("#modTable > tbody > tr[style='display:block']").forEach((e) => {
        e.remove();
    });
    GetCollectionName(modurl);
    await ModDownloadCollection(gameDomain, collectionSlug);
    btnGetMod.disabled = false;
    btnDownloadMod.style.display = "block";
};
const CreateRow = (infos) => {
    let row = document.querySelector("#modTable > tbody > tr").cloneNode(true);
    row.style.display = "block";
    row.setAttribute("data-id", infos.id);
    let i = 0;
    let tds = row.querySelectorAll("td");
    tds[i].querySelector("strong").textContent = infos.name;
    i++;
    // tds[i].textContent = infos.author;
    // i++;
    // tds[i].textContent = infos.category;
    // i++;
    // tds[i].textContent = infos.summary;
    // i++;
    tds[i].querySelector("a").textContent = infos.nxm;
    tds[i].querySelector("a").href = infos.nxm;
    return row;
};
const Download = async () => {
    if (MOD_DATA.length === 0) return;
    if (isDownloading) return;
    let btn = btnDownloadMod.querySelector("button");
    let i = 1;
    let length = MOD_DATA.length;
    isDownloading = true;
    for (const mod of MOD_DATA) {
        window.open(mod.nxm);
        await new Promise((resolve) => setTimeout(resolve, 500));
        btn.textContent = `Download ${i}/${length}`;
        i++;
    }
    isDownloading = false;
};

const btnDownloadMod = document.querySelector(".buy-now");
const btnGetMod = document.querySelector("#getMod");
btnGetMod.onclick = GetModLink;
btnDownloadMod.onclick = Download;
