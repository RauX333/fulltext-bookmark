export async function createOffscreen() {
    //@ts-ignore
    if (await chrome.offscreen.hasDocument?.()) return;
    console.log("create douc")
    //@ts-ignore
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['BLOBS'],
      justification: 'keep service worker running',
    });
  }