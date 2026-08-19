/* ==========================================================
   timetable-viewer.js
   汎用の「固定行・固定列」時刻表レンダラー。

   データ形式（JSON）:
   {
     "stops": ["石山駅", "松原", ...],                // 上から下の停留所の並び順
     "columns": [
       {
         "route": "4",                                // 系統番号
         "dest": "大石小学校",                         // 行先（乗り継ぎ表記含む）
         "note": "",                                   // 接続・乗り継ぎ等の補足（任意）
         "times": { "石山駅": "6:21", "松原": "6:22" } // stops名をキーにした時刻。
                                                        // 停車しない停留所はキー自体を省略してよい
       },
       ...
     ]
   }

   使い方:
     renderTimetable("tt-mount", data, { cornerLabel: "停留所 ＼ 発車便" });
   ========================================================== */
function renderTimetable(containerId, data, opts) {
  opts = opts || {};
  const mount = document.getElementById(containerId);
  if (!mount) return;

  const table = document.createElement("table");
  table.className = "tt-table";

  // ---- 見出し行（上端固定：系統番号・行先・時刻） ----
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");

  const corner = document.createElement("th");
  corner.className = "tt-corner";
  corner.textContent = opts.cornerLabel || "停留所 ＼ 発車便";
  headRow.appendChild(corner);

  data.columns.forEach((col) => {
    const th = document.createElement("th");
    th.innerHTML =
      '<span class="tt-route">' + escapeHtml(col.route || "") + "</span>" +
      '<span class="tt-dest">' + escapeHtml(col.dest || "") + "</span>" +
      (col.note ? '<span class="tt-dest">(' + escapeHtml(col.note) + ")</span>" : "");
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);

  // ---- 本体（左端固定：停留所名 / 中身：各時刻） ----
  const tbody = document.createElement("tbody");
  data.stops.forEach((stop) => {
    const tr = document.createElement("tr");

    const rowTh = document.createElement("th");
    rowTh.scope = "row";
    rowTh.textContent = stop;
    tr.appendChild(rowTh);

    data.columns.forEach((col) => {
      const td = document.createElement("td");
      const v = col.times ? col.times[stop] : undefined;
      if (v) {
        td.textContent = v;
      } else {
        td.textContent = "—";
        td.className = "empty";
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  mount.innerHTML = "";
  mount.appendChild(table);
}

/* 文字サイズ変更ボタン（スマホでの見やすさ調整用）。
   .tt-wrap を含む祖先要素に CSS変数 --tt-font-size を設定して拡大縮小する。 */
function setupTimetableZoom(buttonWrapId, targetSelector) {
  const wrap = document.getElementById(buttonWrapId);
  if (!wrap) return;
  const sizes = [11, 12, 13, 14, 16, 18];
  let idx = 2; // 13px スタート
  function apply() {
    document.querySelectorAll(targetSelector).forEach((el) => {
      el.style.setProperty("--tt-font-size", sizes[idx] + "px");
    });
  }
  wrap.querySelectorAll("[data-zoom]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.zoom === "in" && idx < sizes.length - 1) idx++;
      if (btn.dataset.zoom === "out" && idx > 0) idx--;
      apply();
    });
  });
  apply();
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
