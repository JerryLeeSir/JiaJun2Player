var JiaJunApp = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // js/sha256.js
  var sha256_exports = {};
  __export(sha256_exports, {
    sha256: () => sha256
  });
  async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  var init_sha256 = __esm({
    "js/sha256.js"() {
    }
  });

  // js/config.js
  var PASSWORD_CONFIG2 = {
    localStorageKey: "passwordVerified",
    // 存储验证状态的键名
    verificationTTL: 90 * 24 * 60 * 60 * 1e3
    // 验证有效期（90天，约3个月）
  };
  var API_SITES2 = {
    testSource: {
      api: "https://www.example.com/api.php/provide/vod",
      name: "\u7A7A\u5185\u5BB9\u6D4B\u8BD5\u6E90",
      adult: true
    }
    //ARCHIVE https://telegra.ph/APIs-08-12
  };
  function extendAPISites(newSites) {
    Object.assign(API_SITES2, newSites);
  }
  window.API_SITES = API_SITES2;
  window.extendAPISites = extendAPISites;

  // js/proxy-auth.js
  var cachedPasswordHash = null;
  async function getPasswordHash() {
    if (cachedPasswordHash) {
      return cachedPasswordHash;
    }
    const storedHash = localStorage.getItem("proxyAuthHash");
    if (storedHash) {
      cachedPasswordHash = storedHash;
      return storedHash;
    }
    const passwordVerified = localStorage.getItem("passwordVerified");
    const storedPasswordHash = localStorage.getItem("passwordHash");
    if (passwordVerified === "true" && storedPasswordHash) {
      localStorage.setItem("proxyAuthHash", storedPasswordHash);
      cachedPasswordHash = storedPasswordHash;
      return storedPasswordHash;
    }
    const userPassword = localStorage.getItem("userPassword");
    if (userPassword) {
      try {
        const { sha256: sha2563 } = await Promise.resolve().then(() => (init_sha256(), sha256_exports));
        const hash = await sha2563(userPassword);
        localStorage.setItem("proxyAuthHash", hash);
        cachedPasswordHash = hash;
        return hash;
      } catch (error) {
        console.error("\u751F\u6210\u5BC6\u7801\u54C8\u5E0C\u5931\u8D25:", error);
      }
    }
    if (window.__ENV__ && window.__ENV__.PASSWORD) {
      cachedPasswordHash = window.__ENV__.PASSWORD;
      return window.__ENV__.PASSWORD;
    }
    return null;
  }
  async function addAuthToProxyUrl(url) {
    try {
      const hash = await getPasswordHash();
      if (!hash) {
        console.warn("\u65E0\u6CD5\u83B7\u53D6\u5BC6\u7801\u54C8\u5E0C\uFF0C\u4EE3\u7406\u8BF7\u6C42\u53EF\u80FD\u5931\u8D25");
        return url;
      }
      const timestamp = Date.now();
      const separator = url.includes("?") ? "&" : "?";
      return `${url}${separator}auth=${encodeURIComponent(hash)}&t=${timestamp}`;
    } catch (error) {
      console.error("\u6DFB\u52A0\u4EE3\u7406\u9274\u6743\u5931\u8D25:", error);
      return url;
    }
  }
  function validateProxyAuth(authHash, serverPasswordHash, timestamp) {
    if (!authHash || !serverPasswordHash) {
      return false;
    }
    if (authHash !== serverPasswordHash) {
      return false;
    }
    const now = Date.now();
    const maxAge = 10 * 60 * 1e3;
    if (timestamp && now - parseInt(timestamp) > maxAge) {
      console.warn("\u4EE3\u7406\u8BF7\u6C42\u65F6\u95F4\u6233\u8FC7\u671F");
      return false;
    }
    return true;
  }
  function clearAuthCache() {
    cachedPasswordHash = null;
    localStorage.removeItem("proxyAuthHash");
  }
  window.addEventListener("storage", (e) => {
    if (e.key === "userPassword" || window.PASSWORD_CONFIG && e.key === window.PASSWORD_CONFIG.localStorageKey) {
      clearAuthCache();
    }
  });
  window.ProxyAuth = {
    addAuthToProxyUrl,
    validateProxyAuth,
    clearAuthCache,
    getPasswordHash
  };

  // js/password.js
  function isPasswordProtected() {
    const pwd = window.__ENV__ && window.__ENV__.PASSWORD;
    return typeof pwd === "string" && pwd.length === 64 && !/^0+$/.test(pwd);
  }
  function isPasswordRequired() {
    return !isPasswordProtected();
  }
  function ensurePasswordProtection() {
    if (isPasswordRequired()) {
      showPasswordModal();
      throw new Error("Password protection is required");
    }
    if (isPasswordProtected() && !isPasswordVerified2()) {
      showPasswordModal();
      throw new Error("Password verification required");
    }
    return true;
  }
  window.isPasswordProtected = isPasswordProtected;
  window.isPasswordRequired = isPasswordRequired;
  var PASSWORD_DEBUG = false;
  function pwdLog(...args) {
    if (PASSWORD_DEBUG && typeof console !== "undefined" && console.log) {
      console.log("[password]", ...args);
    }
  }
  async function verifyPassword(password) {
    var _a;
    try {
      const correctHash = (_a = window.__ENV__) == null ? void 0 : _a.PASSWORD;
      pwdLog("env password hash present:", !!correctHash, "len:", correctHash ? correctHash.length : 0);
      if (!correctHash) return false;
      const inputHash = await sha2562(password);
      pwdLog("input hash:", inputHash);
      const isValid = inputHash === correctHash;
      if (isValid) {
        localStorage.setItem(PASSWORD_CONFIG.localStorageKey, JSON.stringify({
          verified: true,
          timestamp: Date.now(),
          passwordHash: correctHash
        }));
      }
      return isValid;
    } catch (error) {
      console.error("\u9A8C\u8BC1\u5BC6\u7801\u65F6\u51FA\u9519:", error);
      return false;
    }
  }
  function isPasswordVerified2() {
    var _a;
    try {
      if (!isPasswordProtected()) return true;
      const stored = localStorage.getItem(PASSWORD_CONFIG.localStorageKey);
      if (!stored) return false;
      const { timestamp, passwordHash } = JSON.parse(stored);
      const currentHash = (_a = window.__ENV__) == null ? void 0 : _a.PASSWORD;
      return timestamp && passwordHash === currentHash && Date.now() - timestamp < PASSWORD_CONFIG.verificationTTL;
    } catch (error) {
      console.error("\u68C0\u67E5\u5BC6\u7801\u9A8C\u8BC1\u72B6\u6001\u65F6\u51FA\u9519:", error);
      return false;
    }
  }
  window.isPasswordProtected = isPasswordProtected;
  window.isPasswordRequired = isPasswordRequired;
  window.isPasswordVerified = isPasswordVerified2;
  window.verifyPassword = verifyPassword;
  window.ensurePasswordProtection = ensurePasswordProtection;
  window.showPasswordModal = showPasswordModal;
  window.hidePasswordModal = hidePasswordModal;
  async function sha2562(message) {
    if (typeof window._jsSha256 === "function") {
      pwdLog("sha256 via window._jsSha256");
      return window._jsSha256(message);
    }
    if (window.crypto && crypto.subtle && crypto.subtle.digest) {
      let msgBuffer;
      if (typeof TextEncoder !== "undefined") {
        msgBuffer = new TextEncoder().encode(message);
      } else {
        const utf8 = unescape(encodeURIComponent(message));
        const arr = new Uint8Array(utf8.length);
        for (let i = 0; i < utf8.length; i++) arr[i] = utf8.charCodeAt(i);
        msgBuffer = arr;
      }
      const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      pwdLog("sha256 via crypto.subtle");
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    }
    throw new Error("No SHA-256 implementation available.");
  }
  function showPasswordModal() {
    const passwordModal = document.getElementById("passwordModal");
    if (passwordModal) {
      const doubanArea = document.getElementById("doubanArea");
      if (doubanArea) doubanArea.classList.add("hidden");
      const cancelBtn = document.getElementById("passwordCancelBtn");
      if (cancelBtn) cancelBtn.classList.add("hidden");
      if (isPasswordRequired()) {
        const title = passwordModal.querySelector("h2");
        const description = passwordModal.querySelector("p");
        if (title) title.textContent = "\u9700\u8981\u8BBE\u7F6E\u5BC6\u7801";
        if (description) description.textContent = "\u8BF7\u5148\u5728\u90E8\u7F72\u5E73\u53F0\u8BBE\u7F6E PASSWORD \u73AF\u5883\u53D8\u91CF\u6765\u4FDD\u62A4\u60A8\u7684\u5B9E\u4F8B";
        const form = passwordModal.querySelector("form");
        const errorMsg = document.getElementById("passwordError");
        if (form) form.style.display = "none";
        if (errorMsg) {
          errorMsg.textContent = "\u4E3A\u786E\u4FDD\u5B89\u5168\uFF0C\u5FC5\u987B\u8BBE\u7F6E PASSWORD \u73AF\u5883\u53D8\u91CF\u624D\u80FD\u4F7F\u7528\u672C\u670D\u52A1\uFF0C\u8BF7\u8054\u7CFB\u7BA1\u7406\u5458\u8FDB\u884C\u914D\u7F6E";
          errorMsg.classList.remove("hidden");
          errorMsg.className = "text-red-500 mt-2 font-medium";
        }
      } else {
        const title = passwordModal.querySelector("h2");
        const description = passwordModal.querySelector("p");
        if (title) title.textContent = "\u8BBF\u95EE\u9A8C\u8BC1";
        if (description) description.textContent = "\u8BF7\u8F93\u5165\u5BC6\u7801\u7EE7\u7EED\u8BBF\u95EE";
        const form = passwordModal.querySelector("form");
        if (form) form.style.display = "block";
      }
      passwordModal.style.display = "flex";
      passwordModal.style.visibility = "visible";
      passwordModal.classList.remove("hidden");
      passwordModal.setAttribute("aria-hidden", "false");
      if (!isPasswordRequired()) {
        setTimeout(() => {
          const passwordInput = document.getElementById("passwordInput");
          if (passwordInput) {
            passwordInput.focus();
          }
        }, 100);
      }
    }
  }
  function hidePasswordModal() {
    const passwordModal = document.getElementById("passwordModal");
    if (passwordModal) {
      hidePasswordError();
      const passwordInput = document.getElementById("passwordInput");
      if (passwordInput) passwordInput.value = "";
      passwordModal.style.display = "none";
      passwordModal.style.visibility = "hidden";
      passwordModal.setAttribute("class", "hidden");
      passwordModal.setAttribute("aria-hidden", "true");
      if (localStorage.getItem("doubanEnabled") === "true") {
        const doubanArea = document.getElementById("doubanArea");
        if (doubanArea) doubanArea.classList.remove("hidden");
        if (typeof initDouban === "function") {
          initDouban();
        }
      }
    }
  }
  function showPasswordError() {
    const errorElement = document.getElementById("passwordError");
    if (errorElement) {
      errorElement.classList.remove("hidden");
      errorElement.style.display = "block";
    }
  }
  function hidePasswordError() {
    const errorElement = document.getElementById("passwordError");
    if (errorElement) {
      errorElement.classList.add("hidden");
      errorElement.style.display = "none";
    }
  }
  async function handlePasswordSubmit(event) {
    if (event && typeof event.preventDefault === "function") {
      event.preventDefault();
    }
    const passwordInput = document.getElementById("passwordInput");
    const password = passwordInput ? passwordInput.value.trim() : "";
    const ok = await verifyPassword(password);
    if (ok) {
      hidePasswordModal();
      try {
        if (typeof window.CustomEvent === "function") {
          document.dispatchEvent(new CustomEvent("passwordVerified"));
        } else {
          const evt = document.createEvent("Event");
          evt.initEvent("passwordVerified", true, true);
          document.dispatchEvent(evt);
        }
      } catch (e) {
        console.warn("dispatch passwordVerified event failed:", e);
      }
    } else {
      showPasswordError();
      if (passwordInput) {
        passwordInput.value = "";
        passwordInput.focus();
      }
    }
  }
  window.handlePasswordSubmit = handlePasswordSubmit;
  function initPasswordProtection() {
    if (isPasswordProtected() && isPasswordVerified2()) {
      hidePasswordModal();
      return;
    }
    if (isPasswordRequired()) {
      showPasswordModal();
      return;
    }
    if (isPasswordProtected() && !isPasswordVerified2()) {
      showPasswordModal();
      return;
    }
  }
  document.addEventListener("DOMContentLoaded", function() {
    const form = document.getElementById("passwordForm");
    if (form && !form.__passwordBound) {
      form.addEventListener("submit", handlePasswordSubmit);
      form.__passwordBound = true;
    }
    initPasswordProtection();
  });

  // js/player.js
  var selectedAPIs = JSON.parse(localStorage.getItem("selectedAPIs") || "[]");
  var customAPIs = JSON.parse(localStorage.getItem("customAPIs") || "[]");
  window.addEventListener("load", function() {
    if (document.referrer && document.referrer !== window.location.href) {
      localStorage.setItem("lastPageUrl", document.referrer);
    }
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get("id");
    const sourceCode = urlParams.get("source");
    if (videoId && sourceCode) {
      localStorage.setItem("currentPlayingId", videoId);
      localStorage.setItem("currentPlayingSource", sourceCode);
    }
  });
  var currentVideoTitle = "";
  var currentEpisodeIndex = 0;
  var art = null;
  var currentHls = null;
  var currentEpisodes = [];
  var episodesReversed = false;
  var autoplayEnabled = true;
  var videoHasEnded = false;
  var userClickedPosition = null;
  var shortcutHintTimeout = null;
  var adFilteringEnabled = true;
  var progressSaveInterval = null;
  var currentVideoUrl = "";
  var isWebkit = typeof window.webkitConvertPointFromNodeToPage === "function";
  Artplayer.FULLSCREEN_WEB_IN_BODY = true;
  document.addEventListener("DOMContentLoaded", function() {
    if (!isPasswordVerified()) {
      document.getElementById("player-loading").style.display = "none";
      return;
    }
    initializePageContent();
  });
  document.addEventListener("passwordVerified", () => {
    document.getElementById("player-loading").style.display = "block";
    initializePageContent();
  });
  function initializePageContent() {
    const urlParams = new URLSearchParams(window.location.search);
    let videoUrl = urlParams.get("url");
    const title = urlParams.get("title");
    const sourceCode = urlParams.get("source");
    let index = parseInt(urlParams.get("index") || "0");
    const episodesList = urlParams.get("episodes");
    const savedPosition = parseInt(urlParams.get("position") || "0");
    if (videoUrl && videoUrl.includes("player.html")) {
      try {
        const nestedUrlParams = new URLSearchParams(videoUrl.split("?")[1]);
        const nestedVideoUrl = nestedUrlParams.get("url");
        const nestedPosition = nestedUrlParams.get("position");
        const nestedIndex = nestedUrlParams.get("index");
        const nestedTitle = nestedUrlParams.get("title");
        if (nestedVideoUrl) {
          videoUrl = nestedVideoUrl;
          const url = new URL(window.location.href);
          if (!urlParams.has("position") && nestedPosition) {
            url.searchParams.set("position", nestedPosition);
          }
          if (!urlParams.has("index") && nestedIndex) {
            url.searchParams.set("index", nestedIndex);
          }
          if (!urlParams.has("title") && nestedTitle) {
            url.searchParams.set("title", nestedTitle);
          }
          window.history.replaceState({}, "", url);
        } else {
          showError("\u5386\u53F2\u8BB0\u5F55\u94FE\u63A5\u65E0\u6548\uFF0C\u8BF7\u8FD4\u56DE\u9996\u9875\u91CD\u65B0\u8BBF\u95EE");
        }
      } catch (e) {
      }
    }
    currentVideoUrl = videoUrl || "";
    currentVideoTitle = title || localStorage.getItem("currentVideoTitle") || "\u672A\u77E5\u89C6\u9891";
    currentEpisodeIndex = index;
    autoplayEnabled = localStorage.getItem("autoplayEnabled") !== "false";
    document.getElementById("autoplayToggle").checked = autoplayEnabled;
    adFilteringEnabled = localStorage.getItem(PLAYER_CONFIG.adFilteringStorage) !== "false";
    document.getElementById("autoplayToggle").addEventListener("change", function(e) {
      autoplayEnabled = e.target.checked;
      localStorage.setItem("autoplayEnabled", autoplayEnabled);
    });
    try {
      if (episodesList) {
        currentEpisodes = JSON.parse(decodeURIComponent(episodesList));
      } else {
        currentEpisodes = JSON.parse(localStorage.getItem("currentEpisodes") || "[]");
      }
      if (index < 0 || currentEpisodes.length > 0 && index >= currentEpisodes.length) {
        if (index >= currentEpisodes.length && currentEpisodes.length > 0) {
          index = currentEpisodes.length - 1;
        } else {
          index = 0;
        }
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set("index", index);
        window.history.replaceState({}, "", newUrl);
      }
      currentEpisodeIndex = index;
      episodesReversed = localStorage.getItem("episodesReversed") === "true";
    } catch (e) {
      currentEpisodes = [];
      currentEpisodeIndex = 0;
      episodesReversed = false;
    }
    document.title = currentVideoTitle + " - LibreTV\u64AD\u653E\u5668";
    document.getElementById("videoTitle").textContent = currentVideoTitle;
    if (videoUrl) {
      initPlayer(videoUrl);
    } else {
      showError("\u65E0\u6548\u7684\u89C6\u9891\u94FE\u63A5");
    }
    renderResourceInfoBar();
    updateEpisodeInfo();
    renderEpisodes();
    updateButtonStates();
    updateOrderButton();
    setTimeout(() => {
      setupProgressBarPreciseClicks();
    }, 1e3);
    document.addEventListener("keydown", handleKeyboardShortcuts);
    window.addEventListener("beforeunload", saveCurrentProgress);
    document.addEventListener("visibilitychange", function() {
      if (document.visibilityState === "hidden") {
        saveCurrentProgress();
      }
    });
    const waitForVideo = setInterval(() => {
      if (art && art.video) {
        art.video.addEventListener("pause", saveCurrentProgress);
        let lastSave = 0;
        art.video.addEventListener("timeupdate", function() {
          const now = Date.now();
          if (now - lastSave > 5e3) {
            saveCurrentProgress();
            lastSave = now;
          }
        });
        clearInterval(waitForVideo);
      }
    }, 200);
  }
  function handleKeyboardShortcuts(e) {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
    if (e.altKey && e.key === "ArrowLeft") {
      if (currentEpisodeIndex > 0) {
        playPreviousEpisode();
        showShortcutHint("\u4E0A\u4E00\u96C6", "left");
        e.preventDefault();
      }
    }
    if (e.altKey && e.key === "ArrowRight") {
      if (currentEpisodeIndex < currentEpisodes.length - 1) {
        playNextEpisode();
        showShortcutHint("\u4E0B\u4E00\u96C6", "right");
        e.preventDefault();
      }
    }
    if (!e.altKey && e.key === "ArrowLeft") {
      if (art && art.currentTime > 5) {
        art.currentTime -= 5;
        showShortcutHint("\u5FEB\u9000", "left");
        e.preventDefault();
      }
    }
    if (!e.altKey && e.key === "ArrowRight") {
      if (art && art.currentTime < art.duration - 5) {
        art.currentTime += 5;
        showShortcutHint("\u5FEB\u8FDB", "right");
        e.preventDefault();
      }
    }
    if (e.key === "ArrowUp") {
      if (art && art.volume < 1) {
        art.volume += 0.1;
        showShortcutHint("\u97F3\u91CF+", "up");
        e.preventDefault();
      }
    }
    if (e.key === "ArrowDown") {
      if (art && art.volume > 0) {
        art.volume -= 0.1;
        showShortcutHint("\u97F3\u91CF-", "down");
        e.preventDefault();
      }
    }
    if (e.key === " ") {
      if (art) {
        art.toggle();
        showShortcutHint("\u64AD\u653E/\u6682\u505C", "play");
        e.preventDefault();
      }
    }
    if (e.key === "f" || e.key === "F") {
      if (art) {
        art.fullscreen = !art.fullscreen;
        showShortcutHint("\u5207\u6362\u5168\u5C4F", "fullscreen");
        e.preventDefault();
      }
    }
  }
  function showShortcutHint(text, direction) {
    const hintElement = document.getElementById("shortcutHint");
    const textElement = document.getElementById("shortcutText");
    const iconElement = document.getElementById("shortcutIcon");
    if (shortcutHintTimeout) {
      clearTimeout(shortcutHintTimeout);
    }
    textElement.textContent = text;
    if (direction === "left") {
      iconElement.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>';
    } else if (direction === "right") {
      iconElement.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>';
    } else if (direction === "up") {
      iconElement.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path>';
    } else if (direction === "down") {
      iconElement.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>';
    } else if (direction === "fullscreen") {
      iconElement.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"></path>';
    } else if (direction === "play") {
      iconElement.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3l14 9-14 9V3z"></path>';
    }
    hintElement.classList.add("show");
    shortcutHintTimeout = setTimeout(() => {
      hintElement.classList.remove("show");
    }, 2e3);
  }
  function initPlayer(videoUrl) {
    if (!videoUrl) {
      return;
    }
    if (art) {
      art.destroy();
      art = null;
    }
    const hlsConfig = {
      debug: false,
      loader: adFilteringEnabled ? CustomHlsJsLoader : Hls.DefaultConfig.loader,
      enableWorker: true,
      lowLatencyMode: false,
      backBufferLength: 90,
      maxBufferLength: 30,
      maxMaxBufferLength: 60,
      maxBufferSize: 30 * 1e3 * 1e3,
      maxBufferHole: 0.5,
      fragLoadingMaxRetry: 6,
      fragLoadingMaxRetryTimeout: 64e3,
      fragLoadingRetryDelay: 1e3,
      manifestLoadingMaxRetry: 3,
      manifestLoadingRetryDelay: 1e3,
      levelLoadingMaxRetry: 4,
      levelLoadingRetryDelay: 1e3,
      startLevel: -1,
      abrEwmaDefaultEstimate: 5e5,
      abrBandWidthFactor: 0.95,
      abrBandWidthUpFactor: 0.7,
      abrMaxWithRealBitrate: true,
      stretchShortVideoTrack: true,
      appendErrorMaxRetry: 5,
      // 增加尝试次数
      liveSyncDurationCount: 3,
      liveDurationInfinity: false
    };
    art = new Artplayer({
      container: "#player",
      url: videoUrl,
      type: "m3u8",
      title: videoTitle,
      volume: 0.8,
      isLive: false,
      muted: false,
      autoplay: true,
      pip: true,
      autoSize: false,
      autoMini: true,
      screenshot: true,
      setting: true,
      loop: false,
      flip: false,
      playbackRate: true,
      aspectRatio: false,
      fullscreen: true,
      fullscreenWeb: true,
      subtitleOffset: false,
      miniProgressBar: true,
      mutex: true,
      backdrop: true,
      playsInline: true,
      autoPlayback: false,
      airplay: true,
      hotkey: false,
      theme: "#23ade5",
      lang: navigator.language.toLowerCase(),
      moreVideoAttr: {
        crossOrigin: "anonymous"
      },
      customType: {
        m3u8: function(video, url) {
          if (currentHls && currentHls.destroy) {
            try {
              currentHls.destroy();
            } catch (e) {
            }
          }
          const hls = new Hls(hlsConfig);
          currentHls = hls;
          let errorDisplayed = false;
          let errorCount = 0;
          let playbackStarted = false;
          let bufferAppendErrorCount = 0;
          video.addEventListener("playing", function() {
            playbackStarted = true;
            document.getElementById("player-loading").style.display = "none";
            document.getElementById("error").style.display = "none";
          });
          video.addEventListener("timeupdate", function() {
            if (video.currentTime > 1) {
              document.getElementById("error").style.display = "none";
            }
          });
          hls.loadSource(url);
          hls.attachMedia(video);
          let sourceElement = video.querySelector("source");
          if (sourceElement) {
            sourceElement.src = videoUrl;
          } else {
            sourceElement = document.createElement("source");
            sourceElement.src = videoUrl;
            video.appendChild(sourceElement);
          }
          video.disableRemotePlayback = false;
          hls.on(Hls.Events.MANIFEST_PARSED, function() {
            video.play().catch((e) => {
            });
          });
          hls.on(Hls.Events.ERROR, function(event, data) {
            errorCount++;
            if (data.details === "bufferAppendError") {
              bufferAppendErrorCount++;
              if (playbackStarted) {
                return;
              }
              if (bufferAppendErrorCount >= 3) {
                hls.recoverMediaError();
              }
            }
            if (data.fatal && !playbackStarted) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  hls.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  hls.recoverMediaError();
                  break;
                default:
                  if (errorCount > 3 && !errorDisplayed) {
                    errorDisplayed = true;
                    showError("\u89C6\u9891\u52A0\u8F7D\u5931\u8D25\uFF0C\u53EF\u80FD\u662F\u683C\u5F0F\u4E0D\u517C\u5BB9\u6216\u6E90\u4E0D\u53EF\u7528");
                  }
                  break;
              }
            }
          });
          hls.on(Hls.Events.FRAG_LOADED, function() {
            document.getElementById("player-loading").style.display = "none";
          });
          hls.on(Hls.Events.LEVEL_LOADED, function() {
            document.getElementById("player-loading").style.display = "none";
          });
        }
      }
    });
    let hideTimer;
    function hideControls() {
      if (art && art.controls) {
        art.controls.show = false;
      }
    }
    function resetHideTimer() {
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        hideControls();
      }, Artplayer.CONTROL_HIDE_TIME);
    }
    function handleMouseOut(e) {
      if (e && !e.relatedTarget) {
        resetHideTimer();
      }
    }
    function handleFullScreen(isFullScreen, isWeb) {
      if (isFullScreen) {
        document.addEventListener("mouseout", handleMouseOut);
      } else {
        document.removeEventListener("mouseout", handleMouseOut);
        clearTimeout(hideTimer);
      }
      if (!isWeb) {
        if (window.screen.orientation && window.screen.orientation.lock) {
          window.screen.orientation.lock("landscape").then(() => {
          }).catch((error) => {
          });
        }
      }
    }
    art.on("ready", () => {
      hideControls();
    });
    art.on("fullscreenWeb", function(isFullScreen) {
      handleFullScreen(isFullScreen, true);
    });
    art.on("fullscreen", function(isFullScreen) {
      handleFullScreen(isFullScreen, false);
    });
    art.on("video:loadedmetadata", function() {
      document.getElementById("player-loading").style.display = "none";
      videoHasEnded = false;
      const urlParams = new URLSearchParams(window.location.search);
      const savedPosition = parseInt(urlParams.get("position") || "0");
      if (savedPosition > 10 && savedPosition < art.duration - 2) {
        art.currentTime = savedPosition;
        showPositionRestoreHint(savedPosition);
      } else {
        try {
          const progressKey = "videoProgress_" + getVideoId();
          const progressStr = localStorage.getItem(progressKey);
          if (progressStr && art.duration > 0) {
            const progress = JSON.parse(progressStr);
            if (progress && typeof progress.position === "number" && progress.position > 10 && progress.position < art.duration - 2) {
              art.currentTime = progress.position;
              showPositionRestoreHint(progress.position);
            }
          }
        } catch (e) {
        }
      }
      setupProgressBarPreciseClicks();
      setTimeout(saveToHistory, 3e3);
      startProgressSaveInterval();
    });
    art.on("video:error", function(error) {
      if (window.isSwitchingVideo) {
        return;
      }
      const loadingElements = document.querySelectorAll("#player-loading, .player-loading-container");
      loadingElements.forEach((el) => {
        if (el) el.style.display = "none";
      });
      showError("\u89C6\u9891\u64AD\u653E\u5931\u8D25: " + (error.message || "\u672A\u77E5\u9519\u8BEF"));
    });
    setupLongPressSpeedControl();
    art.on("video:ended", function() {
      videoHasEnded = true;
      clearVideoProgress();
      if (autoplayEnabled && currentEpisodeIndex < currentEpisodes.length - 1) {
        setTimeout(() => {
          playNextEpisode();
          videoHasEnded = false;
        }, 1e3);
      } else {
        art.fullscreen = false;
      }
    });
    art.on("video:playing", () => {
      if (art.video) {
        art.video.addEventListener("dblclick", () => {
          art.fullscreen = !art.fullscreen;
          art.play();
        });
      }
    });
    setTimeout(function() {
      if (art && art.video && art.video.currentTime > 0) {
        return;
      }
      const loadingElement = document.getElementById("player-loading");
      if (loadingElement && loadingElement.style.display !== "none") {
        loadingElement.innerHTML = `
                <div class="loading-spinner"></div>
                <div>\u89C6\u9891\u52A0\u8F7D\u65F6\u95F4\u8F83\u957F\uFF0C\u8BF7\u8010\u5FC3\u7B49\u5F85...</div>
                <div style="font-size: 12px; color: #aaa; margin-top: 10px;">\u5982\u957F\u65F6\u95F4\u65E0\u54CD\u5E94\uFF0C\u8BF7\u5C1D\u8BD5\u5176\u4ED6\u89C6\u9891\u6E90</div>
            `;
      }
    }, 1e4);
  }
  var CustomHlsJsLoader = class extends Hls.DefaultConfig.loader {
    constructor(config) {
      super(config);
      const load = this.load.bind(this);
      this.load = function(context, config2, callbacks) {
        if (context.type === "manifest" || context.type === "level") {
          const onSuccess = callbacks.onSuccess;
          callbacks.onSuccess = function(response, stats, context2) {
            if (response.data && typeof response.data === "string") {
              response.data = filterAdsFromM3U8(response.data, true);
            }
            return onSuccess(response, stats, context2);
          };
        }
        load(context, config2, callbacks);
      };
    }
  };
  function filterAdsFromM3U8(m3u8Content, strictMode = false) {
    if (!m3u8Content) return "";
    const lines = m3u8Content.split("\n");
    const filteredLines = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.includes("#EXT-X-DISCONTINUITY")) {
        filteredLines.push(line);
      }
    }
    return filteredLines.join("\n");
  }
  function showError(message) {
    if (art && art.video && art.video.currentTime > 1) {
      return;
    }
    const loadingEl = document.getElementById("player-loading");
    if (loadingEl) loadingEl.style.display = "none";
    const errorEl = document.getElementById("error");
    if (errorEl) errorEl.style.display = "flex";
    const errorMsgEl = document.getElementById("error-message");
    if (errorMsgEl) errorMsgEl.textContent = message;
  }
  function updateEpisodeInfo() {
    if (currentEpisodes.length > 0) {
      document.getElementById("episodeInfo").textContent = `\u7B2C ${currentEpisodeIndex + 1}/${currentEpisodes.length} \u96C6`;
    } else {
      document.getElementById("episodeInfo").textContent = "\u65E0\u96C6\u6570\u4FE1\u606F";
    }
  }
  function updateButtonStates() {
    const prevButton = document.getElementById("prevButton");
    const nextButton = document.getElementById("nextButton");
    if (currentEpisodeIndex > 0) {
      prevButton.classList.remove("bg-gray-700", "cursor-not-allowed");
      prevButton.classList.add("bg-[#222]", "hover:bg-[#333]");
      prevButton.removeAttribute("disabled");
    } else {
      prevButton.classList.add("bg-gray-700", "cursor-not-allowed");
      prevButton.classList.remove("bg-[#222]", "hover:bg-[#333]");
      prevButton.setAttribute("disabled", "");
    }
    if (currentEpisodeIndex < currentEpisodes.length - 1) {
      nextButton.classList.remove("bg-gray-700", "cursor-not-allowed");
      nextButton.classList.add("bg-[#222]", "hover:bg-[#333]");
      nextButton.removeAttribute("disabled");
    } else {
      nextButton.classList.add("bg-gray-700", "cursor-not-allowed");
      nextButton.classList.remove("bg-[#222]", "hover:bg-[#333]");
      nextButton.setAttribute("disabled", "");
    }
  }
  function renderEpisodes() {
    const episodesList = document.getElementById("episodesList");
    if (!episodesList) return;
    if (!currentEpisodes || currentEpisodes.length === 0) {
      episodesList.innerHTML = '<div class="col-span-full text-center text-gray-400 py-8">\u6CA1\u6709\u53EF\u7528\u7684\u96C6\u6570</div>';
      return;
    }
    const episodes = episodesReversed ? [...currentEpisodes].reverse() : currentEpisodes;
    let html = "";
    episodes.forEach((episode, index) => {
      const realIndex = episodesReversed ? currentEpisodes.length - 1 - index : index;
      const isActive = realIndex === currentEpisodeIndex;
      html += `
            <button id="episode-${realIndex}" 
                    onclick="playEpisode(${realIndex})" 
                    class="px-4 py-2 ${isActive ? "episode-active" : "!bg-[#222] hover:!bg-[#333] hover:!shadow-none"} !border ${isActive ? "!border-blue-500" : "!border-[#333]"} rounded-lg transition-colors text-center episode-btn">
                ${realIndex + 1}
            </button>
        `;
    });
    episodesList.innerHTML = html;
  }
  function playEpisode(index) {
    if (index < 0 || index >= currentEpisodes.length) {
      return;
    }
    if (art && art.video && !art.video.paused && !videoHasEnded) {
      saveCurrentProgress();
    }
    if (progressSaveInterval) {
      clearInterval(progressSaveInterval);
      progressSaveInterval = null;
    }
    document.getElementById("error").style.display = "none";
    document.getElementById("player-loading").style.display = "flex";
    document.getElementById("player-loading").innerHTML = `
        <div class="loading-spinner"></div>
        <div>\u6B63\u5728\u52A0\u8F7D\u89C6\u9891...</div>
    `;
    const urlParams2 = new URLSearchParams(window.location.search);
    const sourceCode = urlParams2.get("source_code");
    const url = currentEpisodes[index];
    currentEpisodeIndex = index;
    currentVideoUrl = url;
    videoHasEnded = false;
    clearVideoProgress();
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set("index", index);
    currentUrl.searchParams.set("url", url);
    currentUrl.searchParams.delete("position");
    window.history.replaceState({}, "", currentUrl.toString());
    if (isWebkit) {
      initPlayer(url);
    } else {
      art.switch = url;
    }
    updateEpisodeInfo();
    updateButtonStates();
    renderEpisodes();
    userClickedPosition = null;
    setTimeout(() => saveToHistory(), 3e3);
  }
  function playPreviousEpisode() {
    if (currentEpisodeIndex > 0) {
      playEpisode(currentEpisodeIndex - 1);
    }
  }
  function playNextEpisode() {
    if (currentEpisodeIndex < currentEpisodes.length - 1) {
      playEpisode(currentEpisodeIndex + 1);
    }
  }
  function updateOrderButton() {
    const orderText = document.getElementById("orderText");
    const orderIcon = document.getElementById("orderIcon");
    if (orderText && orderIcon) {
      orderText.textContent = episodesReversed ? "\u6B63\u5E8F\u6392\u5217" : "\u5012\u5E8F\u6392\u5217";
      orderIcon.style.transform = episodesReversed ? "rotate(180deg)" : "";
    }
  }
  function setupProgressBarPreciseClicks() {
    const progressBar = document.querySelector(".dplayer-bar-wrap");
    if (!progressBar || !art || !art.video) return;
    progressBar.removeEventListener("mousedown", handleProgressBarClick);
    progressBar.addEventListener("mousedown", handleProgressBarClick);
    progressBar.removeEventListener("touchstart", handleProgressBarTouch);
    progressBar.addEventListener("touchstart", handleProgressBarTouch);
    function handleProgressBarClick(e) {
      if (!art || !art.video) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const percentage = (e.clientX - rect.left) / rect.width;
      const duration = art.video.duration;
      let clickTime = percentage * duration;
      if (duration - clickTime < 1) {
        clickTime = Math.min(clickTime, duration - 1.5);
      }
      userClickedPosition = clickTime;
      e.stopPropagation();
      art.seek(clickTime);
    }
    function handleProgressBarTouch(e) {
      if (!art || !art.video || !e.touches[0]) return;
      const touch = e.touches[0];
      const rect = e.currentTarget.getBoundingClientRect();
      const percentage = (touch.clientX - rect.left) / rect.width;
      const duration = art.video.duration;
      let clickTime = percentage * duration;
      if (duration - clickTime < 1) {
        clickTime = Math.min(clickTime, duration - 1.5);
      }
      userClickedPosition = clickTime;
      e.stopPropagation();
      art.seek(clickTime);
    }
  }
  function saveToHistory() {
    if (!currentEpisodes || currentEpisodes.length === 0 || !currentVideoUrl) {
      return;
    }
    const urlParams = new URLSearchParams(window.location.search);
    const sourceName = urlParams.get("source") || "";
    const sourceCode = urlParams.get("source") || "";
    const id_from_params = urlParams.get("id");
    let currentPosition = 0;
    let videoDuration = 0;
    if (art && art.video) {
      currentPosition = art.video.currentTime;
      videoDuration = art.video.duration;
    }
    let show_identifier_for_video_info;
    if (sourceName && id_from_params) {
      show_identifier_for_video_info = `${sourceName}_${id_from_params}`;
    } else {
      show_identifier_for_video_info = currentEpisodes && currentEpisodes.length > 0 ? currentEpisodes[0] : currentVideoUrl;
    }
    const videoInfo = {
      title: currentVideoTitle,
      directVideoUrl: currentVideoUrl,
      // Current episode's direct URL
      url: `player.html?url=${encodeURIComponent(currentVideoUrl)}&title=${encodeURIComponent(currentVideoTitle)}&source=${encodeURIComponent(sourceName)}&source_code=${encodeURIComponent(sourceCode)}&id=${encodeURIComponent(id_from_params || "")}&index=${currentEpisodeIndex}&position=${Math.floor(currentPosition || 0)}`,
      episodeIndex: currentEpisodeIndex,
      sourceName,
      vod_id: id_from_params || "",
      // Store the ID from params as vod_id in history item
      sourceCode,
      showIdentifier: show_identifier_for_video_info,
      // Identifier for the show/series
      timestamp: Date.now(),
      playbackPosition: currentPosition,
      duration: videoDuration,
      episodes: currentEpisodes && currentEpisodes.length > 0 ? [...currentEpisodes] : []
    };
    try {
      const history = JSON.parse(localStorage.getItem("viewingHistory") || "[]");
      const existingIndex = history.findIndex(
        (item) => item.title === videoInfo.title && item.sourceName === videoInfo.sourceName && item.showIdentifier === videoInfo.showIdentifier
      );
      if (existingIndex !== -1) {
        const existingItem = history[existingIndex];
        existingItem.episodeIndex = videoInfo.episodeIndex;
        existingItem.timestamp = videoInfo.timestamp;
        existingItem.sourceName = videoInfo.sourceName;
        existingItem.sourceCode = videoInfo.sourceCode;
        existingItem.vod_id = videoInfo.vod_id;
        existingItem.directVideoUrl = videoInfo.directVideoUrl;
        existingItem.url = videoInfo.url;
        existingItem.playbackPosition = videoInfo.playbackPosition > 10 ? videoInfo.playbackPosition : existingItem.playbackPosition || 0;
        existingItem.duration = videoInfo.duration || existingItem.duration;
        if (videoInfo.episodes && videoInfo.episodes.length > 0) {
          if (!existingItem.episodes || !Array.isArray(existingItem.episodes) || existingItem.episodes.length !== videoInfo.episodes.length || !videoInfo.episodes.every((ep, i) => ep === existingItem.episodes[i])) {
            existingItem.episodes = [...videoInfo.episodes];
          }
        }
        const updatedItem = history.splice(existingIndex, 1)[0];
        history.unshift(updatedItem);
      } else {
        history.unshift(videoInfo);
      }
      if (history.length > 50) history.splice(50);
      localStorage.setItem("viewingHistory", JSON.stringify(history));
    } catch (e) {
    }
  }
  function showPositionRestoreHint(position) {
    if (!position || position < 10) return;
    const hint = document.createElement("div");
    hint.className = "position-restore-hint";
    hint.innerHTML = `
        <div class="hint-content">
            \u5DF2\u4ECE ${formatTime(position)} \u7EE7\u7EED\u64AD\u653E
        </div>
    `;
    const playerContainer = document.querySelector(".player-container");
    if (playerContainer) {
      playerContainer.appendChild(hint);
    } else {
      return;
    }
    setTimeout(() => {
      hint.classList.add("show");
      setTimeout(() => {
        hint.classList.remove("show");
        setTimeout(() => hint.remove(), 300);
      }, 3e3);
    }, 100);
  }
  function formatTime(seconds) {
    if (isNaN(seconds)) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  }
  function startProgressSaveInterval() {
    if (progressSaveInterval) {
      clearInterval(progressSaveInterval);
    }
    progressSaveInterval = setInterval(saveCurrentProgress, 3e4);
  }
  function saveCurrentProgress() {
    if (!art || !art.video) return;
    const currentTime = art.video.currentTime;
    const duration = art.video.duration;
    if (!duration || currentTime < 1) return;
    const progressKey = `videoProgress_${getVideoId()}`;
    const progressData = {
      position: currentTime,
      duration,
      timestamp: Date.now()
    };
    try {
      localStorage.setItem(progressKey, JSON.stringify(progressData));
      try {
        const historyRaw = localStorage.getItem("viewingHistory");
        if (historyRaw) {
          const history = JSON.parse(historyRaw);
          const idx = history.findIndex(
            (item) => item.title === currentVideoTitle && (item.episodeIndex === void 0 || item.episodeIndex === currentEpisodeIndex)
          );
          if (idx !== -1) {
            if (Math.abs((history[idx].playbackPosition || 0) - currentTime) > 2 || Math.abs((history[idx].duration || 0) - duration) > 2) {
              history[idx].playbackPosition = currentTime;
              history[idx].duration = duration;
              history[idx].timestamp = Date.now();
              localStorage.setItem("viewingHistory", JSON.stringify(history));
            }
          }
        }
      } catch (e) {
      }
    } catch (e) {
    }
  }
  function setupLongPressSpeedControl() {
    if (!art || !art.video) return;
    const playerElement = document.getElementById("player");
    let longPressTimer = null;
    let originalPlaybackRate = 1;
    let isLongPress = false;
    function showSpeedHint(speed) {
      showShortcutHint(`${speed}\u500D\u901F`, "right");
    }
    playerElement.oncontextmenu = () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobile) {
        const dplayerMenu = document.querySelector(".dplayer-menu");
        const dplayerMask = document.querySelector(".dplayer-mask");
        if (dplayerMenu) dplayerMenu.style.display = "none";
        if (dplayerMask) dplayerMask.style.display = "none";
        return false;
      }
      return true;
    };
    playerElement.addEventListener("touchstart", function(e) {
      if (art.video.paused) {
        return;
      }
      originalPlaybackRate = art.video.playbackRate;
      longPressTimer = setTimeout(() => {
        if (art.video.paused) {
          clearTimeout(longPressTimer);
          longPressTimer = null;
          return;
        }
        art.video.playbackRate = 3;
        isLongPress = true;
        showSpeedHint(3);
        e.preventDefault();
      }, 500);
    }, { passive: false });
    playerElement.addEventListener("touchend", function(e) {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
      if (isLongPress) {
        art.video.playbackRate = originalPlaybackRate;
        isLongPress = false;
        showSpeedHint(originalPlaybackRate);
        e.preventDefault();
      }
    });
    playerElement.addEventListener("touchcancel", function() {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
      if (isLongPress) {
        art.video.playbackRate = originalPlaybackRate;
        isLongPress = false;
      }
    });
    playerElement.addEventListener("touchmove", function(e) {
      if (isLongPress) {
        e.preventDefault();
      }
    }, { passive: false });
    art.video.addEventListener("pause", function() {
      if (isLongPress) {
        art.video.playbackRate = originalPlaybackRate;
        isLongPress = false;
      }
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    });
  }
  function clearVideoProgress() {
    const progressKey = `videoProgress_${getVideoId()}`;
    try {
      localStorage.removeItem(progressKey);
    } catch (e) {
    }
  }
  function getVideoId() {
    if (currentVideoUrl) {
      return `${encodeURIComponent(currentVideoUrl)}`;
    }
    return `${encodeURIComponent(currentVideoTitle)}_${currentEpisodeIndex}`;
  }
  function renderResourceInfoBar() {
    const container = document.getElementById("resourceInfoBarContainer");
    if (!container) {
      console.error("\u627E\u4E0D\u5230\u8D44\u6E90\u4FE1\u606F\u5361\u7247\u5BB9\u5668");
      return;
    }
    const urlParams = new URLSearchParams(window.location.search);
    const currentSource = urlParams.get("source") || "";
    container.innerHTML = `
      <div class="resource-info-bar-left flex">
        <span>\u52A0\u8F7D\u4E2D...</span>
        <span class="resource-info-bar-videos">-</span>
      </div>
      <button class="resource-switch-btn flex" id="switchResourceBtn" onclick="showSwitchResourceModal()">
        <span class="resource-switch-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4v16m0 0l-6-6m6 6l6-6" stroke="#a67c2d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>
        \u5207\u6362\u8D44\u6E90
      </button>
    `;
    let resourceName = currentSource;
    if (currentSource && API_SITES[currentSource]) {
      resourceName = API_SITES[currentSource].name;
    }
    if (resourceName === currentSource) {
      const customAPIs2 = JSON.parse(localStorage.getItem("customAPIs") || "[]");
      const customIndex = parseInt(currentSource.replace("custom_", ""), 10);
      if (customAPIs2[customIndex]) {
        resourceName = customAPIs2[customIndex].name || "\u81EA\u5B9A\u4E49\u8D44\u6E90";
      }
    }
    container.innerHTML = `
      <div class="resource-info-bar-left flex">
        <span>${resourceName}</span>
        <span class="resource-info-bar-videos">${currentEpisodes.length} \u4E2A\u89C6\u9891</span>
      </div>
      <button class="resource-switch-btn flex" id="switchResourceBtn" onclick="showSwitchResourceModal()">
        <span class="resource-switch-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4v16m0 0l-6-6m6 6l6-6" stroke="#a67c2d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>
        \u5207\u6362\u8D44\u6E90
      </button>
    `;
  }
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vc2hhMjU2LmpzIiwgIi4uL2NvbmZpZy5qcyIsICIuLi9wcm94eS1hdXRoLmpzIiwgIi4uL3Bhc3N3b3JkLmpzIiwgIi4uL3BsYXllci5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNoYTI1NihtZXNzYWdlKSB7XHJcbiAgICBjb25zdCBtc2dCdWZmZXIgPSBuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUobWVzc2FnZSk7XHJcbiAgICBjb25zdCBoYXNoQnVmZmVyID0gYXdhaXQgY3J5cHRvLnN1YnRsZS5kaWdlc3QoJ1NIQS0yNTYnLCBtc2dCdWZmZXIpO1xyXG4gICAgY29uc3QgaGFzaEFycmF5ID0gQXJyYXkuZnJvbShuZXcgVWludDhBcnJheShoYXNoQnVmZmVyKSk7XHJcbiAgICByZXR1cm4gaGFzaEFycmF5Lm1hcChiID0+IGIudG9TdHJpbmcoMTYpLnBhZFN0YXJ0KDIsICcwJykpLmpvaW4oJycpO1xyXG59XHJcbiIsICIvLyBcdTUxNjhcdTVDNDBcdTVFMzhcdTkxQ0ZcdTkxNERcdTdGNkVcclxuY29uc3QgUFJPWFlfVVJMID0gJy9wcm94eS8nOyAgICAvLyBcdTkwMDJcdTc1MjhcdTRFOEUgQ2xvdWRmbGFyZSwgTmV0bGlmeSAoXHU1RTI2XHU5MUNEXHU1MTk5KSwgVmVyY2VsIChcdTVFMjZcdTkxQ0RcdTUxOTkpXHJcbi8vIGNvbnN0IEhPUExBWUVSX1VSTCA9ICdodHRwczovL2hvcGxheWVyLmNvbS9pbmRleC5odG1sJztcclxuY29uc3QgU0VBUkNIX0hJU1RPUllfS0VZID0gJ3ZpZGVvU2VhcmNoSGlzdG9yeSc7XHJcbmNvbnN0IE1BWF9ISVNUT1JZX0lURU1TID0gNTtcclxuXHJcbi8vIFx1NUJDNlx1NzgwMVx1NEZERFx1NjJBNFx1OTE0RFx1N0Y2RVxyXG4vLyBcdTZDRThcdTYxMEZcdUZGMUFQQVNTV09SRCBcdTczQUZcdTU4ODNcdTUzRDhcdTkxQ0ZcdTY2MkZcdTVGQzVcdTk3MDBcdTc2ODRcdUZGMENcdTYyNDBcdTY3MDlcdTkwRThcdTdGNzJcdTkwRkRcdTVGQzVcdTk4N0JcdThCQkVcdTdGNkVcdTVCQzZcdTc4MDFcdTRFRTVcdTc4NkVcdTRGRERcdTVCODlcdTUxNjhcclxuY29uc3QgUEFTU1dPUkRfQ09ORklHID0ge1xyXG4gICAgbG9jYWxTdG9yYWdlS2V5OiAncGFzc3dvcmRWZXJpZmllZCcsICAvLyBcdTVCNThcdTUwQThcdTlBOENcdThCQzFcdTcyQjZcdTYwMDFcdTc2ODRcdTk1MkVcdTU0MERcclxuICAgIHZlcmlmaWNhdGlvblRUTDogOTAgKiAyNCAqIDYwICogNjAgKiAxMDAwICAvLyBcdTlBOENcdThCQzFcdTY3MDlcdTY1NDhcdTY3MUZcdUZGMDg5MFx1NTkyOVx1RkYwQ1x1N0VBNjNcdTRFMkFcdTY3MDhcdUZGMDlcclxufTtcclxuXHJcbi8vIFx1N0Y1MVx1N0FEOVx1NEZFMVx1NjA2Rlx1OTE0RFx1N0Y2RVxyXG5jb25zdCBTSVRFX0NPTkZJRyA9IHtcclxuICAgIG5hbWU6ICdMaWJyZVRWJyxcclxuICAgIHVybDogJ2h0dHBzOi8vbGlicmV0di5pcy1hbi5vcmcnLFxyXG4gICAgZGVzY3JpcHRpb246ICdcdTUxNERcdThEMzlcdTU3MjhcdTdFQkZcdTg5QzZcdTk4OTFcdTY0MUNcdTdEMjJcdTRFMEVcdTg5QzJcdTc3MEJcdTVFNzNcdTUzRjAnLFxyXG4gICAgbG9nbzogJ2ltYWdlL2xvZ28ucG5nJyxcclxuICAgIHZlcnNpb246ICcxLjAuMydcclxufTtcclxuXHJcbi8vIEFQSVx1N0FEOVx1NzBCOVx1OTE0RFx1N0Y2RVxyXG5jb25zdCBBUElfU0lURVMgPSB7XHJcbiAgICB0ZXN0U291cmNlOiB7XHJcbiAgICAgICAgYXBpOiAnaHR0cHM6Ly93d3cuZXhhbXBsZS5jb20vYXBpLnBocC9wcm92aWRlL3ZvZCcsXHJcbiAgICAgICAgbmFtZTogJ1x1N0E3QVx1NTE4NVx1NUJCOVx1NkQ0Qlx1OEJENVx1NkU5MCcsXHJcbiAgICAgICAgYWR1bHQ6IHRydWVcclxuICAgIH1cclxuICAgIC8vQVJDSElWRSBodHRwczovL3RlbGVncmEucGgvQVBJcy0wOC0xMlxyXG59O1xyXG5cclxuLy8gXHU1QjlBXHU0RTQ5XHU1NDA4XHU1RTc2XHU2NUI5XHU2Q0Q1XHJcbmZ1bmN0aW9uIGV4dGVuZEFQSVNpdGVzKG5ld1NpdGVzKSB7XHJcbiAgICBPYmplY3QuYXNzaWduKEFQSV9TSVRFUywgbmV3U2l0ZXMpO1xyXG59XHJcblxyXG4vLyBcdTY2QjRcdTk3MzJcdTUyMzBcdTUxNjhcdTVDNDBcclxud2luZG93LkFQSV9TSVRFUyA9IEFQSV9TSVRFUztcclxud2luZG93LmV4dGVuZEFQSVNpdGVzID0gZXh0ZW5kQVBJU2l0ZXM7XHJcblxyXG5cclxuLy8gXHU2REZCXHU1MkEwXHU4MDVBXHU1NDA4XHU2NDFDXHU3RDIyXHU3Njg0XHU5MTREXHU3RjZFXHU5MDA5XHU5ODc5XHJcbmNvbnN0IEFHR1JFR0FURURfU0VBUkNIX0NPTkZJRyA9IHtcclxuICAgIGVuYWJsZWQ6IHRydWUsICAgICAgICAgICAgIC8vIFx1NjYyRlx1NTQyNlx1NTQyRlx1NzUyOFx1ODA1QVx1NTQwOFx1NjQxQ1x1N0QyMlxyXG4gICAgdGltZW91dDogODAwMCwgICAgICAgICAgICAvLyBcdTUzNTVcdTRFMkFcdTZFOTBcdThEODVcdTY1RjZcdTY1RjZcdTk1RjRcdUZGMDhcdTZCRUJcdTc5RDJcdUZGMDlcclxuICAgIG1heFJlc3VsdHM6IDEwMDAwLCAgICAgICAgICAvLyBcdTY3MDBcdTU5MjdcdTdFRDNcdTY3OUNcdTY1NzBcdTkxQ0ZcclxuICAgIHBhcmFsbGVsUmVxdWVzdHM6IHRydWUsICAgLy8gXHU2NjJGXHU1NDI2XHU1RTc2XHU4ODRDXHU4QkY3XHU2QzQyXHU2MjQwXHU2NzA5XHU2RTkwXHJcbiAgICBzaG93U291cmNlQmFkZ2VzOiB0cnVlICAgIC8vIFx1NjYyRlx1NTQyNlx1NjYzRVx1NzkzQVx1Njc2NVx1NkU5MFx1NUZCRFx1N0FFMFxyXG59O1xyXG5cclxuLy8gXHU2MkJEXHU4QzYxQVBJXHU4QkY3XHU2QzQyXHU5MTREXHU3RjZFXHJcbmNvbnN0IEFQSV9DT05GSUcgPSB7XHJcbiAgICBzZWFyY2g6IHtcclxuICAgICAgICAvLyBcdTUzRUFcdTYyRkNcdTYzQTVcdTUzQzJcdTY1NzBcdTkwRThcdTUyMDZcdUZGMENcdTRFMERcdTUxOERcdTUzMDVcdTU0MkIgL2FwaS5waHAvcHJvdmlkZS92b2QvXHJcbiAgICAgICAgcGF0aDogJz9hYz12aWRlb2xpc3Qmd2Q9JyxcclxuICAgICAgICBwYWdlUGF0aDogJz9hYz12aWRlb2xpc3Qmd2Q9e3F1ZXJ5fSZwZz17cGFnZX0nLFxyXG4gICAgICAgIG1heFBhZ2VzOiA1MCwgLy8gXHU2NzAwXHU1OTI3XHU4M0I3XHU1M0Q2XHU5ODc1XHU2NTcwXHJcbiAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgICAnVXNlci1BZ2VudCc6ICdNb3ppbGxhLzUuMCAoV2luZG93cyBOVCAxMC4wOyBXaW42NDsgeDY0KSBBcHBsZVdlYktpdC81MzcuMzYgKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvMTIyLjAuMC4wIFNhZmFyaS81MzcuMzYnLFxyXG4gICAgICAgICAgICAnQWNjZXB0JzogJ2FwcGxpY2F0aW9uL2pzb24nXHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIGRldGFpbDoge1xyXG4gICAgICAgIC8vIFx1NTNFQVx1NjJGQ1x1NjNBNVx1NTNDMlx1NjU3MFx1OTBFOFx1NTIwNlxyXG4gICAgICAgIHBhdGg6ICc/YWM9dmlkZW9saXN0Jmlkcz0nLFxyXG4gICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICAgJ1VzZXItQWdlbnQnOiAnTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzEyMi4wLjAuMCBTYWZhcmkvNTM3LjM2JyxcclxuICAgICAgICAgICAgJ0FjY2VwdCc6ICdhcHBsaWNhdGlvbi9qc29uJ1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcbi8vIFx1NEYxOFx1NTMxNlx1NTQwRVx1NzY4NFx1NkI2M1x1NTIxOVx1ODg2OFx1OEZCRVx1NUYwRlx1NkEyMVx1NUYwRlxyXG5jb25zdCBNM1U4X1BBVFRFUk4gPSAvXFwkaHR0cHM/OlxcL1xcL1teXCInXFxzXSs/XFwubTN1OC9nO1xyXG5cclxuLy8gXHU2REZCXHU1MkEwXHU4MUVBXHU1QjlBXHU0RTQ5XHU2NEFEXHU2NTNFXHU1NjY4VVJMXHJcbmNvbnN0IENVU1RPTV9QTEFZRVJfVVJMID0gJ3BsYXllci5odG1sJzsgLy8gXHU0RjdGXHU3NTI4XHU3NkY4XHU1QkY5XHU4REVGXHU1Rjg0XHU1RjE1XHU3NTI4XHU2NzJDXHU1NzMwcGxheWVyLmh0bWxcclxuXHJcbi8vIFx1NTg5RVx1NTJBMFx1ODlDNlx1OTg5MVx1NjRBRFx1NjUzRVx1NzZGOFx1NTE3M1x1OTE0RFx1N0Y2RVxyXG5jb25zdCBQTEFZRVJfQ09ORklHID0ge1xyXG4gICAgYXV0b3BsYXk6IHRydWUsXHJcbiAgICBhbGxvd0Z1bGxzY3JlZW46IHRydWUsXHJcbiAgICB3aWR0aDogJzEwMCUnLFxyXG4gICAgaGVpZ2h0OiAnNjAwJyxcclxuICAgIHRpbWVvdXQ6IDE1MDAwLCAgLy8gXHU2NEFEXHU2NTNFXHU1NjY4XHU1MkEwXHU4RjdEXHU4RDg1XHU2NUY2XHU2NUY2XHU5NUY0XHJcbiAgICBmaWx0ZXJBZHM6IHRydWUsICAvLyBcdTY2MkZcdTU0MjZcdTU0MkZcdTc1MjhcdTVFN0ZcdTU0NEFcdThGQzdcdTZFRTRcclxuICAgIGF1dG9QbGF5TmV4dDogdHJ1ZSwgIC8vIFx1OUVEOFx1OEJBNFx1NTQyRlx1NzUyOFx1ODFFQVx1NTJBOFx1OEZERVx1NjRBRFx1NTI5Rlx1ODBGRFxyXG4gICAgYWRGaWx0ZXJpbmdFbmFibGVkOiB0cnVlLCAvLyBcdTlFRDhcdThCQTRcdTVGMDBcdTU0MkZcdTUyMDZcdTcyNDdcdTVFN0ZcdTU0NEFcdThGQzdcdTZFRTRcclxuICAgIGFkRmlsdGVyaW5nU3RvcmFnZTogJ2FkRmlsdGVyaW5nRW5hYmxlZCcgLy8gXHU1QjU4XHU1MEE4XHU1RTdGXHU1NDRBXHU4RkM3XHU2RUU0XHU4QkJFXHU3RjZFXHU3Njg0XHU5NTJFXHU1NDBEXHJcbn07XHJcblxyXG4vLyBcdTU4OUVcdTUyQTBcdTk1MTlcdThCRUZcdTRGRTFcdTYwNkZcdTY3MkNcdTU3MzBcdTUzMTZcclxuY29uc3QgRVJST1JfTUVTU0FHRVMgPSB7XHJcbiAgICBORVRXT1JLX0VSUk9SOiAnXHU3RjUxXHU3RURDXHU4RkRFXHU2M0E1XHU5NTE5XHU4QkVGXHVGRjBDXHU4QkY3XHU2OEMwXHU2N0U1XHU3RjUxXHU3RURDXHU4QkJFXHU3RjZFJyxcclxuICAgIFRJTUVPVVRfRVJST1I6ICdcdThCRjdcdTZDNDJcdThEODVcdTY1RjZcdUZGMENcdTY3MERcdTUyQTFcdTU2NjhcdTU0Q0RcdTVFOTRcdTY1RjZcdTk1RjRcdThGQzdcdTk1N0YnLFxyXG4gICAgQVBJX0VSUk9SOiAnQVBJXHU2M0E1XHU1M0UzXHU4RkQ0XHU1NkRFXHU5NTE5XHU4QkVGXHVGRjBDXHU4QkY3XHU1QzFEXHU4QkQ1XHU2NkY0XHU2MzYyXHU2NTcwXHU2MzZFXHU2RTkwJyxcclxuICAgIFBMQVlFUl9FUlJPUjogJ1x1NjRBRFx1NjUzRVx1NTY2OFx1NTJBMFx1OEY3RFx1NTkzMVx1OEQyNVx1RkYwQ1x1OEJGN1x1NUMxRFx1OEJENVx1NTE3Nlx1NEVENlx1ODlDNlx1OTg5MVx1NkU5MCcsXHJcbiAgICBVTktOT1dOX0VSUk9SOiAnXHU1M0QxXHU3NTFGXHU2NzJBXHU3N0U1XHU5NTE5XHU4QkVGXHVGRjBDXHU4QkY3XHU1MjM3XHU2NUIwXHU5ODc1XHU5NzYyXHU5MUNEXHU4QkQ1J1xyXG59O1xyXG5cclxuLy8gXHU2REZCXHU1MkEwXHU4RkRCXHU0RTAwXHU2QjY1XHU1Qjg5XHU1MTY4XHU4QkJFXHU3RjZFXHJcbmNvbnN0IFNFQ1VSSVRZX0NPTkZJRyA9IHtcclxuICAgIGVuYWJsZVhTU1Byb3RlY3Rpb246IHRydWUsICAvLyBcdTY2MkZcdTU0MjZcdTU0MkZcdTc1MjhYU1NcdTRGRERcdTYyQTRcclxuICAgIHNhbml0aXplVXJsczogdHJ1ZSwgICAgICAgICAvLyBcdTY2MkZcdTU0MjZcdTZFMDVcdTc0MDZVUkxcclxuICAgIG1heFF1ZXJ5TGVuZ3RoOiAxMDAsICAgICAgICAvLyBcdTY3MDBcdTU5MjdcdTY0MUNcdTdEMjJcdTk1N0ZcdTVFQTZcclxuICAgIC8vIGFsbG93ZWRBcGlEb21haW5zIFx1NEUwRFx1NTE4RFx1OTcwMFx1ODk4MVx1RkYwQ1x1NTZFMFx1NEUzQVx1NjI0MFx1NjcwOVx1OEJGN1x1NkM0Mlx1OTBGRFx1OTAxQVx1OEZDN1x1NTE4NVx1OTBFOFx1NEVFM1x1NzQwNlxyXG59O1xyXG5cclxuLy8gXHU2REZCXHU1MkEwXHU1OTFBXHU0RTJBXHU4MUVBXHU1QjlBXHU0RTQ5QVBJXHU2RTkwXHU3Njg0XHU5MTREXHU3RjZFXHJcbmNvbnN0IENVU1RPTV9BUElfQ09ORklHID0ge1xyXG4gICAgc2VwYXJhdG9yOiAnLCcsICAgICAgICAgICAvLyBcdTUyMDZcdTk2OTRcdTdCMjZcclxuICAgIG1heFNvdXJjZXM6IDUsICAgICAgICAgICAgLy8gXHU2NzAwXHU1OTI3XHU1MTQxXHU4QkI4XHU3Njg0XHU4MUVBXHU1QjlBXHU0RTQ5XHU2RTkwXHU2NTcwXHU5MUNGXHJcbiAgICB0ZXN0VGltZW91dDogNTAwMCwgICAgICAgIC8vIFx1NkQ0Qlx1OEJENVx1OEQ4NVx1NjVGNlx1NjVGNlx1OTVGNChcdTZCRUJcdTc5RDIpXHJcbiAgICBuYW1lUHJlZml4OiAnQ3VzdG9tLScsICAgIC8vIFx1ODFFQVx1NUI5QVx1NEU0OVx1NkU5MFx1NTQwRFx1NzlGMFx1NTI0RFx1N0YwMFxyXG4gICAgdmFsaWRhdGVVcmw6IHRydWUsICAgICAgICAvLyBcdTlBOENcdThCQzFVUkxcdTY4M0NcdTVGMEZcclxuICAgIGNhY2hlUmVzdWx0czogdHJ1ZSwgICAgICAgLy8gXHU3RjEzXHU1QjU4XHU2RDRCXHU4QkQ1XHU3RUQzXHU2NzlDXHJcbiAgICBjYWNoZUV4cGlyeTogNTE4NDAwMDAwMCwgIC8vIFx1N0YxM1x1NUI1OFx1OEZDN1x1NjcxRlx1NjVGNlx1OTVGNCgyXHU0RTJBXHU2NzA4KVxyXG4gICAgYWR1bHRQcm9wTmFtZTogJ2lzQWR1bHQnIC8vIFx1NzUyOFx1NEU4RVx1NjgwN1x1OEJCMFx1NjIxMFx1NEVCQVx1NTE4NVx1NUJCOVx1NzY4NFx1NUM1RVx1NjAyN1x1NTQwRFxyXG59O1xyXG5cclxuLy8gXHU5NjkwXHU4NUNGXHU1MTg1XHU3RjZFXHU5RUM0XHU4MjcyXHU5MUM3XHU5NkM2XHU3QUQ5QVBJXHU3Njg0XHU1M0Q4XHU5MUNGXHJcbmNvbnN0IEhJREVfQlVJTFRJTl9BRFVMVF9BUElTID0gZmFsc2U7XHJcbiIsICIvKipcclxuICogXHU0RUUzXHU3NDA2XHU4QkY3XHU2QzQyXHU5Mjc0XHU2NzQzXHU2QTIxXHU1NzU3XHJcbiAqIFx1NEUzQVx1NEVFM1x1NzQwNlx1OEJGN1x1NkM0Mlx1NkRGQlx1NTJBMFx1NTdGQVx1NEU4RSBQQVNTV09SRCBcdTc2ODRcdTkyNzRcdTY3NDNcdTY3M0FcdTUyMzZcclxuICovXHJcblxyXG4vLyBcdTRFQ0VcdTUxNjhcdTVDNDBcdTkxNERcdTdGNkVcdTgzQjdcdTUzRDZcdTVCQzZcdTc4MDFcdTU0QzhcdTVFMENcdUZGMDhcdTU5ODJcdTY3OUNcdTVCNThcdTU3MjhcdUZGMDlcclxubGV0IGNhY2hlZFBhc3N3b3JkSGFzaCA9IG51bGw7XHJcblxyXG4vKipcclxuICogXHU4M0I3XHU1M0Q2XHU1RjUzXHU1MjREXHU0RjFBXHU4QkREXHU3Njg0XHU1QkM2XHU3ODAxXHU1NEM4XHU1RTBDXHJcbiAqL1xyXG5hc3luYyBmdW5jdGlvbiBnZXRQYXNzd29yZEhhc2goKSB7XHJcbiAgICBpZiAoY2FjaGVkUGFzc3dvcmRIYXNoKSB7XHJcbiAgICAgICAgcmV0dXJuIGNhY2hlZFBhc3N3b3JkSGFzaDtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gMS4gXHU0RjE4XHU1MTQ4XHU0RUNFXHU1REYyXHU1QjU4XHU1MEE4XHU3Njg0XHU0RUUzXHU3NDA2XHU5Mjc0XHU2NzQzXHU1NEM4XHU1RTBDXHU4M0I3XHU1M0Q2XHJcbiAgICBjb25zdCBzdG9yZWRIYXNoID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3Byb3h5QXV0aEhhc2gnKTtcclxuICAgIGlmIChzdG9yZWRIYXNoKSB7XHJcbiAgICAgICAgY2FjaGVkUGFzc3dvcmRIYXNoID0gc3RvcmVkSGFzaDtcclxuICAgICAgICByZXR1cm4gc3RvcmVkSGFzaDtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gMi4gXHU1QzFEXHU4QkQ1XHU0RUNFXHU1QkM2XHU3ODAxXHU5QThDXHU4QkMxXHU3MkI2XHU2MDAxXHU4M0I3XHU1M0Q2XHVGRjA4cGFzc3dvcmQuanMgXHU5QThDXHU4QkMxXHU1NDBFXHU1QjU4XHU1MEE4XHU3Njg0XHU1NEM4XHU1RTBDXHVGRjA5XHJcbiAgICBjb25zdCBwYXNzd29yZFZlcmlmaWVkID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3Bhc3N3b3JkVmVyaWZpZWQnKTtcclxuICAgIGNvbnN0IHN0b3JlZFBhc3N3b3JkSGFzaCA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdwYXNzd29yZEhhc2gnKTtcclxuICAgIGlmIChwYXNzd29yZFZlcmlmaWVkID09PSAndHJ1ZScgJiYgc3RvcmVkUGFzc3dvcmRIYXNoKSB7XHJcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ3Byb3h5QXV0aEhhc2gnLCBzdG9yZWRQYXNzd29yZEhhc2gpO1xyXG4gICAgICAgIGNhY2hlZFBhc3N3b3JkSGFzaCA9IHN0b3JlZFBhc3N3b3JkSGFzaDtcclxuICAgICAgICByZXR1cm4gc3RvcmVkUGFzc3dvcmRIYXNoO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyAzLiBcdTVDMURcdThCRDVcdTRFQ0VcdTc1MjhcdTYyMzdcdThGOTNcdTUxNjVcdTc2ODRcdTVCQzZcdTc4MDFcdTc1MUZcdTYyMTBcdTU0QzhcdTVFMENcclxuICAgIGNvbnN0IHVzZXJQYXNzd29yZCA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCd1c2VyUGFzc3dvcmQnKTtcclxuICAgIGlmICh1c2VyUGFzc3dvcmQpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAvLyBcdTUyQThcdTYwMDFcdTVCRkNcdTUxNjUgc2hhMjU2IFx1NTFGRFx1NjU3MFxyXG4gICAgICAgICAgICBjb25zdCB7IHNoYTI1NiB9ID0gYXdhaXQgaW1wb3J0KCcuL3NoYTI1Ni5qcycpO1xyXG4gICAgICAgICAgICBjb25zdCBoYXNoID0gYXdhaXQgc2hhMjU2KHVzZXJQYXNzd29yZCk7XHJcbiAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdwcm94eUF1dGhIYXNoJywgaGFzaCk7XHJcbiAgICAgICAgICAgIGNhY2hlZFBhc3N3b3JkSGFzaCA9IGhhc2g7XHJcbiAgICAgICAgICAgIHJldHVybiBoYXNoO1xyXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1x1NzUxRlx1NjIxMFx1NUJDNlx1NzgwMVx1NTRDOFx1NUUwQ1x1NTkzMVx1OEQyNTonLCBlcnJvcik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyA0LiBcdTU5ODJcdTY3OUNcdTc1MjhcdTYyMzdcdTZDQTFcdTY3MDlcdThCQkVcdTdGNkVcdTVCQzZcdTc4MDFcdUZGMENcdTVDMURcdThCRDVcdTRGN0ZcdTc1MjhcdTczQUZcdTU4ODNcdTUzRDhcdTkxQ0ZcdTRFMkRcdTc2ODRcdTVCQzZcdTc4MDFcdTU0QzhcdTVFMENcclxuICAgIGlmICh3aW5kb3cuX19FTlZfXyAmJiB3aW5kb3cuX19FTlZfXy5QQVNTV09SRCkge1xyXG4gICAgICAgIGNhY2hlZFBhc3N3b3JkSGFzaCA9IHdpbmRvdy5fX0VOVl9fLlBBU1NXT1JEO1xyXG4gICAgICAgIHJldHVybiB3aW5kb3cuX19FTlZfXy5QQVNTV09SRDtcclxuICAgIH1cclxuICAgIFxyXG4gICAgcmV0dXJuIG51bGw7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBcdTRFM0FcdTRFRTNcdTc0MDZcdThCRjdcdTZDNDJVUkxcdTZERkJcdTUyQTBcdTkyNzRcdTY3NDNcdTUzQzJcdTY1NzBcclxuICovXHJcbmFzeW5jIGZ1bmN0aW9uIGFkZEF1dGhUb1Byb3h5VXJsKHVybCkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICBjb25zdCBoYXNoID0gYXdhaXQgZ2V0UGFzc3dvcmRIYXNoKCk7XHJcbiAgICAgICAgaWYgKCFoYXNoKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignXHU2NUUwXHU2Q0Q1XHU4M0I3XHU1M0Q2XHU1QkM2XHU3ODAxXHU1NEM4XHU1RTBDXHVGRjBDXHU0RUUzXHU3NDA2XHU4QkY3XHU2QzQyXHU1M0VGXHU4MEZEXHU1OTMxXHU4RDI1Jyk7XHJcbiAgICAgICAgICAgIHJldHVybiB1cmw7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIFx1NkRGQlx1NTJBMFx1NjVGNlx1OTVGNFx1NjIzM1x1OTYzMlx1NkI2Mlx1OTFDRFx1NjUzRVx1NjUzQlx1NTFGQlxyXG4gICAgICAgIGNvbnN0IHRpbWVzdGFtcCA9IERhdGUubm93KCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gXHU2OEMwXHU2N0U1VVJMXHU2NjJGXHU1NDI2XHU1REYyXHU1MzA1XHU1NDJCXHU2N0U1XHU4QkUyXHU1M0MyXHU2NTcwXHJcbiAgICAgICAgY29uc3Qgc2VwYXJhdG9yID0gdXJsLmluY2x1ZGVzKCc/JykgPyAnJicgOiAnPyc7XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIGAke3VybH0ke3NlcGFyYXRvcn1hdXRoPSR7ZW5jb2RlVVJJQ29tcG9uZW50KGhhc2gpfSZ0PSR7dGltZXN0YW1wfWA7XHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1x1NkRGQlx1NTJBMFx1NEVFM1x1NzQwNlx1OTI3NFx1Njc0M1x1NTkzMVx1OEQyNTonLCBlcnJvcik7XHJcbiAgICAgICAgcmV0dXJuIHVybDtcclxuICAgIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIFx1OUE4Q1x1OEJDMVx1NEVFM1x1NzQwNlx1OEJGN1x1NkM0Mlx1NzY4NFx1OTI3NFx1Njc0M1xyXG4gKi9cclxuZnVuY3Rpb24gdmFsaWRhdGVQcm94eUF1dGgoYXV0aEhhc2gsIHNlcnZlclBhc3N3b3JkSGFzaCwgdGltZXN0YW1wKSB7XHJcbiAgICBpZiAoIWF1dGhIYXNoIHx8ICFzZXJ2ZXJQYXNzd29yZEhhc2gpIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIFx1OUE4Q1x1OEJDMVx1NTRDOFx1NUUwQ1x1NjYyRlx1NTQyNlx1NTMzOVx1OTE0RFxyXG4gICAgaWYgKGF1dGhIYXNoICE9PSBzZXJ2ZXJQYXNzd29yZEhhc2gpIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIFx1OUE4Q1x1OEJDMVx1NjVGNlx1OTVGNFx1NjIzM1x1RkYwODEwXHU1MjA2XHU5NDlGXHU2NzA5XHU2NTQ4XHU2NzFGXHVGRjA5XHJcbiAgICBjb25zdCBub3cgPSBEYXRlLm5vdygpO1xyXG4gICAgY29uc3QgbWF4QWdlID0gMTAgKiA2MCAqIDEwMDA7IC8vIDEwXHU1MjA2XHU5NDlGXHJcbiAgICBcclxuICAgIGlmICh0aW1lc3RhbXAgJiYgKG5vdyAtIHBhcnNlSW50KHRpbWVzdGFtcCkpID4gbWF4QWdlKSB7XHJcbiAgICAgICAgY29uc29sZS53YXJuKCdcdTRFRTNcdTc0MDZcdThCRjdcdTZDNDJcdTY1RjZcdTk1RjRcdTYyMzNcdThGQzdcdTY3MUYnKTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHJldHVybiB0cnVlO1xyXG59XHJcblxyXG4vKipcclxuICogXHU2RTA1XHU5NjY0XHU3RjEzXHU1QjU4XHU3Njg0XHU5Mjc0XHU2NzQzXHU0RkUxXHU2MDZGXHJcbiAqL1xyXG5mdW5jdGlvbiBjbGVhckF1dGhDYWNoZSgpIHtcclxuICAgIGNhY2hlZFBhc3N3b3JkSGFzaCA9IG51bGw7XHJcbiAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgncHJveHlBdXRoSGFzaCcpO1xyXG59XHJcblxyXG4vLyBcdTc2RDFcdTU0MkNcdTVCQzZcdTc4MDFcdTUzRDhcdTUzMTZcdUZGMENcdTZFMDVcdTk2NjRcdTdGMTNcdTVCNThcclxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3N0b3JhZ2UnLCAoZSkgPT4ge1xyXG4gICAgaWYgKGUua2V5ID09PSAndXNlclBhc3N3b3JkJyB8fCAod2luZG93LlBBU1NXT1JEX0NPTkZJRyAmJiBlLmtleSA9PT0gd2luZG93LlBBU1NXT1JEX0NPTkZJRy5sb2NhbFN0b3JhZ2VLZXkpKSB7XHJcbiAgICAgICAgY2xlYXJBdXRoQ2FjaGUoKTtcclxuICAgIH1cclxufSk7XHJcblxyXG4vLyBcdTVCRkNcdTUxRkFcdTUxRkRcdTY1NzBcclxud2luZG93LlByb3h5QXV0aCA9IHtcclxuICAgIGFkZEF1dGhUb1Byb3h5VXJsLFxyXG4gICAgdmFsaWRhdGVQcm94eUF1dGgsXHJcbiAgICBjbGVhckF1dGhDYWNoZSxcclxuICAgIGdldFBhc3N3b3JkSGFzaFxyXG59O1xyXG4iLCAiLy8gXHU1QkM2XHU3ODAxXHU0RkREXHU2MkE0XHU1MjlGXHU4MEZEXHJcblxyXG4vKipcclxuICogXHU2OEMwXHU2N0U1XHU2NjJGXHU1NDI2XHU4QkJFXHU3RjZFXHU0RTg2XHU1QkM2XHU3ODAxXHU0RkREXHU2MkE0XHJcbiAqIFx1OTAxQVx1OEZDN1x1OEJGQlx1NTNENlx1OTg3NVx1OTc2Mlx1NEUwQVx1NUQ0Q1x1NTE2NVx1NzY4NFx1NzNBRlx1NTg4M1x1NTNEOFx1OTFDRlx1Njc2NVx1NjhDMFx1NjdFNVxyXG4gKi9cclxuZnVuY3Rpb24gaXNQYXNzd29yZFByb3RlY3RlZCgpIHtcclxuICAgIC8vIFx1NTNFQVx1NjhDMFx1NjdFNVx1NjY2RVx1OTAxQVx1NUJDNlx1NzgwMVxyXG4gICAgY29uc3QgcHdkID0gd2luZG93Ll9fRU5WX18gJiYgd2luZG93Ll9fRU5WX18uUEFTU1dPUkQ7XHJcbiAgICBcclxuICAgIC8vIFx1NjhDMFx1NjdFNVx1NjY2RVx1OTAxQVx1NUJDNlx1NzgwMVx1NjYyRlx1NTQyNlx1NjcwOVx1NjU0OFxyXG4gICAgcmV0dXJuIHR5cGVvZiBwd2QgPT09ICdzdHJpbmcnICYmIHB3ZC5sZW5ndGggPT09IDY0ICYmICEvXjArJC8udGVzdChwd2QpO1xyXG59XHJcblxyXG4vKipcclxuICogXHU2OEMwXHU2N0U1XHU2NjJGXHU1NDI2XHU1RjNBXHU1MjM2XHU4OTgxXHU2QzQyXHU4QkJFXHU3RjZFXHU1QkM2XHU3ODAxXHJcbiAqIFx1NTk4Mlx1Njc5Q1x1NkNBMVx1NjcwOVx1OEJCRVx1N0Y2RVx1NjcwOVx1NjU0OFx1NzY4NCBQQVNTV09SRFx1RkYwQ1x1NTIxOVx1OEJBNFx1NEUzQVx1OTcwMFx1ODk4MVx1NUYzQVx1NTIzNlx1OEJCRVx1N0Y2RVx1NUJDNlx1NzgwMVxyXG4gKiBcdTRFM0FcdTRFODZcdTVCODlcdTUxNjhcdTgwMDNcdTg2NTFcdUZGMENcdTYyNDBcdTY3MDlcdTkwRThcdTdGNzJcdTkwRkRcdTVGQzVcdTk4N0JcdThCQkVcdTdGNkVcdTVCQzZcdTc4MDFcclxuICovXHJcbmZ1bmN0aW9uIGlzUGFzc3dvcmRSZXF1aXJlZCgpIHtcclxuICAgIHJldHVybiAhaXNQYXNzd29yZFByb3RlY3RlZCgpO1xyXG59XHJcblxyXG4vKipcclxuICogXHU1RjNBXHU1MjM2XHU1QkM2XHU3ODAxXHU0RkREXHU2MkE0XHU2OEMwXHU2N0U1IC0gXHU5NjMyXHU2QjYyXHU3RUQ1XHU4RkM3XHJcbiAqIFx1NTcyOFx1NTE3M1x1OTUyRVx1NjRDRFx1NEY1Q1x1NTI0RFx1OTBGRFx1NUU5NFx1OEJFNVx1OEMwM1x1NzUyOFx1NkI2NFx1NTFGRFx1NjU3MFxyXG4gKi9cclxuZnVuY3Rpb24gZW5zdXJlUGFzc3dvcmRQcm90ZWN0aW9uKCkge1xyXG4gICAgaWYgKGlzUGFzc3dvcmRSZXF1aXJlZCgpKSB7XHJcbiAgICAgICAgc2hvd1Bhc3N3b3JkTW9kYWwoKTtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Bhc3N3b3JkIHByb3RlY3Rpb24gaXMgcmVxdWlyZWQnKTtcclxuICAgIH1cclxuICAgIGlmIChpc1Bhc3N3b3JkUHJvdGVjdGVkKCkgJiYgIWlzUGFzc3dvcmRWZXJpZmllZCgpKSB7XHJcbiAgICAgICAgc2hvd1Bhc3N3b3JkTW9kYWwoKTtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Bhc3N3b3JkIHZlcmlmaWNhdGlvbiByZXF1aXJlZCcpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRydWU7XHJcbn1cclxuXHJcbndpbmRvdy5pc1Bhc3N3b3JkUHJvdGVjdGVkID0gaXNQYXNzd29yZFByb3RlY3RlZDtcclxud2luZG93LmlzUGFzc3dvcmRSZXF1aXJlZCA9IGlzUGFzc3dvcmRSZXF1aXJlZDtcclxuXHJcbi8vIFx1NTNFRlx1OTAwOVx1RkYxQVx1NjI1M1x1NUYwMFx1NzUzNVx1ODlDNlx1N0FFRlx1OEMwM1x1OEJENVxyXG5jb25zdCBQQVNTV09SRF9ERUJVRyA9IGZhbHNlO1xyXG5mdW5jdGlvbiBwd2RMb2coLi4uYXJncykge1xyXG4gICAgaWYgKFBBU1NXT1JEX0RFQlVHICYmIHR5cGVvZiBjb25zb2xlICE9PSAndW5kZWZpbmVkJyAmJiBjb25zb2xlLmxvZykge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdbcGFzc3dvcmRdJywgLi4uYXJncyk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBcdTlBOENcdThCQzFcdTc1MjhcdTYyMzdcdThGOTNcdTUxNjVcdTc2ODRcdTVCQzZcdTc4MDFcdTY2MkZcdTU0MjZcdTZCNjNcdTc4NkVcdUZGMDhcdTVGMDJcdTZCNjVcdUZGMENcdTRGN0ZcdTc1MjhTSEEtMjU2XHU1NEM4XHU1RTBDXHVGRjA5XHJcbiAqL1xyXG5hc3luYyBmdW5jdGlvbiB2ZXJpZnlQYXNzd29yZChwYXNzd29yZCkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICBjb25zdCBjb3JyZWN0SGFzaCA9IHdpbmRvdy5fX0VOVl9fPy5QQVNTV09SRDtcclxuICAgICAgICBwd2RMb2coJ2VudiBwYXNzd29yZCBoYXNoIHByZXNlbnQ6JywgISFjb3JyZWN0SGFzaCwgJ2xlbjonLCBjb3JyZWN0SGFzaCA/IGNvcnJlY3RIYXNoLmxlbmd0aCA6IDApO1xyXG4gICAgICAgIGlmICghY29ycmVjdEhhc2gpIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgY29uc3QgaW5wdXRIYXNoID0gYXdhaXQgc2hhMjU2KHBhc3N3b3JkKTtcclxuICAgICAgICBwd2RMb2coJ2lucHV0IGhhc2g6JywgaW5wdXRIYXNoKTtcclxuICAgICAgICBjb25zdCBpc1ZhbGlkID0gaW5wdXRIYXNoID09PSBjb3JyZWN0SGFzaDtcclxuXHJcbiAgICAgICAgaWYgKGlzVmFsaWQpIHtcclxuICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oUEFTU1dPUkRfQ09ORklHLmxvY2FsU3RvcmFnZUtleSwgSlNPTi5zdHJpbmdpZnkoe1xyXG4gICAgICAgICAgICAgICAgdmVyaWZpZWQ6IHRydWUsXHJcbiAgICAgICAgICAgICAgICB0aW1lc3RhbXA6IERhdGUubm93KCksXHJcbiAgICAgICAgICAgICAgICBwYXNzd29yZEhhc2g6IGNvcnJlY3RIYXNoXHJcbiAgICAgICAgICAgIH0pKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGlzVmFsaWQ7XHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1x1OUE4Q1x1OEJDMVx1NUJDNlx1NzgwMVx1NjVGNlx1NTFGQVx1OTUxOTonLCBlcnJvcik7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG59XHJcblxyXG4vLyBcdTlBOENcdThCQzFcdTcyQjZcdTYwMDFcdTY4QzBcdTY3RTVcclxuZnVuY3Rpb24gaXNQYXNzd29yZFZlcmlmaWVkKCkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICBpZiAoIWlzUGFzc3dvcmRQcm90ZWN0ZWQoKSkgcmV0dXJuIHRydWU7XHJcblxyXG4gICAgICAgIGNvbnN0IHN0b3JlZCA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKFBBU1NXT1JEX0NPTkZJRy5sb2NhbFN0b3JhZ2VLZXkpO1xyXG4gICAgICAgIGlmICghc3RvcmVkKSByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgIGNvbnN0IHsgdGltZXN0YW1wLCBwYXNzd29yZEhhc2ggfSA9IEpTT04ucGFyc2Uoc3RvcmVkKTtcclxuICAgICAgICBjb25zdCBjdXJyZW50SGFzaCA9IHdpbmRvdy5fX0VOVl9fPy5QQVNTV09SRDtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRpbWVzdGFtcCAmJiBwYXNzd29yZEhhc2ggPT09IGN1cnJlbnRIYXNoICYmXHJcbiAgICAgICAgICAgIERhdGUubm93KCkgLSB0aW1lc3RhbXAgPCBQQVNTV09SRF9DT05GSUcudmVyaWZpY2F0aW9uVFRMO1xyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdcdTY4QzBcdTY3RTVcdTVCQzZcdTc4MDFcdTlBOENcdThCQzFcdTcyQjZcdTYwMDFcdTY1RjZcdTUxRkFcdTk1MTk6JywgZXJyb3IpO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxufVxyXG5cclxuLy8gXHU2NkY0XHU2NUIwXHU1MTY4XHU1QzQwXHU1QkZDXHU1MUZBXHJcbndpbmRvdy5pc1Bhc3N3b3JkUHJvdGVjdGVkID0gaXNQYXNzd29yZFByb3RlY3RlZDtcclxud2luZG93LmlzUGFzc3dvcmRSZXF1aXJlZCA9IGlzUGFzc3dvcmRSZXF1aXJlZDtcclxud2luZG93LmlzUGFzc3dvcmRWZXJpZmllZCA9IGlzUGFzc3dvcmRWZXJpZmllZDtcclxud2luZG93LnZlcmlmeVBhc3N3b3JkID0gdmVyaWZ5UGFzc3dvcmQ7XHJcbndpbmRvdy5lbnN1cmVQYXNzd29yZFByb3RlY3Rpb24gPSBlbnN1cmVQYXNzd29yZFByb3RlY3Rpb247XHJcbndpbmRvdy5zaG93UGFzc3dvcmRNb2RhbCA9IHNob3dQYXNzd29yZE1vZGFsO1xyXG53aW5kb3cuaGlkZVBhc3N3b3JkTW9kYWwgPSBoaWRlUGFzc3dvcmRNb2RhbDtcclxuXHJcbi8vIFNIQS0yNTZcdTVCOUVcdTczQjBcdUZGMUFcdTRGMThcdTUxNDhcdTRGN0ZcdTc1MjggbGlicy9zaGEyNTYubWluLmpzXHVGRjA4d2luZG93Ll9qc1NoYTI1Nlx1RkYwOVx1RkYwQ1x1OTA3Rlx1NTE0RFx1NzUzNVx1ODlDNlx1N0FFRiBXZWJDcnlwdG8vVGV4dEVuY29kZXIgXHU1MTdDXHU1QkI5XHU2MDI3XHU5NUVFXHU5ODk4XHJcbmFzeW5jIGZ1bmN0aW9uIHNoYTI1NihtZXNzYWdlKSB7XHJcbiAgICAvLyAxKSBcdTRGMThcdTUxNDhcdThENzBcdTUzOUZcdTU5Q0IganMtc2hhMjU2XHVGRjA4XHU1NDBDXHU2QjY1XHU1QjlFXHU3M0IwXHVGRjBDXHU1MTdDXHU1QkI5XHU2MDI3XHU2NzAwXHU1OTdEXHVGRjA5XHJcbiAgICBpZiAodHlwZW9mIHdpbmRvdy5fanNTaGEyNTYgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICBwd2RMb2coJ3NoYTI1NiB2aWEgd2luZG93Ll9qc1NoYTI1NicpO1xyXG4gICAgICAgIHJldHVybiB3aW5kb3cuX2pzU2hhMjU2KG1lc3NhZ2UpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIDIpIFx1NTE3Nlx1NkIyMVx1NUMxRFx1OEJENSBXZWIgQ3J5cHRvIEFQSVxyXG4gICAgaWYgKHdpbmRvdy5jcnlwdG8gJiYgY3J5cHRvLnN1YnRsZSAmJiBjcnlwdG8uc3VidGxlLmRpZ2VzdCkge1xyXG4gICAgICAgIC8vIFRleHRFbmNvZGVyIFx1NTcyOFx1OTBFOFx1NTIwNlx1NzUzNVx1ODlDNlx1N0FFRlx1NTNFRlx1ODBGRFx1NEUwRFx1NUI1OFx1NTcyOFxyXG4gICAgICAgIGxldCBtc2dCdWZmZXI7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBUZXh0RW5jb2RlciAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgbXNnQnVmZmVyID0gbmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKG1lc3NhZ2UpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIFx1N0I4MFx1NjYxMyBVVEYtOCBcdTdGMTZcdTc4MDFcdTk2NERcdTdFQTdcdUZGMDhcdTg5ODZcdTc2RDZcdTVFMzhcdTc1MjggQVNDSUkvXHU0RTJEXHU2NTg3XHU1NzNBXHU2NjZGXHVGRjA5XHJcbiAgICAgICAgICAgIGNvbnN0IHV0ZjggPSB1bmVzY2FwZShlbmNvZGVVUklDb21wb25lbnQobWVzc2FnZSkpO1xyXG4gICAgICAgICAgICBjb25zdCBhcnIgPSBuZXcgVWludDhBcnJheSh1dGY4Lmxlbmd0aCk7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdXRmOC5sZW5ndGg7IGkrKykgYXJyW2ldID0gdXRmOC5jaGFyQ29kZUF0KGkpO1xyXG4gICAgICAgICAgICBtc2dCdWZmZXIgPSBhcnI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBoYXNoQnVmZmVyID0gYXdhaXQgY3J5cHRvLnN1YnRsZS5kaWdlc3QoJ1NIQS0yNTYnLCBtc2dCdWZmZXIpO1xyXG4gICAgICAgIGNvbnN0IGhhc2hBcnJheSA9IEFycmF5LmZyb20obmV3IFVpbnQ4QXJyYXkoaGFzaEJ1ZmZlcikpO1xyXG4gICAgICAgIHB3ZExvZygnc2hhMjU2IHZpYSBjcnlwdG8uc3VidGxlJyk7XHJcbiAgICAgICAgcmV0dXJuIGhhc2hBcnJheS5tYXAoYiA9PiBiLnRvU3RyaW5nKDE2KS5wYWRTdGFydCgyLCAnMCcpKS5qb2luKCcnKTtcclxuICAgIH1cclxuXHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIFNIQS0yNTYgaW1wbGVtZW50YXRpb24gYXZhaWxhYmxlLicpO1xyXG59XHJcblxyXG4vKipcclxuICogXHU2NjNFXHU3OTNBXHU1QkM2XHU3ODAxXHU5QThDXHU4QkMxXHU1RjM5XHU3QTk3XHJcbiAqL1xyXG5mdW5jdGlvbiBzaG93UGFzc3dvcmRNb2RhbCgpIHtcclxuICAgIGNvbnN0IHBhc3N3b3JkTW9kYWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGFzc3dvcmRNb2RhbCcpO1xyXG4gICAgaWYgKHBhc3N3b3JkTW9kYWwpIHtcclxuICAgICAgICAvLyBcdTk2MzJcdTZCNjJcdTUxRkFcdTczQjBcdThDNDZcdTc0RTNcdTUzM0FcdTU3REZcdTZFREFcdTUyQThcdTY3NjFcdUZGMDhcdTkwRThcdTUyMDZcdTk4NzVcdTk3NjJcdTUzRUZcdTgwRkRcdTZDQTFcdTY3MDlcdThCRTVcdTUxNDNcdTdEMjBcdUZGMDlcclxuICAgICAgICBjb25zdCBkb3ViYW5BcmVhID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RvdWJhbkFyZWEnKTtcclxuICAgICAgICBpZiAoZG91YmFuQXJlYSkgZG91YmFuQXJlYS5jbGFzc0xpc3QuYWRkKCdoaWRkZW4nKTtcclxuXHJcbiAgICAgICAgY29uc3QgY2FuY2VsQnRuID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Bhc3N3b3JkQ2FuY2VsQnRuJyk7XHJcbiAgICAgICAgaWYgKGNhbmNlbEJ0bikgY2FuY2VsQnRuLmNsYXNzTGlzdC5hZGQoJ2hpZGRlbicpO1xyXG5cclxuICAgICAgICAvLyBcdTY4QzBcdTY3RTVcdTY2MkZcdTU0MjZcdTk3MDBcdTg5ODFcdTVGM0FcdTUyMzZcdThCQkVcdTdGNkVcdTVCQzZcdTc4MDFcclxuICAgICAgICBpZiAoaXNQYXNzd29yZFJlcXVpcmVkKCkpIHtcclxuICAgICAgICAgICAgLy8gXHU0RkVFXHU2NTM5XHU1RjM5XHU3QTk3XHU1MTg1XHU1QkI5XHU2M0QwXHU3OTNBXHU3NTI4XHU2MjM3XHU5NzAwXHU4OTgxXHU1MTQ4XHU4QkJFXHU3RjZFXHU1QkM2XHU3ODAxXHJcbiAgICAgICAgICAgIGNvbnN0IHRpdGxlID0gcGFzc3dvcmRNb2RhbC5xdWVyeVNlbGVjdG9yKCdoMicpO1xyXG4gICAgICAgICAgICBjb25zdCBkZXNjcmlwdGlvbiA9IHBhc3N3b3JkTW9kYWwucXVlcnlTZWxlY3RvcigncCcpO1xyXG4gICAgICAgICAgICBpZiAodGl0bGUpIHRpdGxlLnRleHRDb250ZW50ID0gJ1x1OTcwMFx1ODk4MVx1OEJCRVx1N0Y2RVx1NUJDNlx1NzgwMSc7XHJcbiAgICAgICAgICAgIGlmIChkZXNjcmlwdGlvbikgZGVzY3JpcHRpb24udGV4dENvbnRlbnQgPSAnXHU4QkY3XHU1MTQ4XHU1NzI4XHU5MEU4XHU3RjcyXHU1RTczXHU1M0YwXHU4QkJFXHU3RjZFIFBBU1NXT1JEIFx1NzNBRlx1NTg4M1x1NTNEOFx1OTFDRlx1Njc2NVx1NEZERFx1NjJBNFx1NjBBOFx1NzY4NFx1NUI5RVx1NEY4Qic7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBcdTk2OTBcdTg1Q0ZcdTVCQzZcdTc4MDFcdThGOTNcdTUxNjVcdTY4NDZcdTU0OENcdTYzRDBcdTRFQTRcdTYzMDlcdTk0QUVcdUZGMENcdTUzRUFcdTY2M0VcdTc5M0FcdTYzRDBcdTc5M0FcdTRGRTFcdTYwNkZcclxuICAgICAgICAgICAgY29uc3QgZm9ybSA9IHBhc3N3b3JkTW9kYWwucXVlcnlTZWxlY3RvcignZm9ybScpO1xyXG4gICAgICAgICAgICBjb25zdCBlcnJvck1zZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYXNzd29yZEVycm9yJyk7XHJcbiAgICAgICAgICAgIGlmIChmb3JtKSBmb3JtLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcbiAgICAgICAgICAgIGlmIChlcnJvck1zZykge1xyXG4gICAgICAgICAgICAgICAgZXJyb3JNc2cudGV4dENvbnRlbnQgPSAnXHU0RTNBXHU3ODZFXHU0RkREXHU1Qjg5XHU1MTY4XHVGRjBDXHU1RkM1XHU5ODdCXHU4QkJFXHU3RjZFIFBBU1NXT1JEIFx1NzNBRlx1NTg4M1x1NTNEOFx1OTFDRlx1NjI0RFx1ODBGRFx1NEY3Rlx1NzUyOFx1NjcyQ1x1NjcwRFx1NTJBMVx1RkYwQ1x1OEJGN1x1ODA1NFx1N0NGQlx1N0JBMVx1NzQwNlx1NTQ1OFx1OEZEQlx1ODg0Q1x1OTE0RFx1N0Y2RSc7XHJcbiAgICAgICAgICAgICAgICBlcnJvck1zZy5jbGFzc0xpc3QucmVtb3ZlKCdoaWRkZW4nKTtcclxuICAgICAgICAgICAgICAgIGVycm9yTXNnLmNsYXNzTmFtZSA9ICd0ZXh0LXJlZC01MDAgbXQtMiBmb250LW1lZGl1bSc7IC8vIFx1NjUzOVx1NEUzQVx1NjZGNFx1OTE5Mlx1NzZFRVx1NzY4NFx1N0VBMlx1ODI3MlxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gXHU2QjYzXHU1RTM4XHU3Njg0XHU1QkM2XHU3ODAxXHU5QThDXHU4QkMxXHU2QTIxXHU1RjBGXHJcbiAgICAgICAgICAgIGNvbnN0IHRpdGxlID0gcGFzc3dvcmRNb2RhbC5xdWVyeVNlbGVjdG9yKCdoMicpO1xyXG4gICAgICAgICAgICBjb25zdCBkZXNjcmlwdGlvbiA9IHBhc3N3b3JkTW9kYWwucXVlcnlTZWxlY3RvcigncCcpO1xyXG4gICAgICAgICAgICBpZiAodGl0bGUpIHRpdGxlLnRleHRDb250ZW50ID0gJ1x1OEJCRlx1OTVFRVx1OUE4Q1x1OEJDMSc7XHJcbiAgICAgICAgICAgIGlmIChkZXNjcmlwdGlvbikgZGVzY3JpcHRpb24udGV4dENvbnRlbnQgPSAnXHU4QkY3XHU4RjkzXHU1MTY1XHU1QkM2XHU3ODAxXHU3RUU3XHU3RUVEXHU4QkJGXHU5NUVFJztcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGNvbnN0IGZvcm0gPSBwYXNzd29yZE1vZGFsLnF1ZXJ5U2VsZWN0b3IoJ2Zvcm0nKTtcclxuICAgICAgICAgICAgaWYgKGZvcm0pIGZvcm0uc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBcdTUxN0NcdTVCQjkgaW5kZXguaHRtbCBcdTUzRUZcdTgwRkRcdTg4QUJcdTUxODVcdTgwNTRcdTgxMUFcdTY3MkMgcmVtb3ZlQXR0cmlidXRlKCdjbGFzcycpIFx1NzY4NFx1NjBDNVx1NTFCNVx1RkYxQVx1NTlDQlx1N0VDOFx1NEVFNSBzdHlsZSBcdTRFM0FcdTUxQzZcclxuICAgICAgICBwYXNzd29yZE1vZGFsLnN0eWxlLmRpc3BsYXkgPSAnZmxleCc7XHJcbiAgICAgICAgcGFzc3dvcmRNb2RhbC5zdHlsZS52aXNpYmlsaXR5ID0gJ3Zpc2libGUnO1xyXG4gICAgICAgIHBhc3N3b3JkTW9kYWwuY2xhc3NMaXN0LnJlbW92ZSgnaGlkZGVuJyk7XHJcbiAgICAgICAgcGFzc3dvcmRNb2RhbC5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgJ2ZhbHNlJyk7XHJcblxyXG4gICAgICAgIC8vIFx1NTNFQVx1NjcwOVx1NTcyOFx1OTc1RVx1NUYzQVx1NTIzNlx1OEJCRVx1N0Y2RVx1NUJDNlx1NzgwMVx1NkEyMVx1NUYwRlx1NEUwQlx1NjI0RFx1ODA1QVx1NzEyNlx1OEY5M1x1NTE2NVx1Njg0NlxyXG4gICAgICAgIGlmICghaXNQYXNzd29yZFJlcXVpcmVkKCkpIHtcclxuICAgICAgICAgICAgLy8gXHU3ODZFXHU0RkREXHU4RjkzXHU1MTY1XHU2ODQ2XHU4M0I3XHU1M0Q2XHU3MTI2XHU3MEI5XHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcGFzc3dvcmRJbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYXNzd29yZElucHV0Jyk7XHJcbiAgICAgICAgICAgICAgICBpZiAocGFzc3dvcmRJbnB1dCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHBhc3N3b3JkSW5wdXQuZm9jdXMoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSwgMTAwKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBcdTk2OTBcdTg1Q0ZcdTVCQzZcdTc4MDFcdTlBOENcdThCQzFcdTVGMzlcdTdBOTdcclxuICovXHJcbmZ1bmN0aW9uIGhpZGVQYXNzd29yZE1vZGFsKCkge1xyXG4gICAgY29uc3QgcGFzc3dvcmRNb2RhbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYXNzd29yZE1vZGFsJyk7XHJcbiAgICBpZiAocGFzc3dvcmRNb2RhbCkge1xyXG4gICAgICAgIC8vIFx1OTY5MFx1ODVDRlx1NUJDNlx1NzgwMVx1OTUxOVx1OEJFRlx1NjNEMFx1NzkzQVxyXG4gICAgICAgIGhpZGVQYXNzd29yZEVycm9yKCk7XHJcblxyXG4gICAgICAgIC8vIFx1NkUwNVx1N0E3QVx1NUJDNlx1NzgwMVx1OEY5M1x1NTE2NVx1Njg0NlxyXG4gICAgICAgIGNvbnN0IHBhc3N3b3JkSW5wdXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGFzc3dvcmRJbnB1dCcpO1xyXG4gICAgICAgIGlmIChwYXNzd29yZElucHV0KSBwYXNzd29yZElucHV0LnZhbHVlID0gJyc7XHJcblxyXG4gICAgICAgIC8vIGluZGV4Lmh0bWwgXHU5MUNDXHU1M0VGXHU4MEZEXHU2MjhBIGNsYXNzIFx1NTE2OFx1NzlGQlx1OTY2NFx1NEU4Nlx1RkYwOHJlbW92ZUF0dHJpYnV0ZSgnY2xhc3MnKVx1RkYwOVx1RkYwQ1x1NkI2NFx1NTkwNFx1NUYzQVx1NTIzNlx1NTE5OVx1NTZERSBoaWRkZW5cclxuICAgICAgICBwYXNzd29yZE1vZGFsLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcbiAgICAgICAgcGFzc3dvcmRNb2RhbC5zdHlsZS52aXNpYmlsaXR5ID0gJ2hpZGRlbic7XHJcbiAgICAgICAgcGFzc3dvcmRNb2RhbC5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgJ2hpZGRlbicpO1xyXG4gICAgICAgIHBhc3N3b3JkTW9kYWwuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XHJcblxyXG4gICAgICAgIC8vIFx1NTk4Mlx1Njc5Q1x1NTQyRlx1NzUyOFx1OEM0Nlx1NzRFM1x1NTMzQVx1NTdERlx1NTIxOVx1NjYzRVx1NzkzQVx1OEM0Nlx1NzRFM1x1NTMzQVx1NTdERlxyXG4gICAgICAgIGlmIChsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnZG91YmFuRW5hYmxlZCcpID09PSAndHJ1ZScpIHtcclxuICAgICAgICAgICAgY29uc3QgZG91YmFuQXJlYSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkb3ViYW5BcmVhJyk7XHJcbiAgICAgICAgICAgIGlmIChkb3ViYW5BcmVhKSBkb3ViYW5BcmVhLmNsYXNzTGlzdC5yZW1vdmUoJ2hpZGRlbicpO1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIGluaXREb3ViYW4gPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgICAgIGluaXREb3ViYW4oKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIFx1NjYzRVx1NzkzQVx1NUJDNlx1NzgwMVx1OTUxOVx1OEJFRlx1NEZFMVx1NjA2RlxyXG4gKi9cclxuZnVuY3Rpb24gc2hvd1Bhc3N3b3JkRXJyb3IoKSB7XHJcbiAgICBjb25zdCBlcnJvckVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGFzc3dvcmRFcnJvcicpO1xyXG4gICAgaWYgKGVycm9yRWxlbWVudCkge1xyXG4gICAgICAgIGVycm9yRWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKCdoaWRkZW4nKTtcclxuICAgICAgICAvLyBpbmRleC5odG1sIFx1OTFDQ1x1NzUyOFx1NzY4NFx1NjYyRiBkaXNwbGF5Om5vbmVcclxuICAgICAgICBlcnJvckVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBcdTk2OTBcdTg1Q0ZcdTVCQzZcdTc4MDFcdTk1MTlcdThCRUZcdTRGRTFcdTYwNkZcclxuICovXHJcbmZ1bmN0aW9uIGhpZGVQYXNzd29yZEVycm9yKCkge1xyXG4gICAgY29uc3QgZXJyb3JFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Bhc3N3b3JkRXJyb3InKTtcclxuICAgIGlmIChlcnJvckVsZW1lbnQpIHtcclxuICAgICAgICBlcnJvckVsZW1lbnQuY2xhc3NMaXN0LmFkZCgnaGlkZGVuJyk7XHJcbiAgICAgICAgLy8gaW5kZXguaHRtbCBcdTkxQ0NcdTc1MjhcdTc2ODRcdTY2MkYgZGlzcGxheTpub25lXHJcbiAgICAgICAgZXJyb3JFbGVtZW50LnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBcdTU5MDRcdTc0MDZcdTVCQzZcdTc4MDFcdTYzRDBcdTRFQTRcdTRFOEJcdTRFRjZcdUZGMDhcdTVGMDJcdTZCNjVcdUZGMDlcclxuICovXHJcbmFzeW5jIGZ1bmN0aW9uIGhhbmRsZVBhc3N3b3JkU3VibWl0KGV2ZW50KSB7XHJcbiAgICAvLyBcdTUxN0NcdTVCQjlcdTUxODVcdTgwNTQgb25zdWJtaXQgXHU1NDhDIGFkZEV2ZW50TGlzdGVuZXJcclxuICAgIGlmIChldmVudCAmJiB0eXBlb2YgZXZlbnQucHJldmVudERlZmF1bHQgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHBhc3N3b3JkSW5wdXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGFzc3dvcmRJbnB1dCcpO1xyXG4gICAgY29uc3QgcGFzc3dvcmQgPSBwYXNzd29yZElucHV0ID8gcGFzc3dvcmRJbnB1dC52YWx1ZS50cmltKCkgOiAnJztcclxuXHJcbiAgICAvLyBcdTY4MjFcdTlBOENcdTYyMTBcdTUyOUZcdTY1RjZcdTc4NkVcdTRGRERcdTdBQ0JcdTUzNzNcdTUxNzNcdTk1RURcdTVGMzlcdTdBOTdcdUZGMDhcdTU0RUFcdTYwMTVcdTRFOEJcdTRFRjZcdTZEM0VcdTUzRDEvXHU1NDBFXHU3RUVEXHU5MDNCXHU4RjkxXHU1OTMxXHU4RDI1XHVGRjA5XHJcbiAgICBjb25zdCBvayA9IGF3YWl0IHZlcmlmeVBhc3N3b3JkKHBhc3N3b3JkKTtcclxuICAgIGlmIChvaykge1xyXG4gICAgICAgIGhpZGVQYXNzd29yZE1vZGFsKCk7XHJcblxyXG4gICAgICAgIC8vIFx1ODlFNlx1NTNEMVx1NUJDNlx1NzgwMVx1OUE4Q1x1OEJDMVx1NjIxMFx1NTI5Rlx1NEU4Qlx1NEVGNlx1RkYwOFx1OTBFOFx1NTIwNlx1NzUzNVx1ODlDNlx1NkQ0Rlx1ODlDOFx1NTY2OFx1NEUwRFx1NjUyRlx1NjMwMSBDdXN0b21FdmVudFx1RkYwOVxyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygd2luZG93LkN1c3RvbUV2ZW50ID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudCgncGFzc3dvcmRWZXJpZmllZCcpKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGV2dCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdFdmVudCcpO1xyXG4gICAgICAgICAgICAgICAgZXZ0LmluaXRFdmVudCgncGFzc3dvcmRWZXJpZmllZCcsIHRydWUsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChldnQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAvLyBcdTVGRkRcdTc1NjVcdTRFOEJcdTRFRjZcdTZEM0VcdTUzRDFcdTU5MzFcdThEMjVcdUZGMENcdTkwN0ZcdTUxNERcdTVGNzFcdTU0Q0RcdTRFM0JcdTZENDFcdTdBMEJcclxuICAgICAgICAgICAgY29uc29sZS53YXJuKCdkaXNwYXRjaCBwYXNzd29yZFZlcmlmaWVkIGV2ZW50IGZhaWxlZDonLCBlKTtcclxuICAgICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHNob3dQYXNzd29yZEVycm9yKCk7XHJcbiAgICAgICAgaWYgKHBhc3N3b3JkSW5wdXQpIHtcclxuICAgICAgICAgICAgcGFzc3dvcmRJbnB1dC52YWx1ZSA9ICcnO1xyXG4gICAgICAgICAgICBwYXNzd29yZElucHV0LmZvY3VzKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG4vLyBcdTY2M0VcdTVGMEZcdTY2QjRcdTk3MzJcdTUyMzBcdTUxNjhcdTVDNDBcdUZGMENcdTc4NkVcdTRGRERcdTUxODVcdTgwNTQgb25zdWJtaXQ9XCJoYW5kbGVQYXNzd29yZFN1Ym1pdCgpXCIgXHU1NzI4XHU4MDAxXHU2NUU3XHU2RDRGXHU4OUM4XHU1NjY4XHU1M0VGXHU3NTI4XHJcbndpbmRvdy5oYW5kbGVQYXNzd29yZFN1Ym1pdCA9IGhhbmRsZVBhc3N3b3JkU3VibWl0O1xyXG5cclxuLyoqXHJcbiAqIFx1NTIxRFx1NTlDQlx1NTMxNlx1NUJDNlx1NzgwMVx1OUE4Q1x1OEJDMVx1N0NGQlx1N0VERlxyXG4gKi9cclxuZnVuY3Rpb24gaW5pdFBhc3N3b3JkUHJvdGVjdGlvbigpIHtcclxuICAgIC8vIFx1NTk4Mlx1Njc5Q1x1OEJCRVx1N0Y2RVx1NEU4Nlx1NUJDNlx1NzgwMVx1NEY0Nlx1NzUyOFx1NjIzN1x1NURGMlx1OUE4Q1x1OEJDMVx1RkYwQ1x1Nzg2RVx1NEZERFx1NUYzOVx1N0E5N1x1ODhBQlx1NTE3M1x1OTVFRFx1RkYwOFx1NTE3Q1x1NUJCOVx1NTE4NVx1ODA1NFx1ODExQVx1NjcyQ1x1NURGMlx1NjYzRVx1NzkzQVx1NzY4NFx1NjBDNVx1NTFCNVx1RkYwOVxyXG4gICAgaWYgKGlzUGFzc3dvcmRQcm90ZWN0ZWQoKSAmJiBpc1Bhc3N3b3JkVmVyaWZpZWQoKSkge1xyXG4gICAgICAgIGhpZGVQYXNzd29yZE1vZGFsKCk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgLy8gXHU1OTgyXHU2NzlDXHU5NzAwXHU4OTgxXHU1RjNBXHU1MjM2XHU4QkJFXHU3RjZFXHU1QkM2XHU3ODAxXHVGRjBDXHU2NjNFXHU3OTNBXHU4QjY2XHU1NDRBXHU1RjM5XHU3QTk3XHJcbiAgICBpZiAoaXNQYXNzd29yZFJlcXVpcmVkKCkpIHtcclxuICAgICAgICBzaG93UGFzc3dvcmRNb2RhbCgpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIC8vIFx1NTk4Mlx1Njc5Q1x1OEJCRVx1N0Y2RVx1NEU4Nlx1NUJDNlx1NzgwMVx1NEY0Nlx1NzUyOFx1NjIzN1x1NjcyQVx1OUE4Q1x1OEJDMVx1RkYwQ1x1NjYzRVx1NzkzQVx1NUJDNlx1NzgwMVx1OEY5M1x1NTE2NVx1Njg0NlxyXG4gICAgaWYgKGlzUGFzc3dvcmRQcm90ZWN0ZWQoKSAmJiAhaXNQYXNzd29yZFZlcmlmaWVkKCkpIHtcclxuICAgICAgICBzaG93UGFzc3dvcmRNb2RhbCgpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxufVxyXG5cclxuLy8gXHU1NzI4XHU5ODc1XHU5NzYyXHU1MkEwXHU4RjdEXHU1QjhDXHU2MjEwXHU1NDBFXHU1MjFEXHU1OUNCXHU1MzE2XHU1QkM2XHU3ODAxXHU0RkREXHU2MkE0XHJcbi8vIFx1NTQwQ1x1NjVGNlx1N0VEMVx1NUI5QVx1ODg2OFx1NTM1NSBzdWJtaXQgXHU0RThCXHU0RUY2XHVGRjBDXHU5MDdGXHU1MTREXHU5MEU4XHU1MjA2XHU3NTM1XHU4OUM2XHU3QUVGXHU1QkY5XHU1MTg1XHU4MDU0XHU0RThCXHU0RUY2L1x1NUYwMlx1NkI2NVx1NTkwNFx1NzQwNlx1NTE3Q1x1NUJCOVx1NjAyN1x1OTVFRVx1OTg5OFxyXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgY29uc3QgZm9ybSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYXNzd29yZEZvcm0nKTtcclxuICAgIGlmIChmb3JtICYmICFmb3JtLl9fcGFzc3dvcmRCb3VuZCkge1xyXG4gICAgICAgIGZvcm0uYWRkRXZlbnRMaXN0ZW5lcignc3VibWl0JywgaGFuZGxlUGFzc3dvcmRTdWJtaXQpO1xyXG4gICAgICAgIGZvcm0uX19wYXNzd29yZEJvdW5kID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBpbml0UGFzc3dvcmRQcm90ZWN0aW9uKCk7XHJcbn0pOyIsICJjb25zdCBzZWxlY3RlZEFQSXMgPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdzZWxlY3RlZEFQSXMnKSB8fCAnW10nKTtcclxuY29uc3QgY3VzdG9tQVBJcyA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2N1c3RvbUFQSXMnKSB8fCAnW10nKTsgLy8gXHU1QjU4XHU1MEE4XHU4MUVBXHU1QjlBXHU0RTQ5QVBJXHU1MjE3XHU4ODY4XHJcblxyXG4vLyBcdTY1MzlcdThGREJcdThGRDRcdTU2REVcdTUyOUZcdTgwRkRcclxuZnVuY3Rpb24gZ29CYWNrKGV2ZW50KSB7XHJcbiAgICAvLyBcdTk2MzJcdTZCNjJcdTlFRDhcdThCQTRcdTk0RkVcdTYzQTVcdTg4NENcdTRFM0FcclxuICAgIGlmIChldmVudCkgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgIFxyXG4gICAgLy8gMS4gXHU0RjE4XHU1MTQ4XHU2OEMwXHU2N0U1VVJMXHU1M0MyXHU2NTcwXHU0RTJEXHU3Njg0cmV0dXJuVXJsXHJcbiAgICBjb25zdCB1cmxQYXJhbXMgPSBuZXcgVVJMU2VhcmNoUGFyYW1zKHdpbmRvdy5sb2NhdGlvbi5zZWFyY2gpO1xyXG4gICAgY29uc3QgcmV0dXJuVXJsID0gdXJsUGFyYW1zLmdldCgncmV0dXJuVXJsJyk7XHJcbiAgICBcclxuICAgIGlmIChyZXR1cm5VcmwpIHtcclxuICAgICAgICAvLyBcdTU5ODJcdTY3OUNVUkxcdTRFMkRcdTY3MDlyZXR1cm5VcmxcdTUzQzJcdTY1NzBcdUZGMENcdTRGMThcdTUxNDhcdTRGN0ZcdTc1MjhcclxuICAgICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IGRlY29kZVVSSUNvbXBvbmVudChyZXR1cm5VcmwpO1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gMi4gXHU2OEMwXHU2N0U1bG9jYWxTdG9yYWdlXHU0RTJEXHU0RkREXHU1QjU4XHU3Njg0bGFzdFBhZ2VVcmxcclxuICAgIGNvbnN0IGxhc3RQYWdlVXJsID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2xhc3RQYWdlVXJsJyk7XHJcbiAgICBpZiAobGFzdFBhZ2VVcmwgJiYgbGFzdFBhZ2VVcmwgIT09IHdpbmRvdy5sb2NhdGlvbi5ocmVmKSB7XHJcbiAgICAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSBsYXN0UGFnZVVybDtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIDMuIFx1NjhDMFx1NjdFNVx1NjYyRlx1NTQyNlx1NjYyRlx1NEVDRVx1NjQxQ1x1N0QyMlx1OTg3NVx1OTc2Mlx1OEZEQlx1NTE2NVx1NzY4NFx1NjRBRFx1NjUzRVx1NTY2OFxyXG4gICAgY29uc3QgcmVmZXJyZXIgPSBkb2N1bWVudC5yZWZlcnJlcjtcclxuICAgIFxyXG4gICAgLy8gXHU2OEMwXHU2N0U1IHJlZmVycmVyIFx1NjYyRlx1NTQyNlx1NTMwNVx1NTQyQlx1NjQxQ1x1N0QyMlx1NTNDMlx1NjU3MFxyXG4gICAgaWYgKHJlZmVycmVyICYmIChyZWZlcnJlci5pbmNsdWRlcygnL3M9JykgfHwgcmVmZXJyZXIuaW5jbHVkZXMoJz9zPScpKSkge1xyXG4gICAgICAgIC8vIFx1NTk4Mlx1Njc5Q1x1NjYyRlx1NEVDRVx1NjQxQ1x1N0QyMlx1OTg3NVx1OTc2Mlx1Njc2NVx1NzY4NFx1RkYwQ1x1OEZENFx1NTZERVx1NTIzMFx1NjQxQ1x1N0QyMlx1OTg3NVx1OTc2MlxyXG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gcmVmZXJyZXI7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyA0LiBcdTU5ODJcdTY3OUNcdTY2MkZcdTU3MjhpZnJhbWVcdTRFMkRcdTYyNTNcdTVGMDBcdTc2ODRcdUZGMENcdTVDMURcdThCRDVcdTUxNzNcdTk1RURpZnJhbWVcclxuICAgIGlmICh3aW5kb3cuc2VsZiAhPT0gd2luZG93LnRvcCkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIC8vIFx1NUMxRFx1OEJENVx1OEMwM1x1NzUyOFx1NzIzNlx1N0E5N1x1NTNFM1x1NzY4NFx1NTE3M1x1OTVFRFx1NjRBRFx1NjUzRVx1NTY2OFx1NTFGRFx1NjU3MFxyXG4gICAgICAgICAgICB3aW5kb3cucGFyZW50LmNsb3NlVmlkZW9QbGF5ZXIgJiYgd2luZG93LnBhcmVudC5jbG9zZVZpZGVvUGxheWVyKCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1x1OEMwM1x1NzUyOFx1NzIzNlx1N0E5N1x1NTNFM2Nsb3NlVmlkZW9QbGF5ZXJcdTU5MzFcdThEMjU6JywgZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyA1LiBcdTY1RTBcdTZDRDVcdTc4NkVcdTVCOUFcdTRFMEFcdTRFMDBcdTk4NzVcdUZGMENcdTUyMTlcdThGRDRcdTU2REVcdTk5OTZcdTk4NzVcclxuICAgIGlmICghcmVmZXJyZXIgfHwgcmVmZXJyZXIgPT09ICcnKSB7XHJcbiAgICAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSAnLyc7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyA2LiBcdTRFRTVcdTRFMEFcdTkwRkRcdTRFMERcdTZFRTFcdThEQjNcdUZGMENcdTRGN0ZcdTc1MjhcdTlFRDhcdThCQTRcdTg4NENcdTRFM0FcdUZGMUFcdThGRDRcdTU2REVcdTRFMEFcdTRFMDBcdTk4NzVcclxuICAgIHdpbmRvdy5oaXN0b3J5LmJhY2soKTtcclxufVxyXG5cclxuLy8gXHU5ODc1XHU5NzYyXHU1MkEwXHU4RjdEXHU2NUY2XHU0RkREXHU1QjU4XHU1RjUzXHU1MjREVVJMXHU1MjMwbG9jYWxTdG9yYWdlXHVGRjBDXHU0RjVDXHU0RTNBXHU4RkQ0XHU1NkRFXHU3NkVFXHU2ODA3XHJcbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gXHU0RkREXHU1QjU4XHU1MjREXHU0RTAwXHU5ODc1XHU5NzYyVVJMXHJcbiAgICBpZiAoZG9jdW1lbnQucmVmZXJyZXIgJiYgZG9jdW1lbnQucmVmZXJyZXIgIT09IHdpbmRvdy5sb2NhdGlvbi5ocmVmKSB7XHJcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2xhc3RQYWdlVXJsJywgZG9jdW1lbnQucmVmZXJyZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFx1NjNEMFx1NTNENlx1NUY1M1x1NTI0RFVSTFx1NEUyRFx1NzY4NFx1OTFDRFx1ODk4MVx1NTNDMlx1NjU3MFx1RkYwQ1x1NEVFNVx1NEZCRlx1NTcyOFx1OTcwMFx1ODk4MVx1NjVGNlx1ODBGRFx1NTkxRlx1NjA2Mlx1NTkwRFx1NUY1M1x1NTI0RFx1OTg3NVx1OTc2MlxyXG4gICAgY29uc3QgdXJsUGFyYW1zID0gbmV3IFVSTFNlYXJjaFBhcmFtcyh3aW5kb3cubG9jYXRpb24uc2VhcmNoKTtcclxuICAgIGNvbnN0IHZpZGVvSWQgPSB1cmxQYXJhbXMuZ2V0KCdpZCcpO1xyXG4gICAgY29uc3Qgc291cmNlQ29kZSA9IHVybFBhcmFtcy5nZXQoJ3NvdXJjZScpO1xyXG5cclxuICAgIGlmICh2aWRlb0lkICYmIHNvdXJjZUNvZGUpIHtcclxuICAgICAgICAvLyBcdTRGRERcdTVCNThcdTVGNTNcdTUyNERcdTY0QURcdTY1M0VcdTcyQjZcdTYwMDFcdUZGMENcdTRFRTVcdTRGQkZcdTUxNzZcdTRFRDZcdTk4NzVcdTk3NjJcdTUzRUZcdTRFRTVcdThGRDRcdTU2REVcclxuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnY3VycmVudFBsYXlpbmdJZCcsIHZpZGVvSWQpO1xyXG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdjdXJyZW50UGxheWluZ1NvdXJjZScsIHNvdXJjZUNvZGUpO1xyXG4gICAgfVxyXG59KTtcclxuXHJcblxyXG4vLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cclxuLy8gPT09PT09PT09PT09PT0gUExBWUVSID09PT09PT09PT1cclxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XHJcbi8vIFx1NTE2OFx1NUM0MFx1NTNEOFx1OTFDRlxyXG5sZXQgY3VycmVudFZpZGVvVGl0bGUgPSAnJztcclxubGV0IGN1cnJlbnRFcGlzb2RlSW5kZXggPSAwO1xyXG5sZXQgYXJ0ID0gbnVsbDsgLy8gXHU3NTI4XHU0RThFIEFydFBsYXllciBcdTVCOUVcdTRGOEJcclxubGV0IGN1cnJlbnRIbHMgPSBudWxsOyAvLyBcdThEREZcdThFMkFcdTVGNTNcdTUyNERITFNcdTVCOUVcdTRGOEJcclxubGV0IGN1cnJlbnRFcGlzb2RlcyA9IFtdO1xyXG5sZXQgZXBpc29kZXNSZXZlcnNlZCA9IGZhbHNlO1xyXG5sZXQgYXV0b3BsYXlFbmFibGVkID0gdHJ1ZTsgLy8gXHU5RUQ4XHU4QkE0XHU1RjAwXHU1NDJGXHU4MUVBXHU1MkE4XHU4RkRFXHU2NEFEXHJcbmxldCB2aWRlb0hhc0VuZGVkID0gZmFsc2U7IC8vIFx1OERERlx1OEUyQVx1ODlDNlx1OTg5MVx1NjYyRlx1NTQyNlx1NURGMlx1N0VDRlx1ODFFQVx1NzEzNlx1N0VEM1x1Njc1RlxyXG5sZXQgdXNlckNsaWNrZWRQb3NpdGlvbiA9IG51bGw7IC8vIFx1OEJCMFx1NUY1NVx1NzUyOFx1NjIzN1x1NzBCOVx1NTFGQlx1NzY4NFx1NEY0RFx1N0Y2RVxyXG5sZXQgc2hvcnRjdXRIaW50VGltZW91dCA9IG51bGw7IC8vIFx1NzUyOFx1NEU4RVx1NjNBN1x1NTIzNlx1NUZFQlx1NjM3N1x1OTUyRVx1NjNEMFx1NzkzQVx1NjYzRVx1NzkzQVx1NjVGNlx1OTVGNFxyXG5sZXQgYWRGaWx0ZXJpbmdFbmFibGVkID0gdHJ1ZTsgLy8gXHU5RUQ4XHU4QkE0XHU1RjAwXHU1NDJGXHU1RTdGXHU1NDRBXHU4RkM3XHU2RUU0XHJcbmxldCBwcm9ncmVzc1NhdmVJbnRlcnZhbCA9IG51bGw7IC8vIFx1NUI5QVx1NjcxRlx1NEZERFx1NUI1OFx1OEZEQlx1NUVBNlx1NzY4NFx1OEJBMVx1NjVGNlx1NTY2OFxyXG5sZXQgY3VycmVudFZpZGVvVXJsID0gJyc7IC8vIFx1OEJCMFx1NUY1NVx1NUY1M1x1NTI0RFx1NUI5RVx1OTY0NVx1NzY4NFx1ODlDNlx1OTg5MVVSTFxyXG5jb25zdCBpc1dlYmtpdCA9ICh0eXBlb2Ygd2luZG93LndlYmtpdENvbnZlcnRQb2ludEZyb21Ob2RlVG9QYWdlID09PSAnZnVuY3Rpb24nKVxyXG5BcnRwbGF5ZXIuRlVMTFNDUkVFTl9XRUJfSU5fQk9EWSA9IHRydWU7XHJcblxyXG4vLyBcdTk4NzVcdTk3NjJcdTUyQTBcdThGN0RcclxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGZ1bmN0aW9uICgpIHtcclxuICAgIC8vIFx1NTE0OFx1NjhDMFx1NjdFNVx1NzUyOFx1NjIzN1x1NjYyRlx1NTQyNlx1NURGMlx1OTAxQVx1OEZDN1x1NUJDNlx1NzgwMVx1OUE4Q1x1OEJDMVxyXG4gICAgaWYgKCFpc1Bhc3N3b3JkVmVyaWZpZWQoKSkge1xyXG4gICAgICAgIC8vIFx1OTY5MFx1ODVDRlx1NTJBMFx1OEY3RFx1NjNEMFx1NzkzQVxyXG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwbGF5ZXItbG9hZGluZycpLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGluaXRpYWxpemVQYWdlQ29udGVudCgpO1xyXG59KTtcclxuXHJcbi8vIFx1NzZEMVx1NTQyQ1x1NUJDNlx1NzgwMVx1OUE4Q1x1OEJDMVx1NjIxMFx1NTI5Rlx1NEU4Qlx1NEVGNlxyXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdwYXNzd29yZFZlcmlmaWVkJywgKCkgPT4ge1xyXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BsYXllci1sb2FkaW5nJykuc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XHJcblxyXG4gICAgaW5pdGlhbGl6ZVBhZ2VDb250ZW50KCk7XHJcbn0pO1xyXG5cclxuLy8gXHU1MjFEXHU1OUNCXHU1MzE2XHU5ODc1XHU5NzYyXHU1MTg1XHU1QkI5XHJcbmZ1bmN0aW9uIGluaXRpYWxpemVQYWdlQ29udGVudCgpIHtcclxuXHJcbiAgICAvLyBcdTg5RTNcdTY3OTBVUkxcdTUzQzJcdTY1NzBcclxuICAgIGNvbnN0IHVybFBhcmFtcyA9IG5ldyBVUkxTZWFyY2hQYXJhbXMod2luZG93LmxvY2F0aW9uLnNlYXJjaCk7XHJcbiAgICBsZXQgdmlkZW9VcmwgPSB1cmxQYXJhbXMuZ2V0KCd1cmwnKTtcclxuICAgIGNvbnN0IHRpdGxlID0gdXJsUGFyYW1zLmdldCgndGl0bGUnKTtcclxuICAgIGNvbnN0IHNvdXJjZUNvZGUgPSB1cmxQYXJhbXMuZ2V0KCdzb3VyY2UnKTtcclxuICAgIGxldCBpbmRleCA9IHBhcnNlSW50KHVybFBhcmFtcy5nZXQoJ2luZGV4JykgfHwgJzAnKTtcclxuICAgIGNvbnN0IGVwaXNvZGVzTGlzdCA9IHVybFBhcmFtcy5nZXQoJ2VwaXNvZGVzJyk7IC8vIFx1NEVDRVVSTFx1ODNCN1x1NTNENlx1OTZDNlx1NjU3MFx1NEZFMVx1NjA2RlxyXG4gICAgY29uc3Qgc2F2ZWRQb3NpdGlvbiA9IHBhcnNlSW50KHVybFBhcmFtcy5nZXQoJ3Bvc2l0aW9uJykgfHwgJzAnKTsgLy8gXHU4M0I3XHU1M0Q2XHU0RkREXHU1QjU4XHU3Njg0XHU2NEFEXHU2NTNFXHU0RjREXHU3RjZFXHJcbiAgICAvLyBcdTg5RTNcdTUxQjNcdTUzODZcdTUzRjJcdThCQjBcdTVGNTVcdTk1RUVcdTk4OThcdUZGMUFcdTY4QzBcdTY3RTVVUkxcdTY2MkZcdTU0MjZcdTY2MkZwbGF5ZXIuaHRtbFx1NUYwMFx1NTkzNFx1NzY4NFx1OTRGRVx1NjNBNVxyXG4gICAgLy8gXHU1OTgyXHU2NzlDXHU2NjJGXHVGRjBDXHU4QkY0XHU2NjBFXHU4RkQ5XHU2NjJGXHU1Mzg2XHU1M0YyXHU4QkIwXHU1RjU1XHU5MUNEXHU1QjlBXHU1NDExXHVGRjBDXHU5NzAwXHU4OTgxXHU4OUUzXHU2NzkwXHU3NzFGXHU1QjlFXHU3Njg0XHU4OUM2XHU5ODkxVVJMXHJcbiAgICBpZiAodmlkZW9VcmwgJiYgdmlkZW9VcmwuaW5jbHVkZXMoJ3BsYXllci5odG1sJykpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAvLyBcdTVDMURcdThCRDVcdTRFQ0VcdTVENENcdTU5NTdVUkxcdTRFMkRcdTYzRDBcdTUzRDZcdTc3MUZcdTVCOUVcdTc2ODRcdTg5QzZcdTk4OTFcdTk0RkVcdTYzQTVcclxuICAgICAgICAgICAgY29uc3QgbmVzdGVkVXJsUGFyYW1zID0gbmV3IFVSTFNlYXJjaFBhcmFtcyh2aWRlb1VybC5zcGxpdCgnPycpWzFdKTtcclxuICAgICAgICAgICAgLy8gXHU0RUNFXHU1RDRDXHU1OTU3XHU1M0MyXHU2NTcwXHU0RTJEXHU4M0I3XHU1M0Q2XHU3NzFGXHU1QjlFXHU4OUM2XHU5ODkxVVJMXHJcbiAgICAgICAgICAgIGNvbnN0IG5lc3RlZFZpZGVvVXJsID0gbmVzdGVkVXJsUGFyYW1zLmdldCgndXJsJyk7XHJcbiAgICAgICAgICAgIC8vIFx1NjhDMFx1NjdFNVx1NUQ0Q1x1NTk1N1VSTFx1NjYyRlx1NTQyNlx1NTMwNVx1NTQyQlx1NjRBRFx1NjUzRVx1NEY0RFx1N0Y2RVx1NEZFMVx1NjA2RlxyXG4gICAgICAgICAgICBjb25zdCBuZXN0ZWRQb3NpdGlvbiA9IG5lc3RlZFVybFBhcmFtcy5nZXQoJ3Bvc2l0aW9uJyk7XHJcbiAgICAgICAgICAgIGNvbnN0IG5lc3RlZEluZGV4ID0gbmVzdGVkVXJsUGFyYW1zLmdldCgnaW5kZXgnKTtcclxuICAgICAgICAgICAgY29uc3QgbmVzdGVkVGl0bGUgPSBuZXN0ZWRVcmxQYXJhbXMuZ2V0KCd0aXRsZScpO1xyXG5cclxuICAgICAgICAgICAgaWYgKG5lc3RlZFZpZGVvVXJsKSB7XHJcbiAgICAgICAgICAgICAgICB2aWRlb1VybCA9IG5lc3RlZFZpZGVvVXJsO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFx1NjZGNFx1NjVCMFx1NUY1M1x1NTI0RFVSTFx1NTNDMlx1NjU3MFxyXG4gICAgICAgICAgICAgICAgY29uc3QgdXJsID0gbmV3IFVSTCh3aW5kb3cubG9jYXRpb24uaHJlZik7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXVybFBhcmFtcy5oYXMoJ3Bvc2l0aW9uJykgJiYgbmVzdGVkUG9zaXRpb24pIHtcclxuICAgICAgICAgICAgICAgICAgICB1cmwuc2VhcmNoUGFyYW1zLnNldCgncG9zaXRpb24nLCBuZXN0ZWRQb3NpdGlvbik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoIXVybFBhcmFtcy5oYXMoJ2luZGV4JykgJiYgbmVzdGVkSW5kZXgpIHtcclxuICAgICAgICAgICAgICAgICAgICB1cmwuc2VhcmNoUGFyYW1zLnNldCgnaW5kZXgnLCBuZXN0ZWRJbmRleCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAoIXVybFBhcmFtcy5oYXMoJ3RpdGxlJykgJiYgbmVzdGVkVGl0bGUpIHtcclxuICAgICAgICAgICAgICAgICAgICB1cmwuc2VhcmNoUGFyYW1zLnNldCgndGl0bGUnLCBuZXN0ZWRUaXRsZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvLyBcdTY2RkZcdTYzNjJcdTVGNTNcdTUyNERVUkxcclxuICAgICAgICAgICAgICAgIHdpbmRvdy5oaXN0b3J5LnJlcGxhY2VTdGF0ZSh7fSwgJycsIHVybCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBzaG93RXJyb3IoJ1x1NTM4Nlx1NTNGMlx1OEJCMFx1NUY1NVx1OTRGRVx1NjNBNVx1NjVFMFx1NjU0OFx1RkYwQ1x1OEJGN1x1OEZENFx1NTZERVx1OTk5Nlx1OTg3NVx1OTFDRFx1NjVCMFx1OEJCRlx1OTVFRScpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBcdTRGRERcdTVCNThcdTVGNTNcdTUyNERcdTg5QzZcdTk4OTFVUkxcclxuICAgIGN1cnJlbnRWaWRlb1VybCA9IHZpZGVvVXJsIHx8ICcnO1xyXG5cclxuICAgIC8vIFx1NEVDRWxvY2FsU3RvcmFnZVx1ODNCN1x1NTNENlx1NjU3MFx1NjM2RVxyXG4gICAgY3VycmVudFZpZGVvVGl0bGUgPSB0aXRsZSB8fCBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnY3VycmVudFZpZGVvVGl0bGUnKSB8fCAnXHU2NzJBXHU3N0U1XHU4OUM2XHU5ODkxJztcclxuICAgIGN1cnJlbnRFcGlzb2RlSW5kZXggPSBpbmRleDtcclxuXHJcbiAgICAvLyBcdThCQkVcdTdGNkVcdTgxRUFcdTUyQThcdThGREVcdTY0QURcdTVGMDBcdTUxNzNcdTcyQjZcdTYwMDFcclxuICAgIGF1dG9wbGF5RW5hYmxlZCA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdhdXRvcGxheUVuYWJsZWQnKSAhPT0gJ2ZhbHNlJzsgLy8gXHU5RUQ4XHU4QkE0XHU0RTNBdHJ1ZVxyXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2F1dG9wbGF5VG9nZ2xlJykuY2hlY2tlZCA9IGF1dG9wbGF5RW5hYmxlZDtcclxuXHJcbiAgICAvLyBcdTgzQjdcdTUzRDZcdTVFN0ZcdTU0NEFcdThGQzdcdTZFRTRcdThCQkVcdTdGNkVcclxuICAgIGFkRmlsdGVyaW5nRW5hYmxlZCA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKFBMQVlFUl9DT05GSUcuYWRGaWx0ZXJpbmdTdG9yYWdlKSAhPT0gJ2ZhbHNlJzsgLy8gXHU5RUQ4XHU4QkE0XHU0RTNBdHJ1ZVxyXG5cclxuICAgIC8vIFx1NzZEMVx1NTQyQ1x1ODFFQVx1NTJBOFx1OEZERVx1NjRBRFx1NUYwMFx1NTE3M1x1NTNEOFx1NTMxNlxyXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2F1dG9wbGF5VG9nZ2xlJykuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICBhdXRvcGxheUVuYWJsZWQgPSBlLnRhcmdldC5jaGVja2VkO1xyXG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdhdXRvcGxheUVuYWJsZWQnLCBhdXRvcGxheUVuYWJsZWQpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gXHU0RjE4XHU1MTQ4XHU0RjdGXHU3NTI4VVJMXHU0RjIwXHU5MDEyXHU3Njg0XHU5NkM2XHU2NTcwXHU0RkUxXHU2MDZGXHVGRjBDXHU1NDI2XHU1MjE5XHU0RUNFbG9jYWxTdG9yYWdlXHU4M0I3XHU1M0Q2XHJcbiAgICB0cnkge1xyXG4gICAgICAgIGlmIChlcGlzb2Rlc0xpc3QpIHtcclxuICAgICAgICAgICAgLy8gXHU1OTgyXHU2NzlDVVJMXHU0RTJEXHU2NzA5XHU5NkM2XHU2NTcwXHU2NTcwXHU2MzZFXHVGRjBDXHU0RjE4XHU1MTQ4XHU0RjdGXHU3NTI4XHU1QjgzXHJcbiAgICAgICAgICAgIGN1cnJlbnRFcGlzb2RlcyA9IEpTT04ucGFyc2UoZGVjb2RlVVJJQ29tcG9uZW50KGVwaXNvZGVzTGlzdCkpO1xyXG5cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBcdTU0MjZcdTUyMTlcdTRFQ0Vsb2NhbFN0b3JhZ2VcdTgzQjdcdTUzRDZcclxuICAgICAgICAgICAgY3VycmVudEVwaXNvZGVzID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnY3VycmVudEVwaXNvZGVzJykgfHwgJ1tdJyk7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gXHU2OEMwXHU2N0U1XHU5NkM2XHU2NTcwXHU3RDIyXHU1RjE1XHU2NjJGXHU1NDI2XHU2NzA5XHU2NTQ4XHVGRjBDXHU1OTgyXHU2NzlDXHU2NUUwXHU2NTQ4XHU1MjE5XHU4QzAzXHU2NTc0XHU0RTNBMFxyXG4gICAgICAgIGlmIChpbmRleCA8IDAgfHwgKGN1cnJlbnRFcGlzb2Rlcy5sZW5ndGggPiAwICYmIGluZGV4ID49IGN1cnJlbnRFcGlzb2Rlcy5sZW5ndGgpKSB7XHJcbiAgICAgICAgICAgIC8vIFx1NTk4Mlx1Njc5Q1x1N0QyMlx1NUYxNVx1NTkyQVx1NTkyN1x1RkYwQ1x1NTIxOVx1NEY3Rlx1NzUyOFx1NjcwMFx1NTkyN1x1NjcwOVx1NjU0OFx1N0QyMlx1NUYxNVxyXG4gICAgICAgICAgICBpZiAoaW5kZXggPj0gY3VycmVudEVwaXNvZGVzLmxlbmd0aCAmJiBjdXJyZW50RXBpc29kZXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgaW5kZXggPSBjdXJyZW50RXBpc29kZXMubGVuZ3RoIC0gMTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGluZGV4ID0gMDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gXHU2NkY0XHU2NUIwVVJMXHU0RUU1XHU1M0NEXHU2NjIwXHU0RkVFXHU2QjYzXHU1NDBFXHU3Njg0XHU3RDIyXHU1RjE1XHJcbiAgICAgICAgICAgIGNvbnN0IG5ld1VybCA9IG5ldyBVUkwod2luZG93LmxvY2F0aW9uLmhyZWYpO1xyXG4gICAgICAgICAgICBuZXdVcmwuc2VhcmNoUGFyYW1zLnNldCgnaW5kZXgnLCBpbmRleCk7XHJcbiAgICAgICAgICAgIHdpbmRvdy5oaXN0b3J5LnJlcGxhY2VTdGF0ZSh7fSwgJycsIG5ld1VybCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBcdTY2RjRcdTY1QjBcdTVGNTNcdTUyNERcdTdEMjJcdTVGMTVcdTRFM0FcdTlBOENcdThCQzFcdThGQzdcdTc2ODRcdTUwM0NcclxuICAgICAgICBjdXJyZW50RXBpc29kZUluZGV4ID0gaW5kZXg7XHJcblxyXG4gICAgICAgIGVwaXNvZGVzUmV2ZXJzZWQgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnZXBpc29kZXNSZXZlcnNlZCcpID09PSAndHJ1ZSc7XHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgY3VycmVudEVwaXNvZGVzID0gW107XHJcbiAgICAgICAgY3VycmVudEVwaXNvZGVJbmRleCA9IDA7XHJcbiAgICAgICAgZXBpc29kZXNSZXZlcnNlZCA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFx1OEJCRVx1N0Y2RVx1OTg3NVx1OTc2Mlx1NjgwN1x1OTg5OFxyXG4gICAgZG9jdW1lbnQudGl0bGUgPSBjdXJyZW50VmlkZW9UaXRsZSArICcgLSBMaWJyZVRWXHU2NEFEXHU2NTNFXHU1NjY4JztcclxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd2aWRlb1RpdGxlJykudGV4dENvbnRlbnQgPSBjdXJyZW50VmlkZW9UaXRsZTtcclxuXHJcbiAgICAvLyBcdTUyMURcdTU5Q0JcdTUzMTZcdTY0QURcdTY1M0VcdTU2NjhcclxuICAgIGlmICh2aWRlb1VybCkge1xyXG4gICAgICAgIGluaXRQbGF5ZXIodmlkZW9VcmwpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBzaG93RXJyb3IoJ1x1NjVFMFx1NjU0OFx1NzY4NFx1ODlDNlx1OTg5MVx1OTRGRVx1NjNBNScpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFx1NkUzMlx1NjdEM1x1NkU5MFx1NEZFMVx1NjA2RlxyXG4gICAgcmVuZGVyUmVzb3VyY2VJbmZvQmFyKCk7XHJcblxyXG4gICAgLy8gXHU2NkY0XHU2NUIwXHU5NkM2XHU2NTcwXHU0RkUxXHU2MDZGXHJcbiAgICB1cGRhdGVFcGlzb2RlSW5mbygpO1xyXG5cclxuICAgIC8vIFx1NkUzMlx1NjdEM1x1OTZDNlx1NjU3MFx1NTIxN1x1ODg2OFxyXG4gICAgcmVuZGVyRXBpc29kZXMoKTtcclxuXHJcbiAgICAvLyBcdTY2RjRcdTY1QjBcdTYzMDlcdTk0QUVcdTcyQjZcdTYwMDFcclxuICAgIHVwZGF0ZUJ1dHRvblN0YXRlcygpO1xyXG5cclxuICAgIC8vIFx1NjZGNFx1NjVCMFx1NjM5Mlx1NUU4Rlx1NjMwOVx1OTRBRVx1NzJCNlx1NjAwMVxyXG4gICAgdXBkYXRlT3JkZXJCdXR0b24oKTtcclxuXHJcbiAgICAvLyBcdTZERkJcdTUyQTBcdTVCRjlcdThGREJcdTVFQTZcdTY3NjFcdTc2ODRcdTc2RDFcdTU0MkNcdUZGMENcdTc4NkVcdTRGRERcdTcwQjlcdTUxRkJcdTUxQzZcdTc4NkVcdThERjNcdThGNkNcclxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgIHNldHVwUHJvZ3Jlc3NCYXJQcmVjaXNlQ2xpY2tzKCk7XHJcbiAgICB9LCAxMDAwKTtcclxuXHJcbiAgICAvLyBcdTZERkJcdTUyQTBcdTk1MkVcdTc2RDhcdTVGRUJcdTYzNzdcdTk1MkVcdTRFOEJcdTRFRjZcdTc2RDFcdTU0MkNcclxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBoYW5kbGVLZXlib2FyZFNob3J0Y3V0cyk7XHJcblxyXG4gICAgLy8gXHU2REZCXHU1MkEwXHU5ODc1XHU5NzYyXHU3OUJCXHU1RjAwXHU0RThCXHU0RUY2XHU3NkQxXHU1NDJDXHVGRjBDXHU0RkREXHU1QjU4XHU2NEFEXHU2NTNFXHU0RjREXHU3RjZFXHJcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignYmVmb3JldW5sb2FkJywgc2F2ZUN1cnJlbnRQcm9ncmVzcyk7XHJcblxyXG4gICAgLy8gXHU2NUIwXHU1ODlFXHVGRjFBXHU5ODc1XHU5NzYyXHU5NjkwXHU4NUNGXHVGRjA4XHU1MjA3XHU1NDBFXHU1M0YwL1x1NTIwN1x1NjgwN1x1N0I3RVx1RkYwOVx1NjVGNlx1NEU1Rlx1NEZERFx1NUI1OFxyXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndmlzaWJpbGl0eWNoYW5nZScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBpZiAoZG9jdW1lbnQudmlzaWJpbGl0eVN0YXRlID09PSAnaGlkZGVuJykge1xyXG4gICAgICAgICAgICBzYXZlQ3VycmVudFByb2dyZXNzKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gXHU4OUM2XHU5ODkxXHU2NjgyXHU1MDVDXHU2NUY2XHU0RTVGXHU0RkREXHU1QjU4XHJcbiAgICBjb25zdCB3YWl0Rm9yVmlkZW8gPSBzZXRJbnRlcnZhbCgoKSA9PiB7XHJcbiAgICAgICAgaWYgKGFydCAmJiBhcnQudmlkZW8pIHtcclxuICAgICAgICAgICAgYXJ0LnZpZGVvLmFkZEV2ZW50TGlzdGVuZXIoJ3BhdXNlJywgc2F2ZUN1cnJlbnRQcm9ncmVzcyk7XHJcblxyXG4gICAgICAgICAgICAvLyBcdTY1QjBcdTU4OUVcdUZGMUFcdTY0QURcdTY1M0VcdThGREJcdTVFQTZcdTUzRDhcdTUzMTZcdTY1RjZcdTgyODJcdTZENDFcdTRGRERcdTVCNThcclxuICAgICAgICAgICAgbGV0IGxhc3RTYXZlID0gMDtcclxuICAgICAgICAgICAgYXJ0LnZpZGVvLmFkZEV2ZW50TGlzdGVuZXIoJ3RpbWV1cGRhdGUnLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XHJcbiAgICAgICAgICAgICAgICBpZiAobm93IC0gbGFzdFNhdmUgPiA1MDAwKSB7IC8vIFx1NkJDRjVcdTc5RDJcdTY3MDBcdTU5MUFcdTRGRERcdTVCNThcdTRFMDBcdTZCMjFcclxuICAgICAgICAgICAgICAgICAgICBzYXZlQ3VycmVudFByb2dyZXNzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgbGFzdFNhdmUgPSBub3c7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbCh3YWl0Rm9yVmlkZW8pO1xyXG4gICAgICAgIH1cclxuICAgIH0sIDIwMCk7XHJcbn1cclxuXHJcbi8vIFx1NTkwNFx1NzQwNlx1OTUyRVx1NzZEOFx1NUZFQlx1NjM3N1x1OTUyRVxyXG5mdW5jdGlvbiBoYW5kbGVLZXlib2FyZFNob3J0Y3V0cyhlKSB7XHJcbiAgICAvLyBcdTVGRkRcdTc1NjVcdThGOTNcdTUxNjVcdTY4NDZcdTRFMkRcdTc2ODRcdTYzMDlcdTk1MkVcdTRFOEJcdTRFRjZcclxuICAgIGlmIChlLnRhcmdldC50YWdOYW1lID09PSAnSU5QVVQnIHx8IGUudGFyZ2V0LnRhZ05hbWUgPT09ICdURVhUQVJFQScpIHJldHVybjtcclxuXHJcbiAgICAvLyBBbHQgKyBcdTVERTZcdTdCQURcdTU5MzQgPSBcdTRFMEFcdTRFMDBcdTk2QzZcclxuICAgIGlmIChlLmFsdEtleSAmJiBlLmtleSA9PT0gJ0Fycm93TGVmdCcpIHtcclxuICAgICAgICBpZiAoY3VycmVudEVwaXNvZGVJbmRleCA+IDApIHtcclxuICAgICAgICAgICAgcGxheVByZXZpb3VzRXBpc29kZSgpO1xyXG4gICAgICAgICAgICBzaG93U2hvcnRjdXRIaW50KCdcdTRFMEFcdTRFMDBcdTk2QzYnLCAnbGVmdCcpO1xyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIEFsdCArIFx1NTNGM1x1N0JBRFx1NTkzNCA9IFx1NEUwQlx1NEUwMFx1OTZDNlxyXG4gICAgaWYgKGUuYWx0S2V5ICYmIGUua2V5ID09PSAnQXJyb3dSaWdodCcpIHtcclxuICAgICAgICBpZiAoY3VycmVudEVwaXNvZGVJbmRleCA8IGN1cnJlbnRFcGlzb2Rlcy5sZW5ndGggLSAxKSB7XHJcbiAgICAgICAgICAgIHBsYXlOZXh0RXBpc29kZSgpO1xyXG4gICAgICAgICAgICBzaG93U2hvcnRjdXRIaW50KCdcdTRFMEJcdTRFMDBcdTk2QzYnLCAncmlnaHQnKTtcclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBcdTVERTZcdTdCQURcdTU5MzQgPSBcdTVGRUJcdTkwMDBcclxuICAgIGlmICghZS5hbHRLZXkgJiYgZS5rZXkgPT09ICdBcnJvd0xlZnQnKSB7XHJcbiAgICAgICAgaWYgKGFydCAmJiBhcnQuY3VycmVudFRpbWUgPiA1KSB7XHJcbiAgICAgICAgICAgIGFydC5jdXJyZW50VGltZSAtPSA1O1xyXG4gICAgICAgICAgICBzaG93U2hvcnRjdXRIaW50KCdcdTVGRUJcdTkwMDAnLCAnbGVmdCcpO1xyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIFx1NTNGM1x1N0JBRFx1NTkzNCA9IFx1NUZFQlx1OEZEQlxyXG4gICAgaWYgKCFlLmFsdEtleSAmJiBlLmtleSA9PT0gJ0Fycm93UmlnaHQnKSB7XHJcbiAgICAgICAgaWYgKGFydCAmJiBhcnQuY3VycmVudFRpbWUgPCBhcnQuZHVyYXRpb24gLSA1KSB7XHJcbiAgICAgICAgICAgIGFydC5jdXJyZW50VGltZSArPSA1O1xyXG4gICAgICAgICAgICBzaG93U2hvcnRjdXRIaW50KCdcdTVGRUJcdThGREInLCAncmlnaHQnKTtcclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBcdTRFMEFcdTdCQURcdTU5MzQgPSBcdTk3RjNcdTkxQ0YrXHJcbiAgICBpZiAoZS5rZXkgPT09ICdBcnJvd1VwJykge1xyXG4gICAgICAgIGlmIChhcnQgJiYgYXJ0LnZvbHVtZSA8IDEpIHtcclxuICAgICAgICAgICAgYXJ0LnZvbHVtZSArPSAwLjE7XHJcbiAgICAgICAgICAgIHNob3dTaG9ydGN1dEhpbnQoJ1x1OTdGM1x1OTFDRisnLCAndXAnKTtcclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBcdTRFMEJcdTdCQURcdTU5MzQgPSBcdTk3RjNcdTkxQ0YtXHJcbiAgICBpZiAoZS5rZXkgPT09ICdBcnJvd0Rvd24nKSB7XHJcbiAgICAgICAgaWYgKGFydCAmJiBhcnQudm9sdW1lID4gMCkge1xyXG4gICAgICAgICAgICBhcnQudm9sdW1lIC09IDAuMTtcclxuICAgICAgICAgICAgc2hvd1Nob3J0Y3V0SGludCgnXHU5N0YzXHU5MUNGLScsICdkb3duJyk7XHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gXHU3QTdBXHU2ODNDID0gXHU2NEFEXHU2NTNFL1x1NjY4Mlx1NTA1Q1xyXG4gICAgaWYgKGUua2V5ID09PSAnICcpIHtcclxuICAgICAgICBpZiAoYXJ0KSB7XHJcbiAgICAgICAgICAgIGFydC50b2dnbGUoKTtcclxuICAgICAgICAgICAgc2hvd1Nob3J0Y3V0SGludCgnXHU2NEFEXHU2NTNFL1x1NjY4Mlx1NTA1QycsICdwbGF5Jyk7XHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gZiBcdTk1MkUgPSBcdTUyMDdcdTYzNjJcdTUxNjhcdTVDNEZcclxuICAgIGlmIChlLmtleSA9PT0gJ2YnIHx8IGUua2V5ID09PSAnRicpIHtcclxuICAgICAgICBpZiAoYXJ0KSB7XHJcbiAgICAgICAgICAgIGFydC5mdWxsc2NyZWVuID0gIWFydC5mdWxsc2NyZWVuO1xyXG4gICAgICAgICAgICBzaG93U2hvcnRjdXRIaW50KCdcdTUyMDdcdTYzNjJcdTUxNjhcdTVDNEYnLCAnZnVsbHNjcmVlbicpO1xyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG4vLyBcdTY2M0VcdTc5M0FcdTVGRUJcdTYzNzdcdTk1MkVcdTYzRDBcdTc5M0FcclxuZnVuY3Rpb24gc2hvd1Nob3J0Y3V0SGludCh0ZXh0LCBkaXJlY3Rpb24pIHtcclxuICAgIGNvbnN0IGhpbnRFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Nob3J0Y3V0SGludCcpO1xyXG4gICAgY29uc3QgdGV4dEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2hvcnRjdXRUZXh0Jyk7XHJcbiAgICBjb25zdCBpY29uRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzaG9ydGN1dEljb24nKTtcclxuXHJcbiAgICAvLyBcdTZFMDVcdTk2NjRcdTRFNEJcdTUyNERcdTc2ODRcdThEODVcdTY1RjZcclxuICAgIGlmIChzaG9ydGN1dEhpbnRUaW1lb3V0KSB7XHJcbiAgICAgICAgY2xlYXJUaW1lb3V0KHNob3J0Y3V0SGludFRpbWVvdXQpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFx1OEJCRVx1N0Y2RVx1NjU4N1x1NjcyQ1x1NTQ4Q1x1NTZGRVx1NjgwN1x1NjVCOVx1NTQxMVxyXG4gICAgdGV4dEVsZW1lbnQudGV4dENvbnRlbnQgPSB0ZXh0O1xyXG5cclxuICAgIGlmIChkaXJlY3Rpb24gPT09ICdsZWZ0Jykge1xyXG4gICAgICAgIGljb25FbGVtZW50LmlubmVySFRNTCA9ICc8cGF0aCBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIgc3Ryb2tlLWxpbmVqb2luPVwicm91bmRcIiBzdHJva2Utd2lkdGg9XCIyXCIgZD1cIk0xNSAxOWwtNy03IDctN1wiPjwvcGF0aD4nO1xyXG4gICAgfSBlbHNlIGlmIChkaXJlY3Rpb24gPT09ICdyaWdodCcpIHtcclxuICAgICAgICBpY29uRWxlbWVudC5pbm5lckhUTUwgPSAnPHBhdGggc3Ryb2tlLWxpbmVjYXA9XCJyb3VuZFwiIHN0cm9rZS1saW5lam9pbj1cInJvdW5kXCIgc3Ryb2tlLXdpZHRoPVwiMlwiIGQ9XCJNOSA1bDcgNy03IDdcIj48L3BhdGg+JztcclxuICAgIH0gIGVsc2UgaWYgKGRpcmVjdGlvbiA9PT0gJ3VwJykge1xyXG4gICAgICAgIGljb25FbGVtZW50LmlubmVySFRNTCA9ICc8cGF0aCBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIgc3Ryb2tlLWxpbmVqb2luPVwicm91bmRcIiBzdHJva2Utd2lkdGg9XCIyXCIgZD1cIk01IDE1bDctNyA3IDdcIj48L3BhdGg+JztcclxuICAgIH0gZWxzZSBpZiAoZGlyZWN0aW9uID09PSAnZG93bicpIHtcclxuICAgICAgICBpY29uRWxlbWVudC5pbm5lckhUTUwgPSAnPHBhdGggc3Ryb2tlLWxpbmVjYXA9XCJyb3VuZFwiIHN0cm9rZS1saW5lam9pbj1cInJvdW5kXCIgc3Ryb2tlLXdpZHRoPVwiMlwiIGQ9XCJNMTkgOWwtNyA3LTctN1wiPjwvcGF0aD4nO1xyXG4gICAgfSBlbHNlIGlmIChkaXJlY3Rpb24gPT09ICdmdWxsc2NyZWVuJykge1xyXG4gICAgICAgIGljb25FbGVtZW50LmlubmVySFRNTCA9ICc8cGF0aCBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIgc3Ryb2tlLWxpbmVqb2luPVwicm91bmRcIiBzdHJva2Utd2lkdGg9XCIyXCIgZD1cIk00IDhWNG0wIDBoNE00IDRsNSA1bTExLTFWNG0wIDBoLTRtNCAwbC01IDVNNCAxNnY0bTAgMGg0bS00IDBsNS01bTExIDV2LTRtMCA0aC00bTQgMGwtNS01XCI+PC9wYXRoPic7XHJcbiAgICB9IGVsc2UgaWYgKGRpcmVjdGlvbiA9PT0gJ3BsYXknKSB7XHJcbiAgICAgICAgaWNvbkVsZW1lbnQuaW5uZXJIVE1MID0gJzxwYXRoIHN0cm9rZS1saW5lY2FwPVwicm91bmRcIiBzdHJva2UtbGluZWpvaW49XCJyb3VuZFwiIHN0cm9rZS13aWR0aD1cIjJcIiBkPVwiTTUgM2wxNCA5LTE0IDlWM3pcIj48L3BhdGg+JztcclxuICAgIH1cclxuXHJcbiAgICAvLyBcdTY2M0VcdTc5M0FcdTYzRDBcdTc5M0FcclxuICAgIGhpbnRFbGVtZW50LmNsYXNzTGlzdC5hZGQoJ3Nob3cnKTtcclxuXHJcbiAgICAvLyBcdTRFMjRcdTc5RDJcdTU0MEVcdTk2OTBcdTg1Q0ZcclxuICAgIHNob3J0Y3V0SGludFRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICBoaW50RWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKCdzaG93Jyk7XHJcbiAgICB9LCAyMDAwKTtcclxufVxyXG5cclxuLy8gXHU1MjFEXHU1OUNCXHU1MzE2XHU2NEFEXHU2NTNFXHU1NjY4XHJcbmZ1bmN0aW9uIGluaXRQbGF5ZXIodmlkZW9VcmwpIHtcclxuICAgIGlmICghdmlkZW9VcmwpIHtcclxuICAgICAgICByZXR1cm5cclxuICAgIH1cclxuXHJcbiAgICAvLyBcdTk1MDBcdTZCQzFcdTY1RTdcdTVCOUVcdTRGOEJcclxuICAgIGlmIChhcnQpIHtcclxuICAgICAgICBhcnQuZGVzdHJveSgpO1xyXG4gICAgICAgIGFydCA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gXHU5MTREXHU3RjZFSExTLmpzXHU5MDA5XHU5ODc5XHJcbiAgICBjb25zdCBobHNDb25maWcgPSB7XHJcbiAgICAgICAgZGVidWc6IGZhbHNlLFxyXG4gICAgICAgIGxvYWRlcjogYWRGaWx0ZXJpbmdFbmFibGVkID8gQ3VzdG9tSGxzSnNMb2FkZXIgOiBIbHMuRGVmYXVsdENvbmZpZy5sb2FkZXIsXHJcbiAgICAgICAgZW5hYmxlV29ya2VyOiB0cnVlLFxyXG4gICAgICAgIGxvd0xhdGVuY3lNb2RlOiBmYWxzZSxcclxuICAgICAgICBiYWNrQnVmZmVyTGVuZ3RoOiA5MCxcclxuICAgICAgICBtYXhCdWZmZXJMZW5ndGg6IDMwLFxyXG4gICAgICAgIG1heE1heEJ1ZmZlckxlbmd0aDogNjAsXHJcbiAgICAgICAgbWF4QnVmZmVyU2l6ZTogMzAgKiAxMDAwICogMTAwMCxcclxuICAgICAgICBtYXhCdWZmZXJIb2xlOiAwLjUsXHJcbiAgICAgICAgZnJhZ0xvYWRpbmdNYXhSZXRyeTogNixcclxuICAgICAgICBmcmFnTG9hZGluZ01heFJldHJ5VGltZW91dDogNjQwMDAsXHJcbiAgICAgICAgZnJhZ0xvYWRpbmdSZXRyeURlbGF5OiAxMDAwLFxyXG4gICAgICAgIG1hbmlmZXN0TG9hZGluZ01heFJldHJ5OiAzLFxyXG4gICAgICAgIG1hbmlmZXN0TG9hZGluZ1JldHJ5RGVsYXk6IDEwMDAsXHJcbiAgICAgICAgbGV2ZWxMb2FkaW5nTWF4UmV0cnk6IDQsXHJcbiAgICAgICAgbGV2ZWxMb2FkaW5nUmV0cnlEZWxheTogMTAwMCxcclxuICAgICAgICBzdGFydExldmVsOiAtMSxcclxuICAgICAgICBhYnJFd21hRGVmYXVsdEVzdGltYXRlOiA1MDAwMDAsXHJcbiAgICAgICAgYWJyQmFuZFdpZHRoRmFjdG9yOiAwLjk1LFxyXG4gICAgICAgIGFickJhbmRXaWR0aFVwRmFjdG9yOiAwLjcsXHJcbiAgICAgICAgYWJyTWF4V2l0aFJlYWxCaXRyYXRlOiB0cnVlLFxyXG4gICAgICAgIHN0cmV0Y2hTaG9ydFZpZGVvVHJhY2s6IHRydWUsXHJcbiAgICAgICAgYXBwZW5kRXJyb3JNYXhSZXRyeTogNSwgIC8vIFx1NTg5RVx1NTJBMFx1NUMxRFx1OEJENVx1NkIyMVx1NjU3MFxyXG4gICAgICAgIGxpdmVTeW5jRHVyYXRpb25Db3VudDogMyxcclxuICAgICAgICBsaXZlRHVyYXRpb25JbmZpbml0eTogZmFsc2VcclxuICAgIH07XHJcblxyXG4gICAgLy8gQ3JlYXRlIG5ldyBBcnRQbGF5ZXIgaW5zdGFuY2VcclxuICAgIGFydCA9IG5ldyBBcnRwbGF5ZXIoe1xyXG4gICAgICAgIGNvbnRhaW5lcjogJyNwbGF5ZXInLFxyXG4gICAgICAgIHVybDogdmlkZW9VcmwsXHJcbiAgICAgICAgdHlwZTogJ20zdTgnLFxyXG4gICAgICAgIHRpdGxlOiB2aWRlb1RpdGxlLFxyXG4gICAgICAgIHZvbHVtZTogMC44LFxyXG4gICAgICAgIGlzTGl2ZTogZmFsc2UsXHJcbiAgICAgICAgbXV0ZWQ6IGZhbHNlLFxyXG4gICAgICAgIGF1dG9wbGF5OiB0cnVlLFxyXG4gICAgICAgIHBpcDogdHJ1ZSxcclxuICAgICAgICBhdXRvU2l6ZTogZmFsc2UsXHJcbiAgICAgICAgYXV0b01pbmk6IHRydWUsXHJcbiAgICAgICAgc2NyZWVuc2hvdDogdHJ1ZSxcclxuICAgICAgICBzZXR0aW5nOiB0cnVlLFxyXG4gICAgICAgIGxvb3A6IGZhbHNlLFxyXG4gICAgICAgIGZsaXA6IGZhbHNlLFxyXG4gICAgICAgIHBsYXliYWNrUmF0ZTogdHJ1ZSxcclxuICAgICAgICBhc3BlY3RSYXRpbzogZmFsc2UsXHJcbiAgICAgICAgZnVsbHNjcmVlbjogdHJ1ZSxcclxuICAgICAgICBmdWxsc2NyZWVuV2ViOiB0cnVlLFxyXG4gICAgICAgIHN1YnRpdGxlT2Zmc2V0OiBmYWxzZSxcclxuICAgICAgICBtaW5pUHJvZ3Jlc3NCYXI6IHRydWUsXHJcbiAgICAgICAgbXV0ZXg6IHRydWUsXHJcbiAgICAgICAgYmFja2Ryb3A6IHRydWUsXHJcbiAgICAgICAgcGxheXNJbmxpbmU6IHRydWUsXHJcbiAgICAgICAgYXV0b1BsYXliYWNrOiBmYWxzZSxcclxuICAgICAgICBhaXJwbGF5OiB0cnVlLFxyXG4gICAgICAgIGhvdGtleTogZmFsc2UsXHJcbiAgICAgICAgdGhlbWU6ICcjMjNhZGU1JyxcclxuICAgICAgICBsYW5nOiBuYXZpZ2F0b3IubGFuZ3VhZ2UudG9Mb3dlckNhc2UoKSxcclxuICAgICAgICBtb3JlVmlkZW9BdHRyOiB7XHJcbiAgICAgICAgICAgIGNyb3NzT3JpZ2luOiAnYW5vbnltb3VzJyxcclxuICAgICAgICB9LFxyXG4gICAgICAgIGN1c3RvbVR5cGU6IHtcclxuICAgICAgICAgICAgbTN1ODogZnVuY3Rpb24gKHZpZGVvLCB1cmwpIHtcclxuICAgICAgICAgICAgICAgIC8vIFx1NkUwNVx1NzQwNlx1NEU0Qlx1NTI0RFx1NzY4NEhMU1x1NUI5RVx1NEY4QlxyXG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRIbHMgJiYgY3VycmVudEhscy5kZXN0cm95KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudEhscy5kZXN0cm95KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyBcdTUyMUJcdTVFRkFcdTY1QjBcdTc2ODRITFNcdTVCOUVcdTRGOEJcclxuICAgICAgICAgICAgICAgIGNvbnN0IGhscyA9IG5ldyBIbHMoaGxzQ29uZmlnKTtcclxuICAgICAgICAgICAgICAgIGN1cnJlbnRIbHMgPSBobHM7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gXHU4RERGXHU4RTJBXHU2NjJGXHU1NDI2XHU1REYyXHU3RUNGXHU2NjNFXHU3OTNBXHU5NTE5XHU4QkVGXHJcbiAgICAgICAgICAgICAgICBsZXQgZXJyb3JEaXNwbGF5ZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIC8vIFx1OERERlx1OEUyQVx1NjYyRlx1NTQyNlx1NjcwOVx1OTUxOVx1OEJFRlx1NTNEMVx1NzUxRlxyXG4gICAgICAgICAgICAgICAgbGV0IGVycm9yQ291bnQgPSAwO1xyXG4gICAgICAgICAgICAgICAgLy8gXHU4RERGXHU4RTJBXHU4OUM2XHU5ODkxXHU2NjJGXHU1NDI2XHU1RjAwXHU1OUNCXHU2NEFEXHU2NTNFXHJcbiAgICAgICAgICAgICAgICBsZXQgcGxheWJhY2tTdGFydGVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAvLyBcdThEREZcdThFMkFcdTg5QzZcdTk4OTFcdTY2MkZcdTU0MjZcdTUxRkFcdTczQjBidWZmZXJBcHBlbmRFcnJvclxyXG4gICAgICAgICAgICAgICAgbGV0IGJ1ZmZlckFwcGVuZEVycm9yQ291bnQgPSAwO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFx1NzZEMVx1NTQyQ1x1ODlDNlx1OTg5MVx1NjRBRFx1NjUzRVx1NEU4Qlx1NEVGNlxyXG4gICAgICAgICAgICAgICAgdmlkZW8uYWRkRXZlbnRMaXN0ZW5lcigncGxheWluZycsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBwbGF5YmFja1N0YXJ0ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwbGF5ZXItbG9hZGluZycpLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XHJcbiAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Vycm9yJykuc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFx1NzZEMVx1NTQyQ1x1ODlDNlx1OTg5MVx1OEZEQlx1NUVBNlx1NEU4Qlx1NEVGNlxyXG4gICAgICAgICAgICAgICAgdmlkZW8uYWRkRXZlbnRMaXN0ZW5lcigndGltZXVwZGF0ZScsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodmlkZW8uY3VycmVudFRpbWUgPiAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFx1ODlDNlx1OTg5MVx1OEZEQlx1NUVBNlx1OEQ4NVx1OEZDNzFcdTc5RDJcdUZGMENcdTk2OTBcdTg1Q0ZcdTk1MTlcdThCRUZcdUZGMDhcdTU5ODJcdTY3OUNcdTVCNThcdTU3MjhcdUZGMDlcclxuICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Vycm9yJykuc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBobHMubG9hZFNvdXJjZSh1cmwpO1xyXG4gICAgICAgICAgICAgICAgaGxzLmF0dGFjaE1lZGlhKHZpZGVvKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBlbmFibGUgYWlycGxheSwgZnJvbSBodHRwczovL2dpdGh1Yi5jb20vdmlkZW8tZGV2L2hscy5qcy9pc3N1ZXMvNTk4OVxyXG4gICAgICAgICAgICAgICAgLy8gXHU2OEMwXHU2N0U1XHU2NjJGXHU1NDI2XHU1REYyXHU1QjU4XHU1NzI4c291cmNlXHU1MTQzXHU3RDIwXHVGRjBDXHU1OTgyXHU2NzlDXHU1QjU4XHU1NzI4XHU1MjE5XHU2NkY0XHU2NUIwXHVGRjBDXHU0RTBEXHU1QjU4XHU1NzI4XHU1MjE5XHU1MjFCXHU1RUZBXHJcbiAgICAgICAgICAgICAgICBsZXQgc291cmNlRWxlbWVudCA9IHZpZGVvLnF1ZXJ5U2VsZWN0b3IoJ3NvdXJjZScpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHNvdXJjZUVsZW1lbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBcdTY2RjRcdTY1QjBcdTczQjBcdTY3MDlzb3VyY2VcdTUxNDNcdTdEMjBcdTc2ODRVUkxcclxuICAgICAgICAgICAgICAgICAgICBzb3VyY2VFbGVtZW50LnNyYyA9IHZpZGVvVXJsO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBcdTUyMUJcdTVFRkFcdTY1QjBcdTc2ODRzb3VyY2VcdTUxNDNcdTdEMjBcclxuICAgICAgICAgICAgICAgICAgICBzb3VyY2VFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc291cmNlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgc291cmNlRWxlbWVudC5zcmMgPSB2aWRlb1VybDtcclxuICAgICAgICAgICAgICAgICAgICB2aWRlby5hcHBlbmRDaGlsZChzb3VyY2VFbGVtZW50KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHZpZGVvLmRpc2FibGVSZW1vdGVQbGF5YmFjayA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgICAgIGhscy5vbihIbHMuRXZlbnRzLk1BTklGRVNUX1BBUlNFRCwgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZpZGVvLnBsYXkoKS5jYXRjaChlID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGhscy5vbihIbHMuRXZlbnRzLkVSUk9SLCBmdW5jdGlvbiAoZXZlbnQsIGRhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBcdTU4OUVcdTUyQTBcdTk1MTlcdThCRUZcdThCQTFcdTY1NzBcclxuICAgICAgICAgICAgICAgICAgICBlcnJvckNvdW50Kys7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFx1NTkwNFx1NzQwNmJ1ZmZlckFwcGVuZEVycm9yXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGEuZGV0YWlscyA9PT0gJ2J1ZmZlckFwcGVuZEVycm9yJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBidWZmZXJBcHBlbmRFcnJvckNvdW50Kys7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFx1NTk4Mlx1Njc5Q1x1ODlDNlx1OTg5MVx1NURGMlx1N0VDRlx1NUYwMFx1NTlDQlx1NjRBRFx1NjUzRVx1RkYwQ1x1NTIxOVx1NUZGRFx1NzU2NVx1OEZEOVx1NEUyQVx1OTUxOVx1OEJFRlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocGxheWJhY2tTdGFydGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFx1NTk4Mlx1Njc5Q1x1NTFGQVx1NzNCMFx1NTkxQVx1NkIyMWJ1ZmZlckFwcGVuZEVycm9yXHU0RjQ2XHU4OUM2XHU5ODkxXHU2NzJBXHU2NEFEXHU2NTNFXHVGRjBDXHU1QzFEXHU4QkQ1XHU2MDYyXHU1OTBEXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChidWZmZXJBcHBlbmRFcnJvckNvdW50ID49IDMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhscy5yZWNvdmVyTWVkaWFFcnJvcigpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBcdTU5ODJcdTY3OUNcdTY2MkZcdTgxRjRcdTU0N0RcdTk1MTlcdThCRUZcdUZGMENcdTRFMTRcdTg5QzZcdTk4OTFcdTY3MkFcdTY0QURcdTY1M0VcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YS5mYXRhbCAmJiAhcGxheWJhY2tTdGFydGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFx1NUMxRFx1OEJENVx1NjA2Mlx1NTkwRFx1OTUxOVx1OEJFRlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKGRhdGEudHlwZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBIbHMuRXJyb3JUeXBlcy5ORVRXT1JLX0VSUk9SOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhscy5zdGFydExvYWQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgSGxzLkVycm9yVHlwZXMuTUVESUFfRVJST1I6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaGxzLnJlY292ZXJNZWRpYUVycm9yKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFx1NEVDNVx1NTcyOFx1NTkxQVx1NkIyMVx1NjA2Mlx1NTkwRFx1NUMxRFx1OEJENVx1NTQwRVx1NjYzRVx1NzkzQVx1OTUxOVx1OEJFRlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnJvckNvdW50ID4gMyAmJiAhZXJyb3JEaXNwbGF5ZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JEaXNwbGF5ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaG93RXJyb3IoJ1x1ODlDNlx1OTg5MVx1NTJBMFx1OEY3RFx1NTkzMVx1OEQyNVx1RkYwQ1x1NTNFRlx1ODBGRFx1NjYyRlx1NjgzQ1x1NUYwRlx1NEUwRFx1NTE3Q1x1NUJCOVx1NjIxNlx1NkU5MFx1NEUwRFx1NTNFRlx1NzUyOCcpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIFx1NzZEMVx1NTQyQ1x1NTIwNlx1NkJCNVx1NTJBMFx1OEY3RFx1NEU4Qlx1NEVGNlxyXG4gICAgICAgICAgICAgICAgaGxzLm9uKEhscy5FdmVudHMuRlJBR19MT0FERUQsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGxheWVyLWxvYWRpbmcnKS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gXHU3NkQxXHU1NDJDXHU3RUE3XHU1MjJCXHU1MkEwXHU4RjdEXHU0RThCXHU0RUY2XHJcbiAgICAgICAgICAgICAgICBobHMub24oSGxzLkV2ZW50cy5MRVZFTF9MT0FERUQsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGxheWVyLWxvYWRpbmcnKS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBhcnRwbGF5ZXIgXHU2Q0ExXHU2NzA5ICdmdWxsc2NyZWVuV2ViOmVudGVyJywgJ2Z1bGxzY3JlZW5XZWI6ZXhpdCcgXHU3QjQ5XHU0RThCXHU0RUY2XHJcbiAgICAvLyBcdTYyNDBcdTRFRTVcdTUzOUZcdTYzQTdcdTUyMzZcdTY4MEZcdTk2OTBcdTg1Q0ZcdTRFRTNcdTc4MDFcdTVFNzZcdTZDQTFcdTY3MDlcdThENzdcdTRGNUNcdTc1MjhcclxuICAgIC8vIFx1NUI5RVx1OTY0NVx1OEQ3N1x1NEY1Q1x1NzUyOFx1NzY4NFx1NjYyRiBhcnRwbGF5ZXIgXHU5RUQ4XHU4QkE0XHU4ODRDXHU0RTNBXHVGRjBDXHU1QjgzXHU2NTJGXHU2MzAxXHU4MUVBXHU1MkE4XHU5NjkwXHU4NUNGXHU1REU1XHU1MTc3XHU2ODBGXHJcbiAgICAvLyBcdTRGNDZcdTY3MDlcdTRFMDBcdTRFMkEgYnVnXHVGRjFBIFx1NTcyOFx1NTI2Rlx1NUM0Rlx1NTE2OFx1NUM0Rlx1NjVGNlx1RkYwQ1x1OUYyMFx1NjgwN1x1NzlGQlx1NTFGQVx1NTI2Rlx1NUM0Rlx1NTQwRVx1NEUwRFx1NEYxQVx1ODFFQVx1NTJBOFx1OTY5MFx1ODVDRlx1NURFNVx1NTE3N1x1NjgwRlxyXG4gICAgLy8gXHU0RTBCXHU5NzYyXHU4RkRCXHU0RTAwXHU1RTc2XHU5MUNEXHU2Nzg0XHU1NDhDXHU0RkVFXHU1OTBEXHVGRjFBXHJcbiAgICBsZXQgaGlkZVRpbWVyO1xyXG5cclxuICAgIC8vIFx1OTY5MFx1ODVDRlx1NjNBN1x1NTIzNlx1NjgwRlxyXG4gICAgZnVuY3Rpb24gaGlkZUNvbnRyb2xzKCkge1xyXG4gICAgICAgIGlmIChhcnQgJiYgYXJ0LmNvbnRyb2xzKSB7XHJcbiAgICAgICAgICAgIGFydC5jb250cm9scy5zaG93ID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIFx1OTFDRFx1N0Y2RVx1OEJBMVx1NjVGNlx1NTY2OFx1RkYwQ1x1OEJBMVx1NjVGNlx1NTY2OFx1OEQ4NVx1NjVGNlx1NjVGNlx1OTVGNFx1NEUwRSBhcnRwbGF5ZXIgXHU0RkREXHU2MzAxXHU0RTAwXHU4MUY0XHJcbiAgICBmdW5jdGlvbiByZXNldEhpZGVUaW1lcigpIHtcclxuICAgICAgICBjbGVhclRpbWVvdXQoaGlkZVRpbWVyKTtcclxuICAgICAgICBoaWRlVGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICAgICAgaGlkZUNvbnRyb2xzKCk7XHJcbiAgICAgICAgfSwgQXJ0cGxheWVyLkNPTlRST0xfSElERV9USU1FKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBcdTU5MDRcdTc0MDZcdTlGMjBcdTY4MDdcdTc5QkJcdTVGMDBcdTZENEZcdTg5QzhcdTU2NjhcdTdBOTdcdTUzRTNcclxuICAgIGZ1bmN0aW9uIGhhbmRsZU1vdXNlT3V0KGUpIHtcclxuICAgICAgICBpZiAoZSAmJiAhZS5yZWxhdGVkVGFyZ2V0KSB7XHJcbiAgICAgICAgICAgIHJlc2V0SGlkZVRpbWVyKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIFx1NTE2OFx1NUM0Rlx1NzJCNlx1NjAwMVx1NTIwN1x1NjM2Mlx1NjVGNlx1NkNFOFx1NTE4Qy9cdTc5RkJcdTk2NjQgbW91c2VvdXQgXHU0RThCXHU0RUY2XHVGRjBDXHU3NkQxXHU1NDJDXHU5RjIwXHU2ODA3XHU3OUZCXHU1MUZBXHU1QzRGXHU1RTU1XHU0RThCXHU0RUY2XHJcbiAgICAvLyBcdTRFQ0VcdTgwMENcdTVCRjlcdTY0QURcdTY1M0VcdTU2NjhcdTcyQjZcdTYwMDFcdTY4MEZcdThGREJcdTg4NENcdTk2OTBcdTg1Q0ZcdTUwMTJcdThCQTFcdTY1RjZcclxuICAgIGZ1bmN0aW9uIGhhbmRsZUZ1bGxTY3JlZW4oaXNGdWxsU2NyZWVuLCBpc1dlYikge1xyXG4gICAgICAgIGlmIChpc0Z1bGxTY3JlZW4pIHtcclxuICAgICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2VvdXQnLCBoYW5kbGVNb3VzZU91dCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2VvdXQnLCBoYW5kbGVNb3VzZU91dCk7XHJcbiAgICAgICAgICAgIC8vIFx1OTAwMFx1NTFGQVx1NTE2OFx1NUM0Rlx1NjVGNlx1NkUwNVx1NzQwNlx1OEJBMVx1NjVGNlx1NTY2OFxyXG4gICAgICAgICAgICBjbGVhclRpbWVvdXQoaGlkZVRpbWVyKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghaXNXZWIpIHtcclxuICAgICAgICAgICAgaWYgKHdpbmRvdy5zY3JlZW4ub3JpZW50YXRpb24gJiYgd2luZG93LnNjcmVlbi5vcmllbnRhdGlvbi5sb2NrKSB7XHJcbiAgICAgICAgICAgICAgICB3aW5kb3cuc2NyZWVuLm9yaWVudGF0aW9uLmxvY2soJ2xhbmRzY2FwZScpXHJcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgLmNhdGNoKChlcnJvcikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIFx1NjRBRFx1NjUzRVx1NTY2OFx1NTJBMFx1OEY3RFx1NUI4Q1x1NjIxMFx1NTQwRVx1NTIxRFx1NTlDQlx1OTY5MFx1ODVDRlx1NURFNVx1NTE3N1x1NjgwRlxyXG4gICAgYXJ0Lm9uKCdyZWFkeScsICgpID0+IHtcclxuICAgICAgICBoaWRlQ29udHJvbHMoKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFx1NTE2OFx1NUM0RiBXZWIgXHU2QTIxXHU1RjBGXHU1OTA0XHU3NDA2XHJcbiAgICBhcnQub24oJ2Z1bGxzY3JlZW5XZWInLCBmdW5jdGlvbiAoaXNGdWxsU2NyZWVuKSB7XHJcbiAgICAgICAgaGFuZGxlRnVsbFNjcmVlbihpc0Z1bGxTY3JlZW4sIHRydWUpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gXHU1MTY4XHU1QzRGXHU2QTIxXHU1RjBGXHU1OTA0XHU3NDA2XHJcbiAgICBhcnQub24oJ2Z1bGxzY3JlZW4nLCBmdW5jdGlvbiAoaXNGdWxsU2NyZWVuKSB7XHJcbiAgICAgICAgaGFuZGxlRnVsbFNjcmVlbihpc0Z1bGxTY3JlZW4sIGZhbHNlKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGFydC5vbigndmlkZW86bG9hZGVkbWV0YWRhdGEnLCBmdW5jdGlvbigpIHtcclxuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGxheWVyLWxvYWRpbmcnKS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG4gICAgICAgIHZpZGVvSGFzRW5kZWQgPSBmYWxzZTsgLy8gXHU4OUM2XHU5ODkxXHU1MkEwXHU4RjdEXHU2NUY2XHU5MUNEXHU3RjZFXHU3RUQzXHU2NzVGXHU2ODA3XHU1RkQ3XHJcbiAgICAgICAgLy8gXHU0RjE4XHU1MTQ4XHU0RjdGXHU3NTI4VVJMXHU0RjIwXHU5MDEyXHU3Njg0cG9zaXRpb25cdTUzQzJcdTY1NzBcclxuICAgICAgICBjb25zdCB1cmxQYXJhbXMgPSBuZXcgVVJMU2VhcmNoUGFyYW1zKHdpbmRvdy5sb2NhdGlvbi5zZWFyY2gpO1xyXG4gICAgICAgIGNvbnN0IHNhdmVkUG9zaXRpb24gPSBwYXJzZUludCh1cmxQYXJhbXMuZ2V0KCdwb3NpdGlvbicpIHx8ICcwJyk7XHJcblxyXG4gICAgICAgIGlmIChzYXZlZFBvc2l0aW9uID4gMTAgJiYgc2F2ZWRQb3NpdGlvbiA8IGFydC5kdXJhdGlvbiAtIDIpIHtcclxuICAgICAgICAgICAgLy8gXHU1OTgyXHU2NzlDVVJMXHU0RTJEXHU2NzA5XHU2NzA5XHU2NTQ4XHU3Njg0XHU2NEFEXHU2NTNFXHU0RjREXHU3RjZFXHU1M0MyXHU2NTcwXHVGRjBDXHU3NkY0XHU2M0E1XHU0RjdGXHU3NTI4XHU1QjgzXHJcbiAgICAgICAgICAgIGFydC5jdXJyZW50VGltZSA9IHNhdmVkUG9zaXRpb247XHJcbiAgICAgICAgICAgIHNob3dQb3NpdGlvblJlc3RvcmVIaW50KHNhdmVkUG9zaXRpb24pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIFx1NTQyNlx1NTIxOVx1NUMxRFx1OEJENVx1NEVDRVx1NjcyQ1x1NTczMFx1NUI1OFx1NTBBOFx1NjA2Mlx1NTkwRFx1NjRBRFx1NjUzRVx1OEZEQlx1NUVBNlxyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcHJvZ3Jlc3NLZXkgPSAndmlkZW9Qcm9ncmVzc18nICsgZ2V0VmlkZW9JZCgpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcHJvZ3Jlc3NTdHIgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShwcm9ncmVzc0tleSk7XHJcbiAgICAgICAgICAgICAgICBpZiAocHJvZ3Jlc3NTdHIgJiYgYXJ0LmR1cmF0aW9uID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHByb2dyZXNzID0gSlNPTi5wYXJzZShwcm9ncmVzc1N0cik7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9ncmVzcyAmJlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlb2YgcHJvZ3Jlc3MucG9zaXRpb24gPT09ICdudW1iZXInICYmXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2dyZXNzLnBvc2l0aW9uID4gMTAgJiZcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvZ3Jlc3MucG9zaXRpb24gPCBhcnQuZHVyYXRpb24gLSAyXHJcbiAgICAgICAgICAgICAgICAgICAgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFydC5jdXJyZW50VGltZSA9IHByb2dyZXNzLnBvc2l0aW9uO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzaG93UG9zaXRpb25SZXN0b3JlSGludChwcm9ncmVzcy5wb3NpdGlvbik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFx1OEJCRVx1N0Y2RVx1OEZEQlx1NUVBNlx1Njc2MVx1NzBCOVx1NTFGQlx1NzZEMVx1NTQyQ1xyXG4gICAgICAgIHNldHVwUHJvZ3Jlc3NCYXJQcmVjaXNlQ2xpY2tzKCk7XHJcblxyXG4gICAgICAgIC8vIFx1ODlDNlx1OTg5MVx1NTJBMFx1OEY3RFx1NjIxMFx1NTI5Rlx1NTQwRVx1RkYwQ1x1NTcyOFx1N0EwRFx1NUZBRVx1NUVGNlx1OEZERlx1NTQwRVx1NUMwNlx1NTE3Nlx1NkRGQlx1NTJBMFx1NTIzMFx1ODlDMlx1NzcwQlx1NTM4Nlx1NTNGMlxyXG4gICAgICAgIHNldFRpbWVvdXQoc2F2ZVRvSGlzdG9yeSwgMzAwMCk7XHJcblxyXG4gICAgICAgIC8vIFx1NTQyRlx1NTJBOFx1NUI5QVx1NjcxRlx1NEZERFx1NUI1OFx1NjRBRFx1NjUzRVx1OEZEQlx1NUVBNlxyXG4gICAgICAgIHN0YXJ0UHJvZ3Jlc3NTYXZlSW50ZXJ2YWwoKTtcclxuICAgIH0pXHJcblxyXG4gICAgLy8gXHU5NTE5XHU4QkVGXHU1OTA0XHU3NDA2XHJcbiAgICBhcnQub24oJ3ZpZGVvOmVycm9yJywgZnVuY3Rpb24gKGVycm9yKSB7XHJcbiAgICAgICAgLy8gXHU1OTgyXHU2NzlDXHU2QjYzXHU1NzI4XHU1MjA3XHU2MzYyXHU4OUM2XHU5ODkxXHVGRjBDXHU1RkZEXHU3NTY1XHU5NTE5XHU4QkVGXHJcbiAgICAgICAgaWYgKHdpbmRvdy5pc1N3aXRjaGluZ1ZpZGVvKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFx1OTY5MFx1ODVDRlx1NjI0MFx1NjcwOVx1NTJBMFx1OEY3RFx1NjMwN1x1NzkzQVx1NTY2OFxyXG4gICAgICAgIGNvbnN0IGxvYWRpbmdFbGVtZW50cyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJyNwbGF5ZXItbG9hZGluZywgLnBsYXllci1sb2FkaW5nLWNvbnRhaW5lcicpO1xyXG4gICAgICAgIGxvYWRpbmdFbGVtZW50cy5mb3JFYWNoKGVsID0+IHtcclxuICAgICAgICAgICAgaWYgKGVsKSBlbC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBzaG93RXJyb3IoJ1x1ODlDNlx1OTg5MVx1NjRBRFx1NjUzRVx1NTkzMVx1OEQyNTogJyArIChlcnJvci5tZXNzYWdlIHx8ICdcdTY3MkFcdTc3RTVcdTk1MTlcdThCRUYnKSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBcdTZERkJcdTUyQTBcdTc5RkJcdTUyQThcdTdBRUZcdTk1N0ZcdTYzMDlcdTRFMDlcdTUwMERcdTkwMUZcdTY0QURcdTY1M0VcdTUyOUZcdTgwRkRcclxuICAgIHNldHVwTG9uZ1ByZXNzU3BlZWRDb250cm9sKCk7XHJcblxyXG4gICAgLy8gXHU4OUM2XHU5ODkxXHU2NEFEXHU2NTNFXHU3RUQzXHU2NzVGXHU0RThCXHU0RUY2XHJcbiAgICBhcnQub24oJ3ZpZGVvOmVuZGVkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZpZGVvSGFzRW5kZWQgPSB0cnVlO1xyXG5cclxuICAgICAgICBjbGVhclZpZGVvUHJvZ3Jlc3MoKTtcclxuXHJcbiAgICAgICAgLy8gXHU1OTgyXHU2NzlDXHU4MUVBXHU1MkE4XHU2NEFEXHU2NTNFXHU0RTBCXHU0RTAwXHU5NkM2XHU1RjAwXHU1NDJGXHVGRjBDXHU0RTE0XHU3ODZFXHU1QjlFXHU2NzA5XHU0RTBCXHU0RTAwXHU5NkM2XHJcbiAgICAgICAgaWYgKGF1dG9wbGF5RW5hYmxlZCAmJiBjdXJyZW50RXBpc29kZUluZGV4IDwgY3VycmVudEVwaXNvZGVzLmxlbmd0aCAtIDEpIHtcclxuICAgICAgICAgICAgLy8gXHU3QTBEXHU5NTdGXHU1RUY2XHU4RkRGXHU0RUU1XHU3ODZFXHU0RkREXHU2MjQwXHU2NzA5XHU0RThCXHU0RUY2XHU1OTA0XHU3NDA2XHU1QjhDXHU2MjEwXHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgLy8gXHU3ODZFXHU4QkE0XHU0RTBEXHU2NjJGXHU1NkUwXHU0RTNBXHU3NTI4XHU2MjM3XHU2MkQ2XHU2MkZEXHU1QkZDXHU4MUY0XHU3Njg0XHU1MDQ3XHU3RUQzXHU2NzVGXHU0RThCXHU0RUY2XHJcbiAgICAgICAgICAgICAgICBwbGF5TmV4dEVwaXNvZGUoKTtcclxuICAgICAgICAgICAgICAgIHZpZGVvSGFzRW5kZWQgPSBmYWxzZTsgLy8gXHU5MUNEXHU3RjZFXHU2ODA3XHU1RkQ3XHJcbiAgICAgICAgICAgIH0sIDEwMDApO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGFydC5mdWxsc2NyZWVuID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gXHU2REZCXHU1MkEwXHU1M0NDXHU1MUZCXHU1MTY4XHU1QzRGXHU2NTJGXHU2MzAxXHJcbiAgICBhcnQub24oJ3ZpZGVvOnBsYXlpbmcnLCAoKSA9PiB7XHJcbiAgICAgICAgLy8gXHU3RUQxXHU1QjlBXHU1M0NDXHU1MUZCXHU0RThCXHU0RUY2XHU1MjMwXHU4OUM2XHU5ODkxXHU1QkI5XHU1NjY4XHJcbiAgICAgICAgaWYgKGFydC52aWRlbykge1xyXG4gICAgICAgICAgICBhcnQudmlkZW8uYWRkRXZlbnRMaXN0ZW5lcignZGJsY2xpY2snLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBhcnQuZnVsbHNjcmVlbiA9ICFhcnQuZnVsbHNjcmVlbjtcclxuICAgICAgICAgICAgICAgIGFydC5wbGF5KCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vIDEwXHU3OUQyXHU1NDBFXHU1OTgyXHU2NzlDXHU0RUNEXHU1NzI4XHU1MkEwXHU4RjdEXHVGRjBDXHU0RjQ2XHU0RTBEXHU3QUNCXHU1MzczXHU2NjNFXHU3OTNBXHU5NTE5XHU4QkVGXHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAvLyBcdTU5ODJcdTY3OUNcdTg5QzZcdTk4OTFcdTVERjJcdTdFQ0ZcdTY0QURcdTY1M0VcdTVGMDBcdTU5Q0JcdUZGMENcdTUyMTlcdTRFMERcdTY2M0VcdTc5M0FcdTk1MTlcdThCRUZcclxuICAgICAgICBpZiAoYXJ0ICYmIGFydC52aWRlbyAmJiBhcnQudmlkZW8uY3VycmVudFRpbWUgPiAwKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGxvYWRpbmdFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BsYXllci1sb2FkaW5nJyk7XHJcbiAgICAgICAgaWYgKGxvYWRpbmdFbGVtZW50ICYmIGxvYWRpbmdFbGVtZW50LnN0eWxlLmRpc3BsYXkgIT09ICdub25lJykge1xyXG4gICAgICAgICAgICBsb2FkaW5nRWxlbWVudC5pbm5lckhUTUwgPSBgXHJcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwibG9hZGluZy1zcGlubmVyXCI+PC9kaXY+XHJcbiAgICAgICAgICAgICAgICA8ZGl2Plx1ODlDNlx1OTg5MVx1NTJBMFx1OEY3RFx1NjVGNlx1OTVGNFx1OEY4M1x1OTU3Rlx1RkYwQ1x1OEJGN1x1ODAxMFx1NUZDM1x1N0I0OVx1NUY4NS4uLjwvZGl2PlxyXG4gICAgICAgICAgICAgICAgPGRpdiBzdHlsZT1cImZvbnQtc2l6ZTogMTJweDsgY29sb3I6ICNhYWE7IG1hcmdpbi10b3A6IDEwcHg7XCI+XHU1OTgyXHU5NTdGXHU2NUY2XHU5NUY0XHU2NUUwXHU1NENEXHU1RTk0XHVGRjBDXHU4QkY3XHU1QzFEXHU4QkQ1XHU1MTc2XHU0RUQ2XHU4OUM2XHU5ODkxXHU2RTkwPC9kaXY+XHJcbiAgICAgICAgICAgIGA7XHJcbiAgICAgICAgfVxyXG4gICAgfSwgMTAwMDApO1xyXG59XHJcblxyXG4vLyBcdTgxRUFcdTVCOUFcdTRFNDlNM1U4IExvYWRlclx1NzUyOFx1NEU4RVx1OEZDN1x1NkVFNFx1NUU3Rlx1NTQ0QVxyXG5jbGFzcyBDdXN0b21IbHNKc0xvYWRlciBleHRlbmRzIEhscy5EZWZhdWx0Q29uZmlnLmxvYWRlciB7XHJcbiAgICBjb25zdHJ1Y3Rvcihjb25maWcpIHtcclxuICAgICAgICBzdXBlcihjb25maWcpO1xyXG4gICAgICAgIGNvbnN0IGxvYWQgPSB0aGlzLmxvYWQuYmluZCh0aGlzKTtcclxuICAgICAgICB0aGlzLmxvYWQgPSBmdW5jdGlvbiAoY29udGV4dCwgY29uZmlnLCBjYWxsYmFja3MpIHtcclxuICAgICAgICAgICAgLy8gXHU2MkU2XHU2MjJBbWFuaWZlc3RcdTU0OENsZXZlbFx1OEJGN1x1NkM0MlxyXG4gICAgICAgICAgICBpZiAoY29udGV4dC50eXBlID09PSAnbWFuaWZlc3QnIHx8IGNvbnRleHQudHlwZSA9PT0gJ2xldmVsJykge1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgb25TdWNjZXNzID0gY2FsbGJhY2tzLm9uU3VjY2VzcztcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrcy5vblN1Y2Nlc3MgPSBmdW5jdGlvbiAocmVzcG9uc2UsIHN0YXRzLCBjb250ZXh0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gXHU1OTgyXHU2NzlDXHU2NjJGbTN1OFx1NjU4N1x1NEVGNlx1RkYwQ1x1NTkwNFx1NzQwNlx1NTE4NVx1NUJCOVx1NEVFNVx1NzlGQlx1OTY2NFx1NUU3Rlx1NTQ0QVx1NTIwNlx1NkJCNVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5kYXRhICYmIHR5cGVvZiByZXNwb25zZS5kYXRhID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBcdThGQzdcdTZFRTRcdTYzODlcdTVFN0ZcdTU0NEFcdTZCQjUgLSBcdTVCOUVcdTczQjBcdTY2RjRcdTdDQkVcdTc4NkVcdTc2ODRcdTVFN0ZcdTU0NEFcdThGQzdcdTZFRTRcdTkwM0JcdThGOTFcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2UuZGF0YSA9IGZpbHRlckFkc0Zyb21NM1U4KHJlc3BvbnNlLmRhdGEsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gb25TdWNjZXNzKHJlc3BvbnNlLCBzdGF0cywgY29udGV4dCk7XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIFx1NjI2N1x1ODg0Q1x1NTM5Rlx1NTlDQmxvYWRcdTY1QjlcdTZDRDVcclxuICAgICAgICAgICAgbG9hZChjb250ZXh0LCBjb25maWcsIGNhbGxiYWNrcyk7XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxufVxyXG5cclxuLy8gXHU4RkM3XHU2RUU0XHU1M0VGXHU3NTkxXHU3Njg0XHU1RTdGXHU1NDRBXHU1MTg1XHU1QkI5XHJcbmZ1bmN0aW9uIGZpbHRlckFkc0Zyb21NM1U4KG0zdThDb250ZW50LCBzdHJpY3RNb2RlID0gZmFsc2UpIHtcclxuICAgIGlmICghbTN1OENvbnRlbnQpIHJldHVybiAnJztcclxuXHJcbiAgICAvLyBcdTYzMDlcdTg4NENcdTUyMDZcdTUyNzJNM1U4XHU1MTg1XHU1QkI5XHJcbiAgICBjb25zdCBsaW5lcyA9IG0zdThDb250ZW50LnNwbGl0KCdcXG4nKTtcclxuICAgIGNvbnN0IGZpbHRlcmVkTGluZXMgPSBbXTtcclxuXHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgY29uc3QgbGluZSA9IGxpbmVzW2ldO1xyXG5cclxuICAgICAgICAvLyBcdTUzRUFcdThGQzdcdTZFRTQjRVhULVgtRElTQ09OVElOVUlUWVx1NjgwN1x1OEJDNlxyXG4gICAgICAgIGlmICghbGluZS5pbmNsdWRlcygnI0VYVC1YLURJU0NPTlRJTlVJVFknKSkge1xyXG4gICAgICAgICAgICBmaWx0ZXJlZExpbmVzLnB1c2gobGluZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBmaWx0ZXJlZExpbmVzLmpvaW4oJ1xcbicpO1xyXG59XHJcblxyXG5cclxuLy8gXHU2NjNFXHU3OTNBXHU5NTE5XHU4QkVGXHJcbmZ1bmN0aW9uIHNob3dFcnJvcihtZXNzYWdlKSB7XHJcbiAgICAvLyBcdTU3MjhcdTg5QzZcdTk4OTFcdTVERjJcdTdFQ0ZcdTY0QURcdTY1M0VcdTc2ODRcdTYwQzVcdTUxQjVcdTRFMEJcdTRFMERcdTY2M0VcdTc5M0FcdTk1MTlcdThCRUZcclxuICAgIGlmIChhcnQgJiYgYXJ0LnZpZGVvICYmIGFydC52aWRlby5jdXJyZW50VGltZSA+IDEpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBjb25zdCBsb2FkaW5nRWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGxheWVyLWxvYWRpbmcnKTtcclxuICAgIGlmIChsb2FkaW5nRWwpIGxvYWRpbmdFbC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xyXG4gICAgY29uc3QgZXJyb3JFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdlcnJvcicpO1xyXG4gICAgaWYgKGVycm9yRWwpIGVycm9yRWwuc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcclxuICAgIGNvbnN0IGVycm9yTXNnRWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZXJyb3ItbWVzc2FnZScpO1xyXG4gICAgaWYgKGVycm9yTXNnRWwpIGVycm9yTXNnRWwudGV4dENvbnRlbnQgPSBtZXNzYWdlO1xyXG59XHJcblxyXG4vLyBcdTY2RjRcdTY1QjBcdTk2QzZcdTY1NzBcdTRGRTFcdTYwNkZcclxuZnVuY3Rpb24gdXBkYXRlRXBpc29kZUluZm8oKSB7XHJcbiAgICBpZiAoY3VycmVudEVwaXNvZGVzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZXBpc29kZUluZm8nKS50ZXh0Q29udGVudCA9IGBcdTdCMkMgJHtjdXJyZW50RXBpc29kZUluZGV4ICsgMX0vJHtjdXJyZW50RXBpc29kZXMubGVuZ3RofSBcdTk2QzZgO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZXBpc29kZUluZm8nKS50ZXh0Q29udGVudCA9ICdcdTY1RTBcdTk2QzZcdTY1NzBcdTRGRTFcdTYwNkYnO1xyXG4gICAgfVxyXG59XHJcblxyXG4vLyBcdTY2RjRcdTY1QjBcdTYzMDlcdTk0QUVcdTcyQjZcdTYwMDFcclxuZnVuY3Rpb24gdXBkYXRlQnV0dG9uU3RhdGVzKCkge1xyXG4gICAgY29uc3QgcHJldkJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwcmV2QnV0dG9uJyk7XHJcbiAgICBjb25zdCBuZXh0QnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25leHRCdXR0b24nKTtcclxuXHJcbiAgICAvLyBcdTU5MDRcdTc0MDZcdTRFMEFcdTRFMDBcdTk2QzZcdTYzMDlcdTk0QUVcclxuICAgIGlmIChjdXJyZW50RXBpc29kZUluZGV4ID4gMCkge1xyXG4gICAgICAgIHByZXZCdXR0b24uY2xhc3NMaXN0LnJlbW92ZSgnYmctZ3JheS03MDAnLCAnY3Vyc29yLW5vdC1hbGxvd2VkJyk7XHJcbiAgICAgICAgcHJldkJ1dHRvbi5jbGFzc0xpc3QuYWRkKCdiZy1bIzIyMl0nLCAnaG92ZXI6YmctWyMzMzNdJyk7XHJcbiAgICAgICAgcHJldkJ1dHRvbi5yZW1vdmVBdHRyaWJ1dGUoJ2Rpc2FibGVkJyk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHByZXZCdXR0b24uY2xhc3NMaXN0LmFkZCgnYmctZ3JheS03MDAnLCAnY3Vyc29yLW5vdC1hbGxvd2VkJyk7XHJcbiAgICAgICAgcHJldkJ1dHRvbi5jbGFzc0xpc3QucmVtb3ZlKCdiZy1bIzIyMl0nLCAnaG92ZXI6YmctWyMzMzNdJyk7XHJcbiAgICAgICAgcHJldkJ1dHRvbi5zZXRBdHRyaWJ1dGUoJ2Rpc2FibGVkJywgJycpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFx1NTkwNFx1NzQwNlx1NEUwQlx1NEUwMFx1OTZDNlx1NjMwOVx1OTRBRVxyXG4gICAgaWYgKGN1cnJlbnRFcGlzb2RlSW5kZXggPCBjdXJyZW50RXBpc29kZXMubGVuZ3RoIC0gMSkge1xyXG4gICAgICAgIG5leHRCdXR0b24uY2xhc3NMaXN0LnJlbW92ZSgnYmctZ3JheS03MDAnLCAnY3Vyc29yLW5vdC1hbGxvd2VkJyk7XHJcbiAgICAgICAgbmV4dEJ1dHRvbi5jbGFzc0xpc3QuYWRkKCdiZy1bIzIyMl0nLCAnaG92ZXI6YmctWyMzMzNdJyk7XHJcbiAgICAgICAgbmV4dEJ1dHRvbi5yZW1vdmVBdHRyaWJ1dGUoJ2Rpc2FibGVkJyk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIG5leHRCdXR0b24uY2xhc3NMaXN0LmFkZCgnYmctZ3JheS03MDAnLCAnY3Vyc29yLW5vdC1hbGxvd2VkJyk7XHJcbiAgICAgICAgbmV4dEJ1dHRvbi5jbGFzc0xpc3QucmVtb3ZlKCdiZy1bIzIyMl0nLCAnaG92ZXI6YmctWyMzMzNdJyk7XHJcbiAgICAgICAgbmV4dEJ1dHRvbi5zZXRBdHRyaWJ1dGUoJ2Rpc2FibGVkJywgJycpO1xyXG4gICAgfVxyXG59XHJcblxyXG4vLyBcdTZFMzJcdTY3RDNcdTk2QzZcdTY1NzBcdTYzMDlcdTk0QUVcclxuZnVuY3Rpb24gcmVuZGVyRXBpc29kZXMoKSB7XHJcbiAgICBjb25zdCBlcGlzb2Rlc0xpc3QgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZXBpc29kZXNMaXN0Jyk7XHJcbiAgICBpZiAoIWVwaXNvZGVzTGlzdCkgcmV0dXJuO1xyXG5cclxuICAgIGlmICghY3VycmVudEVwaXNvZGVzIHx8IGN1cnJlbnRFcGlzb2Rlcy5sZW5ndGggPT09IDApIHtcclxuICAgICAgICBlcGlzb2Rlc0xpc3QuaW5uZXJIVE1MID0gJzxkaXYgY2xhc3M9XCJjb2wtc3Bhbi1mdWxsIHRleHQtY2VudGVyIHRleHQtZ3JheS00MDAgcHktOFwiPlx1NkNBMVx1NjcwOVx1NTNFRlx1NzUyOFx1NzY4NFx1OTZDNlx1NjU3MDwvZGl2Pic7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGVwaXNvZGVzID0gZXBpc29kZXNSZXZlcnNlZCA/IFsuLi5jdXJyZW50RXBpc29kZXNdLnJldmVyc2UoKSA6IGN1cnJlbnRFcGlzb2RlcztcclxuICAgIGxldCBodG1sID0gJyc7XHJcblxyXG4gICAgZXBpc29kZXMuZm9yRWFjaCgoZXBpc29kZSwgaW5kZXgpID0+IHtcclxuICAgICAgICAvLyBcdTY4MzlcdTYzNkVcdTUwMTJcdTVFOEZcdTcyQjZcdTYwMDFcdThCQTFcdTdCOTdcdTc3MUZcdTVCOUVcdTc2ODRcdTUyNjdcdTk2QzZcdTdEMjJcdTVGMTVcclxuICAgICAgICBjb25zdCByZWFsSW5kZXggPSBlcGlzb2Rlc1JldmVyc2VkID8gY3VycmVudEVwaXNvZGVzLmxlbmd0aCAtIDEgLSBpbmRleCA6IGluZGV4O1xyXG4gICAgICAgIGNvbnN0IGlzQWN0aXZlID0gcmVhbEluZGV4ID09PSBjdXJyZW50RXBpc29kZUluZGV4O1xyXG5cclxuICAgICAgICBodG1sICs9IGBcclxuICAgICAgICAgICAgPGJ1dHRvbiBpZD1cImVwaXNvZGUtJHtyZWFsSW5kZXh9XCIgXHJcbiAgICAgICAgICAgICAgICAgICAgb25jbGljaz1cInBsYXlFcGlzb2RlKCR7cmVhbEluZGV4fSlcIiBcclxuICAgICAgICAgICAgICAgICAgICBjbGFzcz1cInB4LTQgcHktMiAke2lzQWN0aXZlID8gJ2VwaXNvZGUtYWN0aXZlJyA6ICchYmctWyMyMjJdIGhvdmVyOiFiZy1bIzMzM10gaG92ZXI6IXNoYWRvdy1ub25lJ30gIWJvcmRlciAke2lzQWN0aXZlID8gJyFib3JkZXItYmx1ZS01MDAnIDogJyFib3JkZXItWyMzMzNdJ30gcm91bmRlZC1sZyB0cmFuc2l0aW9uLWNvbG9ycyB0ZXh0LWNlbnRlciBlcGlzb2RlLWJ0blwiPlxyXG4gICAgICAgICAgICAgICAgJHtyZWFsSW5kZXggKyAxfVxyXG4gICAgICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgICBgO1xyXG4gICAgfSk7XHJcblxyXG4gICAgZXBpc29kZXNMaXN0LmlubmVySFRNTCA9IGh0bWw7XHJcbn1cclxuXHJcbi8vIFx1NjRBRFx1NjUzRVx1NjMwN1x1NUI5QVx1OTZDNlx1NjU3MFxyXG5mdW5jdGlvbiBwbGF5RXBpc29kZShpbmRleCkge1xyXG4gICAgLy8gXHU3ODZFXHU0RkREaW5kZXhcdTU3MjhcdTY3MDlcdTY1NDhcdTgzMDNcdTU2RjRcdTUxODVcclxuICAgIGlmIChpbmRleCA8IDAgfHwgaW5kZXggPj0gY3VycmVudEVwaXNvZGVzLmxlbmd0aCkge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICAvLyBcdTRGRERcdTVCNThcdTVGNTNcdTUyNERcdTY0QURcdTY1M0VcdThGREJcdTVFQTZcdUZGMDhcdTU5ODJcdTY3OUNcdTZCNjNcdTU3MjhcdTY0QURcdTY1M0VcdUZGMDlcclxuICAgIGlmIChhcnQgJiYgYXJ0LnZpZGVvICYmICFhcnQudmlkZW8ucGF1c2VkICYmICF2aWRlb0hhc0VuZGVkKSB7XHJcbiAgICAgICAgc2F2ZUN1cnJlbnRQcm9ncmVzcygpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFx1NkUwNVx1OTY2NFx1OEZEQlx1NUVBNlx1NEZERFx1NUI1OFx1OEJBMVx1NjVGNlx1NTY2OFxyXG4gICAgaWYgKHByb2dyZXNzU2F2ZUludGVydmFsKSB7XHJcbiAgICAgICAgY2xlYXJJbnRlcnZhbChwcm9ncmVzc1NhdmVJbnRlcnZhbCk7XHJcbiAgICAgICAgcHJvZ3Jlc3NTYXZlSW50ZXJ2YWwgPSBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFx1OTk5Nlx1NTE0OFx1OTY5MFx1ODVDRlx1NEU0Qlx1NTI0RFx1NTNFRlx1ODBGRFx1NjYzRVx1NzkzQVx1NzY4NFx1OTUxOVx1OEJFRlxyXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Vycm9yJykuc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuICAgIC8vIFx1NjYzRVx1NzkzQVx1NTJBMFx1OEY3RFx1NjMwN1x1NzkzQVx1NTY2OFxyXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3BsYXllci1sb2FkaW5nJykuc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcclxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwbGF5ZXItbG9hZGluZycpLmlubmVySFRNTCA9IGBcclxuICAgICAgICA8ZGl2IGNsYXNzPVwibG9hZGluZy1zcGlubmVyXCI+PC9kaXY+XHJcbiAgICAgICAgPGRpdj5cdTZCNjNcdTU3MjhcdTUyQTBcdThGN0RcdTg5QzZcdTk4OTEuLi48L2Rpdj5cclxuICAgIGA7XHJcblxyXG4gICAgLy8gXHU4M0I3XHU1M0Q2IHNvdXJjZUNvZGVcclxuICAgIGNvbnN0IHVybFBhcmFtczIgPSBuZXcgVVJMU2VhcmNoUGFyYW1zKHdpbmRvdy5sb2NhdGlvbi5zZWFyY2gpO1xyXG4gICAgY29uc3Qgc291cmNlQ29kZSA9IHVybFBhcmFtczIuZ2V0KCdzb3VyY2VfY29kZScpO1xyXG5cclxuICAgIC8vIFx1NTFDNlx1NTkwN1x1NTIwN1x1NjM2Mlx1NTI2N1x1OTZDNlx1NzY4NFVSTFxyXG4gICAgY29uc3QgdXJsID0gY3VycmVudEVwaXNvZGVzW2luZGV4XTtcclxuXHJcbiAgICAvLyBcdTY2RjRcdTY1QjBcdTVGNTNcdTUyNERcdTUyNjdcdTk2QzZcdTdEMjJcdTVGMTVcclxuICAgIGN1cnJlbnRFcGlzb2RlSW5kZXggPSBpbmRleDtcclxuICAgIGN1cnJlbnRWaWRlb1VybCA9IHVybDtcclxuICAgIHZpZGVvSGFzRW5kZWQgPSBmYWxzZTsgLy8gXHU5MUNEXHU3RjZFXHU4OUM2XHU5ODkxXHU3RUQzXHU2NzVGXHU2ODA3XHU1RkQ3XHJcblxyXG4gICAgY2xlYXJWaWRlb1Byb2dyZXNzKCk7XHJcblxyXG4gICAgLy8gXHU2NkY0XHU2NUIwVVJMXHU1M0MyXHU2NTcwXHVGRjA4XHU0RTBEXHU1MjM3XHU2NUIwXHU5ODc1XHU5NzYyXHVGRjA5XHJcbiAgICBjb25zdCBjdXJyZW50VXJsID0gbmV3IFVSTCh3aW5kb3cubG9jYXRpb24uaHJlZik7XHJcbiAgICBjdXJyZW50VXJsLnNlYXJjaFBhcmFtcy5zZXQoJ2luZGV4JywgaW5kZXgpO1xyXG4gICAgY3VycmVudFVybC5zZWFyY2hQYXJhbXMuc2V0KCd1cmwnLCB1cmwpO1xyXG4gICAgY3VycmVudFVybC5zZWFyY2hQYXJhbXMuZGVsZXRlKCdwb3NpdGlvbicpO1xyXG4gICAgd2luZG93Lmhpc3RvcnkucmVwbGFjZVN0YXRlKHt9LCAnJywgY3VycmVudFVybC50b1N0cmluZygpKTtcclxuXHJcbiAgICBpZiAoaXNXZWJraXQpIHtcclxuICAgICAgICBpbml0UGxheWVyKHVybCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGFydC5zd2l0Y2ggPSB1cmw7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gXHU2NkY0XHU2NUIwVUlcclxuICAgIHVwZGF0ZUVwaXNvZGVJbmZvKCk7XHJcbiAgICB1cGRhdGVCdXR0b25TdGF0ZXMoKTtcclxuICAgIHJlbmRlckVwaXNvZGVzKCk7XHJcblxyXG4gICAgLy8gXHU5MUNEXHU3RjZFXHU3NTI4XHU2MjM3XHU3MEI5XHU1MUZCXHU0RjREXHU3RjZFXHU4QkIwXHU1RjU1XHJcbiAgICB1c2VyQ2xpY2tlZFBvc2l0aW9uID0gbnVsbDtcclxuXHJcbiAgICAvLyBcdTRFMDlcdTc5RDJcdTU0MEVcdTRGRERcdTVCNThcdTUyMzBcdTUzODZcdTUzRjJcdThCQjBcdTVGNTVcclxuICAgIHNldFRpbWVvdXQoKCkgPT4gc2F2ZVRvSGlzdG9yeSgpLCAzMDAwKTtcclxufVxyXG5cclxuLy8gXHU2NEFEXHU2NTNFXHU0RTBBXHU0RTAwXHU5NkM2XHJcbmZ1bmN0aW9uIHBsYXlQcmV2aW91c0VwaXNvZGUoKSB7XHJcbiAgICBpZiAoY3VycmVudEVwaXNvZGVJbmRleCA+IDApIHtcclxuICAgICAgICBwbGF5RXBpc29kZShjdXJyZW50RXBpc29kZUluZGV4IC0gMSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8vIFx1NjRBRFx1NjUzRVx1NEUwQlx1NEUwMFx1OTZDNlxyXG5mdW5jdGlvbiBwbGF5TmV4dEVwaXNvZGUoKSB7XHJcbiAgICBpZiAoY3VycmVudEVwaXNvZGVJbmRleCA8IGN1cnJlbnRFcGlzb2Rlcy5sZW5ndGggLSAxKSB7XHJcbiAgICAgICAgcGxheUVwaXNvZGUoY3VycmVudEVwaXNvZGVJbmRleCArIDEpO1xyXG4gICAgfVxyXG59XHJcblxyXG4vLyBcdTU5MERcdTUyMzZcdTY0QURcdTY1M0VcdTk0RkVcdTYzQTVcclxuZnVuY3Rpb24gY29weUxpbmtzKCkge1xyXG4gICAgLy8gXHU1QzFEXHU4QkQ1XHU0RUNFVVJMXHU0RTJEXHU4M0I3XHU1M0Q2XHU1M0MyXHU2NTcwXHJcbiAgICBjb25zdCB1cmxQYXJhbXMgPSBuZXcgVVJMU2VhcmNoUGFyYW1zKHdpbmRvdy5sb2NhdGlvbi5zZWFyY2gpO1xyXG4gICAgY29uc3QgbGlua1VybCA9IHVybFBhcmFtcy5nZXQoJ3VybCcpIHx8ICcnO1xyXG4gICAgaWYgKGxpbmtVcmwgIT09ICcnKSB7XHJcbiAgICAgICAgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQobGlua1VybCkudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgIHNob3dUb2FzdCgnXHU2NEFEXHU2NTNFXHU5NEZFXHU2M0E1XHU1REYyXHU1OTBEXHU1MjM2JywgJ3N1Y2Nlc3MnKTtcclxuICAgICAgICB9KS5jYXRjaChlcnIgPT4ge1xyXG4gICAgICAgICAgICBzaG93VG9hc3QoJ1x1NTkwRFx1NTIzNlx1NTkzMVx1OEQyNVx1RkYwQ1x1OEJGN1x1NjhDMFx1NjdFNVx1NkQ0Rlx1ODlDOFx1NTY2OFx1Njc0M1x1OTY1MCcsICdlcnJvcicpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59XHJcblxyXG4vLyBcdTUyMDdcdTYzNjJcdTk2QzZcdTY1NzBcdTYzOTJcdTVFOEZcclxuZnVuY3Rpb24gdG9nZ2xlRXBpc29kZU9yZGVyKCkge1xyXG4gICAgZXBpc29kZXNSZXZlcnNlZCA9ICFlcGlzb2Rlc1JldmVyc2VkO1xyXG5cclxuICAgIC8vIFx1NEZERFx1NUI1OFx1NTIzMGxvY2FsU3RvcmFnZVxyXG4gICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2VwaXNvZGVzUmV2ZXJzZWQnLCBlcGlzb2Rlc1JldmVyc2VkKTtcclxuXHJcbiAgICAvLyBcdTkxQ0RcdTY1QjBcdTZFMzJcdTY3RDNcdTk2QzZcdTY1NzBcdTUyMTdcdTg4NjhcclxuICAgIHJlbmRlckVwaXNvZGVzKCk7XHJcblxyXG4gICAgLy8gXHU2NkY0XHU2NUIwXHU2MzkyXHU1RThGXHU2MzA5XHU5NEFFXHJcbiAgICB1cGRhdGVPcmRlckJ1dHRvbigpO1xyXG59XHJcblxyXG4vLyBcdTY2RjRcdTY1QjBcdTYzOTJcdTVFOEZcdTYzMDlcdTk0QUVcdTcyQjZcdTYwMDFcclxuZnVuY3Rpb24gdXBkYXRlT3JkZXJCdXR0b24oKSB7XHJcbiAgICBjb25zdCBvcmRlclRleHQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnb3JkZXJUZXh0Jyk7XHJcbiAgICBjb25zdCBvcmRlckljb24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnb3JkZXJJY29uJyk7XHJcblxyXG4gICAgaWYgKG9yZGVyVGV4dCAmJiBvcmRlckljb24pIHtcclxuICAgICAgICBvcmRlclRleHQudGV4dENvbnRlbnQgPSBlcGlzb2Rlc1JldmVyc2VkID8gJ1x1NkI2M1x1NUU4Rlx1NjM5Mlx1NTIxNycgOiAnXHU1MDEyXHU1RThGXHU2MzkyXHU1MjE3JztcclxuICAgICAgICBvcmRlckljb24uc3R5bGUudHJhbnNmb3JtID0gZXBpc29kZXNSZXZlcnNlZCA/ICdyb3RhdGUoMTgwZGVnKScgOiAnJztcclxuICAgIH1cclxufVxyXG5cclxuLy8gXHU4QkJFXHU3RjZFXHU4RkRCXHU1RUE2XHU2NzYxXHU1MUM2XHU3ODZFXHU3MEI5XHU1MUZCXHU1OTA0XHU3NDA2XHJcbmZ1bmN0aW9uIHNldHVwUHJvZ3Jlc3NCYXJQcmVjaXNlQ2xpY2tzKCkge1xyXG4gICAgLy8gXHU2N0U1XHU2MjdFRFBsYXllclx1NzY4NFx1OEZEQlx1NUVBNlx1Njc2MVx1NTE0M1x1N0QyMFxyXG4gICAgY29uc3QgcHJvZ3Jlc3NCYXIgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuZHBsYXllci1iYXItd3JhcCcpO1xyXG4gICAgaWYgKCFwcm9ncmVzc0JhciB8fCAhYXJ0IHx8ICFhcnQudmlkZW8pIHJldHVybjtcclxuXHJcbiAgICAvLyBcdTc5RkJcdTk2NjRcdTUzRUZcdTgwRkRcdTVCNThcdTU3MjhcdTc2ODRcdTY1RTdcdTRFOEJcdTRFRjZcdTc2RDFcdTU0MkNcdTU2NjhcclxuICAgIHByb2dyZXNzQmFyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIGhhbmRsZVByb2dyZXNzQmFyQ2xpY2spO1xyXG5cclxuICAgIC8vIFx1NkRGQlx1NTJBMFx1NjVCMFx1NzY4NFx1NEU4Qlx1NEVGNlx1NzZEMVx1NTQyQ1x1NTY2OFxyXG4gICAgcHJvZ3Jlc3NCYXIuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgaGFuZGxlUHJvZ3Jlc3NCYXJDbGljayk7XHJcblxyXG4gICAgLy8gXHU1NzI4XHU3OUZCXHU1MkE4XHU3QUVGXHU0RTVGXHU2REZCXHU1MkEwXHU4OUU2XHU2NDc4XHU0RThCXHU0RUY2XHU2NTJGXHU2MzAxXHJcbiAgICBwcm9ncmVzc0Jhci5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgaGFuZGxlUHJvZ3Jlc3NCYXJUb3VjaCk7XHJcbiAgICBwcm9ncmVzc0Jhci5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgaGFuZGxlUHJvZ3Jlc3NCYXJUb3VjaCk7XHJcblxyXG4gICAgLy8gXHU1OTA0XHU3NDA2XHU4RkRCXHU1RUE2XHU2NzYxXHU3MEI5XHU1MUZCXHJcbiAgICBmdW5jdGlvbiBoYW5kbGVQcm9ncmVzc0JhckNsaWNrKGUpIHtcclxuICAgICAgICBpZiAoIWFydCB8fCAhYXJ0LnZpZGVvKSByZXR1cm47XHJcblxyXG4gICAgICAgIC8vIFx1OEJBMVx1N0I5N1x1NzBCOVx1NTFGQlx1NEY0RFx1N0Y2RVx1NzZGOFx1NUJGOVx1NEU4RVx1OEZEQlx1NUVBNlx1Njc2MVx1NzY4NFx1NkJENFx1NEY4QlxyXG4gICAgICAgIGNvbnN0IHJlY3QgPSBlLmN1cnJlbnRUYXJnZXQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcbiAgICAgICAgY29uc3QgcGVyY2VudGFnZSA9IChlLmNsaWVudFggLSByZWN0LmxlZnQpIC8gcmVjdC53aWR0aDtcclxuXHJcbiAgICAgICAgLy8gXHU4QkExXHU3Qjk3XHU3MEI5XHU1MUZCXHU0RjREXHU3RjZFXHU1QkY5XHU1RTk0XHU3Njg0XHU4OUM2XHU5ODkxXHU2NUY2XHU5NUY0XHJcbiAgICAgICAgY29uc3QgZHVyYXRpb24gPSBhcnQudmlkZW8uZHVyYXRpb247XHJcbiAgICAgICAgbGV0IGNsaWNrVGltZSA9IHBlcmNlbnRhZ2UgKiBkdXJhdGlvbjtcclxuXHJcbiAgICAgICAgLy8gXHU1OTA0XHU3NDA2XHU4OUM2XHU5ODkxXHU2M0E1XHU4RkQxXHU3RUQzXHU1QzNFXHU3Njg0XHU2MEM1XHU1MUI1XHJcbiAgICAgICAgaWYgKGR1cmF0aW9uIC0gY2xpY2tUaW1lIDwgMSkge1xyXG4gICAgICAgICAgICAvLyBcdTU5ODJcdTY3OUNcdTcwQjlcdTUxRkJcdTRGNERcdTdGNkVcdTk3NUVcdTVFMzhcdTYzQTVcdThGRDFcdTdFRDNcdTVDM0VcdUZGMENcdTdBMERcdTVGQUVcdTVGODBcdTUyNERcdTc5RkJcdTRFMDBcdTcwQjlcclxuICAgICAgICAgICAgY2xpY2tUaW1lID0gTWF0aC5taW4oY2xpY2tUaW1lLCBkdXJhdGlvbiAtIDEuNSk7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gXHU4QkIwXHU1RjU1XHU3NTI4XHU2MjM3XHU3MEI5XHU1MUZCXHU3Njg0XHU0RjREXHU3RjZFXHJcbiAgICAgICAgdXNlckNsaWNrZWRQb3NpdGlvbiA9IGNsaWNrVGltZTtcclxuXHJcbiAgICAgICAgLy8gXHU5NjNCXHU2QjYyXHU5RUQ4XHU4QkE0XHU0RThCXHU0RUY2XHU0RjIwXHU2NEFEXHVGRjBDXHU5MDdGXHU1MTRERFBsYXllclx1NTE4NVx1OTBFOFx1OTAzQlx1OEY5MVx1NUMwNlx1ODlDNlx1OTg5MVx1OERGM1x1ODFGM1x1NjcyQlx1NUMzRVxyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcblxyXG4gICAgICAgIC8vIFx1NzZGNFx1NjNBNVx1OEJCRVx1N0Y2RVx1ODlDNlx1OTg5MVx1NjVGNlx1OTVGNFxyXG4gICAgICAgIGFydC5zZWVrKGNsaWNrVGltZSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gXHU1OTA0XHU3NDA2XHU3OUZCXHU1MkE4XHU3QUVGXHU4OUU2XHU2NDc4XHU0RThCXHU0RUY2XHJcbiAgICBmdW5jdGlvbiBoYW5kbGVQcm9ncmVzc0JhclRvdWNoKGUpIHtcclxuICAgICAgICBpZiAoIWFydCB8fCAhYXJ0LnZpZGVvIHx8ICFlLnRvdWNoZXNbMF0pIHJldHVybjtcclxuXHJcbiAgICAgICAgY29uc3QgdG91Y2ggPSBlLnRvdWNoZXNbMF07XHJcbiAgICAgICAgY29uc3QgcmVjdCA9IGUuY3VycmVudFRhcmdldC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuICAgICAgICBjb25zdCBwZXJjZW50YWdlID0gKHRvdWNoLmNsaWVudFggLSByZWN0LmxlZnQpIC8gcmVjdC53aWR0aDtcclxuXHJcbiAgICAgICAgY29uc3QgZHVyYXRpb24gPSBhcnQudmlkZW8uZHVyYXRpb247XHJcbiAgICAgICAgbGV0IGNsaWNrVGltZSA9IHBlcmNlbnRhZ2UgKiBkdXJhdGlvbjtcclxuXHJcbiAgICAgICAgLy8gXHU1OTA0XHU3NDA2XHU4OUM2XHU5ODkxXHU2M0E1XHU4RkQxXHU3RUQzXHU1QzNFXHU3Njg0XHU2MEM1XHU1MUI1XHJcbiAgICAgICAgaWYgKGR1cmF0aW9uIC0gY2xpY2tUaW1lIDwgMSkge1xyXG4gICAgICAgICAgICBjbGlja1RpbWUgPSBNYXRoLm1pbihjbGlja1RpbWUsIGR1cmF0aW9uIC0gMS41KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFx1OEJCMFx1NUY1NVx1NzUyOFx1NjIzN1x1NzBCOVx1NTFGQlx1NzY4NFx1NEY0RFx1N0Y2RVxyXG4gICAgICAgIHVzZXJDbGlja2VkUG9zaXRpb24gPSBjbGlja1RpbWU7XHJcblxyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgYXJ0LnNlZWsoY2xpY2tUaW1lKTtcclxuICAgIH1cclxufVxyXG5cclxuLy8gXHU1NzI4XHU2NEFEXHU2NTNFXHU1NjY4XHU1MjFEXHU1OUNCXHU1MzE2XHU1NDBFXHU2REZCXHU1MkEwXHU4OUM2XHU5ODkxXHU1MjMwXHU1Mzg2XHU1M0YyXHU4QkIwXHU1RjU1XHJcbmZ1bmN0aW9uIHNhdmVUb0hpc3RvcnkoKSB7XHJcbiAgICAvLyBcdTc4NkVcdTRGREQgY3VycmVudEVwaXNvZGVzIFx1OTc1RVx1N0E3QVx1NEUxNFx1NjcwOVx1NUY1M1x1NTI0RFx1ODlDNlx1OTg5MVVSTFxyXG4gICAgaWYgKCFjdXJyZW50RXBpc29kZXMgfHwgY3VycmVudEVwaXNvZGVzLmxlbmd0aCA9PT0gMCB8fCAhY3VycmVudFZpZGVvVXJsKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFx1NUMxRFx1OEJENVx1NEVDRVVSTFx1NEUyRFx1ODNCN1x1NTNENlx1NTNDMlx1NjU3MFxyXG4gICAgY29uc3QgdXJsUGFyYW1zID0gbmV3IFVSTFNlYXJjaFBhcmFtcyh3aW5kb3cubG9jYXRpb24uc2VhcmNoKTtcclxuICAgIGNvbnN0IHNvdXJjZU5hbWUgPSB1cmxQYXJhbXMuZ2V0KCdzb3VyY2UnKSB8fCAnJztcclxuICAgIGNvbnN0IHNvdXJjZUNvZGUgPSB1cmxQYXJhbXMuZ2V0KCdzb3VyY2UnKSB8fCAnJztcclxuICAgIGNvbnN0IGlkX2Zyb21fcGFyYW1zID0gdXJsUGFyYW1zLmdldCgnaWQnKTsgLy8gR2V0IHZpZGVvIElEIGZyb20gcGxheWVyIFVSTCAocGFzc2VkIGFzICdpZCcpXHJcblxyXG4gICAgLy8gXHU4M0I3XHU1M0Q2XHU1RjUzXHU1MjREXHU2NEFEXHU2NTNFXHU4RkRCXHU1RUE2XHJcbiAgICBsZXQgY3VycmVudFBvc2l0aW9uID0gMDtcclxuICAgIGxldCB2aWRlb0R1cmF0aW9uID0gMDtcclxuXHJcbiAgICBpZiAoYXJ0ICYmIGFydC52aWRlbykge1xyXG4gICAgICAgIGN1cnJlbnRQb3NpdGlvbiA9IGFydC52aWRlby5jdXJyZW50VGltZTtcclxuICAgICAgICB2aWRlb0R1cmF0aW9uID0gYXJ0LnZpZGVvLmR1cmF0aW9uO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIERlZmluZSBhIHNob3cgaWRlbnRpZmllcjogUHJpb3JpdGl6ZSBzb3VyY2VOYW1lX2lkLCBmYWxsYmFjayB0byBmaXJzdCBlcGlzb2RlIFVSTCBvciBjdXJyZW50IHZpZGVvIFVSTFxyXG4gICAgbGV0IHNob3dfaWRlbnRpZmllcl9mb3JfdmlkZW9faW5mbztcclxuICAgIGlmIChzb3VyY2VOYW1lICYmIGlkX2Zyb21fcGFyYW1zKSB7XHJcbiAgICAgICAgc2hvd19pZGVudGlmaWVyX2Zvcl92aWRlb19pbmZvID0gYCR7c291cmNlTmFtZX1fJHtpZF9mcm9tX3BhcmFtc31gO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBzaG93X2lkZW50aWZpZXJfZm9yX3ZpZGVvX2luZm8gPSAoY3VycmVudEVwaXNvZGVzICYmIGN1cnJlbnRFcGlzb2Rlcy5sZW5ndGggPiAwKSA/IGN1cnJlbnRFcGlzb2Rlc1swXSA6IGN1cnJlbnRWaWRlb1VybDtcclxuICAgIH1cclxuXHJcbiAgICAvLyBcdTY3ODRcdTVFRkFcdTg5ODFcdTRGRERcdTVCNThcdTc2ODRcdTg5QzZcdTk4OTFcdTRGRTFcdTYwNkZcdTVCRjlcdThDNjFcclxuICAgIGNvbnN0IHZpZGVvSW5mbyA9IHtcclxuICAgICAgICB0aXRsZTogY3VycmVudFZpZGVvVGl0bGUsXHJcbiAgICAgICAgZGlyZWN0VmlkZW9Vcmw6IGN1cnJlbnRWaWRlb1VybCwgLy8gQ3VycmVudCBlcGlzb2RlJ3MgZGlyZWN0IFVSTFxyXG4gICAgICAgIHVybDogYHBsYXllci5odG1sP3VybD0ke2VuY29kZVVSSUNvbXBvbmVudChjdXJyZW50VmlkZW9VcmwpfSZ0aXRsZT0ke2VuY29kZVVSSUNvbXBvbmVudChjdXJyZW50VmlkZW9UaXRsZSl9JnNvdXJjZT0ke2VuY29kZVVSSUNvbXBvbmVudChzb3VyY2VOYW1lKX0mc291cmNlX2NvZGU9JHtlbmNvZGVVUklDb21wb25lbnQoc291cmNlQ29kZSl9JmlkPSR7ZW5jb2RlVVJJQ29tcG9uZW50KGlkX2Zyb21fcGFyYW1zIHx8ICcnKX0maW5kZXg9JHtjdXJyZW50RXBpc29kZUluZGV4fSZwb3NpdGlvbj0ke01hdGguZmxvb3IoY3VycmVudFBvc2l0aW9uIHx8IDApfWAsXHJcbiAgICAgICAgZXBpc29kZUluZGV4OiBjdXJyZW50RXBpc29kZUluZGV4LFxyXG4gICAgICAgIHNvdXJjZU5hbWU6IHNvdXJjZU5hbWUsXHJcbiAgICAgICAgdm9kX2lkOiBpZF9mcm9tX3BhcmFtcyB8fCAnJywgLy8gU3RvcmUgdGhlIElEIGZyb20gcGFyYW1zIGFzIHZvZF9pZCBpbiBoaXN0b3J5IGl0ZW1cclxuICAgICAgICBzb3VyY2VDb2RlOiBzb3VyY2VDb2RlLFxyXG4gICAgICAgIHNob3dJZGVudGlmaWVyOiBzaG93X2lkZW50aWZpZXJfZm9yX3ZpZGVvX2luZm8sIC8vIElkZW50aWZpZXIgZm9yIHRoZSBzaG93L3Nlcmllc1xyXG4gICAgICAgIHRpbWVzdGFtcDogRGF0ZS5ub3coKSxcclxuICAgICAgICBwbGF5YmFja1Bvc2l0aW9uOiBjdXJyZW50UG9zaXRpb24sXHJcbiAgICAgICAgZHVyYXRpb246IHZpZGVvRHVyYXRpb24sXHJcbiAgICAgICAgZXBpc29kZXM6IGN1cnJlbnRFcGlzb2RlcyAmJiBjdXJyZW50RXBpc29kZXMubGVuZ3RoID4gMCA/IFsuLi5jdXJyZW50RXBpc29kZXNdIDogW11cclxuICAgIH07XHJcbiAgICBcclxuICAgIHRyeSB7XHJcbiAgICAgICAgY29uc3QgaGlzdG9yeSA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3ZpZXdpbmdIaXN0b3J5JykgfHwgJ1tdJyk7XHJcblxyXG4gICAgICAgIC8vIFx1NjhDMFx1NjdFNVx1NjYyRlx1NTQyNlx1NURGMlx1N0VDRlx1NUI1OFx1NTcyOFx1NzZGOFx1NTQwQ1x1NzY4NFx1N0NGQlx1NTIxN1x1OEJCMFx1NUY1NSAoXHU1N0ZBXHU0RThFXHU2ODA3XHU5ODk4XHUzMDAxXHU2NzY1XHU2RTkwXHU1NDhDIHNob3dJZGVudGlmaWVyKVxyXG4gICAgICAgIGNvbnN0IGV4aXN0aW5nSW5kZXggPSBoaXN0b3J5LmZpbmRJbmRleChpdGVtID0+IFxyXG4gICAgICAgICAgICBpdGVtLnRpdGxlID09PSB2aWRlb0luZm8udGl0bGUgJiYgXHJcbiAgICAgICAgICAgIGl0ZW0uc291cmNlTmFtZSA9PT0gdmlkZW9JbmZvLnNvdXJjZU5hbWUgJiYgXHJcbiAgICAgICAgICAgIGl0ZW0uc2hvd0lkZW50aWZpZXIgPT09IHZpZGVvSW5mby5zaG93SWRlbnRpZmllclxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGlmIChleGlzdGluZ0luZGV4ICE9PSAtMSkge1xyXG4gICAgICAgICAgICAvLyBcdTVCNThcdTU3MjhcdTUyMTlcdTY2RjRcdTY1QjBcdTczQjBcdTY3MDlcdThCQjBcdTVGNTVcdTc2ODRcdTVGNTNcdTUyNERcdTk2QzZcdTY1NzBcdTMwMDFcdTY1RjZcdTk1RjRcdTYyMzNcdTMwMDFcdTY0QURcdTY1M0VcdThGREJcdTVFQTZcdTU0OENVUkxcdTdCNDlcclxuICAgICAgICAgICAgY29uc3QgZXhpc3RpbmdJdGVtID0gaGlzdG9yeVtleGlzdGluZ0luZGV4XTtcclxuICAgICAgICAgICAgZXhpc3RpbmdJdGVtLmVwaXNvZGVJbmRleCA9IHZpZGVvSW5mby5lcGlzb2RlSW5kZXg7XHJcbiAgICAgICAgICAgIGV4aXN0aW5nSXRlbS50aW1lc3RhbXAgPSB2aWRlb0luZm8udGltZXN0YW1wO1xyXG4gICAgICAgICAgICBleGlzdGluZ0l0ZW0uc291cmNlTmFtZSA9IHZpZGVvSW5mby5zb3VyY2VOYW1lOyAvLyBTaG91bGQgYmUgY29uc2lzdGVudCwgYnV0IHVwZGF0ZSBqdXN0IGluIGNhc2VcclxuICAgICAgICAgICAgZXhpc3RpbmdJdGVtLnNvdXJjZUNvZGUgPSB2aWRlb0luZm8uc291cmNlQ29kZTtcclxuICAgICAgICAgICAgZXhpc3RpbmdJdGVtLnZvZF9pZCA9IHZpZGVvSW5mby52b2RfaWQ7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBVcGRhdGUgVVJMcyB0byByZWZsZWN0IHRoZSBjdXJyZW50IGVwaXNvZGUgYmVpbmcgd2F0Y2hlZFxyXG4gICAgICAgICAgICBleGlzdGluZ0l0ZW0uZGlyZWN0VmlkZW9VcmwgPSB2aWRlb0luZm8uZGlyZWN0VmlkZW9Vcmw7IC8vIEN1cnJlbnQgZXBpc29kZSdzIGRpcmVjdCBVUkxcclxuICAgICAgICAgICAgZXhpc3RpbmdJdGVtLnVybCA9IHZpZGVvSW5mby51cmw7IC8vIFBsYXllciBsaW5rIGZvciB0aGUgY3VycmVudCBlcGlzb2RlXHJcblxyXG4gICAgICAgICAgICAvLyBcdTY2RjRcdTY1QjBcdTY0QURcdTY1M0VcdThGREJcdTVFQTZcdTRGRTFcdTYwNkZcclxuICAgICAgICAgICAgZXhpc3RpbmdJdGVtLnBsYXliYWNrUG9zaXRpb24gPSB2aWRlb0luZm8ucGxheWJhY2tQb3NpdGlvbiA+IDEwID8gdmlkZW9JbmZvLnBsYXliYWNrUG9zaXRpb24gOiAoZXhpc3RpbmdJdGVtLnBsYXliYWNrUG9zaXRpb24gfHwgMCk7XHJcbiAgICAgICAgICAgIGV4aXN0aW5nSXRlbS5kdXJhdGlvbiA9IHZpZGVvSW5mby5kdXJhdGlvbiB8fCBleGlzdGluZ0l0ZW0uZHVyYXRpb247XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAvLyBcdTY2RjRcdTY1QjBcdTk2QzZcdTY1NzBcdTUyMTdcdTg4NjhcdUZGMDhcdTU5ODJcdTY3OUNcdTY1QjBcdTc2ODRcdTk2QzZcdTY1NzBcdTUyMTdcdTg4NjhcdTRFMEVcdTVCNThcdTUwQThcdTc2ODRcdTRFMERcdTU0MENcdUZGMENcdTRGOEJcdTU5ODJcdTk2QzZcdTY1NzBcdTU4OUVcdTUyQTBcdTRFODZcdUZGMDlcclxuICAgICAgICAgICAgaWYgKHZpZGVvSW5mby5lcGlzb2RlcyAmJiB2aWRlb0luZm8uZXBpc29kZXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFleGlzdGluZ0l0ZW0uZXBpc29kZXMgfHwgXHJcbiAgICAgICAgICAgICAgICAgICAgIUFycmF5LmlzQXJyYXkoZXhpc3RpbmdJdGVtLmVwaXNvZGVzKSB8fCBcclxuICAgICAgICAgICAgICAgICAgICBleGlzdGluZ0l0ZW0uZXBpc29kZXMubGVuZ3RoICE9PSB2aWRlb0luZm8uZXBpc29kZXMubGVuZ3RoIHx8IFxyXG4gICAgICAgICAgICAgICAgICAgICF2aWRlb0luZm8uZXBpc29kZXMuZXZlcnkoKGVwLCBpKSA9PiBlcCA9PT0gZXhpc3RpbmdJdGVtLmVwaXNvZGVzW2ldKSkgeyAvLyBCYXNpYyBjaGVjayBmb3IgY29udGVudCBjaGFuZ2VcclxuICAgICAgICAgICAgICAgICAgICBleGlzdGluZ0l0ZW0uZXBpc29kZXMgPSBbLi4udmlkZW9JbmZvLmVwaXNvZGVzXTsgLy8gRGVlcCBjb3B5XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIFx1NzlGQlx1NTIzMFx1NjcwMFx1NTI0RFx1OTc2MlxyXG4gICAgICAgICAgICBjb25zdCB1cGRhdGVkSXRlbSA9IGhpc3Rvcnkuc3BsaWNlKGV4aXN0aW5nSW5kZXgsIDEpWzBdO1xyXG4gICAgICAgICAgICBoaXN0b3J5LnVuc2hpZnQodXBkYXRlZEl0ZW0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIFx1NkRGQlx1NTJBMFx1NjVCMFx1OEJCMFx1NUY1NVx1NTIzMFx1NjcwMFx1NTI0RFx1OTc2MlxyXG4gICAgICAgICAgICBoaXN0b3J5LnVuc2hpZnQodmlkZW9JbmZvKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFx1OTY1MFx1NTIzNlx1NTM4Nlx1NTNGMlx1OEJCMFx1NUY1NVx1NjU3MFx1OTFDRlx1NEUzQTUwXHU2NzYxXHJcbiAgICAgICAgaWYgKGhpc3RvcnkubGVuZ3RoID4gNTApIGhpc3Rvcnkuc3BsaWNlKDUwKTtcclxuXHJcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ3ZpZXdpbmdIaXN0b3J5JywgSlNPTi5zdHJpbmdpZnkoaGlzdG9yeSkpO1xyXG4gICAgfSBjYXRjaCAoZSkge1xyXG4gICAgfVxyXG59XHJcblxyXG4vLyBcdTY2M0VcdTc5M0FcdTYwNjJcdTU5MERcdTRGNERcdTdGNkVcdTYzRDBcdTc5M0FcclxuZnVuY3Rpb24gc2hvd1Bvc2l0aW9uUmVzdG9yZUhpbnQocG9zaXRpb24pIHtcclxuICAgIGlmICghcG9zaXRpb24gfHwgcG9zaXRpb24gPCAxMCkgcmV0dXJuO1xyXG5cclxuICAgIC8vIFx1NTIxQlx1NUVGQVx1NjNEMFx1NzkzQVx1NTE0M1x1N0QyMFxyXG4gICAgY29uc3QgaGludCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgaGludC5jbGFzc05hbWUgPSAncG9zaXRpb24tcmVzdG9yZS1oaW50JztcclxuICAgIGhpbnQuaW5uZXJIVE1MID0gYFxyXG4gICAgICAgIDxkaXYgY2xhc3M9XCJoaW50LWNvbnRlbnRcIj5cclxuICAgICAgICAgICAgXHU1REYyXHU0RUNFICR7Zm9ybWF0VGltZShwb3NpdGlvbil9IFx1N0VFN1x1N0VFRFx1NjRBRFx1NjUzRVxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgYDtcclxuXHJcbiAgICAvLyBcdTZERkJcdTUyQTBcdTUyMzBcdTY0QURcdTY1M0VcdTU2NjhcdTVCQjlcdTU2NjhcclxuICAgIGNvbnN0IHBsYXllckNvbnRhaW5lciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5wbGF5ZXItY29udGFpbmVyJyk7IC8vIEVuc3VyZSB0aGlzIHNlbGVjdG9yIGlzIGNvcnJlY3RcclxuICAgIGlmIChwbGF5ZXJDb250YWluZXIpIHsgLy8gQ2hlY2sgaWYgcGxheWVyQ29udGFpbmVyIGV4aXN0c1xyXG4gICAgICAgIHBsYXllckNvbnRhaW5lci5hcHBlbmRDaGlsZChoaW50KTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuOyAvLyBFeGl0IGlmIGNvbnRhaW5lciBub3QgZm91bmRcclxuICAgIH1cclxuXHJcbiAgICAvLyBcdTY2M0VcdTc5M0FcdTYzRDBcdTc5M0FcclxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgIGhpbnQuY2xhc3NMaXN0LmFkZCgnc2hvdycpO1xyXG5cclxuICAgICAgICAvLyAzXHU3OUQyXHU1NDBFXHU5NjkwXHU4NUNGXHJcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgICAgIGhpbnQuY2xhc3NMaXN0LnJlbW92ZSgnc2hvdycpO1xyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IGhpbnQucmVtb3ZlKCksIDMwMCk7XHJcbiAgICAgICAgfSwgMzAwMCk7XHJcbiAgICB9LCAxMDApO1xyXG59XHJcblxyXG4vLyBcdTY4M0NcdTVGMEZcdTUzMTZcdTY1RjZcdTk1RjRcdTRFM0EgbW06c3MgXHU2ODNDXHU1RjBGXHJcbmZ1bmN0aW9uIGZvcm1hdFRpbWUoc2Vjb25kcykge1xyXG4gICAgaWYgKGlzTmFOKHNlY29uZHMpKSByZXR1cm4gJzAwOjAwJztcclxuXHJcbiAgICBjb25zdCBtaW51dGVzID0gTWF0aC5mbG9vcihzZWNvbmRzIC8gNjApO1xyXG4gICAgY29uc3QgcmVtYWluaW5nU2Vjb25kcyA9IE1hdGguZmxvb3Ioc2Vjb25kcyAlIDYwKTtcclxuXHJcbiAgICByZXR1cm4gYCR7bWludXRlcy50b1N0cmluZygpLnBhZFN0YXJ0KDIsICcwJyl9OiR7cmVtYWluaW5nU2Vjb25kcy50b1N0cmluZygpLnBhZFN0YXJ0KDIsICcwJyl9YDtcclxufVxyXG5cclxuLy8gXHU1RjAwXHU1OUNCXHU1QjlBXHU2NzFGXHU0RkREXHU1QjU4XHU2NEFEXHU2NTNFXHU4RkRCXHU1RUE2XHJcbmZ1bmN0aW9uIHN0YXJ0UHJvZ3Jlc3NTYXZlSW50ZXJ2YWwoKSB7XHJcbiAgICAvLyBcdTZFMDVcdTk2NjRcdTUzRUZcdTgwRkRcdTVCNThcdTU3MjhcdTc2ODRcdTY1RTdcdThCQTFcdTY1RjZcdTU2NjhcclxuICAgIGlmIChwcm9ncmVzc1NhdmVJbnRlcnZhbCkge1xyXG4gICAgICAgIGNsZWFySW50ZXJ2YWwocHJvZ3Jlc3NTYXZlSW50ZXJ2YWwpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFx1NkJDRjMwXHU3OUQyXHU0RkREXHU1QjU4XHU0RTAwXHU2QjIxXHU2NEFEXHU2NTNFXHU4RkRCXHU1RUE2XHJcbiAgICBwcm9ncmVzc1NhdmVJbnRlcnZhbCA9IHNldEludGVydmFsKHNhdmVDdXJyZW50UHJvZ3Jlc3MsIDMwMDAwKTtcclxufVxyXG5cclxuLy8gXHU0RkREXHU1QjU4XHU1RjUzXHU1MjREXHU2NEFEXHU2NTNFXHU4RkRCXHU1RUE2XHJcbmZ1bmN0aW9uIHNhdmVDdXJyZW50UHJvZ3Jlc3MoKSB7XHJcbiAgICBpZiAoIWFydCB8fCAhYXJ0LnZpZGVvKSByZXR1cm47XHJcbiAgICBjb25zdCBjdXJyZW50VGltZSA9IGFydC52aWRlby5jdXJyZW50VGltZTtcclxuICAgIGNvbnN0IGR1cmF0aW9uID0gYXJ0LnZpZGVvLmR1cmF0aW9uO1xyXG4gICAgaWYgKCFkdXJhdGlvbiB8fCBjdXJyZW50VGltZSA8IDEpIHJldHVybjtcclxuXHJcbiAgICAvLyBcdTU3Mjhsb2NhbFN0b3JhZ2VcdTRFMkRcdTRGRERcdTVCNThcdThGREJcdTVFQTZcclxuICAgIGNvbnN0IHByb2dyZXNzS2V5ID0gYHZpZGVvUHJvZ3Jlc3NfJHtnZXRWaWRlb0lkKCl9YDtcclxuICAgIGNvbnN0IHByb2dyZXNzRGF0YSA9IHtcclxuICAgICAgICBwb3NpdGlvbjogY3VycmVudFRpbWUsXHJcbiAgICAgICAgZHVyYXRpb246IGR1cmF0aW9uLFxyXG4gICAgICAgIHRpbWVzdGFtcDogRGF0ZS5ub3coKVxyXG4gICAgfTtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0ocHJvZ3Jlc3NLZXksIEpTT04uc3RyaW5naWZ5KHByb2dyZXNzRGF0YSkpO1xyXG4gICAgICAgIC8vIC0tLSBcdTY1QjBcdTU4OUVcdUZGMUFcdTU0MENcdTZCNjVcdTY2RjRcdTY1QjAgdmlld2luZ0hpc3RvcnkgXHU0RTJEXHU3Njg0XHU4RkRCXHU1RUE2IC0tLVxyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGhpc3RvcnlSYXcgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgndmlld2luZ0hpc3RvcnknKTtcclxuICAgICAgICAgICAgaWYgKGhpc3RvcnlSYXcpIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGhpc3RvcnkgPSBKU09OLnBhcnNlKGhpc3RvcnlSYXcpO1xyXG4gICAgICAgICAgICAgICAgLy8gXHU3NTI4IHRpdGxlICsgXHU5NkM2XHU2NTcwXHU3RDIyXHU1RjE1XHU1NTJGXHU0RTAwXHU2ODA3XHU4QkM2XHJcbiAgICAgICAgICAgICAgICBjb25zdCBpZHggPSBoaXN0b3J5LmZpbmRJbmRleChpdGVtID0+XHJcbiAgICAgICAgICAgICAgICAgICAgaXRlbS50aXRsZSA9PT0gY3VycmVudFZpZGVvVGl0bGUgJiZcclxuICAgICAgICAgICAgICAgICAgICAoaXRlbS5lcGlzb2RlSW5kZXggPT09IHVuZGVmaW5lZCB8fCBpdGVtLmVwaXNvZGVJbmRleCA9PT0gY3VycmVudEVwaXNvZGVJbmRleClcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICBpZiAoaWR4ICE9PSAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFx1NTNFQVx1NTcyOFx1OEZEQlx1NUVBNlx1NjcwOVx1NjYwRVx1NjYzRVx1NTNEOFx1NTMxNlx1NjVGNlx1NjI0RFx1NjZGNFx1NjVCMFx1RkYwQ1x1NTFDRlx1NUMxMVx1NTE5OVx1NTE2NVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChcclxuICAgICAgICAgICAgICAgICAgICAgICAgTWF0aC5hYnMoKGhpc3RvcnlbaWR4XS5wbGF5YmFja1Bvc2l0aW9uIHx8IDApIC0gY3VycmVudFRpbWUpID4gMiB8fFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBNYXRoLmFicygoaGlzdG9yeVtpZHhdLmR1cmF0aW9uIHx8IDApIC0gZHVyYXRpb24pID4gMlxyXG4gICAgICAgICAgICAgICAgICAgICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBoaXN0b3J5W2lkeF0ucGxheWJhY2tQb3NpdGlvbiA9IGN1cnJlbnRUaW1lO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBoaXN0b3J5W2lkeF0uZHVyYXRpb24gPSBkdXJhdGlvbjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaGlzdG9yeVtpZHhdLnRpbWVzdGFtcCA9IERhdGUubm93KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCd2aWV3aW5nSGlzdG9yeScsIEpTT04uc3RyaW5naWZ5KGhpc3RvcnkpKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgfVxyXG4gICAgfSBjYXRjaCAoZSkge1xyXG4gICAgfVxyXG59XHJcblxyXG4vLyBcdThCQkVcdTdGNkVcdTc5RkJcdTUyQThcdTdBRUZcdTk1N0ZcdTYzMDlcdTRFMDlcdTUwMERcdTkwMUZcdTY0QURcdTY1M0VcdTUyOUZcdTgwRkRcclxuZnVuY3Rpb24gc2V0dXBMb25nUHJlc3NTcGVlZENvbnRyb2woKSB7XHJcbiAgICBpZiAoIWFydCB8fCAhYXJ0LnZpZGVvKSByZXR1cm47XHJcblxyXG4gICAgY29uc3QgcGxheWVyRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwbGF5ZXInKTtcclxuICAgIGxldCBsb25nUHJlc3NUaW1lciA9IG51bGw7XHJcbiAgICBsZXQgb3JpZ2luYWxQbGF5YmFja1JhdGUgPSAxLjA7XHJcbiAgICBsZXQgaXNMb25nUHJlc3MgPSBmYWxzZTtcclxuXHJcbiAgICAvLyBcdTY2M0VcdTc5M0FcdTVGRUJcdTkwMUZcdTYzRDBcdTc5M0FcclxuICAgIGZ1bmN0aW9uIHNob3dTcGVlZEhpbnQoc3BlZWQpIHtcclxuICAgICAgICBzaG93U2hvcnRjdXRIaW50KGAke3NwZWVkfVx1NTAwRFx1OTAxRmAsICdyaWdodCcpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFx1Nzk4MVx1NzUyOFx1NTNGM1x1OTUyRVxyXG4gICAgcGxheWVyRWxlbWVudC5vbmNvbnRleHRtZW51ID0gKCkgPT4ge1xyXG4gICAgICAgIC8vIFx1NjhDMFx1NkQ0Qlx1NjYyRlx1NTQyNlx1NEUzQVx1NzlGQlx1NTJBOFx1OEJCRVx1NTkwN1xyXG4gICAgICAgIGNvbnN0IGlzTW9iaWxlID0gL0FuZHJvaWR8d2ViT1N8aVBob25lfGlQYWR8aVBvZHxCbGFja0JlcnJ5fElFTW9iaWxlfE9wZXJhIE1pbmkvaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpO1xyXG5cclxuICAgICAgICAvLyBcdTUzRUFcdTU3MjhcdTc5RkJcdTUyQThcdThCQkVcdTU5MDdcdTRFMEFcdTc5ODFcdTc1MjhcdTUzRjNcdTk1MkVcclxuICAgICAgICBpZiAoaXNNb2JpbGUpIHtcclxuICAgICAgICAgICAgY29uc3QgZHBsYXllck1lbnUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLmRwbGF5ZXItbWVudVwiKTtcclxuICAgICAgICAgICAgY29uc3QgZHBsYXllck1hc2sgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLmRwbGF5ZXItbWFza1wiKTtcclxuICAgICAgICAgICAgaWYgKGRwbGF5ZXJNZW51KSBkcGxheWVyTWVudS5zdHlsZS5kaXNwbGF5ID0gXCJub25lXCI7XHJcbiAgICAgICAgICAgIGlmIChkcGxheWVyTWFzaykgZHBsYXllck1hc2suc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0cnVlOyAvLyBcdTU3MjhcdTY4NENcdTk3NjJcdThCQkVcdTU5MDdcdTRFMEFcdTUxNDFcdThCQjhcdTUzRjNcdTk1MkVcdTgzRENcdTUzNTVcclxuICAgIH07XHJcblxyXG4gICAgLy8gXHU4OUU2XHU2NDc4XHU1RjAwXHU1OUNCXHU0RThCXHU0RUY2XHJcbiAgICBwbGF5ZXJFbGVtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgIC8vIFx1NjhDMFx1NjdFNVx1ODlDNlx1OTg5MVx1NjYyRlx1NTQyNlx1NkI2M1x1NTcyOFx1NjRBRFx1NjUzRVx1RkYwQ1x1NTk4Mlx1Njc5Q1x1NkNBMVx1NjcwOVx1NjRBRFx1NjUzRVx1NTIxOVx1NEUwRFx1ODlFNlx1NTNEMVx1OTU3Rlx1NjMwOVx1NTI5Rlx1ODBGRFxyXG4gICAgICAgIGlmIChhcnQudmlkZW8ucGF1c2VkKSB7XHJcbiAgICAgICAgICAgIHJldHVybjsgLy8gXHU4OUM2XHU5ODkxXHU2NjgyXHU1MDVDXHU2NUY2XHU0RTBEXHU4OUU2XHU1M0QxXHU5NTdGXHU2MzA5XHU1MjlGXHU4MEZEXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBcdTRGRERcdTVCNThcdTUzOUZcdTU5Q0JcdTY0QURcdTY1M0VcdTkwMUZcdTVFQTZcclxuICAgICAgICBvcmlnaW5hbFBsYXliYWNrUmF0ZSA9IGFydC52aWRlby5wbGF5YmFja1JhdGU7XHJcblxyXG4gICAgICAgIC8vIFx1OEJCRVx1N0Y2RVx1OTU3Rlx1NjMwOVx1OEJBMVx1NjVGNlx1NTY2OFxyXG4gICAgICAgIGxvbmdQcmVzc1RpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgICAgIC8vIFx1NTE4RFx1NkIyMVx1NjhDMFx1NjdFNVx1ODlDNlx1OTg5MVx1NjYyRlx1NTQyNlx1NEVDRFx1NTcyOFx1NjRBRFx1NjUzRVxyXG4gICAgICAgICAgICBpZiAoYXJ0LnZpZGVvLnBhdXNlZCkge1xyXG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KGxvbmdQcmVzc1RpbWVyKTtcclxuICAgICAgICAgICAgICAgIGxvbmdQcmVzc1RpbWVyID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gXHU5NTdGXHU2MzA5XHU4RDg1XHU4RkM3NTAwbXNcdUZGMENcdThCQkVcdTdGNkVcdTRFM0EzXHU1MDBEXHU5MDFGXHJcbiAgICAgICAgICAgIGFydC52aWRlby5wbGF5YmFja1JhdGUgPSAzLjA7XHJcbiAgICAgICAgICAgIGlzTG9uZ1ByZXNzID0gdHJ1ZTtcclxuICAgICAgICAgICAgc2hvd1NwZWVkSGludCgzLjApO1xyXG5cclxuICAgICAgICAgICAgLy8gXHU1M0VBXHU1NzI4XHU3ODZFXHU4QkE0XHU0RTNBXHU5NTdGXHU2MzA5XHU2NUY2XHU5NjNCXHU2QjYyXHU5RUQ4XHU4QkE0XHU4ODRDXHU0RTNBXHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICB9LCA1MDApO1xyXG4gICAgfSwgeyBwYXNzaXZlOiBmYWxzZSB9KTtcclxuXHJcbiAgICAvLyBcdTg5RTZcdTY0NzhcdTdFRDNcdTY3NUZcdTRFOEJcdTRFRjZcclxuICAgIHBsYXllckVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgIC8vIFx1NkUwNVx1OTY2NFx1OTU3Rlx1NjMwOVx1OEJBMVx1NjVGNlx1NTY2OFxyXG4gICAgICAgIGlmIChsb25nUHJlc3NUaW1lcikge1xyXG4gICAgICAgICAgICBjbGVhclRpbWVvdXQobG9uZ1ByZXNzVGltZXIpO1xyXG4gICAgICAgICAgICBsb25nUHJlc3NUaW1lciA9IG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBcdTU5ODJcdTY3OUNcdTY2MkZcdTk1N0ZcdTYzMDlcdTcyQjZcdTYwMDFcdUZGMENcdTYwNjJcdTU5MERcdTUzOUZcdTU5Q0JcdTY0QURcdTY1M0VcdTkwMUZcdTVFQTZcclxuICAgICAgICBpZiAoaXNMb25nUHJlc3MpIHtcclxuICAgICAgICAgICAgYXJ0LnZpZGVvLnBsYXliYWNrUmF0ZSA9IG9yaWdpbmFsUGxheWJhY2tSYXRlO1xyXG4gICAgICAgICAgICBpc0xvbmdQcmVzcyA9IGZhbHNlO1xyXG4gICAgICAgICAgICBzaG93U3BlZWRIaW50KG9yaWdpbmFsUGxheWJhY2tSYXRlKTtcclxuXHJcbiAgICAgICAgICAgIC8vIFx1OTYzQlx1NkI2Mlx1OTU3Rlx1NjMwOVx1NTQwRVx1NzY4NFx1NzBCOVx1NTFGQlx1NEU4Qlx1NEVGNlxyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIFx1NTk4Mlx1Njc5Q1x1NEUwRFx1NjYyRlx1OTU3Rlx1NjMwOVx1RkYwQ1x1NTIxOVx1NTE0MVx1OEJCOFx1NkI2M1x1NUUzOFx1NzY4NFx1NzBCOVx1NTFGQlx1NEU4Qlx1NEVGNlx1RkYwOFx1NjY4Mlx1NTA1Qy9cdTY0QURcdTY1M0VcdUZGMDlcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFx1ODlFNlx1NjQ3OFx1NTNENlx1NkQ4OFx1NEU4Qlx1NEVGNlxyXG4gICAgcGxheWVyRWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGNhbmNlbCcsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAvLyBcdTZFMDVcdTk2NjRcdTk1N0ZcdTYzMDlcdThCQTFcdTY1RjZcdTU2NjhcclxuICAgICAgICBpZiAobG9uZ1ByZXNzVGltZXIpIHtcclxuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KGxvbmdQcmVzc1RpbWVyKTtcclxuICAgICAgICAgICAgbG9uZ1ByZXNzVGltZXIgPSBudWxsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gXHU1OTgyXHU2NzlDXHU2NjJGXHU5NTdGXHU2MzA5XHU3MkI2XHU2MDAxXHVGRjBDXHU2MDYyXHU1OTBEXHU1MzlGXHU1OUNCXHU2NEFEXHU2NTNFXHU5MDFGXHU1RUE2XHJcbiAgICAgICAgaWYgKGlzTG9uZ1ByZXNzKSB7XHJcbiAgICAgICAgICAgIGFydC52aWRlby5wbGF5YmFja1JhdGUgPSBvcmlnaW5hbFBsYXliYWNrUmF0ZTtcclxuICAgICAgICAgICAgaXNMb25nUHJlc3MgPSBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBcdTg5RTZcdTY0NzhcdTc5RkJcdTUyQThcdTRFOEJcdTRFRjYgLSBcdTk2MzJcdTZCNjJcdTU3MjhcdTk1N0ZcdTYzMDlcdTY1RjZcdTg5RTZcdTUzRDFcdTk4NzVcdTk3NjJcdTZFREFcdTUyQThcclxuICAgIHBsYXllckVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICBpZiAoaXNMb25nUHJlc3MpIHtcclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIH1cclxuICAgIH0sIHsgcGFzc2l2ZTogZmFsc2UgfSk7XHJcblxyXG4gICAgLy8gXHU4OUM2XHU5ODkxXHU2NjgyXHU1MDVDXHU2NUY2XHU1M0Q2XHU2RDg4XHU5NTdGXHU2MzA5XHU3MkI2XHU2MDAxXHJcbiAgICBhcnQudmlkZW8uYWRkRXZlbnRMaXN0ZW5lcigncGF1c2UnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYgKGlzTG9uZ1ByZXNzKSB7XHJcbiAgICAgICAgICAgIGFydC52aWRlby5wbGF5YmFja1JhdGUgPSBvcmlnaW5hbFBsYXliYWNrUmF0ZTtcclxuICAgICAgICAgICAgaXNMb25nUHJlc3MgPSBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChsb25nUHJlc3NUaW1lcikge1xyXG4gICAgICAgICAgICBjbGVhclRpbWVvdXQobG9uZ1ByZXNzVGltZXIpO1xyXG4gICAgICAgICAgICBsb25nUHJlc3NUaW1lciA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbi8vIFx1NkUwNVx1OTY2NFx1ODlDNlx1OTg5MVx1OEZEQlx1NUVBNlx1OEJCMFx1NUY1NVxyXG5mdW5jdGlvbiBjbGVhclZpZGVvUHJvZ3Jlc3MoKSB7XHJcbiAgICBjb25zdCBwcm9ncmVzc0tleSA9IGB2aWRlb1Byb2dyZXNzXyR7Z2V0VmlkZW9JZCgpfWA7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKHByb2dyZXNzS2V5KTtcclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgIH1cclxufVxyXG5cclxuLy8gXHU4M0I3XHU1M0Q2XHU4OUM2XHU5ODkxXHU1NTJGXHU0RTAwXHU2ODA3XHU4QkM2XHJcbmZ1bmN0aW9uIGdldFZpZGVvSWQoKSB7XHJcbiAgICAvLyBcdTRGN0ZcdTc1MjhcdTg5QzZcdTk4OTFcdTY4MDdcdTk4OThcdTU0OENcdTk2QzZcdTY1NzBcdTdEMjJcdTVGMTVcdTRGNUNcdTRFM0FcdTU1MkZcdTRFMDBcdTY4MDdcdThCQzZcclxuICAgIC8vIElmIGN1cnJlbnRWaWRlb1VybCBpcyBhdmFpbGFibGUgYW5kIG1vcmUgdW5pcXVlLCBwcmVmZXIgaXQuIE90aGVyd2lzZSwgZmFsbGJhY2suXHJcbiAgICBpZiAoY3VycmVudFZpZGVvVXJsKSB7XHJcbiAgICAgICAgcmV0dXJuIGAke2VuY29kZVVSSUNvbXBvbmVudChjdXJyZW50VmlkZW9VcmwpfWA7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gYCR7ZW5jb2RlVVJJQ29tcG9uZW50KGN1cnJlbnRWaWRlb1RpdGxlKX1fJHtjdXJyZW50RXBpc29kZUluZGV4fWA7XHJcbn1cclxuXHJcbmxldCBjb250cm9sc0xvY2tlZCA9IGZhbHNlO1xyXG5mdW5jdGlvbiB0b2dnbGVDb250cm9sc0xvY2soKSB7XHJcbiAgICBjb25zdCBjb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGxheWVyQ29udGFpbmVyJyk7XHJcbiAgICBjb250cm9sc0xvY2tlZCA9ICFjb250cm9sc0xvY2tlZDtcclxuICAgIGNvbnRhaW5lci5jbGFzc0xpc3QudG9nZ2xlKCdjb250cm9scy1sb2NrZWQnLCBjb250cm9sc0xvY2tlZCk7XHJcbiAgICBjb25zdCBpY29uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvY2tJY29uJyk7XHJcbiAgICAvLyBcdTUyMDdcdTYzNjJcdTU2RkVcdTY4MDdcdUZGMUFcdTk1MDEgLyBcdTg5RTNcdTk1MDFcclxuICAgIGljb24uaW5uZXJIVE1MID0gY29udHJvbHNMb2NrZWRcclxuICAgICAgICA/ICc8cGF0aCBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIgc3Ryb2tlLWxpbmVqb2luPVwicm91bmRcIiBzdHJva2Utd2lkdGg9XCIyXCIgZD1cXFwiTTEyIDE1djJtMC04VjdhNCA0IDAgMDAtOCAwdjJtOCAwSDR2OGgxNnYtOEg2di02elxcXCIvPidcclxuICAgICAgICA6ICc8cGF0aCBzdHJva2UtbGluZWNhcD1cInJvdW5kXCIgc3Ryb2tlLWxpbmVqb2luPVwicm91bmRcIiBzdHJva2Utd2lkdGg9XCIyXCIgZD1cXFwiTTE1IDExVjdhMyAzIDAgMDAtNiAwdjRtLTMgNGgxMnY2SDZ2LTZ6XFxcIi8+JztcclxufVxyXG5cclxuLy8gXHU2NTJGXHU2MzAxXHU1NzI4aWZyYW1lXHU0RTJEXHU1MTczXHU5NUVEXHU2NEFEXHU2NTNFXHU1NjY4XHJcbmZ1bmN0aW9uIGNsb3NlRW1iZWRkZWRQbGF5ZXIoKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIGlmICh3aW5kb3cuc2VsZiAhPT0gd2luZG93LnRvcCkge1xyXG4gICAgICAgICAgICAvLyBcdTU5ODJcdTY3OUNcdTU3MjhpZnJhbWVcdTRFMkRcdUZGMENcdTVDMURcdThCRDVcdThDMDNcdTc1MjhcdTcyMzZcdTdBOTdcdTUzRTNcdTc2ODRcdTUxNzNcdTk1RURcdTY1QjlcdTZDRDVcclxuICAgICAgICAgICAgaWYgKHdpbmRvdy5wYXJlbnQgJiYgdHlwZW9mIHdpbmRvdy5wYXJlbnQuY2xvc2VWaWRlb1BsYXllciA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICAgICAgd2luZG93LnBhcmVudC5jbG9zZVZpZGVvUGxheWVyKCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdcdTVDMURcdThCRDVcdTUxNzNcdTk1RURcdTVENENcdTUxNjVcdTVGMEZcdTY0QURcdTY1M0VcdTU2NjhcdTU5MzFcdThEMjU6JywgZSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlbmRlclJlc291cmNlSW5mb0JhcigpIHtcclxuICAgIC8vIFx1ODNCN1x1NTNENlx1NUJCOVx1NTY2OFx1NTE0M1x1N0QyMFxyXG4gICAgY29uc3QgY29udGFpbmVyID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc291cmNlSW5mb0JhckNvbnRhaW5lcicpO1xyXG4gICAgaWYgKCFjb250YWluZXIpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdcdTYyN0VcdTRFMERcdTUyMzBcdThENDRcdTZFOTBcdTRGRTFcdTYwNkZcdTUzNjFcdTcyNDdcdTVCQjlcdTU2NjgnKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIFx1ODNCN1x1NTNENlx1NUY1M1x1NTI0RFx1ODlDNlx1OTg5MSBzb3VyY2VfY29kZVxyXG4gICAgY29uc3QgdXJsUGFyYW1zID0gbmV3IFVSTFNlYXJjaFBhcmFtcyh3aW5kb3cubG9jYXRpb24uc2VhcmNoKTtcclxuICAgIGNvbnN0IGN1cnJlbnRTb3VyY2UgPSB1cmxQYXJhbXMuZ2V0KCdzb3VyY2UnKSB8fCAnJztcclxuICAgIFxyXG4gICAgLy8gXHU2NjNFXHU3OTNBXHU0RTM0XHU2NUY2XHU1MkEwXHU4RjdEXHU3MkI2XHU2MDAxXHJcbiAgICBjb250YWluZXIuaW5uZXJIVE1MID0gYFxyXG4gICAgICA8ZGl2IGNsYXNzPVwicmVzb3VyY2UtaW5mby1iYXItbGVmdCBmbGV4XCI+XHJcbiAgICAgICAgPHNwYW4+XHU1MkEwXHU4RjdEXHU0RTJELi4uPC9zcGFuPlxyXG4gICAgICAgIDxzcGFuIGNsYXNzPVwicmVzb3VyY2UtaW5mby1iYXItdmlkZW9zXCI+LTwvc3Bhbj5cclxuICAgICAgPC9kaXY+XHJcbiAgICAgIDxidXR0b24gY2xhc3M9XCJyZXNvdXJjZS1zd2l0Y2gtYnRuIGZsZXhcIiBpZD1cInN3aXRjaFJlc291cmNlQnRuXCIgb25jbGljaz1cInNob3dTd2l0Y2hSZXNvdXJjZU1vZGFsKClcIj5cclxuICAgICAgICA8c3BhbiBjbGFzcz1cInJlc291cmNlLXN3aXRjaC1pY29uXCI+XHJcbiAgICAgICAgICA8c3ZnIHZpZXdCb3g9XCIwIDAgMjQgMjRcIiBmaWxsPVwibm9uZVwiIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIj48cGF0aCBkPVwiTTEyIDR2MTZtMCAwbC02LTZtNiA2bDYtNlwiIHN0cm9rZT1cIiNhNjdjMmRcIiBzdHJva2Utd2lkdGg9XCIyXCIgc3Ryb2tlLWxpbmVjYXA9XCJyb3VuZFwiIHN0cm9rZS1saW5lam9pbj1cInJvdW5kXCIvPjwvc3ZnPlxyXG4gICAgICAgIDwvc3Bhbj5cclxuICAgICAgICBcdTUyMDdcdTYzNjJcdThENDRcdTZFOTBcclxuICAgICAgPC9idXR0b24+XHJcbiAgICBgO1xyXG5cclxuICAgIC8vIFx1NjdFNVx1NjI3RVx1NUY1M1x1NTI0RFx1NkU5MFx1NTQwRFx1NzlGMFx1RkYwQ1x1NEVDRSBBUElfU0lURVMgXHU1NDhDIGN1c3RvbV9hcGkgXHU0RTJEXHU2N0U1XHU2MjdFXHU1MzczXHU1M0VGXHJcbiAgICBsZXQgcmVzb3VyY2VOYW1lID0gY3VycmVudFNvdXJjZVxyXG4gICAgaWYgKGN1cnJlbnRTb3VyY2UgJiYgQVBJX1NJVEVTW2N1cnJlbnRTb3VyY2VdKSB7XHJcbiAgICAgICAgcmVzb3VyY2VOYW1lID0gQVBJX1NJVEVTW2N1cnJlbnRTb3VyY2VdLm5hbWU7XHJcbiAgICB9XHJcbiAgICBpZiAocmVzb3VyY2VOYW1lID09PSBjdXJyZW50U291cmNlKSB7XHJcbiAgICAgICAgY29uc3QgY3VzdG9tQVBJcyA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2N1c3RvbUFQSXMnKSB8fCAnW10nKTtcclxuICAgICAgICBjb25zdCBjdXN0b21JbmRleCA9IHBhcnNlSW50KGN1cnJlbnRTb3VyY2UucmVwbGFjZSgnY3VzdG9tXycsICcnKSwgMTApO1xyXG4gICAgICAgIGlmIChjdXN0b21BUElzW2N1c3RvbUluZGV4XSkge1xyXG4gICAgICAgICAgICByZXNvdXJjZU5hbWUgPSBjdXN0b21BUElzW2N1c3RvbUluZGV4XS5uYW1lIHx8ICdcdTgxRUFcdTVCOUFcdTRFNDlcdThENDRcdTZFOTAnO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjb250YWluZXIuaW5uZXJIVE1MID0gYFxyXG4gICAgICA8ZGl2IGNsYXNzPVwicmVzb3VyY2UtaW5mby1iYXItbGVmdCBmbGV4XCI+XHJcbiAgICAgICAgPHNwYW4+JHtyZXNvdXJjZU5hbWV9PC9zcGFuPlxyXG4gICAgICAgIDxzcGFuIGNsYXNzPVwicmVzb3VyY2UtaW5mby1iYXItdmlkZW9zXCI+JHtjdXJyZW50RXBpc29kZXMubGVuZ3RofSBcdTRFMkFcdTg5QzZcdTk4OTE8L3NwYW4+XHJcbiAgICAgIDwvZGl2PlxyXG4gICAgICA8YnV0dG9uIGNsYXNzPVwicmVzb3VyY2Utc3dpdGNoLWJ0biBmbGV4XCIgaWQ9XCJzd2l0Y2hSZXNvdXJjZUJ0blwiIG9uY2xpY2s9XCJzaG93U3dpdGNoUmVzb3VyY2VNb2RhbCgpXCI+XHJcbiAgICAgICAgPHNwYW4gY2xhc3M9XCJyZXNvdXJjZS1zd2l0Y2gtaWNvblwiPlxyXG4gICAgICAgICAgPHN2ZyB2aWV3Qm94PVwiMCAwIDI0IDI0XCIgZmlsbD1cIm5vbmVcIiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCI+PHBhdGggZD1cIk0xMiA0djE2bTAgMGwtNi02bTYgNmw2LTZcIiBzdHJva2U9XCIjYTY3YzJkXCIgc3Ryb2tlLXdpZHRoPVwiMlwiIHN0cm9rZS1saW5lY2FwPVwicm91bmRcIiBzdHJva2UtbGluZWpvaW49XCJyb3VuZFwiLz48L3N2Zz5cclxuICAgICAgICA8L3NwYW4+XHJcbiAgICAgICAgXHU1MjA3XHU2MzYyXHU4RDQ0XHU2RTkwXHJcbiAgICAgIDwvYnV0dG9uPlxyXG4gICAgYDtcclxufVxyXG5cclxuLy8gXHU2RDRCXHU4QkQ1XHU4OUM2XHU5ODkxXHU2RTkwXHU5MDFGXHU3Mzg3XHU3Njg0XHU1MUZEXHU2NTcwXHJcbmFzeW5jIGZ1bmN0aW9uIHRlc3RWaWRlb1NvdXJjZVNwZWVkKHNvdXJjZUtleSwgdm9kSWQpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgY29uc3Qgc3RhcnRUaW1lID0gcGVyZm9ybWFuY2Uubm93KCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gXHU2Nzg0XHU1RUZBQVBJXHU1M0MyXHU2NTcwXHJcbiAgICAgICAgbGV0IGFwaVBhcmFtcyA9ICcnO1xyXG4gICAgICAgIGlmIChzb3VyY2VLZXkuc3RhcnRzV2l0aCgnY3VzdG9tXycpKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGN1c3RvbUluZGV4ID0gc291cmNlS2V5LnJlcGxhY2UoJ2N1c3RvbV8nLCAnJyk7XHJcbiAgICAgICAgICAgIGNvbnN0IGN1c3RvbUFwaSA9IGdldEN1c3RvbUFwaUluZm8oY3VzdG9tSW5kZXgpO1xyXG4gICAgICAgICAgICBpZiAoIWN1c3RvbUFwaSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgc3BlZWQ6IC0xLCBlcnJvcjogJ0FQSVx1OTE0RFx1N0Y2RVx1NjVFMFx1NjU0OCcgfTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoY3VzdG9tQXBpLmRldGFpbCkge1xyXG4gICAgICAgICAgICAgICAgYXBpUGFyYW1zID0gJyZjdXN0b21BcGk9JyArIGVuY29kZVVSSUNvbXBvbmVudChjdXN0b21BcGkudXJsKSArICcmY3VzdG9tRGV0YWlsPScgKyBlbmNvZGVVUklDb21wb25lbnQoY3VzdG9tQXBpLmRldGFpbCkgKyAnJnNvdXJjZT1jdXN0b20nO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgYXBpUGFyYW1zID0gJyZjdXN0b21BcGk9JyArIGVuY29kZVVSSUNvbXBvbmVudChjdXN0b21BcGkudXJsKSArICcmc291cmNlPWN1c3RvbSc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBhcGlQYXJhbXMgPSAnJnNvdXJjZT0nICsgc291cmNlS2V5O1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAvLyBcdTZERkJcdTUyQTBcdTY1RjZcdTk1RjRcdTYyMzNcdTk2MzJcdTZCNjJcdTdGMTNcdTVCNThcclxuICAgICAgICBjb25zdCB0aW1lc3RhbXAgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcclxuICAgICAgICBjb25zdCBjYWNoZUJ1c3RlciA9IGAmX3Q9JHt0aW1lc3RhbXB9YDtcclxuICAgICAgICBcclxuICAgICAgICAvLyBcdTgzQjdcdTUzRDZcdTg5QzZcdTk4OTFcdThCRTZcdTYwQzVcclxuICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKGAvYXBpL2RldGFpbD9pZD0ke2VuY29kZVVSSUNvbXBvbmVudCh2b2RJZCl9JHthcGlQYXJhbXN9JHtjYWNoZUJ1c3Rlcn1gLCB7XHJcbiAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXHJcbiAgICAgICAgICAgIGNhY2hlOiAnbm8tY2FjaGUnXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKCFyZXNwb25zZS5vaykge1xyXG4gICAgICAgICAgICByZXR1cm4geyBzcGVlZDogLTEsIGVycm9yOiAnXHU4M0I3XHU1M0Q2XHU1OTMxXHU4RDI1JyB9O1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmICghZGF0YS5lcGlzb2RlcyB8fCBkYXRhLmVwaXNvZGVzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICByZXR1cm4geyBzcGVlZDogLTEsIGVycm9yOiAnXHU2NUUwXHU2NEFEXHU2NTNFXHU2RTkwJyB9O1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAvLyBcdTZENEJcdThCRDVcdTdCMkNcdTRFMDBcdTRFMkFcdTY0QURcdTY1M0VcdTk0RkVcdTYzQTVcdTc2ODRcdTU0Q0RcdTVFOTRcdTkwMUZcdTVFQTZcclxuICAgICAgICBjb25zdCBmaXJzdEVwaXNvZGVVcmwgPSBkYXRhLmVwaXNvZGVzWzBdO1xyXG4gICAgICAgIGlmICghZmlyc3RFcGlzb2RlVXJsKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7IHNwZWVkOiAtMSwgZXJyb3I6ICdcdTk0RkVcdTYzQTVcdTY1RTBcdTY1NDgnIH07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIFx1NkQ0Qlx1OEJENVx1ODlDNlx1OTg5MVx1OTRGRVx1NjNBNVx1NTRDRFx1NUU5NFx1NjVGNlx1OTVGNFxyXG4gICAgICAgIGNvbnN0IHZpZGVvVGVzdFN0YXJ0ID0gcGVyZm9ybWFuY2Uubm93KCk7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgdmlkZW9SZXNwb25zZSA9IGF3YWl0IGZldGNoKGZpcnN0RXBpc29kZVVybCwge1xyXG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnSEVBRCcsXHJcbiAgICAgICAgICAgICAgICBtb2RlOiAnbm8tY29ycycsXHJcbiAgICAgICAgICAgICAgICBjYWNoZTogJ25vLWNhY2hlJyxcclxuICAgICAgICAgICAgICAgIHNpZ25hbDogQWJvcnRTaWduYWwudGltZW91dCg1MDAwKSAvLyA1XHU3OUQyXHU4RDg1XHU2NUY2XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgY29uc3QgdmlkZW9UZXN0RW5kID0gcGVyZm9ybWFuY2Uubm93KCk7XHJcbiAgICAgICAgICAgIGNvbnN0IHRvdGFsVGltZSA9IHZpZGVvVGVzdEVuZCAtIHN0YXJ0VGltZTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIFx1OEZENFx1NTZERVx1NjAzQlx1NTRDRFx1NUU5NFx1NjVGNlx1OTVGNFx1RkYwOFx1NkJFQlx1NzlEMlx1RkYwOVxyXG4gICAgICAgICAgICByZXR1cm4geyBcclxuICAgICAgICAgICAgICAgIHNwZWVkOiBNYXRoLnJvdW5kKHRvdGFsVGltZSksXHJcbiAgICAgICAgICAgICAgICBlcGlzb2RlczogZGF0YS5lcGlzb2Rlcy5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICBlcnJvcjogbnVsbCBcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9IGNhdGNoICh2aWRlb0Vycm9yKSB7XHJcbiAgICAgICAgICAgIC8vIFx1NTk4Mlx1Njc5Q1x1ODlDNlx1OTg5MVx1OTRGRVx1NjNBNVx1NkQ0Qlx1OEJENVx1NTkzMVx1OEQyNVx1RkYwQ1x1NTNFQVx1OEZENFx1NTZERUFQSVx1NTRDRFx1NUU5NFx1NjVGNlx1OTVGNFxyXG4gICAgICAgICAgICBjb25zdCBhcGlUaW1lID0gcGVyZm9ybWFuY2Uubm93KCkgLSBzdGFydFRpbWU7XHJcbiAgICAgICAgICAgIHJldHVybiB7IFxyXG4gICAgICAgICAgICAgICAgc3BlZWQ6IE1hdGgucm91bmQoYXBpVGltZSksXHJcbiAgICAgICAgICAgICAgICBlcGlzb2RlczogZGF0YS5lcGlzb2Rlcy5sZW5ndGgsXHJcbiAgICAgICAgICAgICAgICBlcnJvcjogbnVsbCxcclxuICAgICAgICAgICAgICAgIG5vdGU6ICdBUElcdTU0Q0RcdTVFOTQnIFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgcmV0dXJuIHsgXHJcbiAgICAgICAgICAgIHNwZWVkOiAtMSwgXHJcbiAgICAgICAgICAgIGVycm9yOiBlcnJvci5uYW1lID09PSAnQWJvcnRFcnJvcicgPyAnXHU4RDg1XHU2NUY2JyA6ICdcdTZENEJcdThCRDVcdTU5MzFcdThEMjUnIFxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcbn1cclxuXHJcbi8vIFx1NjgzQ1x1NUYwRlx1NTMxNlx1OTAxRlx1NUVBNlx1NjYzRVx1NzkzQVxyXG5mdW5jdGlvbiBmb3JtYXRTcGVlZERpc3BsYXkoc3BlZWRSZXN1bHQpIHtcclxuICAgIGlmIChzcGVlZFJlc3VsdC5zcGVlZCA9PT0gLTEpIHtcclxuICAgICAgICByZXR1cm4gYDxzcGFuIGNsYXNzPVwic3BlZWQtaW5kaWNhdG9yIGVycm9yXCI+XHUyNzRDICR7c3BlZWRSZXN1bHQuZXJyb3J9PC9zcGFuPmA7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIGNvbnN0IHNwZWVkID0gc3BlZWRSZXN1bHQuc3BlZWQ7XHJcbiAgICBsZXQgY2xhc3NOYW1lID0gJ3NwZWVkLWluZGljYXRvciBnb29kJztcclxuICAgIGxldCBpY29uID0gJ1x1RDgzRFx1REZFMic7XHJcbiAgICBcclxuICAgIGlmIChzcGVlZCA+IDIwMDApIHtcclxuICAgICAgICBjbGFzc05hbWUgPSAnc3BlZWQtaW5kaWNhdG9yIHBvb3InO1xyXG4gICAgICAgIGljb24gPSAnXHVEODNEXHVERDM0JztcclxuICAgIH0gZWxzZSBpZiAoc3BlZWQgPiAxMDAwKSB7XHJcbiAgICAgICAgY2xhc3NOYW1lID0gJ3NwZWVkLWluZGljYXRvciBtZWRpdW0nO1xyXG4gICAgICAgIGljb24gPSAnXHVEODNEXHVERkUxJztcclxuICAgIH1cclxuICAgIFxyXG4gICAgY29uc3Qgbm90ZSA9IHNwZWVkUmVzdWx0Lm5vdGUgPyBgICgke3NwZWVkUmVzdWx0Lm5vdGV9KWAgOiAnJztcclxuICAgIHJldHVybiBgPHNwYW4gY2xhc3M9XCIke2NsYXNzTmFtZX1cIj4ke2ljb259ICR7c3BlZWR9bXMke25vdGV9PC9zcGFuPmA7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHNob3dTd2l0Y2hSZXNvdXJjZU1vZGFsKCkge1xyXG4gICAgY29uc3QgdXJsUGFyYW1zID0gbmV3IFVSTFNlYXJjaFBhcmFtcyh3aW5kb3cubG9jYXRpb24uc2VhcmNoKTtcclxuICAgIGNvbnN0IGN1cnJlbnRTb3VyY2VDb2RlID0gdXJsUGFyYW1zLmdldCgnc291cmNlJyk7XHJcbiAgICBjb25zdCBjdXJyZW50VmlkZW9JZCA9IHVybFBhcmFtcy5nZXQoJ2lkJyk7XHJcblxyXG4gICAgY29uc3QgbW9kYWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbW9kYWwnKTtcclxuICAgIGNvbnN0IG1vZGFsVGl0bGUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbW9kYWxUaXRsZScpO1xyXG4gICAgY29uc3QgbW9kYWxDb250ZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21vZGFsQ29udGVudCcpO1xyXG5cclxuICAgIG1vZGFsVGl0bGUuaW5uZXJIVE1MID0gYDxzcGFuIGNsYXNzPVwiYnJlYWstd29yZHNcIj4ke2N1cnJlbnRWaWRlb1RpdGxlfTwvc3Bhbj5gO1xyXG4gICAgbW9kYWxDb250ZW50LmlubmVySFRNTCA9ICc8ZGl2IHN0eWxlPVwidGV4dC1hbGlnbjpjZW50ZXI7cGFkZGluZzoyMHB4O2NvbG9yOiNhYWE7Z3JpZC1jb2x1bW46MS8tMTtcIj5cdTZCNjNcdTU3MjhcdTUyQTBcdThGN0RcdThENDRcdTZFOTBcdTUyMTdcdTg4NjguLi48L2Rpdj4nO1xyXG4gICAgbW9kYWwuY2xhc3NMaXN0LnJlbW92ZSgnaGlkZGVuJyk7XHJcblxyXG4gICAgLy8gXHU2NDFDXHU3RDIyXHJcbiAgICBjb25zdCByZXNvdXJjZU9wdGlvbnMgPSBzZWxlY3RlZEFQSXMubWFwKChjdXJyKSA9PiB7XHJcbiAgICAgICAgaWYgKEFQSV9TSVRFU1tjdXJyXSkge1xyXG4gICAgICAgICAgICByZXR1cm4geyBrZXk6IGN1cnIsIG5hbWU6IEFQSV9TSVRFU1tjdXJyXS5uYW1lIH07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGN1c3RvbUluZGV4ID0gcGFyc2VJbnQoY3Vyci5yZXBsYWNlKCdjdXN0b21fJywgJycpLCAxMCk7XHJcbiAgICAgICAgaWYgKGN1c3RvbUFQSXNbY3VzdG9tSW5kZXhdKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB7IGtleTogY3VyciwgbmFtZTogY3VzdG9tQVBJc1tjdXN0b21JbmRleF0ubmFtZSB8fCAnXHU4MUVBXHU1QjlBXHU0RTQ5XHU4RDQ0XHU2RTkwJyB9O1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4geyBrZXk6IGN1cnIsIG5hbWU6ICdcdTY3MkFcdTc3RTVcdThENDRcdTZFOTAnIH07XHJcbiAgICB9KTtcclxuICAgIGxldCBhbGxSZXN1bHRzID0ge307XHJcbiAgICBhd2FpdCBQcm9taXNlLmFsbChyZXNvdXJjZU9wdGlvbnMubWFwKGFzeW5jIChvcHQpID0+IHtcclxuICAgICAgICBsZXQgcXVlcnlSZXN1bHQgPSBhd2FpdCBzZWFyY2hCeUFQSUFuZEtleVdvcmQob3B0LmtleSwgY3VycmVudFZpZGVvVGl0bGUpO1xyXG4gICAgICAgIGlmIChxdWVyeVJlc3VsdC5sZW5ndGggPT0gMCkge1xyXG4gICAgICAgICAgICByZXR1cm4gXHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIFx1NEYxOFx1NTE0OFx1NTNENlx1NUI4Q1x1NTE2OFx1NTQwQ1x1NTQwRFx1OEQ0NFx1NkU5MFx1RkYwQ1x1NTQyNlx1NTIxOVx1OUVEOFx1OEJBNFx1NTNENlx1N0IyQ1x1NEUwMFx1NEUyQVxyXG4gICAgICAgIGxldCByZXN1bHQgPSBxdWVyeVJlc3VsdFswXVxyXG4gICAgICAgIHF1ZXJ5UmVzdWx0LmZvckVhY2goKHJlcykgPT4ge1xyXG4gICAgICAgICAgICBpZiAocmVzLnZvZF9uYW1lID09IGN1cnJlbnRWaWRlb1RpdGxlKSB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQgPSByZXM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIGFsbFJlc3VsdHNbb3B0LmtleV0gPSByZXN1bHQ7XHJcbiAgICB9KSk7XHJcblxyXG4gICAgLy8gXHU2NkY0XHU2NUIwXHU3MkI2XHU2MDAxXHU2NjNFXHU3OTNBXHVGRjFBXHU1RjAwXHU1OUNCXHU5MDFGXHU3Mzg3XHU2RDRCXHU4QkQ1XHJcbiAgICBtb2RhbENvbnRlbnQuaW5uZXJIVE1MID0gJzxkaXYgc3R5bGU9XCJ0ZXh0LWFsaWduOmNlbnRlcjtwYWRkaW5nOjIwcHg7Y29sb3I6I2FhYTtncmlkLWNvbHVtbjoxLy0xO1wiPlx1NkI2M1x1NTcyOFx1NkQ0Qlx1OEJENVx1NTQwNFx1OEQ0NFx1NkU5MFx1OTAxRlx1NzM4Ny4uLjwvZGl2Pic7XHJcblxyXG4gICAgLy8gXHU1NDBDXHU2NUY2XHU2RDRCXHU4QkQ1XHU2MjQwXHU2NzA5XHU4RDQ0XHU2RTkwXHU3Njg0XHU5MDFGXHU3Mzg3XHJcbiAgICBjb25zdCBzcGVlZFJlc3VsdHMgPSB7fTtcclxuICAgIGF3YWl0IFByb21pc2UuYWxsKE9iamVjdC5lbnRyaWVzKGFsbFJlc3VsdHMpLm1hcChhc3luYyAoW3NvdXJjZUtleSwgcmVzdWx0XSkgPT4ge1xyXG4gICAgICAgIGlmIChyZXN1bHQpIHtcclxuICAgICAgICAgICAgc3BlZWRSZXN1bHRzW3NvdXJjZUtleV0gPSBhd2FpdCB0ZXN0VmlkZW9Tb3VyY2VTcGVlZChzb3VyY2VLZXksIHJlc3VsdC52b2RfaWQpO1xyXG4gICAgICAgIH1cclxuICAgIH0pKTtcclxuXHJcbiAgICAvLyBcdTVCRjlcdTdFRDNcdTY3OUNcdThGREJcdTg4NENcdTYzOTJcdTVFOEZcclxuICAgIGNvbnN0IHNvcnRlZFJlc3VsdHMgPSBPYmplY3QuZW50cmllcyhhbGxSZXN1bHRzKS5zb3J0KChba2V5QSwgcmVzdWx0QV0sIFtrZXlCLCByZXN1bHRCXSkgPT4ge1xyXG4gICAgICAgIC8vIFx1NUY1M1x1NTI0RFx1NjRBRFx1NjUzRVx1NzY4NFx1NkU5MFx1NjUzRVx1NTcyOFx1NjcwMFx1NTI0RFx1OTc2MlxyXG4gICAgICAgIGNvbnN0IGlzQ3VycmVudEEgPSBTdHJpbmcoa2V5QSkgPT09IFN0cmluZyhjdXJyZW50U291cmNlQ29kZSkgJiYgU3RyaW5nKHJlc3VsdEEudm9kX2lkKSA9PT0gU3RyaW5nKGN1cnJlbnRWaWRlb0lkKTtcclxuICAgICAgICBjb25zdCBpc0N1cnJlbnRCID0gU3RyaW5nKGtleUIpID09PSBTdHJpbmcoY3VycmVudFNvdXJjZUNvZGUpICYmIFN0cmluZyhyZXN1bHRCLnZvZF9pZCkgPT09IFN0cmluZyhjdXJyZW50VmlkZW9JZCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKGlzQ3VycmVudEEgJiYgIWlzQ3VycmVudEIpIHJldHVybiAtMTtcclxuICAgICAgICBpZiAoIWlzQ3VycmVudEEgJiYgaXNDdXJyZW50QikgcmV0dXJuIDE7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gXHU1MTc2XHU0RjU5XHU2MzA5XHU3MTY3XHU5MDFGXHU1RUE2XHU2MzkyXHU1RThGXHVGRjBDXHU5MDFGXHU1RUE2XHU1RkVCXHU3Njg0XHU1NzI4XHU1MjREXHU5NzYyXHVGRjA4XHU5MDFGXHU1RUE2XHU0RTNBLTFcdTg4NjhcdTc5M0FcdTU5MzFcdThEMjVcdUZGMENcdTYzOTJcdTUyMzBcdTY3MDBcdTU0MEVcdUZGMDlcclxuICAgICAgICBjb25zdCBzcGVlZEEgPSBzcGVlZFJlc3VsdHNba2V5QV0/LnNwZWVkIHx8IDk5OTk5O1xyXG4gICAgICAgIGNvbnN0IHNwZWVkQiA9IHNwZWVkUmVzdWx0c1trZXlCXT8uc3BlZWQgfHwgOTk5OTk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKHNwZWVkQSA9PT0gLTEgJiYgc3BlZWRCICE9PSAtMSkgcmV0dXJuIDE7XHJcbiAgICAgICAgaWYgKHNwZWVkQSAhPT0gLTEgJiYgc3BlZWRCID09PSAtMSkgcmV0dXJuIC0xO1xyXG4gICAgICAgIGlmIChzcGVlZEEgPT09IC0xICYmIHNwZWVkQiA9PT0gLTEpIHJldHVybiAwO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiBzcGVlZEEgLSBzcGVlZEI7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBcdTZFMzJcdTY3RDNcdThENDRcdTZFOTBcdTUyMTdcdTg4NjhcclxuICAgIGxldCBodG1sID0gJzxkaXYgY2xhc3M9XCJncmlkIGdyaWQtY29scy0yIHNtOmdyaWQtY29scy0zIG1kOmdyaWQtY29scy00IGxnOmdyaWQtY29scy01IGdhcC00IHAtNFwiPic7XHJcbiAgICBcclxuICAgIGZvciAoY29uc3QgW3NvdXJjZUtleSwgcmVzdWx0XSBvZiBzb3J0ZWRSZXN1bHRzKSB7XHJcbiAgICAgICAgaWYgKCFyZXN1bHQpIGNvbnRpbnVlO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIFx1NEZFRVx1NTkwRCBpc0N1cnJlbnRTb3VyY2UgXHU1MjI0XHU2NUFEXHVGRjBDXHU3ODZFXHU0RkREXHU3QzdCXHU1NzhCXHU0RTAwXHU4MUY0XHJcbiAgICAgICAgY29uc3QgaXNDdXJyZW50U291cmNlID0gU3RyaW5nKHNvdXJjZUtleSkgPT09IFN0cmluZyhjdXJyZW50U291cmNlQ29kZSkgJiYgU3RyaW5nKHJlc3VsdC52b2RfaWQpID09PSBTdHJpbmcoY3VycmVudFZpZGVvSWQpO1xyXG4gICAgICAgIGNvbnN0IHNvdXJjZU5hbWUgPSByZXNvdXJjZU9wdGlvbnMuZmluZChvcHQgPT4gb3B0LmtleSA9PT0gc291cmNlS2V5KT8ubmFtZSB8fCAnXHU2NzJBXHU3N0U1XHU4RDQ0XHU2RTkwJztcclxuICAgICAgICBjb25zdCBzcGVlZFJlc3VsdCA9IHNwZWVkUmVzdWx0c1tzb3VyY2VLZXldIHx8IHsgc3BlZWQ6IC0xLCBlcnJvcjogJ1x1NjcyQVx1NkQ0Qlx1OEJENScgfTtcclxuICAgICAgICBcclxuICAgICAgICBodG1sICs9IGBcclxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cInJlbGF0aXZlIGdyb3VwICR7aXNDdXJyZW50U291cmNlID8gJ29wYWNpdHktNTAgY3Vyc29yLW5vdC1hbGxvd2VkJyA6ICdjdXJzb3ItcG9pbnRlciBob3ZlcjpzY2FsZS0xMDUgdHJhbnNpdGlvbi10cmFuc2Zvcm0nfVwiIFxyXG4gICAgICAgICAgICAgICAgICR7IWlzQ3VycmVudFNvdXJjZSA/IGBvbmNsaWNrPVwic3dpdGNoVG9SZXNvdXJjZSgnJHtzb3VyY2VLZXl9JywgJyR7cmVzdWx0LnZvZF9pZH0nKVwiYCA6ICcnfT5cclxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJhc3BlY3QtWzIvM10gcm91bmRlZC1sZyBvdmVyZmxvdy1oaWRkZW4gYmctZ3JheS04MDAgcmVsYXRpdmVcIj5cclxuICAgICAgICAgICAgICAgICAgICA8aW1nIHNyYz1cIiR7cmVzdWx0LnZvZF9waWN9XCIgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICBhbHQ9XCIke3Jlc3VsdC52b2RfbmFtZX1cIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3M9XCJ3LWZ1bGwgaC1mdWxsIG9iamVjdC1jb3ZlclwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICBvbmVycm9yPVwidGhpcy5zcmM9J2RhdGE6aW1hZ2Uvc3ZnK3htbDtiYXNlNjQsUEhOMlp5QjRiV3h1Y3owaWFIUjBjRG92TDNkM2R5NTNNeTV2Y21jdk1qQXdNQzl6ZG1jaUlIWnBaWGRDYjNnOUlqQWdNQ0F5TkNBeU5DSWdabWxzYkQwaWJtOXVaU0lnYzNSeWIydGxQU0lqTmpZMklpQnpkSEp2YTJVdGQybGtkR2c5SWpJaUlITjBjbTlyWlMxc2FXNWxZMkZ3UFNKeWIzVnVaQ0lnYzNSeWIydGxMV3hwYm1WcWIybHVQU0p5YjNWdVpDSStQSEpsWTNRZ2VEMGlNeUlnZVQwaU15SWdkMmxrZEdnOUlqRTRJaUJvWldsbmFIUTlJakU0SWlCeWVEMGlNaUlnY25rOUlqSWlQand2Y21WamRENDhjR0YwYUNCa1BTSk5NakVnTVRWMk5HRXlJRElnTUNBd0lERXRNaUF5U0RWaE1pQXlJREFnTUNBeExUSXRNbll0TkNJK1BDOXdZWFJvUGp4d2IyeDViR2x1WlNCd2IybHVkSE05SWpFM0lEZ2dNVElnTXlBM0lEZ2lQand2Y0c5c2VXeHBibVUrUEhCaGRHZ2daRDBpVFRFeUlETjJNVElpUGp3dmNHRjBhRDQ4TDNOMlp6ND0nXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgPCEtLSBcdTkwMUZcdTczODdcdTY2M0VcdTc5M0FcdTU3MjhcdTU2RkVcdTcyNDdcdTUzRjNcdTRFMEFcdTg5RDIgLS0+XHJcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImFic29sdXRlIHRvcC0xIHJpZ2h0LTEgc3BlZWQtYmFkZ2UgYmctYmxhY2sgYmctb3BhY2l0eS03NVwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAke2Zvcm1hdFNwZWVkRGlzcGxheShzcGVlZFJlc3VsdCl9XHJcbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJtdC0yXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cInRleHQteHMgZm9udC1tZWRpdW0gdGV4dC1ncmF5LTIwMCB0cnVuY2F0ZVwiPiR7cmVzdWx0LnZvZF9uYW1lfTwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ0ZXh0LVsxMHB4XSB0ZXh0LWdyYXktNDAwIHRydW5jYXRlXCI+JHtzb3VyY2VOYW1lfTwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJ0ZXh0LVsxMHB4XSB0ZXh0LWdyYXktNTAwIG10LTFcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgJHtzcGVlZFJlc3VsdC5lcGlzb2RlcyA/IGAke3NwZWVkUmVzdWx0LmVwaXNvZGVzfVx1OTZDNmAgOiAnJ31cclxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgJHtpc0N1cnJlbnRTb3VyY2UgPyBgXHJcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImFic29sdXRlIGluc2V0LTAgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1jZW50ZXJcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImJnLWJsdWUtNjAwIGJnLW9wYWNpdHktNzUgcm91bmRlZC1sZyBweC0yIHB5LTAuNSB0ZXh0LXhzIHRleHQtd2hpdGUgZm9udC1tZWRpdW1cIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFx1NUY1M1x1NTI0RFx1NjRBRFx1NjUzRVxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgIGAgOiAnJ31cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgYDtcclxuICAgIH1cclxuICAgIFxyXG4gICAgaHRtbCArPSAnPC9kaXY+JztcclxuICAgIG1vZGFsQ29udGVudC5pbm5lckhUTUwgPSBodG1sO1xyXG59XHJcblxyXG4vLyBcdTUyMDdcdTYzNjJcdThENDRcdTZFOTBcdTc2ODRcdTUxRkRcdTY1NzBcclxuYXN5bmMgZnVuY3Rpb24gc3dpdGNoVG9SZXNvdXJjZShzb3VyY2VLZXksIHZvZElkKSB7XHJcbiAgICAvLyBcdTUxNzNcdTk1RURcdTZBMjFcdTYwMDFcdTY4NDZcclxuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtb2RhbCcpLmNsYXNzTGlzdC5hZGQoJ2hpZGRlbicpO1xyXG4gICAgXHJcbiAgICBzaG93TG9hZGluZygpO1xyXG4gICAgdHJ5IHtcclxuICAgICAgICAvLyBcdTY3ODRcdTVFRkFBUElcdTUzQzJcdTY1NzBcclxuICAgICAgICBsZXQgYXBpUGFyYW1zID0gJyc7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gXHU1OTA0XHU3NDA2XHU4MUVBXHU1QjlBXHU0RTQ5QVBJXHU2RTkwXHJcbiAgICAgICAgaWYgKHNvdXJjZUtleS5zdGFydHNXaXRoKCdjdXN0b21fJykpIHtcclxuICAgICAgICAgICAgY29uc3QgY3VzdG9tSW5kZXggPSBzb3VyY2VLZXkucmVwbGFjZSgnY3VzdG9tXycsICcnKTtcclxuICAgICAgICAgICAgY29uc3QgY3VzdG9tQXBpID0gZ2V0Q3VzdG9tQXBpSW5mbyhjdXN0b21JbmRleCk7XHJcbiAgICAgICAgICAgIGlmICghY3VzdG9tQXBpKSB7XHJcbiAgICAgICAgICAgICAgICBzaG93VG9hc3QoJ1x1ODFFQVx1NUI5QVx1NEU0OUFQSVx1OTE0RFx1N0Y2RVx1NjVFMFx1NjU0OCcsICdlcnJvcicpO1xyXG4gICAgICAgICAgICAgICAgaGlkZUxvYWRpbmcoKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBcdTRGMjBcdTkwMTIgZGV0YWlsIFx1NUI1N1x1NkJCNVxyXG4gICAgICAgICAgICBpZiAoY3VzdG9tQXBpLmRldGFpbCkge1xyXG4gICAgICAgICAgICAgICAgYXBpUGFyYW1zID0gJyZjdXN0b21BcGk9JyArIGVuY29kZVVSSUNvbXBvbmVudChjdXN0b21BcGkudXJsKSArICcmY3VzdG9tRGV0YWlsPScgKyBlbmNvZGVVUklDb21wb25lbnQoY3VzdG9tQXBpLmRldGFpbCkgKyAnJnNvdXJjZT1jdXN0b20nO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgYXBpUGFyYW1zID0gJyZjdXN0b21BcGk9JyArIGVuY29kZVVSSUNvbXBvbmVudChjdXN0b21BcGkudXJsKSArICcmc291cmNlPWN1c3RvbSc7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBcdTUxODVcdTdGNkVBUElcclxuICAgICAgICAgICAgYXBpUGFyYW1zID0gJyZzb3VyY2U9JyArIHNvdXJjZUtleTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gQWRkIGEgdGltZXN0YW1wIHRvIHByZXZlbnQgY2FjaGluZ1xyXG4gICAgICAgIGNvbnN0IHRpbWVzdGFtcCA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xyXG4gICAgICAgIGNvbnN0IGNhY2hlQnVzdGVyID0gYCZfdD0ke3RpbWVzdGFtcH1gO1xyXG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goYC9hcGkvZGV0YWlsP2lkPSR7ZW5jb2RlVVJJQ29tcG9uZW50KHZvZElkKX0ke2FwaVBhcmFtc30ke2NhY2hlQnVzdGVyfWApO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXNwb25zZS5qc29uKCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKCFkYXRhLmVwaXNvZGVzIHx8IGRhdGEuZXBpc29kZXMubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgIHNob3dUb2FzdCgnXHU2NzJBXHU2MjdFXHU1MjMwXHU2NEFEXHU2NTNFXHU4RDQ0XHU2RTkwJywgJ2Vycm9yJyk7XHJcbiAgICAgICAgICAgIGhpZGVMb2FkaW5nKCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFx1ODNCN1x1NTNENlx1NUY1M1x1NTI0RFx1NjRBRFx1NjUzRVx1NzY4NFx1OTZDNlx1NjU3MFx1N0QyMlx1NUYxNVxyXG4gICAgICAgIGNvbnN0IGN1cnJlbnRJbmRleCA9IGN1cnJlbnRFcGlzb2RlSW5kZXg7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gXHU3ODZFXHU1QjlBXHU4OTgxXHU2NEFEXHU2NTNFXHU3Njg0XHU5NkM2XHU2NTcwXHU3RDIyXHU1RjE1XHJcbiAgICAgICAgbGV0IHRhcmdldEluZGV4ID0gMDtcclxuICAgICAgICBpZiAoY3VycmVudEluZGV4IDwgZGF0YS5lcGlzb2Rlcy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgLy8gXHU1OTgyXHU2NzlDXHU1RjUzXHU1MjREXHU5NkM2XHU2NTcwXHU1NzI4XHU2NUIwXHU4RDQ0XHU2RTkwXHU0RTJEXHU1QjU4XHU1NzI4XHVGRjBDXHU1MjE5XHU0RjdGXHU3NTI4XHU3NkY4XHU1NDBDXHU5NkM2XHU2NTcwXHJcbiAgICAgICAgICAgIHRhcmdldEluZGV4ID0gY3VycmVudEluZGV4O1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAvLyBcdTgzQjdcdTUzRDZcdTc2RUVcdTY4MDdcdTk2QzZcdTY1NzBcdTc2ODRVUkxcclxuICAgICAgICBjb25zdCB0YXJnZXRVcmwgPSBkYXRhLmVwaXNvZGVzW3RhcmdldEluZGV4XTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBcdTY3ODRcdTVFRkFcdTY0QURcdTY1M0VcdTk4NzVcdTk3NjJVUkxcclxuICAgICAgICBjb25zdCB3YXRjaFVybCA9IGBwbGF5ZXIuaHRtbD9pZD0ke3ZvZElkfSZzb3VyY2U9JHtzb3VyY2VLZXl9JnVybD0ke2VuY29kZVVSSUNvbXBvbmVudCh0YXJnZXRVcmwpfSZpbmRleD0ke3RhcmdldEluZGV4fSZ0aXRsZT0ke2VuY29kZVVSSUNvbXBvbmVudChjdXJyZW50VmlkZW9UaXRsZSl9YDtcclxuICAgICAgICBcclxuICAgICAgICAvLyBcdTRGRERcdTVCNThcdTVGNTNcdTUyNERcdTcyQjZcdTYwMDFcdTUyMzBsb2NhbFN0b3JhZ2VcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnY3VycmVudFZpZGVvVGl0bGUnLCBkYXRhLnZvZF9uYW1lIHx8ICdcdTY3MkFcdTc3RTVcdTg5QzZcdTk4OTEnKTtcclxuICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2N1cnJlbnRFcGlzb2RlcycsIEpTT04uc3RyaW5naWZ5KGRhdGEuZXBpc29kZXMpKTtcclxuICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2N1cnJlbnRFcGlzb2RlSW5kZXgnLCB0YXJnZXRJbmRleCk7XHJcbiAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdjdXJyZW50U291cmNlQ29kZScsIHNvdXJjZUtleSk7XHJcbiAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdsYXN0UGxheVRpbWUnLCBEYXRlLm5vdygpKTtcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ1x1NEZERFx1NUI1OFx1NjRBRFx1NjUzRVx1NzJCNlx1NjAwMVx1NTkzMVx1OEQyNTonLCBlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFx1OERGM1x1OEY2Q1x1NTIzMFx1NjRBRFx1NjUzRVx1OTg3NVx1OTc2MlxyXG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gd2F0Y2hVcmw7XHJcbiAgICAgICAgXHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1x1NTIwN1x1NjM2Mlx1OEQ0NFx1NkU5MFx1NTkzMVx1OEQyNTonLCBlcnJvcik7XHJcbiAgICAgICAgc2hvd1RvYXN0KCdcdTUyMDdcdTYzNjJcdThENDRcdTZFOTBcdTU5MzFcdThEMjVcdUZGMENcdThCRjdcdTdBMERcdTU0MEVcdTkxQ0RcdThCRDUnLCAnZXJyb3InKTtcclxuICAgIH0gZmluYWxseSB7XHJcbiAgICAgICAgaGlkZUxvYWRpbmcoKTtcclxuICAgIH1cclxufSJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsaUJBQXNCLE9BQU8sU0FBUztBQUNsQyxVQUFNLFlBQVksSUFBSSxZQUFZLEVBQUUsT0FBTyxPQUFPO0FBQ2xELFVBQU0sYUFBYSxNQUFNLE9BQU8sT0FBTyxPQUFPLFdBQVcsU0FBUztBQUNsRSxVQUFNLFlBQVksTUFBTSxLQUFLLElBQUksV0FBVyxVQUFVLENBQUM7QUFDdkQsV0FBTyxVQUFVLElBQUksT0FBSyxFQUFFLFNBQVMsRUFBRSxFQUFFLFNBQVMsR0FBRyxHQUFHLENBQUMsRUFBRSxLQUFLLEVBQUU7QUFBQSxFQUN0RTtBQUxBO0FBQUE7QUFBQTtBQUFBOzs7QUNRQSxNQUFNQSxtQkFBa0I7QUFBQSxJQUNwQixpQkFBaUI7QUFBQTtBQUFBLElBQ2pCLGlCQUFpQixLQUFLLEtBQUssS0FBSyxLQUFLO0FBQUE7QUFBQSxFQUN6QztBQVlBLE1BQU1DLGFBQVk7QUFBQSxJQUNkLFlBQVk7QUFBQSxNQUNSLEtBQUs7QUFBQSxN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QWUsQ0FBQztBQUFBLElBQ2pEO0FBQ0EsV0FBTyxHQUFHLG1CQUFtQixpQkFBaUIsQ0FBQyxJQUFJLG1CQUFtQjtBQUFBLEVBQzFFO0FBOEJBLFdBQVMsd0JBQXdCO0FBRTdCLFVBQU0sWUFBWSxTQUFTLGVBQWUsMEJBQTBCO0FBQ3BFLFFBQUksQ0FBQyxXQUFXO0FBQ1osY0FBUSxNQUFNLG9FQUFhO0FBQzNCO0FBQUEsSUFDSjtBQUdBLFVBQU0sWUFBWSxJQUFJLGdCQUFnQixPQUFPLFNBQVMsTUFBTTtBQUM1RCxVQUFNLGdCQUFnQixVQUFVLElBQUksUUFBUSxLQUFLO0FBR2pELGNBQVUsWUFBWTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFjdEIsUUFBSSxlQUFlO0FBQ25CLFFBQUksaUJBQWlCLFVBQVUsYUFBYSxHQUFHO0FBQzNDLHFCQUFlLFVBQVUsYUFBYSxFQUFFO0FBQUEsSUFDNUM7QUFDQSxRQUFJLGlCQUFpQixlQUFlO0FBQ2hDLFlBQU1FLGNBQWEsS0FBSyxNQUFNLGFBQWEsUUFBUSxZQUFZLEtBQUssSUFBSTtBQUN4RSxZQUFNLGNBQWMsU0FBUyxjQUFjLFFBQVEsV0FBVyxFQUFFLEdBQUcsRUFBRTtBQUNyRSxVQUFJQSxZQUFXLFdBQVcsR0FBRztBQUN6Qix1QkFBZUEsWUFBVyxXQUFXLEVBQUUsUUFBUTtBQUFBLE1BQ25EO0FBQUEsSUFDSjtBQUVBLGNBQVUsWUFBWTtBQUFBO0FBQUEsZ0JBRVYsWUFBWTtBQUFBLGlEQUNxQixnQkFBZ0IsTUFBTTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVN2RTsiLAogICJuYW1lcyI6IFsiUEFTU1dPUkRfQ09ORklHIiwgIkFQSV9TSVRFUyIsICJzaGEyNTYiLCAiaXNQYXNzd29yZFZlcmlmaWVkIiwgInNoYTI1NiIsICJjb25maWciLCAiY29udGV4dCIsICJjdXN0b21BUElzIl0KfQo=
