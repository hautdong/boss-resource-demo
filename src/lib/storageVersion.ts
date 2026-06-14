// ── 首次启动初始化 ──
// 仅在没有任何数据时写默认值，不会清除用户已有数据
export function initStorage() {
  try {
    if (!localStorage.getItem("boss-storage-inited")) {
      localStorage.setItem("boss-storage-inited", "1")
    }
  } catch {}
}
