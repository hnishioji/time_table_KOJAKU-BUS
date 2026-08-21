/* ==========================================================
   timetable-viewer.js  (CSS Grid版)
   汎用の「固定行・固定列」時刻表レンダラー。

   ★ 以前は <table> で組んでいましたが、table-layout:fixed が
     ブラウザによって「折り返せない内容（時刻文字列など）の最小幅」を
     優先してしまい、指定した列幅が効かないケースがあったため、
     table を使わず CSS Grid（div構造）に置き換えています。
     列幅の実体は assets/timetable-viewer.css の
     --tt-stop-w / --tt-data-w で決まる。

   データ形式（JSON）:
   {
     "stops": [                                        // 上から下の停留所の並び順
       { "id": "r6",  "name": "石山駅" },
       { "id": "r7",  "name": "松原" },
       ...
       { "id": "r45", "name": "大石小学校" },            // 同じ名前が複数回出現してもOK。
       { "id": "r90", "name": "大石小学校" },            // id（＝元Excelの行番号）で区別する。
       ...
     ],
     "columns": [
       {
         "route": "4",                                // 系統番号
         "dest": "大石小学校",                         // 行先（乗り継ぎ表記含む）
         "note": "",                                   // 接続・乗り継ぎ等の補足（任意）
         "times": { "r6": "6:21", "r7": "6:22" }       // stopの id をキーにした時刻。
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

  // 各列（＝各便）ごとに「値が入っている最初の停留所id」＝始発、
  // 「値が入っている最後の停留所id」＝終着 を先に求めておく。
  // 「｜」「レ」も"その区間は運行している"印なので始発・終着の判定には含める。
  data.columns.forEach((col) => {
    const activeIds = data.stops
      .map((s) => s.id)
      .filter((id) => col.times && col.times[id]);
    col._runStart = activeIds[0];
    col._runEnd = activeIds[activeIds.length - 1];
  });

  const nCols = data.columns.length;

  const grid = document.createElement("div");
  grid.className = "tt-grid";
  // 列数ぶんの grid-template-columns をここで組み立てる。
  // 幅の実際の値は CSS変数 --tt-stop-w / --tt-data-w（timetable-viewer.css側）で決まるので、
  // 数値を変えたいときは JS ではなく CSS を編集すればよい。
  grid.style.gridTemplateColumns =
    "var(--tt-stop-w) repeat(" + nCols + ", var(--tt-data-w))";

  function makeCell(classNames, innerHTML) {
    const div = document.createElement("div");
    div.className = "tt-cell " + classNames;
    if (innerHTML !== undefined) div.innerHTML = innerHTML;
    return div;
  }

  // ---- 見出し行（上端固定：系統番号・行先） ----
  grid.appendChild(
    makeCell("corner", escapeHtml(opts.cornerLabel || "停留所 ＼ 発車便"))
  );
  data.columns.forEach((col) => {
    const html =
      '<span class="tt-route">' + escapeHtml(col.route || "") + "</span>" +
      '<span class="tt-dest">' + escapeHtml(col.dest || "") + "</span>" +
      (col.note ? '<span class="tt-dest">(' + escapeHtml(col.note) + ")</span>" : "");
    grid.appendChild(makeCell("head", html));
  });

  // ---- 本体（左端固定：停留所名 / 中身：各時刻） ----
  data.stops.forEach((stop, rowIdx) => {
    const rowEven = rowIdx % 2 === 1 ? " row-even" : "";

    grid.appendChild(makeCell("stop" + rowEven, escapeHtml(stop.name)));

    data.columns.forEach((col) => {
      const v = col.times ? col.times[stop.id] : undefined;
      let extra = "";
      let text = "";

      if (v === "｜") {
        text = "｜";
        extra = " through";
      } else if (v === "レ") {
        text = "レ";
        extra = " through";
      } else if (v) {
        text = v;
      } else {
        text = "－";
        extra = " empty";
      }

      if (col._runStart === stop.id) extra += " run-start";
      if (col._runEnd === stop.id) extra += " run-end";

      grid.appendChild(makeCell("time" + rowEven + extra, escapeHtml(text)));
    });
  });

  mount.innerHTML = "";
  mount.appendChild(grid);
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
