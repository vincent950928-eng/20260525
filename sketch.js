let rainData = [];
// 使用 corsproxy.io 作為代理，並對原始 URL 進行編碼以確保參數正確傳遞
const apiUrl = 'https://corsproxy.io/?' + encodeURIComponent('https://wic.gov.taipei/OpenData/API/Rain/Get?stationNo=&loginId=open_rain&dataKey=85452C1D');

let myMap;
let canvas;
// 宣告 mappa 變數
let mappa;

// 地圖設定：中心點設在台北市 (25.04, 121.55)，縮放等級 12
const options = {
  lat: 25.04,
  lng: 121.55,
  zoom: 12,
  style: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
}

function setup() {
  canvas = createCanvas(windowWidth, windowHeight);
  // 在 setup 中初始化 Mappa
  mappa = new Mappa('Leaflet');
  myMap = mappa.tileMap(options);
  myMap.overlay(canvas);

  fetchData();
  // 每 10 分鐘自動更新一次資料 (600,000 ms)
  setInterval(fetchData, 600000);
}

function fetchData() {
  loadJSON(apiUrl, gotData, handleError);
}

function gotData(data) {
  console.log("API 原始回傳資料:", data); // 輸出原始資料，方便檢查結構

  // 檢查資料是否直接是陣列
  if (Array.isArray(data)) {
    rainData = data;
  } else if (data && typeof data === 'object') {
    // 嘗試從常見的屬性中提取陣列
    if (Array.isArray(data.data)) { // 假設資料可能在 'data' 屬性下
      rainData = data.data;
    } else if (Array.isArray(data.RainData)) { // 假設資料可能在 'RainData' 屬性下 (常見於政府API)
      rainData = data.RainData;
    } else {
      console.warn("API 回傳資料是一個物件，但未在常見屬性 (如 'data', 'RainData') 中找到陣列。請檢查上方 'API 原始回傳資料' 的輸出，以確定正確的資料路徑。");
      rainData = []; // 確保 rainData 仍為陣列，避免後續錯誤
    }
  } else {
    console.error("API 回傳資料格式非預期 (既非陣列也非物件):", data);
    rainData = [];
  }
  console.log("處理後的雨量資料 (rainData):", rainData); // 輸出處理後的資料
}

function handleError(err) {
  console.error("API 串接失敗:", err);
}

function draw() {
  // 使用 clear() 而不是 background()，這樣地圖才不會被覆蓋
  clear();

  if (rainData.length === 0) {
    fill(0);
    textSize(20);
    text("資料載入中...", 20, 30);
  } else {
    for (let i = 0; i < rainData.length; i++) {
      let item = rainData[i];
      
      // 將經緯度轉換為畫布上的像素座標
      const pos = myMap.latLngToPixel(item.lat, item.lon);
      
      // 只有在畫面範圍內的點才繪製
      if (pos.x > 0 && pos.x < width && pos.y > 0 && pos.y < height) {
        // 繪製雨量圓點（顏色隨雨量變化，藍色深淺代表雨量）
        let rainVal = float(item.rain1hr);
        fill(0, 100, 255, 180);
        noStroke();
        let diameter = 10 + rainVal;
        ellipse(pos.x, pos.y, diameter, diameter);
        
        // 滑鼠互動檢測：如果滑鼠與圓心的距離小於半徑
        let d = dist(mouseX, mouseY, pos.x, pos.y);
        if (d < diameter / 2 + 5) { // 稍微增加感應範圍方便操作
          // 繪製簡單的提示框背景
          fill(255, 240);
          stroke(0, 100);
          rect(pos.x + 10, pos.y - 12, 140, 24, 5);
          
          fill(0);
          noStroke();
          textAlign(LEFT, CENTER);
          text(`${item.stationName}: ${rainVal} mm`, pos.x + 15, pos.y);
        }
      }
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
