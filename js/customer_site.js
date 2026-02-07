const CUSTOMER_SITES = {
    maotai: {
        api: 'https://caiji.maotaizy.cc/api.php/provide/vod/at/josn',
        name: '茅台资源',
    }
};

// 调用全局方法合并
if (window.extendAPISites) {
    window.extendAPISites(CUSTOMER_SITES);
} else {
    console.error("错误：请先加载 config.js！");
}
