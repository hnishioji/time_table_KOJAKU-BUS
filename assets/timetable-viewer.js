/* ==========================================================
   timetable-viewer.js
   汎用の「固定行・固定列」時刻表レンダラー。

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

  const table = document.createElement("table");
  table.className = "tt-table";

  // ---- colgroup: 列幅の指定はここに一本化する（最も確実に効く方法）。
  //      th/tdに直接 width を書く方式は、position:sticky や
  //      white-space:nowrap との組み合わせでブラウザにより解釈がぶれることがあるため、
  //      table-layout:fixed と組み合わせて col 要素で固定する。
  const colgroup = document.createElement("colgroup");
  const stopCol = document.createElement("col");
  stopCol.className = "tt-col-stop";
  colgroup.appendChild(stopCol);
  data.columns.forEach(() => {
    const c = document.createElement("col");
    c.className = "tt-col-data";
    colgroup.appendChild(c);
  });
  table.appendChild(colgroup);

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
    rowTh.textContent = stop.name;
    tr.appendChild(rowTh);

    data.columns.forEach((col) => {
      const td = document.createElement("td");
      const v = col.times ? col.times[stop.id] : undefined;
      if (v === "｜") {
        // 停車せず通過（運行は継続）
        td.textContent = "｜";
        td.classList.add("through");
      } else if (v === "レ") {
        // 経路として通過（運行は継続）
        td.textContent = "レ";
        td.classList.add("through");
      } else if (v) {
        td.textContent = v;
      } else {
        // 本当の空欄（この区間は運行なし）
        td.textContent = "－";
        td.classList.add("empty");
      }

      // Excelの「上端太罫線＝始発／下端太罫線＝終着」を再現
      if (col._runStart === stop.id) td.classList.add("run-start");
      if (col._runEnd === stop.id) td.classList.add("run-end");

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
