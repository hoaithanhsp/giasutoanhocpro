# Hướng dẫn kết nối Google Sheets

## Bước 1: Tạo Google Sheet mới
1. Vào [Google Sheets](https://sheets.google.com)
2. Tạo một Spreadsheet mới
3. Đặt tên: **"Lịch sử làm bài - Gia Sư Toán Pro"**
4. Ở **Dòng 1** (header), nhập các cột:

| A | B | C | D | E | F | G | H | I | J | K | L |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Thời gian | Họ tên | Lớp | Cấp học | Lớp (số) | Chủ đề | Tổng câu | Câu đúng | Câu sai | Điểm (%) | Thời gian (giây) | Chi tiết |

## Bước 2: Thêm Google Apps Script
1. Trên thanh menu, vào **Extensions (Tiện ích mở rộng)** → **Apps Script**
2. **Xóa** toàn bộ nội dung mặc định
3. **Copy-paste** toàn bộ code bên dưới:

```javascript
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    
    if (data.action === 'submit') {
      return handleSubmit(data.data);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: 'Unknown action' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var action = e.parameter.action;
    
    if (action === 'history') {
      return handleHistory(e.parameter.name, e.parameter['class']);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, message: 'API is running' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function handleSubmit(result) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  sheet.appendRow([
    result.timestamp,
    result.studentName,
    result.studentClass,
    result.level,
    result.grade,
    result.topic,
    result.totalQuestions,
    result.correctCount,
    result.incorrectCount,
    result.scorePercent + '%',
    result.timeTakenSeconds,
    JSON.stringify(result.details)
  ]);
  
  return ContentService
    .createTextOutput(JSON.stringify({ success: true, message: 'Data saved!' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleHistory(name, className) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  var results = [];
  
  // Skip header row (index 0)
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    // Filter by name and class (columns B and C)
    if (row[1] === name && row[2] === className) {
      results.push({
        timestamp: row[0],
        studentName: row[1],
        studentClass: row[2],
        level: row[3],
        grade: row[4],
        topic: row[5],
        totalQuestions: row[6],
        correctCount: row[7],
        incorrectCount: row[8],
        scorePercent: row[9],
        timeTakenSeconds: row[10],
        details: row[11]
      });
    }
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({ success: true, data: results }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

4. Nhấn **Ctrl+S** để lưu
5. Đặt tên project: **"Gia Su Toan API"**

## Bước 3: Deploy Web App
1. Nhấn nút **Deploy (Triển khai)** → **New deployment (Triển khai mới)**
2. Nhấn ⚙️ bên cạnh **Select type** → chọn **Web app**
3. Cấu hình:
   - **Description**: Gia Sư Toán Pro API
   - **Execute as**: **Me** (tài khoản của bạn)
   - **Who has access**: **Anyone** (Bất kỳ ai)
4. Nhấn **Deploy**
5. Cho phép quyền truy cập khi được hỏi (Review Permissions → Advanced → Go to Gia Su Toan API)
6. **Copy URL** của Web App (dạng: `https://script.google.com/macros/s/.../exec`)

## Bước 4: Dán URL vào App
1. Mở app **Gia Sư Toán Pro**
2. Vào **Settings (API Key)** trên header
3. Dán URL vào ô **"Google Sheets URL"**
4. Nhấn **Lưu Cấu Hình**

## ✅ Xong!
Từ giờ, mỗi khi học sinh hoàn thành bài thi, kết quả sẽ **tự động** được ghi vào Google Sheets của bạn.

---

## Lưu ý
- Nếu bạn **chỉnh sửa code** Apps Script, cần **Deploy lại** (New deployment) và cập nhật URL mới
- Dữ liệu sẽ được ghi liên tục vào Sheet, bạn có thể dùng Filter/Sort để xem theo học sinh
- Có thể tạo thêm **Pivot Table** hoặc **Chart** trên Google Sheets để phân tích kết quả
