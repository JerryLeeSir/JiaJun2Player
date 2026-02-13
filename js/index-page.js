// 页面加载后显示弹窗脚本（先访问验证，再使用声明）
function showDisclaimerIfNeeded() {
    const hasSeenDisclaimer = localStorage.getItem('hasSeenDisclaimer');
    if (hasSeenDisclaimer) return;
    const disclaimerModal = document.getElementById('disclaimerModal');
    if (!disclaimerModal) return;
    disclaimerModal.style.display = 'flex';
    disclaimerModal.style.visibility = 'visible';
    // 确保只绑定一次
    const btn = document.getElementById('acceptDisclaimerBtn');
    if (btn && !btn._disclaimerBound) {
        btn._disclaimerBound = true;
        btn.addEventListener('click', function() {
            localStorage.setItem('hasSeenDisclaimer', 'true');
            disclaimerModal.style.display = 'none';
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // 弹窗顺序：需要密码时先显示访问验证，通过后再显示使用声明。延迟一帧执行，确保 password.js 已初始化（电视端脚本顺序可能不同）
    function runModalOrder() {
        var needPassword = window.isPasswordProtected && typeof window.isPasswordProtected === 'function' &&
            window.isPasswordVerified && typeof window.isPasswordVerified === 'function' &&
            window.isPasswordProtected() && !window.isPasswordVerified();
        if (needPassword) {
            var disc = document.getElementById('disclaimerModal');
            if (disc) { disc.style.display = 'none'; disc.classList.add('hidden'); }
            document.addEventListener('passwordVerified', showDisclaimerIfNeeded, { once: true });
            if (typeof window.showPasswordModal === 'function') {
                window.showPasswordModal();
            }
        } else {
            showDisclaimerIfNeeded();
        }
    }
    if (window.showPasswordModal) {
        runModalOrder();
    } else {
        setTimeout(runModalOrder, 50);
    }

    // URL搜索参数处理脚本
    // 首先检查是否是播放URL格式 (/watch 开头的路径)
    if (window.location.pathname.startsWith('/watch')) {
        // 播放URL，不做额外处理，watch.html会处理重定向
        return;
    }
    
    // 检查页面路径中的搜索参数 (格式: /s=keyword)
    const path = window.location.pathname;
    const searchPrefix = '/s=';
    
    if (path.startsWith(searchPrefix)) {
        // 提取搜索关键词
        const keyword = decodeURIComponent(path.substring(searchPrefix.length));
        if (keyword) {
            // 设置搜索框的值
            document.getElementById('searchInput').value = keyword;
            // 显示清空按钮
            toggleClearButton();
            // 执行搜索
            setTimeout(() => {
                // 使用setTimeout确保其他DOM加载和初始化完成
                search();
                // 更新浏览器历史，不改变URL (保持搜索参数在地址栏)
                try {
                    window.history.replaceState(
                        { search: keyword }, 
                        `搜索: ${keyword} - LibreTV`, 
                        window.location.href
                    );
                } catch (e) {
                    console.error('更新浏览器历史失败:', e);
                }
            }, 300);
        }
    }
    
    // 也检查查询字符串中的搜索参数 (格式: ?s=keyword)
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('s');
    
    if (searchQuery) {
        // 设置搜索框的值
        document.getElementById('searchInput').value = searchQuery;
        // 执行搜索
        setTimeout(() => {
            search();
            // 更新URL为规范格式
            try {
                window.history.replaceState(
                    { search: searchQuery }, 
                    `搜索: ${searchQuery} - LibreTV`, 
                    `/s=${encodeURIComponent(searchQuery)}`
                );
            } catch (e) {
                console.error('更新浏览器历史失败:', e);
            }
        }, 300);
    }
});
