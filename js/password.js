// 密码保护功能

/**
 * 检查是否设置了密码保护
 * 通过读取页面上嵌入的环境变量来检查
 */
function isPasswordProtected() {
    // 只检查普通密码
    const pwd = window.__ENV__ && window.__ENV__.PASSWORD;
    
    // 检查普通密码是否有效
    return typeof pwd === 'string' && pwd.length === 64 && !/^0+$/.test(pwd);
}

/**
 * 检查是否强制要求设置密码
 * 如果没有设置有效的 PASSWORD，则认为需要强制设置密码
 * 为了安全考虑，所有部署都必须设置密码
 */
function isPasswordRequired() {
    return !isPasswordProtected();
}

/**
 * 强制密码保护检查 - 防止绕过
 * 在关键操作前都应该调用此函数
 */
function ensurePasswordProtection() {
    if (isPasswordRequired()) {
        showPasswordModal();
        throw new Error('Password protection is required');
    }
    if (isPasswordProtected() && !isPasswordVerified()) {
        showPasswordModal();
        throw new Error('Password verification required');
    }
    return true;
}

window.isPasswordProtected = isPasswordProtected;
window.isPasswordRequired = isPasswordRequired;

// 可选：打开电视端调试
const PASSWORD_DEBUG = false;
function pwdLog(...args) {
    if (PASSWORD_DEBUG && typeof console !== 'undefined' && console.log) {
        console.log('[password]', ...args);
    }
}

/**
 * 验证用户输入的密码是否正确（异步，使用SHA-256哈希）
 */
async function verifyPassword(password) {
    try {
        const correctHash = window.__ENV__?.PASSWORD;
        pwdLog('env password hash present:', !!correctHash, 'len:', correctHash ? correctHash.length : 0);
        if (!correctHash) return false;

        const inputHash = await sha256(password);
        pwdLog('input hash:', inputHash);
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
        console.error('验证密码时出错:', error);
        return false;
    }
}

// 验证状态检查
function isPasswordVerified() {
    try {
        if (!isPasswordProtected()) return true;

        const stored = localStorage.getItem(PASSWORD_CONFIG.localStorageKey);
        if (!stored) return false;

        const { timestamp, passwordHash } = JSON.parse(stored);
        const currentHash = window.__ENV__?.PASSWORD;

        return timestamp && passwordHash === currentHash &&
            Date.now() - timestamp < PASSWORD_CONFIG.verificationTTL;
    } catch (error) {
        console.error('检查密码验证状态时出错:', error);
        return false;
    }
}

// 更新全局导出
window.isPasswordProtected = isPasswordProtected;
window.isPasswordRequired = isPasswordRequired;
window.isPasswordVerified = isPasswordVerified;
window.verifyPassword = verifyPassword;
window.ensurePasswordProtection = ensurePasswordProtection;
window.showPasswordModal = showPasswordModal;
window.hidePasswordModal = hidePasswordModal;

// SHA-256实现：优先使用 libs/sha256.min.js（window._jsSha256），避免电视端 WebCrypto/TextEncoder 兼容性问题
async function sha256(message) {
    // 1) 优先走原始 js-sha256（同步实现，兼容性最好）
    if (typeof window._jsSha256 === 'function') {
        pwdLog('sha256 via window._jsSha256');
        return window._jsSha256(message);
    }

    // 2) 其次尝试 Web Crypto API
    if (window.crypto && crypto.subtle && crypto.subtle.digest) {
        // TextEncoder 在部分电视端可能不存在
        let msgBuffer;
        if (typeof TextEncoder !== 'undefined') {
            msgBuffer = new TextEncoder().encode(message);
        } else {
            // 简易 UTF-8 编码降级（覆盖常用 ASCII/中文场景）
            const utf8 = unescape(encodeURIComponent(message));
            const arr = new Uint8Array(utf8.length);
            for (let i = 0; i < utf8.length; i++) arr[i] = utf8.charCodeAt(i);
            msgBuffer = arr;
        }

        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        pwdLog('sha256 via crypto.subtle');
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    throw new Error('No SHA-256 implementation available.');
}

/**
 * 显示密码验证弹窗
 */
function showPasswordModal() {
    const passwordModal = document.getElementById('passwordModal');
    if (passwordModal) {
        // 防止出现豆瓣区域滚动条（部分页面可能没有该元素）
        const doubanArea = document.getElementById('doubanArea');
        if (doubanArea) doubanArea.classList.add('hidden');

        const cancelBtn = document.getElementById('passwordCancelBtn');
        if (cancelBtn) cancelBtn.classList.add('hidden');

        // 检查是否需要强制设置密码
        if (isPasswordRequired()) {
            // 修改弹窗内容提示用户需要先设置密码
            const title = passwordModal.querySelector('h2');
            const description = passwordModal.querySelector('p');
            if (title) title.textContent = '需要设置密码';
            if (description) description.textContent = '请先在部署平台设置 PASSWORD 环境变量来保护您的实例';
            
            // 隐藏密码输入框和提交按钮，只显示提示信息
            const form = passwordModal.querySelector('form');
            const errorMsg = document.getElementById('passwordError');
            if (form) form.style.display = 'none';
            if (errorMsg) {
                errorMsg.textContent = '为确保安全，必须设置 PASSWORD 环境变量才能使用本服务，请联系管理员进行配置';
                errorMsg.classList.remove('hidden');
                errorMsg.className = 'text-red-500 mt-2 font-medium'; // 改为更醒目的红色
            }
        } else {
            // 正常的密码验证模式
            const title = passwordModal.querySelector('h2');
            const description = passwordModal.querySelector('p');
            if (title) title.textContent = '访问验证';
            if (description) description.textContent = '请输入密码继续访问';
            
            const form = passwordModal.querySelector('form');
            if (form) form.style.display = 'block';
        }

        // 兼容 index.html 可能被内联脚本 removeAttribute('class') 的情况：始终以 style 为准
        passwordModal.style.display = 'flex';
        passwordModal.style.visibility = 'visible';
        passwordModal.classList.remove('hidden');
        passwordModal.setAttribute('aria-hidden', 'false');

        // 只有在非强制设置密码模式下才聚焦输入框
        if (!isPasswordRequired()) {
            // 确保输入框获取焦点
            setTimeout(() => {
                const passwordInput = document.getElementById('passwordInput');
                if (passwordInput) {
                    passwordInput.focus();
                }
            }, 100);
        }
    }
}

/**
 * 隐藏密码验证弹窗
 */
function hidePasswordModal() {
    const passwordModal = document.getElementById('passwordModal');
    if (passwordModal) {
        // 隐藏密码错误提示
        hidePasswordError();

        // 清空密码输入框
        const passwordInput = document.getElementById('passwordInput');
        if (passwordInput) passwordInput.value = '';

        // index.html 里可能把 class 全移除了（removeAttribute('class')），此处强制写回 hidden
        passwordModal.style.display = 'none';
        passwordModal.style.visibility = 'hidden';
        passwordModal.setAttribute('class', 'hidden');
        passwordModal.setAttribute('aria-hidden', 'true');

        // 如果启用豆瓣区域则显示豆瓣区域
        if (localStorage.getItem('doubanEnabled') === 'true') {
            const doubanArea = document.getElementById('doubanArea');
            if (doubanArea) doubanArea.classList.remove('hidden');
            if (typeof initDouban === 'function') {
                initDouban();
            }
        }
    }
}

/**
 * 显示密码错误信息
 */
function showPasswordError() {
    const errorElement = document.getElementById('passwordError');
    if (errorElement) {
        errorElement.classList.remove('hidden');
        // index.html 里用的是 display:none
        errorElement.style.display = 'block';
    }
}

/**
 * 隐藏密码错误信息
 */
function hidePasswordError() {
    const errorElement = document.getElementById('passwordError');
    if (errorElement) {
        errorElement.classList.add('hidden');
        // index.html 里用的是 display:none
        errorElement.style.display = 'none';
    }
}

/**
 * 处理密码提交事件（异步）
 */
async function handlePasswordSubmit(event) {
    // 兼容内联 onsubmit 和 addEventListener
    if (event && typeof event.preventDefault === 'function') {
        event.preventDefault();
    }

    const passwordInput = document.getElementById('passwordInput');
    const password = passwordInput ? passwordInput.value.trim() : '';

    // 校验成功时确保立即关闭弹窗（哪怕事件派发/后续逻辑失败）
    const ok = await verifyPassword(password);
    if (ok) {
        hidePasswordModal();

        // 触发密码验证成功事件（部分电视浏览器不支持 CustomEvent）
        try {
            if (typeof window.CustomEvent === 'function') {
                document.dispatchEvent(new CustomEvent('passwordVerified'));
            } else {
                const evt = document.createEvent('Event');
                evt.initEvent('passwordVerified', true, true);
                document.dispatchEvent(evt);
            }
        } catch (e) {
            // 忽略事件派发失败，避免影响主流程
            console.warn('dispatch passwordVerified event failed:', e);
        }
    } else {
        showPasswordError();
        if (passwordInput) {
            passwordInput.value = '';
            passwordInput.focus();
        }
    }
}

// 显式暴露到全局，确保内联 onsubmit="handlePasswordSubmit()" 在老旧浏览器可用
window.handlePasswordSubmit = handlePasswordSubmit;

/**
 * 初始化密码验证系统
 */
function initPasswordProtection() {
    // 如果设置了密码但用户已验证，确保弹窗被关闭（兼容内联脚本已显示的情况）
    if (isPasswordProtected() && isPasswordVerified()) {
        hidePasswordModal();
        return;
    }
    // 如果需要强制设置密码，显示警告弹窗
    if (isPasswordRequired()) {
        showPasswordModal();
        return;
    }
    // 如果设置了密码但用户未验证，显示密码输入框
    if (isPasswordProtected() && !isPasswordVerified()) {
        showPasswordModal();
        return;
    }
}

// 在页面加载完成后初始化密码保护
// 同时绑定表单 submit 事件，避免部分电视端对内联事件/异步处理兼容性问题
document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('passwordForm');
    if (form && !form.__passwordBound) {
        form.addEventListener('submit', handlePasswordSubmit);
        form.__passwordBound = true;
    }

    initPasswordProtection();
});