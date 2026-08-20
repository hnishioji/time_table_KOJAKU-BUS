/* ==========================================================
   共通ナビゲーション描画
   各ページは <div id="site-nav"></div> を用意し、
   このスクリプトの前に以下のグローバル変数を設定しておく。

     window.PAGE_TYPE = 'timetable' | 'map' | 'top'
     window.PAGE_CAT  = 'heijitsu' | 'doyo' | 'nichisai'   (timetableのみ)
     window.PAGE_DIR  = 'kudari' | 'nobori'                (timetableのみ)

   ページ名の命名規則: {category}-{direction}.html
   例) heijitsu-kudari.html, doyo-nobori.html
   ========================================================== */
(function () {
  var CATEGORIES = [
    { id: "heijitsu", label: "平日" },
    { id: "doyo", label: "土曜日" },
    { id: "nichisai", label: "日祭日" }
  ];
  var DIRECTIONS = [
    { id: "kudari-table", label: "下り（石山駅発）" },
    { id: "nobori-table", label: "上り（石山駅着）" }
  ];

  function el(html) {
    var t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function buildNav() {
    var mount = document.getElementById("site-nav");
    if (!mount) return;

    var type = window.PAGE_TYPE || "top";
    var cat = window.PAGE_CAT;
    var dir = window.PAGE_DIR;

    var wrap = el('<div></div>');

    // 上段：サイトタイトル ＋ 路線図ボタン
    var top = el(
      '<div class="nav-top">' +
        '<a class="site-title" href="index.html">江若バス（大石小学校線）時刻表' +
          '<small>非公式まとめ / 江若交通株式会社</small>' +
        '</a>' +
        '<a class="btn-map' + (type === "map" ? " active" : "") + '" href="rosenzu.html">🗺️ 路線図</a>' +
      '</div>'
    );
    wrap.appendChild(top);

    if (type === "timetable" && cat && dir) {
      // 方向タブ（同じカテゴリのまま上り/下りを切替）
      var dirRow = el('<div class="nav-dir"></div>');
      DIRECTIONS.forEach(function (d) {
        var a = el(
          '<a class="tab' + (d.id === dir ? " active" : "") + '" href="' +
            cat + "-" + d.id + '.html">' + d.label + "</a>"
        );
        dirRow.appendChild(a);
      });
      wrap.appendChild(dirRow);

      // カテゴリタブ（同じ方向のまま平日/土曜日/日祭日を切替）
      var catRow = el('<div class="nav-cat"></div>');
      CATEGORIES.forEach(function (c) {
        var a = el(
          '<a class="tab' + (c.id === cat ? " active" : "") + '" href="' +
            c.id + "-" + dir + '.html">' + c.label + "</a>"
        );
        catRow.appendChild(a);
      });
      wrap.appendChild(catRow);
    }

    mount.innerHTML = wrap.innerHTML;
  }

  document.addEventListener("DOMContentLoaded", buildNav);
})();
