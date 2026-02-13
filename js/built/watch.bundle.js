var JiaJunApp = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // js/config.js
  var PASSWORD_CONFIG2 = {
    localStorageKey: "passwordVerified",
    // 存储验证状态的键名
    verificationTTL: 90 * 24 * 60 * 60 * 1e3
    // 验证有效期（90天，约3个月）
  };
  var API_SITES = {
    testSource: {
      api: "https://www.example.com/api.php/provide/vod",
      name: "\u7A7A\u5185\u5BB9\u6D4B\u8BD5\u6E90",
      adult: true
    }
    //ARCHIVE https://telegra.ph/APIs-08-12
  };
  function extendAPISites(newSites) {
    Object.assign(API_SITES, newSites);
  }
  window.API_SITES = API_SITES;
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
        const { sha256: sha2562 } = await import("./sha256.js");
        const hash = await sha2562(userPassword);
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
    if (isPasswordProtected() && !isPasswordVerified()) {
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
      const inputHash = await sha256(password);
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
  function isPasswordVerified() {
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
  window.isPasswordVerified = isPasswordVerified;
  window.verifyPassword = verifyPassword;
  window.ensurePasswordProtection = ensurePasswordProtection;
  window.showPasswordModal = showPasswordModal;
  window.hidePasswordModal = hidePasswordModal;
  async function sha256(message) {
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
    if (isPasswordProtected() && isPasswordVerified()) {
      hidePasswordModal();
      return;
    }
    if (isPasswordRequired()) {
      showPasswordModal();
      return;
    }
    if (isPasswordProtected() && !isPasswordVerified()) {
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

  // js/watch.js
  window.onload = function() {
    const currentParams = new URLSearchParams(window.location.search);
    const playerUrlObj = new URL("player.html", window.location.origin);
    const statusElement = document.getElementById("redirect-status");
    const manualRedirect = document.getElementById("manual-redirect");
    let statusMessages = [
      "\u51C6\u5907\u89C6\u9891\u6570\u636E\u4E2D...",
      "\u6B63\u5728\u52A0\u8F7D\u89C6\u9891\u4FE1\u606F...",
      "\u5373\u5C06\u5F00\u59CB\u64AD\u653E..."
    ];
    let currentStatus = 0;
    let statusInterval = setInterval(() => {
      if (currentStatus >= statusMessages.length) {
        currentStatus = 0;
      }
      if (statusElement) {
        statusElement.textContent = statusMessages[currentStatus];
        statusElement.style.opacity = 0.7;
        setTimeout(() => {
          if (statusElement) statusElement.style.opacity = 1;
        }, 300);
      }
      currentStatus++;
    }, 1e3);
    currentParams.forEach((value, key) => {
      playerUrlObj.searchParams.set(key, value);
    });
    const referrer = document.referrer;
    const backUrl = currentParams.get("back");
    let returnUrl = "";
    if (backUrl) {
      returnUrl = decodeURIComponent(backUrl);
    } else if (referrer && (referrer.includes("/s=") || referrer.includes("?s="))) {
      returnUrl = referrer;
    } else if (referrer && referrer.trim() !== "") {
      returnUrl = referrer;
    } else {
      returnUrl = "/";
    }
    if (!playerUrlObj.searchParams.has("returnUrl")) {
      playerUrlObj.searchParams.set("returnUrl", encodeURIComponent(returnUrl));
    }
    localStorage.setItem("lastPageUrl", returnUrl);
    if (returnUrl.includes("/s=") || returnUrl.includes("?s=")) {
      localStorage.setItem("cameFromSearch", "true");
      localStorage.setItem("searchPageUrl", returnUrl);
    }
    const finalPlayerUrl = playerUrlObj.toString();
    if (manualRedirect) {
      manualRedirect.href = finalPlayerUrl;
    }
    const metaRefresh = document.querySelector('meta[http-equiv="refresh"]');
    if (metaRefresh) {
      metaRefresh.content = `3; url=${finalPlayerUrl}`;
    }
    setTimeout(() => {
      clearInterval(statusInterval);
      window.location.href = finalPlayerUrl;
    }, 2800);
  };
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vY29uZmlnLmpzIiwgIi4uL3Byb3h5LWF1dGguanMiLCAiLi4vcGFzc3dvcmQuanMiLCAiLi4vd2F0Y2guanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8vIFx1NTE2OFx1NUM0MFx1NUUzOFx1OTFDRlx1OTE0RFx1N0Y2RVxyXG5jb25zdCBQUk9YWV9VUkwgPSAnL3Byb3h5Lyc7ICAgIC8vIFx1OTAwMlx1NzUyOFx1NEU4RSBDbG91ZGZsYXJlLCBOZXRsaWZ5IChcdTVFMjZcdTkxQ0RcdTUxOTkpLCBWZXJjZWwgKFx1NUUyNlx1OTFDRFx1NTE5OSlcclxuLy8gY29uc3QgSE9QTEFZRVJfVVJMID0gJ2h0dHBzOi8vaG9wbGF5ZXIuY29tL2luZGV4Lmh0bWwnO1xyXG5jb25zdCBTRUFSQ0hfSElTVE9SWV9LRVkgPSAndmlkZW9TZWFyY2hIaXN0b3J5JztcclxuY29uc3QgTUFYX0hJU1RPUllfSVRFTVMgPSA1O1xyXG5cclxuLy8gXHU1QkM2XHU3ODAxXHU0RkREXHU2MkE0XHU5MTREXHU3RjZFXHJcbi8vIFx1NkNFOFx1NjEwRlx1RkYxQVBBU1NXT1JEIFx1NzNBRlx1NTg4M1x1NTNEOFx1OTFDRlx1NjYyRlx1NUZDNVx1OTcwMFx1NzY4NFx1RkYwQ1x1NjI0MFx1NjcwOVx1OTBFOFx1N0Y3Mlx1OTBGRFx1NUZDNVx1OTg3Qlx1OEJCRVx1N0Y2RVx1NUJDNlx1NzgwMVx1NEVFNVx1Nzg2RVx1NEZERFx1NUI4OVx1NTE2OFxyXG5jb25zdCBQQVNTV09SRF9DT05GSUcgPSB7XHJcbiAgICBsb2NhbFN0b3JhZ2VLZXk6ICdwYXNzd29yZFZlcmlmaWVkJywgIC8vIFx1NUI1OFx1NTBBOFx1OUE4Q1x1OEJDMVx1NzJCNlx1NjAwMVx1NzY4NFx1OTUyRVx1NTQwRFxyXG4gICAgdmVyaWZpY2F0aW9uVFRMOiA5MCAqIDI0ICogNjAgKiA2MCAqIDEwMDAgIC8vIFx1OUE4Q1x1OEJDMVx1NjcwOVx1NjU0OFx1NjcxRlx1RkYwODkwXHU1OTI5XHVGRjBDXHU3RUE2M1x1NEUyQVx1NjcwOFx1RkYwOVxyXG59O1xyXG5cclxuLy8gXHU3RjUxXHU3QUQ5XHU0RkUxXHU2MDZGXHU5MTREXHU3RjZFXHJcbmNvbnN0IFNJVEVfQ09ORklHID0ge1xyXG4gICAgbmFtZTogJ0xpYnJlVFYnLFxyXG4gICAgdXJsOiAnaHR0cHM6Ly9saWJyZXR2LmlzLWFuLm9yZycsXHJcbiAgICBkZXNjcmlwdGlvbjogJ1x1NTE0RFx1OEQzOVx1NTcyOFx1N0VCRlx1ODlDNlx1OTg5MVx1NjQxQ1x1N0QyMlx1NEUwRVx1ODlDMlx1NzcwQlx1NUU3M1x1NTNGMCcsXHJcbiAgICBsb2dvOiAnaW1hZ2UvbG9nby5wbmcnLFxyXG4gICAgdmVyc2lvbjogJzEuMC4zJ1xyXG59O1xyXG5cclxuLy8gQVBJXHU3QUQ5XHU3MEI5XHU5MTREXHU3RjZFXHJcbmNvbnN0IEFQSV9TSVRFUyA9IHtcclxuICAgIHRlc3RTb3VyY2U6IHtcclxuICAgICAgICBhcGk6ICdodHRwczovL3d3dy5leGFtcGxlLmNvbS9hcGkucGhwL3Byb3ZpZGUvdm9kJyxcclxuICAgICAgICBuYW1lOiAnXHU3QTdBXHU1MTg1XHU1QkI5XHU2RDRCXHU4QkQ1XHU2RTkwJyxcclxuICAgICAgICBhZHVsdDogdHJ1ZVxyXG4gICAgfVxyXG4gICAgLy9BUkNISVZFIGh0dHBzOi8vdGVsZWdyYS5waC9BUElzLTA4LTEyXHJcbn07XHJcblxyXG4vLyBcdTVCOUFcdTRFNDlcdTU0MDhcdTVFNzZcdTY1QjlcdTZDRDVcclxuZnVuY3Rpb24gZXh0ZW5kQVBJU2l0ZXMobmV3U2l0ZXMpIHtcclxuICAgIE9iamVjdC5hc3NpZ24oQVBJX1NJVEVTLCBuZXdTaXRlcyk7XHJcbn1cclxuXHJcbi8vIFx1NjZCNFx1OTczMlx1NTIzMFx1NTE2OFx1NUM0MFxyXG53aW5kb3cuQVBJX1NJVEVTID0gQVBJX1NJVEVTO1xyXG53aW5kb3cuZXh0ZW5kQVBJU2l0ZXMgPSBleHRlbmRBUElTaXRlcztcclxuXHJcblxyXG4vLyBcdTZERkJcdTUyQTBcdTgwNUFcdTU0MDhcdTY0MUNcdTdEMjJcdTc2ODRcdTkxNERcdTdGNkVcdTkwMDlcdTk4NzlcclxuY29uc3QgQUdHUkVHQVRFRF9TRUFSQ0hfQ09ORklHID0ge1xyXG4gICAgZW5hYmxlZDogdHJ1ZSwgICAgICAgICAgICAgLy8gXHU2NjJGXHU1NDI2XHU1NDJGXHU3NTI4XHU4MDVBXHU1NDA4XHU2NDFDXHU3RDIyXHJcbiAgICB0aW1lb3V0OiA4MDAwLCAgICAgICAgICAgIC8vIFx1NTM1NVx1NEUyQVx1NkU5MFx1OEQ4NVx1NjVGNlx1NjVGNlx1OTVGNFx1RkYwOFx1NkJFQlx1NzlEMlx1RkYwOVxyXG4gICAgbWF4UmVzdWx0czogMTAwMDAsICAgICAgICAgIC8vIFx1NjcwMFx1NTkyN1x1N0VEM1x1Njc5Q1x1NjU3MFx1OTFDRlxyXG4gICAgcGFyYWxsZWxSZXF1ZXN0czogdHJ1ZSwgICAvLyBcdTY2MkZcdTU0MjZcdTVFNzZcdTg4NENcdThCRjdcdTZDNDJcdTYyNDBcdTY3MDlcdTZFOTBcclxuICAgIHNob3dTb3VyY2VCYWRnZXM6IHRydWUgICAgLy8gXHU2NjJGXHU1NDI2XHU2NjNFXHU3OTNBXHU2NzY1XHU2RTkwXHU1RkJEXHU3QUUwXHJcbn07XHJcblxyXG4vLyBcdTYyQkRcdThDNjFBUElcdThCRjdcdTZDNDJcdTkxNERcdTdGNkVcclxuY29uc3QgQVBJX0NPTkZJRyA9IHtcclxuICAgIHNlYXJjaDoge1xyXG4gICAgICAgIC8vIFx1NTNFQVx1NjJGQ1x1NjNBNVx1NTNDMlx1NjU3MFx1OTBFOFx1NTIwNlx1RkYwQ1x1NEUwRFx1NTE4RFx1NTMwNVx1NTQyQiAvYXBpLnBocC9wcm92aWRlL3ZvZC9cclxuICAgICAgICBwYXRoOiAnP2FjPXZpZGVvbGlzdCZ3ZD0nLFxyXG4gICAgICAgIHBhZ2VQYXRoOiAnP2FjPXZpZGVvbGlzdCZ3ZD17cXVlcnl9JnBnPXtwYWdlfScsXHJcbiAgICAgICAgbWF4UGFnZXM6IDUwLCAvLyBcdTY3MDBcdTU5MjdcdTgzQjdcdTUzRDZcdTk4NzVcdTY1NzBcclxuICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICAgICdVc2VyLUFnZW50JzogJ01vemlsbGEvNS4wIChXaW5kb3dzIE5UIDEwLjA7IFdpbjY0OyB4NjQpIEFwcGxlV2ViS2l0LzUzNy4zNiAoS0hUTUwsIGxpa2UgR2Vja28pIENocm9tZS8xMjIuMC4wLjAgU2FmYXJpLzUzNy4zNicsXHJcbiAgICAgICAgICAgICdBY2NlcHQnOiAnYXBwbGljYXRpb24vanNvbidcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgZGV0YWlsOiB7XHJcbiAgICAgICAgLy8gXHU1M0VBXHU2MkZDXHU2M0E1XHU1M0MyXHU2NTcwXHU5MEU4XHU1MjA2XHJcbiAgICAgICAgcGF0aDogJz9hYz12aWRlb2xpc3QmaWRzPScsXHJcbiAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgICAnVXNlci1BZ2VudCc6ICdNb3ppbGxhLzUuMCAoV2luZG93cyBOVCAxMC4wOyBXaW42NDsgeDY0KSBBcHBsZVdlYktpdC81MzcuMzYgKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvMTIyLjAuMC4wIFNhZmFyaS81MzcuMzYnLFxyXG4gICAgICAgICAgICAnQWNjZXB0JzogJ2FwcGxpY2F0aW9uL2pzb24nXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG5cclxuLy8gXHU0RjE4XHU1MzE2XHU1NDBFXHU3Njg0XHU2QjYzXHU1MjE5XHU4ODY4XHU4RkJFXHU1RjBGXHU2QTIxXHU1RjBGXHJcbmNvbnN0IE0zVThfUEFUVEVSTiA9IC9cXCRodHRwcz86XFwvXFwvW15cIidcXHNdKz9cXC5tM3U4L2c7XHJcblxyXG4vLyBcdTZERkJcdTUyQTBcdTgxRUFcdTVCOUFcdTRFNDlcdTY0QURcdTY1M0VcdTU2NjhVUkxcclxuY29uc3QgQ1VTVE9NX1BMQVlFUl9VUkwgPSAncGxheWVyLmh0bWwnOyAvLyBcdTRGN0ZcdTc1MjhcdTc2RjhcdTVCRjlcdThERUZcdTVGODRcdTVGMTVcdTc1MjhcdTY3MkNcdTU3MzBwbGF5ZXIuaHRtbFxyXG5cclxuLy8gXHU1ODlFXHU1MkEwXHU4OUM2XHU5ODkxXHU2NEFEXHU2NTNFXHU3NkY4XHU1MTczXHU5MTREXHU3RjZFXHJcbmNvbnN0IFBMQVlFUl9DT05GSUcgPSB7XHJcbiAgICBhdXRvcGxheTogdHJ1ZSxcclxuICAgIGFsbG93RnVsbHNjcmVlbjogdHJ1ZSxcclxuICAgIHdpZHRoOiAnMTAwJScsXHJcbiAgICBoZWlnaHQ6ICc2MDAnLFxyXG4gICAgdGltZW91dDogMTUwMDAsICAvLyBcdTY0QURcdTY1M0VcdTU2NjhcdTUyQTBcdThGN0RcdThEODVcdTY1RjZcdTY1RjZcdTk1RjRcclxuICAgIGZpbHRlckFkczogdHJ1ZSwgIC8vIFx1NjYyRlx1NTQyNlx1NTQyRlx1NzUyOFx1NUU3Rlx1NTQ0QVx1OEZDN1x1NkVFNFxyXG4gICAgYXV0b1BsYXlOZXh0OiB0cnVlLCAgLy8gXHU5RUQ4XHU4QkE0XHU1NDJGXHU3NTI4XHU4MUVBXHU1MkE4XHU4RkRFXHU2NEFEXHU1MjlGXHU4MEZEXHJcbiAgICBhZEZpbHRlcmluZ0VuYWJsZWQ6IHRydWUsIC8vIFx1OUVEOFx1OEJBNFx1NUYwMFx1NTQyRlx1NTIwNlx1NzI0N1x1NUU3Rlx1NTQ0QVx1OEZDN1x1NkVFNFxyXG4gICAgYWRGaWx0ZXJpbmdTdG9yYWdlOiAnYWRGaWx0ZXJpbmdFbmFibGVkJyAvLyBcdTVCNThcdTUwQThcdTVFN0ZcdTU0NEFcdThGQzdcdTZFRTRcdThCQkVcdTdGNkVcdTc2ODRcdTk1MkVcdTU0MERcclxufTtcclxuXHJcbi8vIFx1NTg5RVx1NTJBMFx1OTUxOVx1OEJFRlx1NEZFMVx1NjA2Rlx1NjcyQ1x1NTczMFx1NTMxNlxyXG5jb25zdCBFUlJPUl9NRVNTQUdFUyA9IHtcclxuICAgIE5FVFdPUktfRVJST1I6ICdcdTdGNTFcdTdFRENcdThGREVcdTYzQTVcdTk1MTlcdThCRUZcdUZGMENcdThCRjdcdTY4QzBcdTY3RTVcdTdGNTFcdTdFRENcdThCQkVcdTdGNkUnLFxyXG4gICAgVElNRU9VVF9FUlJPUjogJ1x1OEJGN1x1NkM0Mlx1OEQ4NVx1NjVGNlx1RkYwQ1x1NjcwRFx1NTJBMVx1NTY2OFx1NTRDRFx1NUU5NFx1NjVGNlx1OTVGNFx1OEZDN1x1OTU3RicsXHJcbiAgICBBUElfRVJST1I6ICdBUElcdTYzQTVcdTUzRTNcdThGRDRcdTU2REVcdTk1MTlcdThCRUZcdUZGMENcdThCRjdcdTVDMURcdThCRDVcdTY2RjRcdTYzNjJcdTY1NzBcdTYzNkVcdTZFOTAnLFxyXG4gICAgUExBWUVSX0VSUk9SOiAnXHU2NEFEXHU2NTNFXHU1NjY4XHU1MkEwXHU4RjdEXHU1OTMxXHU4RDI1XHVGRjBDXHU4QkY3XHU1QzFEXHU4QkQ1XHU1MTc2XHU0RUQ2XHU4OUM2XHU5ODkxXHU2RTkwJyxcclxuICAgIFVOS05PV05fRVJST1I6ICdcdTUzRDFcdTc1MUZcdTY3MkFcdTc3RTVcdTk1MTlcdThCRUZcdUZGMENcdThCRjdcdTUyMzdcdTY1QjBcdTk4NzVcdTk3NjJcdTkxQ0RcdThCRDUnXHJcbn07XHJcblxyXG4vLyBcdTZERkJcdTUyQTBcdThGREJcdTRFMDBcdTZCNjVcdTVCODlcdTUxNjhcdThCQkVcdTdGNkVcclxuY29uc3QgU0VDVVJJVFlfQ09ORklHID0ge1xyXG4gICAgZW5hYmxlWFNTUHJvdGVjdGlvbjogdHJ1ZSwgIC8vIFx1NjYyRlx1NTQyNlx1NTQyRlx1NzUyOFhTU1x1NEZERFx1NjJBNFxyXG4gICAgc2FuaXRpemVVcmxzOiB0cnVlLCAgICAgICAgIC8vIFx1NjYyRlx1NTQyNlx1NkUwNVx1NzQwNlVSTFxyXG4gICAgbWF4UXVlcnlMZW5ndGg6IDEwMCwgICAgICAgIC8vIFx1NjcwMFx1NTkyN1x1NjQxQ1x1N0QyMlx1OTU3Rlx1NUVBNlxyXG4gICAgLy8gYWxsb3dlZEFwaURvbWFpbnMgXHU0RTBEXHU1MThEXHU5NzAwXHU4OTgxXHVGRjBDXHU1NkUwXHU0RTNBXHU2MjQwXHU2NzA5XHU4QkY3XHU2QzQyXHU5MEZEXHU5MDFBXHU4RkM3XHU1MTg1XHU5MEU4XHU0RUUzXHU3NDA2XHJcbn07XHJcblxyXG4vLyBcdTZERkJcdTUyQTBcdTU5MUFcdTRFMkFcdTgxRUFcdTVCOUFcdTRFNDlBUElcdTZFOTBcdTc2ODRcdTkxNERcdTdGNkVcclxuY29uc3QgQ1VTVE9NX0FQSV9DT05GSUcgPSB7XHJcbiAgICBzZXBhcmF0b3I6ICcsJywgICAgICAgICAgIC8vIFx1NTIwNlx1OTY5NFx1N0IyNlxyXG4gICAgbWF4U291cmNlczogNSwgICAgICAgICAgICAvLyBcdTY3MDBcdTU5MjdcdTUxNDFcdThCQjhcdTc2ODRcdTgxRUFcdTVCOUFcdTRFNDlcdTZFOTBcdTY1NzBcdTkxQ0ZcclxuICAgIHRlc3RUaW1lb3V0OiA1MDAwLCAgICAgICAgLy8gXHU2RDRCXHU4QkQ1XHU4RDg1XHU2NUY2XHU2NUY2XHU5NUY0KFx1NkJFQlx1NzlEMilcclxuICAgIG5hbWVQcmVmaXg6ICdDdXN0b20tJywgICAgLy8gXHU4MUVBXHU1QjlBXHU0RTQ5XHU2RTkwXHU1NDBEXHU3OUYwXHU1MjREXHU3RjAwXHJcbiAgICB2YWxpZGF0ZVVybDogdHJ1ZSwgICAgICAgIC8vIFx1OUE4Q1x1OEJDMVVSTFx1NjgzQ1x1NUYwRlxyXG4gICAgY2FjaGVSZXN1bHRzOiB0cnVlLCAgICAgICAvLyBcdTdGMTNcdTVCNThcdTZENEJcdThCRDVcdTdFRDNcdTY3OUNcclxuICAgIGNhY2hlRXhwaXJ5OiA1MTg0MDAwMDAwLCAgLy8gXHU3RjEzXHU1QjU4XHU4RkM3XHU2NzFGXHU2NUY2XHU5NUY0KDJcdTRFMkFcdTY3MDgpXHJcbiAgICBhZHVsdFByb3BOYW1lOiAnaXNBZHVsdCcgLy8gXHU3NTI4XHU0RThFXHU2ODA3XHU4QkIwXHU2MjEwXHU0RUJBXHU1MTg1XHU1QkI5XHU3Njg0XHU1QzVFXHU2MDI3XHU1NDBEXHJcbn07XHJcblxyXG4vLyBcdTk2OTBcdTg1Q0ZcdTUxODVcdTdGNkVcdTlFQzRcdTgyNzJcdTkxQzdcdTk2QzZcdTdBRDlBUElcdTc2ODRcdTUzRDhcdTkxQ0ZcclxuY29uc3QgSElERV9CVUlMVElOX0FEVUxUX0FQSVMgPSBmYWxzZTtcclxuIiwgIi8qKlxyXG4gKiBcdTRFRTNcdTc0MDZcdThCRjdcdTZDNDJcdTkyNzRcdTY3NDNcdTZBMjFcdTU3NTdcclxuICogXHU0RTNBXHU0RUUzXHU3NDA2XHU4QkY3XHU2QzQyXHU2REZCXHU1MkEwXHU1N0ZBXHU0RThFIFBBU1NXT1JEIFx1NzY4NFx1OTI3NFx1Njc0M1x1NjczQVx1NTIzNlxyXG4gKi9cclxuXHJcbi8vIFx1NEVDRVx1NTE2OFx1NUM0MFx1OTE0RFx1N0Y2RVx1ODNCN1x1NTNENlx1NUJDNlx1NzgwMVx1NTRDOFx1NUUwQ1x1RkYwOFx1NTk4Mlx1Njc5Q1x1NUI1OFx1NTcyOFx1RkYwOVxyXG5sZXQgY2FjaGVkUGFzc3dvcmRIYXNoID0gbnVsbDtcclxuXHJcbi8qKlxyXG4gKiBcdTgzQjdcdTUzRDZcdTVGNTNcdTUyNERcdTRGMUFcdThCRERcdTc2ODRcdTVCQzZcdTc4MDFcdTU0QzhcdTVFMENcclxuICovXHJcbmFzeW5jIGZ1bmN0aW9uIGdldFBhc3N3b3JkSGFzaCgpIHtcclxuICAgIGlmIChjYWNoZWRQYXNzd29yZEhhc2gpIHtcclxuICAgICAgICByZXR1cm4gY2FjaGVkUGFzc3dvcmRIYXNoO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyAxLiBcdTRGMThcdTUxNDhcdTRFQ0VcdTVERjJcdTVCNThcdTUwQThcdTc2ODRcdTRFRTNcdTc0MDZcdTkyNzRcdTY3NDNcdTU0QzhcdTVFMENcdTgzQjdcdTUzRDZcclxuICAgIGNvbnN0IHN0b3JlZEhhc2ggPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgncHJveHlBdXRoSGFzaCcpO1xyXG4gICAgaWYgKHN0b3JlZEhhc2gpIHtcclxuICAgICAgICBjYWNoZWRQYXNzd29yZEhhc2ggPSBzdG9yZWRIYXNoO1xyXG4gICAgICAgIHJldHVybiBzdG9yZWRIYXNoO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyAyLiBcdTVDMURcdThCRDVcdTRFQ0VcdTVCQzZcdTc4MDFcdTlBOENcdThCQzFcdTcyQjZcdTYwMDFcdTgzQjdcdTUzRDZcdUZGMDhwYXNzd29yZC5qcyBcdTlBOENcdThCQzFcdTU0MEVcdTVCNThcdTUwQThcdTc2ODRcdTU0QzhcdTVFMENcdUZGMDlcclxuICAgIGNvbnN0IHBhc3N3b3JkVmVyaWZpZWQgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgncGFzc3dvcmRWZXJpZmllZCcpO1xyXG4gICAgY29uc3Qgc3RvcmVkUGFzc3dvcmRIYXNoID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3Bhc3N3b3JkSGFzaCcpO1xyXG4gICAgaWYgKHBhc3N3b3JkVmVyaWZpZWQgPT09ICd0cnVlJyAmJiBzdG9yZWRQYXNzd29yZEhhc2gpIHtcclxuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgncHJveHlBdXRoSGFzaCcsIHN0b3JlZFBhc3N3b3JkSGFzaCk7XHJcbiAgICAgICAgY2FjaGVkUGFzc3dvcmRIYXNoID0gc3RvcmVkUGFzc3dvcmRIYXNoO1xyXG4gICAgICAgIHJldHVybiBzdG9yZWRQYXNzd29yZEhhc2g7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIDMuIFx1NUMxRFx1OEJENVx1NEVDRVx1NzUyOFx1NjIzN1x1OEY5M1x1NTE2NVx1NzY4NFx1NUJDNlx1NzgwMVx1NzUxRlx1NjIxMFx1NTRDOFx1NUUwQ1xyXG4gICAgY29uc3QgdXNlclBhc3N3b3JkID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3VzZXJQYXNzd29yZCcpO1xyXG4gICAgaWYgKHVzZXJQYXNzd29yZCkge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIC8vIFx1NTJBOFx1NjAwMVx1NUJGQ1x1NTE2NSBzaGEyNTYgXHU1MUZEXHU2NTcwXHJcbiAgICAgICAgICAgIGNvbnN0IHsgc2hhMjU2IH0gPSBhd2FpdCBpbXBvcnQoJy4vc2hhMjU2LmpzJyk7XHJcbiAgICAgICAgICAgIGNvbnN0IGhhc2ggPSBhd2FpdCBzaGEyNTYodXNlclBhc3N3b3JkKTtcclxuICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ3Byb3h5QXV0aEhhc2gnLCBoYXNoKTtcclxuICAgICAgICAgICAgY2FjaGVkUGFzc3dvcmRIYXNoID0gaGFzaDtcclxuICAgICAgICAgICAgcmV0dXJuIGhhc2g7XHJcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignXHU3NTFGXHU2MjEwXHU1QkM2XHU3ODAxXHU1NEM4XHU1RTBDXHU1OTMxXHU4RDI1OicsIGVycm9yKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIDQuIFx1NTk4Mlx1Njc5Q1x1NzUyOFx1NjIzN1x1NkNBMVx1NjcwOVx1OEJCRVx1N0Y2RVx1NUJDNlx1NzgwMVx1RkYwQ1x1NUMxRFx1OEJENVx1NEY3Rlx1NzUyOFx1NzNBRlx1NTg4M1x1NTNEOFx1OTFDRlx1NEUyRFx1NzY4NFx1NUJDNlx1NzgwMVx1NTRDOFx1NUUwQ1xyXG4gICAgaWYgKHdpbmRvdy5fX0VOVl9fICYmIHdpbmRvdy5fX0VOVl9fLlBBU1NXT1JEKSB7XHJcbiAgICAgICAgY2FjaGVkUGFzc3dvcmRIYXNoID0gd2luZG93Ll9fRU5WX18uUEFTU1dPUkQ7XHJcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5fX0VOVl9fLlBBU1NXT1JEO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICByZXR1cm4gbnVsbDtcclxufVxyXG5cclxuLyoqXHJcbiAqIFx1NEUzQVx1NEVFM1x1NzQwNlx1OEJGN1x1NkM0MlVSTFx1NkRGQlx1NTJBMFx1OTI3NFx1Njc0M1x1NTNDMlx1NjU3MFxyXG4gKi9cclxuYXN5bmMgZnVuY3Rpb24gYWRkQXV0aFRvUHJveHlVcmwodXJsKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIGNvbnN0IGhhc2ggPSBhd2FpdCBnZXRQYXNzd29yZEhhc2goKTtcclxuICAgICAgICBpZiAoIWhhc2gpIHtcclxuICAgICAgICAgICAgY29uc29sZS53YXJuKCdcdTY1RTBcdTZDRDVcdTgzQjdcdTUzRDZcdTVCQzZcdTc4MDFcdTU0QzhcdTVFMENcdUZGMENcdTRFRTNcdTc0MDZcdThCRjdcdTZDNDJcdTUzRUZcdTgwRkRcdTU5MzFcdThEMjUnKTtcclxuICAgICAgICAgICAgcmV0dXJuIHVybDtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gXHU2REZCXHU1MkEwXHU2NUY2XHU5NUY0XHU2MjMzXHU5NjMyXHU2QjYyXHU5MUNEXHU2NTNFXHU2NTNCXHU1MUZCXHJcbiAgICAgICAgY29uc3QgdGltZXN0YW1wID0gRGF0ZS5ub3coKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBcdTY4QzBcdTY3RTVVUkxcdTY2MkZcdTU0MjZcdTVERjJcdTUzMDVcdTU0MkJcdTY3RTVcdThCRTJcdTUzQzJcdTY1NzBcclxuICAgICAgICBjb25zdCBzZXBhcmF0b3IgPSB1cmwuaW5jbHVkZXMoJz8nKSA/ICcmJyA6ICc/JztcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gYCR7dXJsfSR7c2VwYXJhdG9yfWF1dGg9JHtlbmNvZGVVUklDb21wb25lbnQoaGFzaCl9JnQ9JHt0aW1lc3RhbXB9YDtcclxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignXHU2REZCXHU1MkEwXHU0RUUzXHU3NDA2XHU5Mjc0XHU2NzQzXHU1OTMxXHU4RDI1OicsIGVycm9yKTtcclxuICAgICAgICByZXR1cm4gdXJsO1xyXG4gICAgfVxyXG59XHJcblxyXG4vKipcclxuICogXHU5QThDXHU4QkMxXHU0RUUzXHU3NDA2XHU4QkY3XHU2QzQyXHU3Njg0XHU5Mjc0XHU2NzQzXHJcbiAqL1xyXG5mdW5jdGlvbiB2YWxpZGF0ZVByb3h5QXV0aChhdXRoSGFzaCwgc2VydmVyUGFzc3dvcmRIYXNoLCB0aW1lc3RhbXApIHtcclxuICAgIGlmICghYXV0aEhhc2ggfHwgIXNlcnZlclBhc3N3b3JkSGFzaCkge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gXHU5QThDXHU4QkMxXHU1NEM4XHU1RTBDXHU2NjJGXHU1NDI2XHU1MzM5XHU5MTREXHJcbiAgICBpZiAoYXV0aEhhc2ggIT09IHNlcnZlclBhc3N3b3JkSGFzaCkge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgLy8gXHU5QThDXHU4QkMxXHU2NUY2XHU5NUY0XHU2MjMzXHVGRjA4MTBcdTUyMDZcdTk0OUZcdTY3MDlcdTY1NDhcdTY3MUZcdUZGMDlcclxuICAgIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XHJcbiAgICBjb25zdCBtYXhBZ2UgPSAxMCAqIDYwICogMTAwMDsgLy8gMTBcdTUyMDZcdTk0OUZcclxuICAgIFxyXG4gICAgaWYgKHRpbWVzdGFtcCAmJiAobm93IC0gcGFyc2VJbnQodGltZXN0YW1wKSkgPiBtYXhBZ2UpIHtcclxuICAgICAgICBjb25zb2xlLndhcm4oJ1x1NEVFM1x1NzQwNlx1OEJGN1x1NkM0Mlx1NjVGNlx1OTVGNFx1NjIzM1x1OEZDN1x1NjcxRicpO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgcmV0dXJuIHRydWU7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBcdTZFMDVcdTk2NjRcdTdGMTNcdTVCNThcdTc2ODRcdTkyNzRcdTY3NDNcdTRGRTFcdTYwNkZcclxuICovXHJcbmZ1bmN0aW9uIGNsZWFyQXV0aENhY2hlKCkge1xyXG4gICAgY2FjaGVkUGFzc3dvcmRIYXNoID0gbnVsbDtcclxuICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCdwcm94eUF1dGhIYXNoJyk7XHJcbn1cclxuXHJcbi8vIFx1NzZEMVx1NTQyQ1x1NUJDNlx1NzgwMVx1NTNEOFx1NTMxNlx1RkYwQ1x1NkUwNVx1OTY2NFx1N0YxM1x1NUI1OFxyXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignc3RvcmFnZScsIChlKSA9PiB7XHJcbiAgICBpZiAoZS5rZXkgPT09ICd1c2VyUGFzc3dvcmQnIHx8ICh3aW5kb3cuUEFTU1dPUkRfQ09ORklHICYmIGUua2V5ID09PSB3aW5kb3cuUEFTU1dPUkRfQ09ORklHLmxvY2FsU3RvcmFnZUtleSkpIHtcclxuICAgICAgICBjbGVhckF1dGhDYWNoZSgpO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbi8vIFx1NUJGQ1x1NTFGQVx1NTFGRFx1NjU3MFxyXG53aW5kb3cuUHJveHlBdXRoID0ge1xyXG4gICAgYWRkQXV0aFRvUHJveHlVcmwsXHJcbiAgICB2YWxpZGF0ZVByb3h5QXV0aCxcclxuICAgIGNsZWFyQXV0aENhY2hlLFxyXG4gICAgZ2V0UGFzc3dvcmRIYXNoXHJcbn07XHJcbiIsICIvLyBcdTVCQzZcdTc4MDFcdTRGRERcdTYyQTRcdTUyOUZcdTgwRkRcclxuXHJcbi8qKlxyXG4gKiBcdTY4QzBcdTY3RTVcdTY2MkZcdTU0MjZcdThCQkVcdTdGNkVcdTRFODZcdTVCQzZcdTc4MDFcdTRGRERcdTYyQTRcclxuICogXHU5MDFBXHU4RkM3XHU4QkZCXHU1M0Q2XHU5ODc1XHU5NzYyXHU0RTBBXHU1RDRDXHU1MTY1XHU3Njg0XHU3M0FGXHU1ODgzXHU1M0Q4XHU5MUNGXHU2NzY1XHU2OEMwXHU2N0U1XHJcbiAqL1xyXG5mdW5jdGlvbiBpc1Bhc3N3b3JkUHJvdGVjdGVkKCkge1xyXG4gICAgLy8gXHU1M0VBXHU2OEMwXHU2N0U1XHU2NjZFXHU5MDFBXHU1QkM2XHU3ODAxXHJcbiAgICBjb25zdCBwd2QgPSB3aW5kb3cuX19FTlZfXyAmJiB3aW5kb3cuX19FTlZfXy5QQVNTV09SRDtcclxuICAgIFxyXG4gICAgLy8gXHU2OEMwXHU2N0U1XHU2NjZFXHU5MDFBXHU1QkM2XHU3ODAxXHU2NjJGXHU1NDI2XHU2NzA5XHU2NTQ4XHJcbiAgICByZXR1cm4gdHlwZW9mIHB3ZCA9PT0gJ3N0cmluZycgJiYgcHdkLmxlbmd0aCA9PT0gNjQgJiYgIS9eMCskLy50ZXN0KHB3ZCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBcdTY4QzBcdTY3RTVcdTY2MkZcdTU0MjZcdTVGM0FcdTUyMzZcdTg5ODFcdTZDNDJcdThCQkVcdTdGNkVcdTVCQzZcdTc4MDFcclxuICogXHU1OTgyXHU2NzlDXHU2Q0ExXHU2NzA5XHU4QkJFXHU3RjZFXHU2NzA5XHU2NTQ4XHU3Njg0IFBBU1NXT1JEXHVGRjBDXHU1MjE5XHU4QkE0XHU0RTNBXHU5NzAwXHU4OTgxXHU1RjNBXHU1MjM2XHU4QkJFXHU3RjZFXHU1QkM2XHU3ODAxXHJcbiAqIFx1NEUzQVx1NEU4Nlx1NUI4OVx1NTE2OFx1ODAwM1x1ODY1MVx1RkYwQ1x1NjI0MFx1NjcwOVx1OTBFOFx1N0Y3Mlx1OTBGRFx1NUZDNVx1OTg3Qlx1OEJCRVx1N0Y2RVx1NUJDNlx1NzgwMVxyXG4gKi9cclxuZnVuY3Rpb24gaXNQYXNzd29yZFJlcXVpcmVkKCkge1xyXG4gICAgcmV0dXJuICFpc1Bhc3N3b3JkUHJvdGVjdGVkKCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBcdTVGM0FcdTUyMzZcdTVCQzZcdTc4MDFcdTRGRERcdTYyQTRcdTY4QzBcdTY3RTUgLSBcdTk2MzJcdTZCNjJcdTdFRDVcdThGQzdcclxuICogXHU1NzI4XHU1MTczXHU5NTJFXHU2NENEXHU0RjVDXHU1MjREXHU5MEZEXHU1RTk0XHU4QkU1XHU4QzAzXHU3NTI4XHU2QjY0XHU1MUZEXHU2NTcwXHJcbiAqL1xyXG5mdW5jdGlvbiBlbnN1cmVQYXNzd29yZFByb3RlY3Rpb24oKSB7XHJcbiAgICBpZiAoaXNQYXNzd29yZFJlcXVpcmVkKCkpIHtcclxuICAgICAgICBzaG93UGFzc3dvcmRNb2RhbCgpO1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignUGFzc3dvcmQgcHJvdGVjdGlvbiBpcyByZXF1aXJlZCcpO1xyXG4gICAgfVxyXG4gICAgaWYgKGlzUGFzc3dvcmRQcm90ZWN0ZWQoKSAmJiAhaXNQYXNzd29yZFZlcmlmaWVkKCkpIHtcclxuICAgICAgICBzaG93UGFzc3dvcmRNb2RhbCgpO1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignUGFzc3dvcmQgdmVyaWZpY2F0aW9uIHJlcXVpcmVkJyk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdHJ1ZTtcclxufVxyXG5cclxud2luZG93LmlzUGFzc3dvcmRQcm90ZWN0ZWQgPSBpc1Bhc3N3b3JkUHJvdGVjdGVkO1xyXG53aW5kb3cuaXNQYXNzd29yZFJlcXVpcmVkID0gaXNQYXNzd29yZFJlcXVpcmVkO1xyXG5cclxuLy8gXHU1M0VGXHU5MDA5XHVGRjFBXHU2MjUzXHU1RjAwXHU3NTM1XHU4OUM2XHU3QUVGXHU4QzAzXHU4QkQ1XHJcbmNvbnN0IFBBU1NXT1JEX0RFQlVHID0gZmFsc2U7XHJcbmZ1bmN0aW9uIHB3ZExvZyguLi5hcmdzKSB7XHJcbiAgICBpZiAoUEFTU1dPUkRfREVCVUcgJiYgdHlwZW9mIGNvbnNvbGUgIT09ICd1bmRlZmluZWQnICYmIGNvbnNvbGUubG9nKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ1twYXNzd29yZF0nLCAuLi5hcmdzKTtcclxuICAgIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIFx1OUE4Q1x1OEJDMVx1NzUyOFx1NjIzN1x1OEY5M1x1NTE2NVx1NzY4NFx1NUJDNlx1NzgwMVx1NjYyRlx1NTQyNlx1NkI2M1x1Nzg2RVx1RkYwOFx1NUYwMlx1NkI2NVx1RkYwQ1x1NEY3Rlx1NzUyOFNIQS0yNTZcdTU0QzhcdTVFMENcdUZGMDlcclxuICovXHJcbmFzeW5jIGZ1bmN0aW9uIHZlcmlmeVBhc3N3b3JkKHBhc3N3b3JkKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIGNvbnN0IGNvcnJlY3RIYXNoID0gd2luZG93Ll9fRU5WX18/LlBBU1NXT1JEO1xyXG4gICAgICAgIHB3ZExvZygnZW52IHBhc3N3b3JkIGhhc2ggcHJlc2VudDonLCAhIWNvcnJlY3RIYXNoLCAnbGVuOicsIGNvcnJlY3RIYXNoID8gY29ycmVjdEhhc2gubGVuZ3RoIDogMCk7XHJcbiAgICAgICAgaWYgKCFjb3JyZWN0SGFzaCkgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICBjb25zdCBpbnB1dEhhc2ggPSBhd2FpdCBzaGEyNTYocGFzc3dvcmQpO1xyXG4gICAgICAgIHB3ZExvZygnaW5wdXQgaGFzaDonLCBpbnB1dEhhc2gpO1xyXG4gICAgICAgIGNvbnN0IGlzVmFsaWQgPSBpbnB1dEhhc2ggPT09IGNvcnJlY3RIYXNoO1xyXG5cclxuICAgICAgICBpZiAoaXNWYWxpZCkge1xyXG4gICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShQQVNTV09SRF9DT05GSUcubG9jYWxTdG9yYWdlS2V5LCBKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgICAgICAgICB2ZXJpZmllZDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIHRpbWVzdGFtcDogRGF0ZS5ub3coKSxcclxuICAgICAgICAgICAgICAgIHBhc3N3b3JkSGFzaDogY29ycmVjdEhhc2hcclxuICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gaXNWYWxpZDtcclxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignXHU5QThDXHU4QkMxXHU1QkM2XHU3ODAxXHU2NUY2XHU1MUZBXHU5NTE5OicsIGVycm9yKTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8vIFx1OUE4Q1x1OEJDMVx1NzJCNlx1NjAwMVx1NjhDMFx1NjdFNVxyXG5mdW5jdGlvbiBpc1Bhc3N3b3JkVmVyaWZpZWQoKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIGlmICghaXNQYXNzd29yZFByb3RlY3RlZCgpKSByZXR1cm4gdHJ1ZTtcclxuXHJcbiAgICAgICAgY29uc3Qgc3RvcmVkID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oUEFTU1dPUkRfQ09ORklHLmxvY2FsU3RvcmFnZUtleSk7XHJcbiAgICAgICAgaWYgKCFzdG9yZWQpIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgY29uc3QgeyB0aW1lc3RhbXAsIHBhc3N3b3JkSGFzaCB9ID0gSlNPTi5wYXJzZShzdG9yZWQpO1xyXG4gICAgICAgIGNvbnN0IGN1cnJlbnRIYXNoID0gd2luZG93Ll9fRU5WX18/LlBBU1NXT1JEO1xyXG5cclxuICAgICAgICByZXR1cm4gdGltZXN0YW1wICYmIHBhc3N3b3JkSGFzaCA9PT0gY3VycmVudEhhc2ggJiZcclxuICAgICAgICAgICAgRGF0ZS5ub3coKSAtIHRpbWVzdGFtcCA8IFBBU1NXT1JEX0NPTkZJRy52ZXJpZmljYXRpb25UVEw7XHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1x1NjhDMFx1NjdFNVx1NUJDNlx1NzgwMVx1OUE4Q1x1OEJDMVx1NzJCNlx1NjAwMVx1NjVGNlx1NTFGQVx1OTUxOTonLCBlcnJvcik7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG59XHJcblxyXG4vLyBcdTY2RjRcdTY1QjBcdTUxNjhcdTVDNDBcdTVCRkNcdTUxRkFcclxud2luZG93LmlzUGFzc3dvcmRQcm90ZWN0ZWQgPSBpc1Bhc3N3b3JkUHJvdGVjdGVkO1xyXG53aW5kb3cuaXNQYXNzd29yZFJlcXVpcmVkID0gaXNQYXNzd29yZFJlcXVpcmVkO1xyXG53aW5kb3cuaXNQYXNzd29yZFZlcmlmaWVkID0gaXNQYXNzd29yZFZlcmlmaWVkO1xyXG53aW5kb3cudmVyaWZ5UGFzc3dvcmQgPSB2ZXJpZnlQYXNzd29yZDtcclxud2luZG93LmVuc3VyZVBhc3N3b3JkUHJvdGVjdGlvbiA9IGVuc3VyZVBhc3N3b3JkUHJvdGVjdGlvbjtcclxud2luZG93LnNob3dQYXNzd29yZE1vZGFsID0gc2hvd1Bhc3N3b3JkTW9kYWw7XHJcbndpbmRvdy5oaWRlUGFzc3dvcmRNb2RhbCA9IGhpZGVQYXNzd29yZE1vZGFsO1xyXG5cclxuLy8gU0hBLTI1Nlx1NUI5RVx1NzNCMFx1RkYxQVx1NEYxOFx1NTE0OFx1NEY3Rlx1NzUyOCBsaWJzL3NoYTI1Ni5taW4uanNcdUZGMDh3aW5kb3cuX2pzU2hhMjU2XHVGRjA5XHVGRjBDXHU5MDdGXHU1MTREXHU3NTM1XHU4OUM2XHU3QUVGIFdlYkNyeXB0by9UZXh0RW5jb2RlciBcdTUxN0NcdTVCQjlcdTYwMjdcdTk1RUVcdTk4OThcclxuYXN5bmMgZnVuY3Rpb24gc2hhMjU2KG1lc3NhZ2UpIHtcclxuICAgIC8vIDEpIFx1NEYxOFx1NTE0OFx1OEQ3MFx1NTM5Rlx1NTlDQiBqcy1zaGEyNTZcdUZGMDhcdTU0MENcdTZCNjVcdTVCOUVcdTczQjBcdUZGMENcdTUxN0NcdTVCQjlcdTYwMjdcdTY3MDBcdTU5N0RcdUZGMDlcclxuICAgIGlmICh0eXBlb2Ygd2luZG93Ll9qc1NoYTI1NiA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIHB3ZExvZygnc2hhMjU2IHZpYSB3aW5kb3cuX2pzU2hhMjU2Jyk7XHJcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5fanNTaGEyNTYobWVzc2FnZSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gMikgXHU1MTc2XHU2QjIxXHU1QzFEXHU4QkQ1IFdlYiBDcnlwdG8gQVBJXHJcbiAgICBpZiAod2luZG93LmNyeXB0byAmJiBjcnlwdG8uc3VidGxlICYmIGNyeXB0by5zdWJ0bGUuZGlnZXN0KSB7XHJcbiAgICAgICAgLy8gVGV4dEVuY29kZXIgXHU1NzI4XHU5MEU4XHU1MjA2XHU3NTM1XHU4OUM2XHU3QUVGXHU1M0VGXHU4MEZEXHU0RTBEXHU1QjU4XHU1NzI4XHJcbiAgICAgICAgbGV0IG1zZ0J1ZmZlcjtcclxuICAgICAgICBpZiAodHlwZW9mIFRleHRFbmNvZGVyICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICBtc2dCdWZmZXIgPSBuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUobWVzc2FnZSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gXHU3QjgwXHU2NjEzIFVURi04IFx1N0YxNlx1NzgwMVx1OTY0RFx1N0VBN1x1RkYwOFx1ODk4Nlx1NzZENlx1NUUzOFx1NzUyOCBBU0NJSS9cdTRFMkRcdTY1ODdcdTU3M0FcdTY2NkZcdUZGMDlcclxuICAgICAgICAgICAgY29uc3QgdXRmOCA9IHVuZXNjYXBlKGVuY29kZVVSSUNvbXBvbmVudChtZXNzYWdlKSk7XHJcbiAgICAgICAgICAgIGNvbnN0IGFyciA9IG5ldyBVaW50OEFycmF5KHV0ZjgubGVuZ3RoKTtcclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB1dGY4Lmxlbmd0aDsgaSsrKSBhcnJbaV0gPSB1dGY4LmNoYXJDb2RlQXQoaSk7XHJcbiAgICAgICAgICAgIG1zZ0J1ZmZlciA9IGFycjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGhhc2hCdWZmZXIgPSBhd2FpdCBjcnlwdG8uc3VidGxlLmRpZ2VzdCgnU0hBLTI1NicsIG1zZ0J1ZmZlcik7XHJcbiAgICAgICAgY29uc3QgaGFzaEFycmF5ID0gQXJyYXkuZnJvbShuZXcgVWludDhBcnJheShoYXNoQnVmZmVyKSk7XHJcbiAgICAgICAgcHdkTG9nKCdzaGEyNTYgdmlhIGNyeXB0by5zdWJ0bGUnKTtcclxuICAgICAgICByZXR1cm4gaGFzaEFycmF5Lm1hcChiID0+IGIudG9TdHJpbmcoMTYpLnBhZFN0YXJ0KDIsICcwJykpLmpvaW4oJycpO1xyXG4gICAgfVxyXG5cclxuICAgIHRocm93IG5ldyBFcnJvcignTm8gU0hBLTI1NiBpbXBsZW1lbnRhdGlvbiBhdmFpbGFibGUuJyk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBcdTY2M0VcdTc5M0FcdTVCQzZcdTc4MDFcdTlBOENcdThCQzFcdTVGMzlcdTdBOTdcclxuICovXHJcbmZ1bmN0aW9uIHNob3dQYXNzd29yZE1vZGFsKCkge1xyXG4gICAgY29uc3QgcGFzc3dvcmRNb2RhbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYXNzd29yZE1vZGFsJyk7XHJcbiAgICBpZiAocGFzc3dvcmRNb2RhbCkge1xyXG4gICAgICAgIC8vIFx1OTYzMlx1NkI2Mlx1NTFGQVx1NzNCMFx1OEM0Nlx1NzRFM1x1NTMzQVx1NTdERlx1NkVEQVx1NTJBOFx1Njc2MVx1RkYwOFx1OTBFOFx1NTIwNlx1OTg3NVx1OTc2Mlx1NTNFRlx1ODBGRFx1NkNBMVx1NjcwOVx1OEJFNVx1NTE0M1x1N0QyMFx1RkYwOVxyXG4gICAgICAgIGNvbnN0IGRvdWJhbkFyZWEgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZG91YmFuQXJlYScpO1xyXG4gICAgICAgIGlmIChkb3ViYW5BcmVhKSBkb3ViYW5BcmVhLmNsYXNzTGlzdC5hZGQoJ2hpZGRlbicpO1xyXG5cclxuICAgICAgICBjb25zdCBjYW5jZWxCdG4gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGFzc3dvcmRDYW5jZWxCdG4nKTtcclxuICAgICAgICBpZiAoY2FuY2VsQnRuKSBjYW5jZWxCdG4uY2xhc3NMaXN0LmFkZCgnaGlkZGVuJyk7XHJcblxyXG4gICAgICAgIC8vIFx1NjhDMFx1NjdFNVx1NjYyRlx1NTQyNlx1OTcwMFx1ODk4MVx1NUYzQVx1NTIzNlx1OEJCRVx1N0Y2RVx1NUJDNlx1NzgwMVxyXG4gICAgICAgIGlmIChpc1Bhc3N3b3JkUmVxdWlyZWQoKSkge1xyXG4gICAgICAgICAgICAvLyBcdTRGRUVcdTY1MzlcdTVGMzlcdTdBOTdcdTUxODVcdTVCQjlcdTYzRDBcdTc5M0FcdTc1MjhcdTYyMzdcdTk3MDBcdTg5ODFcdTUxNDhcdThCQkVcdTdGNkVcdTVCQzZcdTc4MDFcclxuICAgICAgICAgICAgY29uc3QgdGl0bGUgPSBwYXNzd29yZE1vZGFsLnF1ZXJ5U2VsZWN0b3IoJ2gyJyk7XHJcbiAgICAgICAgICAgIGNvbnN0IGRlc2NyaXB0aW9uID0gcGFzc3dvcmRNb2RhbC5xdWVyeVNlbGVjdG9yKCdwJyk7XHJcbiAgICAgICAgICAgIGlmICh0aXRsZSkgdGl0bGUudGV4dENvbnRlbnQgPSAnXHU5NzAwXHU4OTgxXHU4QkJFXHU3RjZFXHU1QkM2XHU3ODAxJztcclxuICAgICAgICAgICAgaWYgKGRlc2NyaXB0aW9uKSBkZXNjcmlwdGlvbi50ZXh0Q29udGVudCA9ICdcdThCRjdcdTUxNDhcdTU3MjhcdTkwRThcdTdGNzJcdTVFNzNcdTUzRjBcdThCQkVcdTdGNkUgUEFTU1dPUkQgXHU3M0FGXHU1ODgzXHU1M0Q4XHU5MUNGXHU2NzY1XHU0RkREXHU2MkE0XHU2MEE4XHU3Njg0XHU1QjlFXHU0RjhCJztcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIFx1OTY5MFx1ODVDRlx1NUJDNlx1NzgwMVx1OEY5M1x1NTE2NVx1Njg0Nlx1NTQ4Q1x1NjNEMFx1NEVBNFx1NjMwOVx1OTRBRVx1RkYwQ1x1NTNFQVx1NjYzRVx1NzkzQVx1NjNEMFx1NzkzQVx1NEZFMVx1NjA2RlxyXG4gICAgICAgICAgICBjb25zdCBmb3JtID0gcGFzc3dvcmRNb2RhbC5xdWVyeVNlbGVjdG9yKCdmb3JtJyk7XHJcbiAgICAgICAgICAgIGNvbnN0IGVycm9yTXNnID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Bhc3N3b3JkRXJyb3InKTtcclxuICAgICAgICAgICAgaWYgKGZvcm0pIGZvcm0uc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuICAgICAgICAgICAgaWYgKGVycm9yTXNnKSB7XHJcbiAgICAgICAgICAgICAgICBlcnJvck1zZy50ZXh0Q29udGVudCA9ICdcdTRFM0FcdTc4NkVcdTRGRERcdTVCODlcdTUxNjhcdUZGMENcdTVGQzVcdTk4N0JcdThCQkVcdTdGNkUgUEFTU1dPUkQgXHU3M0FGXHU1ODgzXHU1M0Q4XHU5MUNGXHU2MjREXHU4MEZEXHU0RjdGXHU3NTI4XHU2NzJDXHU2NzBEXHU1MkExXHVGRjBDXHU4QkY3XHU4MDU0XHU3Q0ZCXHU3QkExXHU3NDA2XHU1NDU4XHU4RkRCXHU4ODRDXHU5MTREXHU3RjZFJztcclxuICAgICAgICAgICAgICAgIGVycm9yTXNnLmNsYXNzTGlzdC5yZW1vdmUoJ2hpZGRlbicpO1xyXG4gICAgICAgICAgICAgICAgZXJyb3JNc2cuY2xhc3NOYW1lID0gJ3RleHQtcmVkLTUwMCBtdC0yIGZvbnQtbWVkaXVtJzsgLy8gXHU2NTM5XHU0RTNBXHU2NkY0XHU5MTkyXHU3NkVFXHU3Njg0XHU3RUEyXHU4MjcyXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBcdTZCNjNcdTVFMzhcdTc2ODRcdTVCQzZcdTc4MDFcdTlBOENcdThCQzFcdTZBMjFcdTVGMEZcclxuICAgICAgICAgICAgY29uc3QgdGl0bGUgPSBwYXNzd29yZE1vZGFsLnF1ZXJ5U2VsZWN0b3IoJ2gyJyk7XHJcbiAgICAgICAgICAgIGNvbnN0IGRlc2NyaXB0aW9uID0gcGFzc3dvcmRNb2RhbC5xdWVyeVNlbGVjdG9yKCdwJyk7XHJcbiAgICAgICAgICAgIGlmICh0aXRsZSkgdGl0bGUudGV4dENvbnRlbnQgPSAnXHU4QkJGXHU5NUVFXHU5QThDXHU4QkMxJztcclxuICAgICAgICAgICAgaWYgKGRlc2NyaXB0aW9uKSBkZXNjcmlwdGlvbi50ZXh0Q29udGVudCA9ICdcdThCRjdcdThGOTNcdTUxNjVcdTVCQzZcdTc4MDFcdTdFRTdcdTdFRURcdThCQkZcdTk1RUUnO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgY29uc3QgZm9ybSA9IHBhc3N3b3JkTW9kYWwucXVlcnlTZWxlY3RvcignZm9ybScpO1xyXG4gICAgICAgICAgICBpZiAoZm9ybSkgZm9ybS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFx1NTE3Q1x1NUJCOSBpbmRleC5odG1sIFx1NTNFRlx1ODBGRFx1ODhBQlx1NTE4NVx1ODA1NFx1ODExQVx1NjcyQyByZW1vdmVBdHRyaWJ1dGUoJ2NsYXNzJykgXHU3Njg0XHU2MEM1XHU1MUI1XHVGRjFBXHU1OUNCXHU3RUM4XHU0RUU1IHN0eWxlIFx1NEUzQVx1NTFDNlxyXG4gICAgICAgIHBhc3N3b3JkTW9kYWwuc3R5bGUuZGlzcGxheSA9ICdmbGV4JztcclxuICAgICAgICBwYXNzd29yZE1vZGFsLnN0eWxlLnZpc2liaWxpdHkgPSAndmlzaWJsZSc7XHJcbiAgICAgICAgcGFzc3dvcmRNb2RhbC5jbGFzc0xpc3QucmVtb3ZlKCdoaWRkZW4nKTtcclxuICAgICAgICBwYXNzd29yZE1vZGFsLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAnZmFsc2UnKTtcclxuXHJcbiAgICAgICAgLy8gXHU1M0VBXHU2NzA5XHU1NzI4XHU5NzVFXHU1RjNBXHU1MjM2XHU4QkJFXHU3RjZFXHU1QkM2XHU3ODAxXHU2QTIxXHU1RjBGXHU0RTBCXHU2MjREXHU4MDVBXHU3MTI2XHU4RjkzXHU1MTY1XHU2ODQ2XHJcbiAgICAgICAgaWYgKCFpc1Bhc3N3b3JkUmVxdWlyZWQoKSkge1xyXG4gICAgICAgICAgICAvLyBcdTc4NkVcdTRGRERcdThGOTNcdTUxNjVcdTY4NDZcdTgzQjdcdTUzRDZcdTcxMjZcdTcwQjlcclxuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBwYXNzd29yZElucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Bhc3N3b3JkSW5wdXQnKTtcclxuICAgICAgICAgICAgICAgIGlmIChwYXNzd29yZElucHV0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcGFzc3dvcmRJbnB1dC5mb2N1cygpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LCAxMDApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIFx1OTY5MFx1ODVDRlx1NUJDNlx1NzgwMVx1OUE4Q1x1OEJDMVx1NUYzOVx1N0E5N1xyXG4gKi9cclxuZnVuY3Rpb24gaGlkZVBhc3N3b3JkTW9kYWwoKSB7XHJcbiAgICBjb25zdCBwYXNzd29yZE1vZGFsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Bhc3N3b3JkTW9kYWwnKTtcclxuICAgIGlmIChwYXNzd29yZE1vZGFsKSB7XHJcbiAgICAgICAgLy8gXHU5NjkwXHU4NUNGXHU1QkM2XHU3ODAxXHU5NTE5XHU4QkVGXHU2M0QwXHU3OTNBXHJcbiAgICAgICAgaGlkZVBhc3N3b3JkRXJyb3IoKTtcclxuXHJcbiAgICAgICAgLy8gXHU2RTA1XHU3QTdBXHU1QkM2XHU3ODAxXHU4RjkzXHU1MTY1XHU2ODQ2XHJcbiAgICAgICAgY29uc3QgcGFzc3dvcmRJbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYXNzd29yZElucHV0Jyk7XHJcbiAgICAgICAgaWYgKHBhc3N3b3JkSW5wdXQpIHBhc3N3b3JkSW5wdXQudmFsdWUgPSAnJztcclxuXHJcbiAgICAgICAgLy8gaW5kZXguaHRtbCBcdTkxQ0NcdTUzRUZcdTgwRkRcdTYyOEEgY2xhc3MgXHU1MTY4XHU3OUZCXHU5NjY0XHU0RTg2XHVGRjA4cmVtb3ZlQXR0cmlidXRlKCdjbGFzcycpXHVGRjA5XHVGRjBDXHU2QjY0XHU1OTA0XHU1RjNBXHU1MjM2XHU1MTk5XHU1NkRFIGhpZGRlblxyXG4gICAgICAgIHBhc3N3b3JkTW9kYWwuc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuICAgICAgICBwYXNzd29yZE1vZGFsLnN0eWxlLnZpc2liaWxpdHkgPSAnaGlkZGVuJztcclxuICAgICAgICBwYXNzd29yZE1vZGFsLnNldEF0dHJpYnV0ZSgnY2xhc3MnLCAnaGlkZGVuJyk7XHJcbiAgICAgICAgcGFzc3dvcmRNb2RhbC5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKTtcclxuXHJcbiAgICAgICAgLy8gXHU1OTgyXHU2NzlDXHU1NDJGXHU3NTI4XHU4QzQ2XHU3NEUzXHU1MzNBXHU1N0RGXHU1MjE5XHU2NjNFXHU3OTNBXHU4QzQ2XHU3NEUzXHU1MzNBXHU1N0RGXHJcbiAgICAgICAgaWYgKGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdkb3ViYW5FbmFibGVkJykgPT09ICd0cnVlJykge1xyXG4gICAgICAgICAgICBjb25zdCBkb3ViYW5BcmVhID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2RvdWJhbkFyZWEnKTtcclxuICAgICAgICAgICAgaWYgKGRvdWJhbkFyZWEpIGRvdWJhbkFyZWEuY2xhc3NMaXN0LnJlbW92ZSgnaGlkZGVuJyk7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgaW5pdERvdWJhbiA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICAgICAgaW5pdERvdWJhbigpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG4vKipcclxuICogXHU2NjNFXHU3OTNBXHU1QkM2XHU3ODAxXHU5NTE5XHU4QkVGXHU0RkUxXHU2MDZGXHJcbiAqL1xyXG5mdW5jdGlvbiBzaG93UGFzc3dvcmRFcnJvcigpIHtcclxuICAgIGNvbnN0IGVycm9yRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYXNzd29yZEVycm9yJyk7XHJcbiAgICBpZiAoZXJyb3JFbGVtZW50KSB7XHJcbiAgICAgICAgZXJyb3JFbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoJ2hpZGRlbicpO1xyXG4gICAgICAgIC8vIGluZGV4Lmh0bWwgXHU5MUNDXHU3NTI4XHU3Njg0XHU2NjJGIGRpc3BsYXk6bm9uZVxyXG4gICAgICAgIGVycm9yRWxlbWVudC5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcclxuICAgIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIFx1OTY5MFx1ODVDRlx1NUJDNlx1NzgwMVx1OTUxOVx1OEJFRlx1NEZFMVx1NjA2RlxyXG4gKi9cclxuZnVuY3Rpb24gaGlkZVBhc3N3b3JkRXJyb3IoKSB7XHJcbiAgICBjb25zdCBlcnJvckVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGFzc3dvcmRFcnJvcicpO1xyXG4gICAgaWYgKGVycm9yRWxlbWVudCkge1xyXG4gICAgICAgIGVycm9yRWxlbWVudC5jbGFzc0xpc3QuYWRkKCdoaWRkZW4nKTtcclxuICAgICAgICAvLyBpbmRleC5odG1sIFx1OTFDQ1x1NzUyOFx1NzY4NFx1NjYyRiBkaXNwbGF5Om5vbmVcclxuICAgICAgICBlcnJvckVsZW1lbnQuc3R5bGUuZGlzcGxheSA9ICdub25lJztcclxuICAgIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIFx1NTkwNFx1NzQwNlx1NUJDNlx1NzgwMVx1NjNEMFx1NEVBNFx1NEU4Qlx1NEVGNlx1RkYwOFx1NUYwMlx1NkI2NVx1RkYwOVxyXG4gKi9cclxuYXN5bmMgZnVuY3Rpb24gaGFuZGxlUGFzc3dvcmRTdWJtaXQoZXZlbnQpIHtcclxuICAgIC8vIFx1NTE3Q1x1NUJCOVx1NTE4NVx1ODA1NCBvbnN1Ym1pdCBcdTU0OEMgYWRkRXZlbnRMaXN0ZW5lclxyXG4gICAgaWYgKGV2ZW50ICYmIHR5cGVvZiBldmVudC5wcmV2ZW50RGVmYXVsdCA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgcGFzc3dvcmRJbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwYXNzd29yZElucHV0Jyk7XHJcbiAgICBjb25zdCBwYXNzd29yZCA9IHBhc3N3b3JkSW5wdXQgPyBwYXNzd29yZElucHV0LnZhbHVlLnRyaW0oKSA6ICcnO1xyXG5cclxuICAgIC8vIFx1NjgyMVx1OUE4Q1x1NjIxMFx1NTI5Rlx1NjVGNlx1Nzg2RVx1NEZERFx1N0FDQlx1NTM3M1x1NTE3M1x1OTVFRFx1NUYzOVx1N0E5N1x1RkYwOFx1NTRFQVx1NjAxNVx1NEU4Qlx1NEVGNlx1NkQzRVx1NTNEMS9cdTU0MEVcdTdFRURcdTkwM0JcdThGOTFcdTU5MzFcdThEMjVcdUZGMDlcclxuICAgIGNvbnN0IG9rID0gYXdhaXQgdmVyaWZ5UGFzc3dvcmQocGFzc3dvcmQpO1xyXG4gICAgaWYgKG9rKSB7XHJcbiAgICAgICAgaGlkZVBhc3N3b3JkTW9kYWwoKTtcclxuXHJcbiAgICAgICAgLy8gXHU4OUU2XHU1M0QxXHU1QkM2XHU3ODAxXHU5QThDXHU4QkMxXHU2MjEwXHU1MjlGXHU0RThCXHU0RUY2XHVGRjA4XHU5MEU4XHU1MjA2XHU3NTM1XHU4OUM2XHU2RDRGXHU4OUM4XHU1NjY4XHU0RTBEXHU2NTJGXHU2MzAxIEN1c3RvbUV2ZW50XHVGRjA5XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3cuQ3VzdG9tRXZlbnQgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgICAgIGRvY3VtZW50LmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KCdwYXNzd29yZFZlcmlmaWVkJykpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZXZ0ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0V2ZW50Jyk7XHJcbiAgICAgICAgICAgICAgICBldnQuaW5pdEV2ZW50KCdwYXNzd29yZFZlcmlmaWVkJywgdHJ1ZSwgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5kaXNwYXRjaEV2ZW50KGV2dCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIC8vIFx1NUZGRFx1NzU2NVx1NEU4Qlx1NEVGNlx1NkQzRVx1NTNEMVx1NTkzMVx1OEQyNVx1RkYwQ1x1OTA3Rlx1NTE0RFx1NUY3MVx1NTRDRFx1NEUzQlx1NkQ0MVx1N0EwQlxyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ2Rpc3BhdGNoIHBhc3N3b3JkVmVyaWZpZWQgZXZlbnQgZmFpbGVkOicsIGUpO1xyXG4gICAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgc2hvd1Bhc3N3b3JkRXJyb3IoKTtcclxuICAgICAgICBpZiAocGFzc3dvcmRJbnB1dCkge1xyXG4gICAgICAgICAgICBwYXNzd29yZElucHV0LnZhbHVlID0gJyc7XHJcbiAgICAgICAgICAgIHBhc3N3b3JkSW5wdXQuZm9jdXMoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbi8vIFx1NjYzRVx1NUYwRlx1NjZCNFx1OTczMlx1NTIzMFx1NTE2OFx1NUM0MFx1RkYwQ1x1Nzg2RVx1NEZERFx1NTE4NVx1ODA1NCBvbnN1Ym1pdD1cImhhbmRsZVBhc3N3b3JkU3VibWl0KClcIiBcdTU3MjhcdTgwMDFcdTY1RTdcdTZENEZcdTg5QzhcdTU2NjhcdTUzRUZcdTc1Mjhcclxud2luZG93LmhhbmRsZVBhc3N3b3JkU3VibWl0ID0gaGFuZGxlUGFzc3dvcmRTdWJtaXQ7XHJcblxyXG4vKipcclxuICogXHU1MjFEXHU1OUNCXHU1MzE2XHU1QkM2XHU3ODAxXHU5QThDXHU4QkMxXHU3Q0ZCXHU3RURGXHJcbiAqL1xyXG5mdW5jdGlvbiBpbml0UGFzc3dvcmRQcm90ZWN0aW9uKCkge1xyXG4gICAgLy8gXHU1OTgyXHU2NzlDXHU4QkJFXHU3RjZFXHU0RTg2XHU1QkM2XHU3ODAxXHU0RjQ2XHU3NTI4XHU2MjM3XHU1REYyXHU5QThDXHU4QkMxXHVGRjBDXHU3ODZFXHU0RkREXHU1RjM5XHU3QTk3XHU4OEFCXHU1MTczXHU5NUVEXHVGRjA4XHU1MTdDXHU1QkI5XHU1MTg1XHU4MDU0XHU4MTFBXHU2NzJDXHU1REYyXHU2NjNFXHU3OTNBXHU3Njg0XHU2MEM1XHU1MUI1XHVGRjA5XHJcbiAgICBpZiAoaXNQYXNzd29yZFByb3RlY3RlZCgpICYmIGlzUGFzc3dvcmRWZXJpZmllZCgpKSB7XHJcbiAgICAgICAgaGlkZVBhc3N3b3JkTW9kYWwoKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICAvLyBcdTU5ODJcdTY3OUNcdTk3MDBcdTg5ODFcdTVGM0FcdTUyMzZcdThCQkVcdTdGNkVcdTVCQzZcdTc4MDFcdUZGMENcdTY2M0VcdTc5M0FcdThCNjZcdTU0NEFcdTVGMzlcdTdBOTdcclxuICAgIGlmIChpc1Bhc3N3b3JkUmVxdWlyZWQoKSkge1xyXG4gICAgICAgIHNob3dQYXNzd29yZE1vZGFsKCk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgLy8gXHU1OTgyXHU2NzlDXHU4QkJFXHU3RjZFXHU0RTg2XHU1QkM2XHU3ODAxXHU0RjQ2XHU3NTI4XHU2MjM3XHU2NzJBXHU5QThDXHU4QkMxXHVGRjBDXHU2NjNFXHU3OTNBXHU1QkM2XHU3ODAxXHU4RjkzXHU1MTY1XHU2ODQ2XHJcbiAgICBpZiAoaXNQYXNzd29yZFByb3RlY3RlZCgpICYmICFpc1Bhc3N3b3JkVmVyaWZpZWQoKSkge1xyXG4gICAgICAgIHNob3dQYXNzd29yZE1vZGFsKCk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG59XHJcblxyXG4vLyBcdTU3MjhcdTk4NzVcdTk3NjJcdTUyQTBcdThGN0RcdTVCOENcdTYyMTBcdTU0MEVcdTUyMURcdTU5Q0JcdTUzMTZcdTVCQzZcdTc4MDFcdTRGRERcdTYyQTRcclxuLy8gXHU1NDBDXHU2NUY2XHU3RUQxXHU1QjlBXHU4ODY4XHU1MzU1IHN1Ym1pdCBcdTRFOEJcdTRFRjZcdUZGMENcdTkwN0ZcdTUxNERcdTkwRThcdTUyMDZcdTc1MzVcdTg5QzZcdTdBRUZcdTVCRjlcdTUxODVcdTgwNTRcdTRFOEJcdTRFRjYvXHU1RjAyXHU2QjY1XHU1OTA0XHU3NDA2XHU1MTdDXHU1QkI5XHU2MDI3XHU5NUVFXHU5ODk4XHJcbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICBjb25zdCBmb3JtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Bhc3N3b3JkRm9ybScpO1xyXG4gICAgaWYgKGZvcm0gJiYgIWZvcm0uX19wYXNzd29yZEJvdW5kKSB7XHJcbiAgICAgICAgZm9ybS5hZGRFdmVudExpc3RlbmVyKCdzdWJtaXQnLCBoYW5kbGVQYXNzd29yZFN1Ym1pdCk7XHJcbiAgICAgICAgZm9ybS5fX3Bhc3N3b3JkQm91bmQgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIGluaXRQYXNzd29yZFByb3RlY3Rpb24oKTtcclxufSk7IiwgIi8vIFx1ODNCN1x1NTNENlx1NUY1M1x1NTI0RFVSTFx1NzY4NFx1NTNDMlx1NjU3MFx1RkYwQ1x1NUU3Nlx1NUMwNlx1NUI4M1x1NEVFQ1x1NEYyMFx1OTAxMlx1N0VEOXBsYXllci5odG1sXHJcbndpbmRvdy5vbmxvYWQgPSBmdW5jdGlvbigpIHtcclxuICAgIC8vIFx1ODNCN1x1NTNENlx1NUY1M1x1NTI0RFVSTFx1NzY4NFx1NjdFNVx1OEJFMlx1NTNDMlx1NjU3MFxyXG4gICAgY29uc3QgY3VycmVudFBhcmFtcyA9IG5ldyBVUkxTZWFyY2hQYXJhbXMod2luZG93LmxvY2F0aW9uLnNlYXJjaCk7XHJcbiAgICBcclxuICAgIC8vIFx1NTIxQlx1NUVGQXBsYXllci5odG1sXHU3Njg0VVJMXHU1QkY5XHU4QzYxXHJcbiAgICBjb25zdCBwbGF5ZXJVcmxPYmogPSBuZXcgVVJMKFwicGxheWVyLmh0bWxcIiwgd2luZG93LmxvY2F0aW9uLm9yaWdpbik7XHJcbiAgICBcclxuICAgIC8vIFx1NjZGNFx1NjVCMFx1NzJCNlx1NjAwMVx1NjU4N1x1NjcyQ1xyXG4gICAgY29uc3Qgc3RhdHVzRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZWRpcmVjdC1zdGF0dXMnKTtcclxuICAgIGNvbnN0IG1hbnVhbFJlZGlyZWN0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21hbnVhbC1yZWRpcmVjdCcpO1xyXG4gICAgbGV0IHN0YXR1c01lc3NhZ2VzID0gW1xyXG4gICAgICAgIFwiXHU1MUM2XHU1OTA3XHU4OUM2XHU5ODkxXHU2NTcwXHU2MzZFXHU0RTJELi4uXCIsXHJcbiAgICAgICAgXCJcdTZCNjNcdTU3MjhcdTUyQTBcdThGN0RcdTg5QzZcdTk4OTFcdTRGRTFcdTYwNkYuLi5cIixcclxuICAgICAgICBcIlx1NTM3M1x1NUMwNlx1NUYwMFx1NTlDQlx1NjRBRFx1NjUzRS4uLlwiLFxyXG4gICAgXTtcclxuICAgIGxldCBjdXJyZW50U3RhdHVzID0gMDtcclxuICAgIFxyXG4gICAgLy8gXHU3MkI2XHU2MDAxXHU2NTg3XHU2NzJDXHU1MkE4XHU3NTNCXHJcbiAgICBsZXQgc3RhdHVzSW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XHJcbiAgICAgICAgaWYgKGN1cnJlbnRTdGF0dXMgPj0gc3RhdHVzTWVzc2FnZXMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGN1cnJlbnRTdGF0dXMgPSAwO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoc3RhdHVzRWxlbWVudCkge1xyXG4gICAgICAgICAgICBzdGF0dXNFbGVtZW50LnRleHRDb250ZW50ID0gc3RhdHVzTWVzc2FnZXNbY3VycmVudFN0YXR1c107XHJcbiAgICAgICAgICAgIHN0YXR1c0VsZW1lbnQuc3R5bGUub3BhY2l0eSA9IDAuNztcclxuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc3RhdHVzRWxlbWVudCkgc3RhdHVzRWxlbWVudC5zdHlsZS5vcGFjaXR5ID0gMTtcclxuICAgICAgICAgICAgfSwgMzAwKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY3VycmVudFN0YXR1cysrO1xyXG4gICAgfSwgMTAwMCk7XHJcbiAgICBcclxuICAgIC8vIFx1Nzg2RVx1NEZERFx1NEZERFx1NzU1OVx1NjI0MFx1NjcwOVx1NTM5Rlx1NTlDQlx1NTNDMlx1NjU3MFxyXG4gICAgY3VycmVudFBhcmFtcy5mb3JFYWNoKCh2YWx1ZSwga2V5KSA9PiB7XHJcbiAgICAgICAgcGxheWVyVXJsT2JqLnNlYXJjaFBhcmFtcy5zZXQoa2V5LCB2YWx1ZSk7XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgLy8gXHU4M0I3XHU1M0Q2XHU2NzY1XHU2RTkwVVJMIChcdTU5ODJcdTY3OUNcdTVCNThcdTU3MjgpXHJcbiAgICBjb25zdCByZWZlcnJlciA9IGRvY3VtZW50LnJlZmVycmVyO1xyXG4gICAgXHJcbiAgICAvLyBcdTgzQjdcdTUzRDZcdTVGNTNcdTUyNERVUkxcdTRFMkRcdTc2ODRcdThGRDRcdTU2REVVUkxcdTUzQzJcdTY1NzBcdUZGMDhcdTU5ODJcdTY3OUNcdTY3MDlcdUZGMDlcclxuICAgIGNvbnN0IGJhY2tVcmwgPSBjdXJyZW50UGFyYW1zLmdldCgnYmFjaycpO1xyXG4gICAgXHJcbiAgICAvLyBcdTc4NkVcdTVCOUFcdThGRDRcdTU2REVVUkxcdTc2ODRcdTRGMThcdTUxNDhcdTdFQTdcdUZGMUExLiBcdTYzMDdcdTVCOUFcdTc2ODRiYWNrXHU1M0MyXHU2NTcwIDIuIHJlZmVycmVyIDMuIFx1NjQxQ1x1N0QyMlx1OTg3NVx1OTc2MlxyXG4gICAgbGV0IHJldHVyblVybCA9ICcnO1xyXG4gICAgaWYgKGJhY2tVcmwpIHtcclxuICAgICAgICAvLyBcdTY3MDlcdTY2M0VcdTVGMEZcdTYzMDdcdTVCOUFcdTc2ODRcdThGRDRcdTU2REVVUkxcclxuICAgICAgICByZXR1cm5VcmwgPSBkZWNvZGVVUklDb21wb25lbnQoYmFja1VybCk7XHJcbiAgICB9IGVsc2UgaWYgKHJlZmVycmVyICYmIChyZWZlcnJlci5pbmNsdWRlcygnL3M9JykgfHwgcmVmZXJyZXIuaW5jbHVkZXMoJz9zPScpKSkge1xyXG4gICAgICAgIC8vIFx1Njc2NVx1NkU5MFx1NjYyRlx1NjQxQ1x1N0QyMlx1OTg3NVx1OTc2MlxyXG4gICAgICAgIHJldHVyblVybCA9IHJlZmVycmVyO1xyXG4gICAgfSBlbHNlIGlmIChyZWZlcnJlciAmJiByZWZlcnJlci50cmltKCkgIT09ICcnKSB7XHJcbiAgICAgICAgLy8gXHU1OTgyXHU2NzlDXHU2NzA5cmVmZXJyZXJcdTRGNDZcdTRFMERcdTY2MkZcdTY0MUNcdTdEMjJcdTk4NzVcdUZGMENcdTRFNUZcdTRGN0ZcdTc1MjhcdTVCODNcclxuICAgICAgICByZXR1cm5VcmwgPSByZWZlcnJlcjtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gXHU5RUQ4XHU4QkE0XHU1NkRFXHU1MjMwXHU5OTk2XHU5ODc1XHJcbiAgICAgICAgcmV0dXJuVXJsID0gJy8nO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBcdTVDMDZcdThGRDRcdTU2REVVUkxcdTZERkJcdTUyQTBcdTUyMzBwbGF5ZXIuaHRtbFx1NzY4NFx1NTNDMlx1NjU3MFx1NEUyRFxyXG4gICAgaWYgKCFwbGF5ZXJVcmxPYmouc2VhcmNoUGFyYW1zLmhhcygncmV0dXJuVXJsJykpIHtcclxuICAgICAgICBwbGF5ZXJVcmxPYmouc2VhcmNoUGFyYW1zLnNldCgncmV0dXJuVXJsJywgZW5jb2RlVVJJQ29tcG9uZW50KHJldHVyblVybCkpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBcdTU0MENcdTY1RjZcdTRGRERcdTVCNThcdTU3Mjhsb2NhbFN0b3JhZ2VcdTRFMkRcdUZGMENcdTRGNUNcdTRFM0FcdTU5MDdcdTc1MjhcclxuICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdsYXN0UGFnZVVybCcsIHJldHVyblVybCk7XHJcbiAgICBcclxuICAgIC8vIFx1NjgwN1x1OEJCMFx1Njc2NVx1ODFFQVx1NjQxQ1x1N0QyMlx1OTg3NVx1OTc2MlxyXG4gICAgaWYgKHJldHVyblVybC5pbmNsdWRlcygnL3M9JykgfHwgcmV0dXJuVXJsLmluY2x1ZGVzKCc/cz0nKSkge1xyXG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdjYW1lRnJvbVNlYXJjaCcsICd0cnVlJyk7XHJcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ3NlYXJjaFBhZ2VVcmwnLCByZXR1cm5VcmwpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvLyBcdTgzQjdcdTUzRDZcdTY3MDBcdTdFQzhcdTc2ODRVUkxcdTVCNTdcdTdCMjZcdTRFMzJcclxuICAgIGNvbnN0IGZpbmFsUGxheWVyVXJsID0gcGxheWVyVXJsT2JqLnRvU3RyaW5nKCk7XHJcbiAgICBcclxuICAgIC8vIFx1NjZGNFx1NjVCMFx1NjI0Qlx1NTJBOFx1OTFDRFx1NUI5QVx1NTQxMVx1OTRGRVx1NjNBNVxyXG4gICAgaWYgKG1hbnVhbFJlZGlyZWN0KSB7XHJcbiAgICAgICAgbWFudWFsUmVkaXJlY3QuaHJlZiA9IGZpbmFsUGxheWVyVXJsO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFx1NjZGNFx1NjVCMG1ldGEgcmVmcmVzaFx1NjgwN1x1N0I3RVxyXG4gICAgY29uc3QgbWV0YVJlZnJlc2ggPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdtZXRhW2h0dHAtZXF1aXY9XCJyZWZyZXNoXCJdJyk7XHJcbiAgICBpZiAobWV0YVJlZnJlc2gpIHtcclxuICAgICAgICBtZXRhUmVmcmVzaC5jb250ZW50ID0gYDM7IHVybD0ke2ZpbmFsUGxheWVyVXJsfWA7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIFx1OTFDRFx1NUI5QVx1NTQxMVx1NTIzMFx1NjRBRFx1NjUzRVx1NTY2OFx1OTg3NVx1OTc2MlxyXG4gICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgY2xlYXJJbnRlcnZhbChzdGF0dXNJbnRlcnZhbCk7XHJcbiAgICAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSBmaW5hbFBsYXllclVybDtcclxuICAgIH0sIDI4MDApOyAvLyBcdTdBMERcdTVGQUVcdTY1RTlcdTRFOEVtZXRhIHJlZnJlc2hcdTc2ODRcdTY1RjZcdTk1RjRcdUZGMENcdTc4NkVcdTRGRERcdTYyMTFcdTRFRUNcdTc2ODRKU1x1NjNBN1x1NTIzNlx1OTFDRFx1NUI5QVx1NTQxMVxyXG59OyJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFRQSxNQUFNQSxtQkFBa0I7QUFBQSxJQUNwQixpQkFBaUI7QUFBQTtBQUFBLElBQ2pCLGlCQUFpQixLQUFLLEtBQUssS0FBSyxLQUFLO0FBQUE7QUFBQSxFQUN6QztBQVlBLE1BQU0sWUFBWTtBQUFBLElBQ2QsWUFBWTtBQUFBLE1BQ1IsS0FBSztBQUFBLE1BQ0wsTUFBTTtBQUFBLE1BQ04sT0FBTztBQUFBLElBQ1g7QUFBQTtBQUFBLEVBRUo7QUFHQSxXQUFTLGVBQWUsVUFBVTtBQUM5QixXQUFPLE9BQU8sV0FBVyxRQUFRO0FBQUEsRUFDckM7QUFHQSxTQUFPLFlBQVk7QUFDbkIsU0FBTyxpQkFBaUI7OztBQ2pDeEIsTUFBSSxxQkFBcUI7QUFLekIsaUJBQWUsa0JBQWtCO0FBQzdCLFFBQUksb0JBQW9CO0FBQ3BCLGFBQU87QUFBQSxJQUNYO0FBR0EsVUFBTSxhQUFh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QVMsQ0FBQztBQUFBLElBQzVFO0FBR0EsaUJBQWEsUUFBUSxlQUFlLFNBQVM7QUFHN0MsUUFBSSxVQUFVLFNBQVMsS0FBSyxLQUFLLFVBQVUsU0FBUyxLQUFLLEdBQUc7QUFDeEQsbUJBQWEsUUFBUSxrQkFBa0IsTUFBTTtBQUM3QyxtQkFBYSxRQUFRLGlCQUFpQixTQUFTO0FBQUEsSUFDbkQ7QUFHQSxVQUFNLGlCQUFpQixhQUFhLFNBQVM7QUFHN0MsUUFBSSxnQkFBZ0I7QUFDaEIscUJBQWUsT0FBTztBQUFBLElBQzFCO0FBR0EsVUFBTSxjQUFjLFNBQVMsY0FBYyw0QkFBNEI7QUFDdkUsUUFBSSxhQUFhO0FBQ2Isa0JBQVksVUFBVSxVQUFVLGNBQWM7QUFBQSxJQUNsRDtBQUdBLGVBQVcsTUFBTTtBQUNiLG9CQUFjLGNBQWM7QUFDNUIsYUFBTyxTQUFTLE9BQU87QUFBQSxJQUMzQixHQUFHLElBQUk7QUFBQSxFQUNYOyIsCiAgIm5hbWVzIjogWyJQQVNTV09SRF9DT05GSUciLCAic2hhMjU2Il0KfQo=
