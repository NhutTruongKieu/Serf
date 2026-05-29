# Serf — Flashcard học từ vựng tiếng Anh

Ứng dụng học từ vựng tiếng Anh (mục tiêu trình độ B2 ~ 4000 từ) cho người Việt, viết bằng **React Native + Expo**. Hỗ trợ học theo bộ, ôn tập theo thuật toán SRS (Spaced Repetition), quiz trắc nghiệm, sao lưu lên Google Drive, chạy trên iOS / Android / iPad (tablet) / web.

---

## Tính năng

### 1. Học từ vựng (Home)

- **Flashcard** từng từ một với ảnh minh hoạ, từ, IPA, nghĩa, ví dụ.
- **Cử chỉ vuốt**:
  - Trái / Phải: chuyển từ kế tiếp / trước.
  - Lên / Xuống: chuyển sang bộ kế tiếp / trước (kể cả sang category khác).
- **Chạm để xem nghĩa** (tap ẩn / hiện nghĩa).
- **Đánh dấu đã thuộc** (icon ✓) — loại từ khỏi vòng lặp của bộ; hiển thị "Tuyệt vời!" khi học hết bộ, có nút khôi phục để học lại.
- **Counter** `n/total` ở góc phải, chạm để reset về từ đầu bộ.
- **Auto-phát âm** từ khi chuyển sang từ mới (có thể tắt qua nút loa hoặc setting Mute).
- **3 nút âm thanh** trên thẻ: Nghe từ (tap thẳng vào từ), Nghe nghĩa (📖), Nghe ví dụ (💬).
- **Modal chọn bộ**: hiển thị toàn bộ category + set, mỗi set có tiến độ `learned/total`. Category chưa unlock hiển thị icon khoá kèm hint.

### 2. Phân chia category & bộ

- Category được chia theo chủ đề. Thứ tự học:
  1. **Số & Đánh vần (CVC)** — số đếm 10–30, các số tròn chục, số to (1.000 → 1B), bộ phụ Phonics CVC (`cat, dog, …`).
  2. Cảm xúc & Tâm trạng
  3. Thiên nhiên & Phong cảnh
  4. Cơ thể & Sức khỏe
  5. Đồ dùng & Đồ vật
  6. Hành động thông thường
  7. Địa điểm & Hướng
  8. Khái niệm & Phẩm chất
  9. Từ vựng chung
  10. **Tất cả** — mở khoá khi học hết mọi loại.
- Mỗi category chia thành **bộ 20 từ**.
- **Sub-group** (`setGroup`): bộ phụ trong cùng category được chunk độc lập (vd CVC trong Numbers tạo set riêng, không trộn lẫn).
- **Unlock progressive**: 2 category đầu mở sẵn (Số & Đánh vần, Cảm xúc); từ category thứ 3 trở đi, mở khi học hết các category trước đó.

### 3. Hệ thống SRS (Spaced Repetition)

- 7 bước (0 → 6) với khoảng cách ôn tăng dần:
  - Step 0: vừa vào SRS
  - Step 1: **6 giờ**
  - Step 2: 1 ngày
  - Step 3: 2 ngày
  - Step 4: 3 ngày
  - Step 5: 7 ngày
  - Step 6: 1 tháng (ổn định)
- Trả lời **đúng** → tăng 1 bước, đặt lại thời điểm ôn theo bảng trên.
- Trả lời **sai** → giảm 1 bước, ôn lại ngay.
- Tự động migration: progress legacy `REVIEW_MASTERED_IDS` chuyển sang SRS step max (ôn sau 1 tháng).

### 4. Quiz trắc nghiệm (icon 🎓)

- Lấy danh sách **từ đã thuộc và đến hạn ôn** theo SRS.
- Mỗi câu: hiển thị ảnh/từ, người dùng chọn nghĩa đúng trong 4 lựa chọn (distractors được sinh thông minh từ cùng category).
- Cập nhật SRS step sau mỗi câu trả lời.
- Lưu lịch sử các session quiz vào AsyncStorage (`QUIZ_SESSIONS_V1`).

### 5. Bộ trộn / Shuffle (icon 🔀)

3 phạm vi (scope) trộn, nhớ lựa chọn qua các lần dùng:

- **Bộ**: trộn toàn bộ từ trong 1 bộ đang chọn.
- **Loại**: bốc ngẫu nhiên **20 từ** trong category đang chọn.
- **Tất cả**: bốc ngẫu nhiên **20 từ** trong **các category đã unlock**.

Nút "Trộn lại" sau khi đi hết queue:
- Scope `set`: trộn lại đúng các từ cũ với order mới.
- Scope `category` / `all`: bốc 20 từ **ngẫu nhiên mới**.

### 6. Học từ trong đoạn văn (icon 📄)

- Dán / gõ một đoạn văn tiếng Anh bất kỳ vào ô nhập (giới hạn 20.000 ký tự).
- App **quét toàn bộ kho từ vựng**, tìm những từ xuất hiện trong đoạn:
  - Tokenize đoạn văn, lenient stem các hậu tố phổ biến: `-s, -es, -ies, -ed, -ied, -ing` → bắt được dạng số nhiều / quá khứ / -ing.
  - Voc có nhiều dạng (vd `"sink; sank"`) được tách và thử khớp từng dạng.
- Bốc ngẫu nhiên **10 từ** từ danh sách trùng → hiển thị flashcard (ảnh, từ, IPA, nghĩa, phát âm word / meaning / example).
- Nút **"Bốc lại 10 từ"** sau khi học hết để random batch khác từ cùng đoạn văn.
- Nút **"Nhập đoạn khác"** ở header để quay lại ô nhập, giữ nguyên hoặc xoá đoạn cũ.

### 7. Tuỳ chỉnh vị trí icon Meaning & Example

- Setting cho phép đặt 2 icon Nghe Nghĩa / Nghe Ví dụ ở **trái / giữa / phải**.
- **Inline picker** ngay trên thẻ học: 2 vị trí inactive hiển thị icon radio-button-off — chạm để chuyển nhanh, không phải vào Cài đặt.
- **Double-tap** vào radio-button-off để **tắt inline picker** ngay (khi không muốn icon thừa hiện trên thẻ).
- Setting toggle để bật / tắt inline picker (lưu vào `SETTINGS_SOUND_ICONS_INLINE_PICKER`).

### 8. Cài đặt (Settings)

- **Tài khoản**: đăng nhập / đăng xuất Google.
- **Âm thanh**: bật / tắt phát âm tự động.
- **Giao diện**:
  - Chế độ màu: **Tối** (mặc định) / **Sáng** — toàn app.
- **Giao diện thẻ từ**:
  - Vị trí Meaning & Example (segmented Trái / Giữa / Phải).
  - Toggle "Chọn vị trí trên thẻ từ" (inline picker).
- **Tiến độ học**:
  - Đặt lại bộ đang học.
  - Đặt lại toàn bộ tiến độ.
- **Sao lưu dữ liệu**:
  - **Google Drive**: upload / download backup ẩn theo tài khoản Google (tự sao lưu 1 lần sau khi đăng nhập).
  - **Xuất** dữ liệu ra file JSON (qua hộp Share của hệ điều hành).
  - **Nhập** dữ liệu từ file JSON (Document Picker).
- **Ứng dụng**: hiển thị phiên bản & bundle id.

### 9. Sao lưu & khôi phục

- Backup chứa: tiến độ học từng bộ, SRS state, sessions quiz, cài đặt (mute, theme, vị trí icon…).
- File JSON có version (`BACKUP_VERSION = 3`), sanitize key trước khi import.
- Hỗ trợ Google Drive (folder ẩn theo app data scope).

### 10. Audio

- Mỗi từ có thể có 3 audio bundled (file MP3): `sound` (word), `meaningSound`, `exampleSound`.
- Bộ Số & CVC fallback dùng **device TTS** (`expo-speech`) — đọc tiếng Anh cho từ, tiếng Việt cho meaning.
- Tự dừng audio cũ khi user chuyển từ.

### 11. Theme

- Light / Dark theme (mặc định Dark), hệ màu tự build theo OS hoặc theo lựa chọn trong Settings.

### 12. Responsive (Phone + Tablet)

- Helper `lib/layout.ts` clamp bề rộng nội dung ở **600px** trên tablet, ảnh card max **420px**.
- Content tự căn giữa trên iPad / iPad Pro; phone hiển thị như cũ.
- iOS `supportsTablet: true` → app chạy native trên iPad (không scale-up từ iPhone).

### 13. Lưu trữ cục bộ (AsyncStorage keys)

| Key | Mô tả |
|---|---|
| `LEARNED_VOCS_{category}_SET_{i}` | Danh sách id từ còn lại trong set |
| `SRS_CARD_STATES_V1` | Trạng thái SRS (step + nextReviewAt) |
| `QUIZ_SESSIONS_V1` | Lịch sử các session quiz |
| `SETTINGS_MUTE` | Tắt auto-phát âm |
| `SETTINGS_SOUND_ICONS_ALIGN` | Vị trí icon (left/center/right) |
| `SETTINGS_SOUND_ICONS_INLINE_PICKER` | Bật/tắt inline picker |
| `SETTINGS_THEME_MODE` | dark / light |
| `REVIEW_SHUFFLE_SCOPE` | set / category / all |
| `CURRENT_CATEGORY`, `CURRENT_SET` | Vị trí học gần nhất |
| `AUTH_SESSION`, `GOOGLE_BACKUP_AT` | Phiên Google + thời điểm backup cuối |

Các migration tự chạy khi mở app:
- Token voc → id (`migrateAllProgressToIds`).
- Legacy mastered → SRS (`migrateReviewMasteredToSrs`).
- Phonics (CVC) cũ → setGroup CVC trong Numbers (`migrateMergeCvcIntoNumbers`).

---

## Stack công nghệ

- **Expo** SDK 54, **React Native** 0.81, **React** 19.
- **Expo Router** (file-based routing, typed routes).
- **expo-av / expo-audio** — phát file MP3.
- **expo-speech** — TTS thiết bị.
- **expo-auth-session** — OAuth Google.
- **expo-file-system / expo-document-picker / expo-sharing** — xuất / nhập backup.
- **expo-image** — ảnh tối ưu cache.
- **react-native-gesture-handler** — vuốt thẻ.
- **react-native-reanimated** — animation (worklets).
- **AsyncStorage** — lưu trữ cục bộ.
- **TypeScript** + ESLint (`eslint-config-expo`).

---

## Cài đặt & chạy

```bash
# 1. Cài dependencies
npm install

# 2. Copy file env mẫu rồi điền Google OAuth client ID nếu cần
cp .env.example .env

# 3. Chạy dev server
npm run start

# Hoặc build & chạy trực tiếp trên thiết bị
npm run android   # Android (cần Android SDK + emulator/device)
npm run ios       # iOS (cần Xcode, chỉ macOS)
npm run web       # Web (Expo web)
```

### Build APK release (Windows)

```bash
npm run build:apk
# → android/app/build/outputs/apk/release/app-release.apk
```

### Build qua EAS

`eas.json` đã có sẵn cấu hình development / preview / production. Chạy:

```bash
npx eas build --profile production --platform android
npx eas build --profile production --platform ios
```

---

## Cấu trúc thư mục

```
app/                 # Routes (expo-router)
  (tabs)/index.tsx   # Màn học chính (flashcard)
  (tabs)/settings.tsx
  review.tsx         # Bộ trộn / shuffle
  srs-quiz.tsx       # Quiz SRS
  passage.tsx        # Học từ trong đoạn văn
assets/
  vocs.ts            # ~4000 từ B2 (new_vocs, new_vocs2)
  vocs-learning-extra.ts  # Bộ Số + CVC sinh runtime
  data/              # Ảnh + mp3 cho từng từ
components/          # UI component dùng chung
constants/           # Theme + app constants
contexts/            # React Context (app-settings, auth)
hooks/               # Custom hooks (use-app-theme, …)
lib/                 # Business logic
  category-unlock.ts # Logic mở khoá theo tiến độ
  vocab-sets.ts      # Chunk vocab thành sets (theo setGroup)
  vocab-passage-match.ts  # Tokenize đoạn văn + match vocab
  vocab-storage.ts   # AsyncStorage + migrations
  vocab-srs.ts       # SRS engine
  vocab-quiz-mcq.ts  # Sinh distractors
  vocab-audio-playback.ts
  data-backup.ts     # Export/Import JSON
  google-drive-backup.ts
  layout.ts          # Responsive metrics (phone/tablet)
  storage-keys.ts    # Tất cả AsyncStorage keys
scripts/             # Script Node tiền-xử-lý data
  add-ipa-to-vocs.js
  generate.js
  …
styles/              # StyleSheet tách theo màn
```

---

## Quy ước phát triển

- **Vocabulary type** (`lib/vocab-types.ts`):
  ```ts
  { id, voc, pos, meaning, category, setGroup?, sound?, meaningSound?, exampleSound?, image?, ipa?, useDeviceTts?, ttsMeaningLang? }
  ```
- **id** vĩnh viễn — đừng đổi, vì progress + SRS lưu theo id.
- Thêm category mới: cập nhật `VOCAB_CATEGORY_ORDER` + `CATEGORY_LABELS_VI` trong `lib/category-unlock.ts`.
- Tách bộ phụ trong cùng category: gán `setGroup: "ten-phu"` cho các items đó.
- Thêm setting mới: bổ sung key vào `lib/storage-keys.ts`, expose state + setter trong `contexts/app-settings.tsx`, thêm vào danh sách `isBackupKey` của `lib/data-backup.ts` nếu cần đồng bộ.

---

## Tài liệu tham khảo

- [Expo documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction)
- [React Native](https://reactnative.dev/)
