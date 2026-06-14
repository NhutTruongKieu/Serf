import { Ionicons } from "@expo/vector-icons";

export type AppGuideThemeColor = "accent" | "success" | "iconTeal" | "iconMuted";

export type AppGuideIcon = {
  name: keyof typeof Ionicons.glyphMap;
  color?: AppGuideThemeColor;
};

export type AppGuideBullet = {
  icon?: keyof typeof Ionicons.glyphMap;
  color?: AppGuideThemeColor;
  text: string;
};

export type AppGuideStep = {
  id: string;
  icons: AppGuideIcon[];
  title: string;
  body: string;
  bullets?: AppGuideBullet[];
};

export const APP_GUIDE_STEPS: AppGuideStep[] = [
  {
    id: "welcome",
    icons: [
      { name: "shuffle", color: "iconTeal" },
      { name: "school", color: "iconTeal" },
      { name: "document-text-outline", color: "iconTeal" },
      { name: "settings-outline", color: "iconTeal" },
    ],
    title: "Chào mừng đến Serf!",
    body: "Serf giúp bạn học từ vựng tiếng Anh theo bộ chủ đề, ôn tập thông minh và luyện qua quiz. Bắt đầu từ hai chủ đề đầu tiên, sau đó mở khóa thêm khi hoàn thành từng phần.",
  },
  {
    id: "flashcard",
    icons: [
      { name: "book", color: "iconTeal" },
      { name: "chatbox-ellipses", color: "success" },
      { name: "volume-high", color: "success" },
    ],
    title: "Học với flashcard",
    bullets: [
      {
        icon: "book",
        color: "iconTeal",
        text: "Chạm vào thẻ để xem nghĩa tiếng Việt và ví dụ.",
      },
      {
        icon: "swap-horizontal-outline",
        color: "iconTeal",
        text: "Vuốt trái / phải hoặc chạm ← → để chuyển từ.",
      },
      {
        icon: "book",
        color: "iconTeal",
        text: "Chạm vào từ để nghe phát âm.",
      },
      {
        icon: "chatbox-ellipses",
        color: "success",
        text: "Icon sách (nghĩa) và hội thoại (ví dụ) trên thẻ để nghe thêm.",
      },
      {
        icon: "volume-high",
        color: "success",
        text: "Nút loa dưới thẻ bật/tắt phát âm tự động khi đổi từ.",
      },
      {
        text: "Số n/total góc phải — chạm để quay về từ đầu bộ.",
      },
    ],
    body: "",
  },
  {
    id: "sets",
    icons: [{ name: "filter", color: "accent" }],
    title: "Chọn bộ từ vựng",
    bullets: [
      {
        icon: "filter",
        color: "accent",
        text: "Nút lọc góc trên trái mở danh sách chủ đề và bộ (mỗi bộ ~20 từ).",
      },
      {
        icon: "checkmark-circle-outline",
        color: "success",
        text: "Theo dõi tiến độ learned/total trên từng bộ.",
      },
      {
        icon: "lock-closed",
        color: "iconMuted",
        text: "Chủ đề khoá hiển thị icon khoá — học hết chủ đề trước để mở khóa.",
      },
      {
        text: "Vuốt lên / xuống trên thẻ để chuyển sang bộ hoặc chủ đề kế tiếp.",
      },
    ],
    body: "",
  },
  {
    id: "progress",
    icons: [
      { name: "ribbon", color: "accent" },
      { name: "checkmark-circle-outline", color: "success" },
    ],
    title: "Đánh dấu tiến độ",
    bullets: [
      {
        icon: "checkmark-circle-outline",
        color: "success",
        text: "Dưới ảnh: đã thuộc trong bộ — từ sẽ không lặp lại cho đến khi học lại bộ.",
      },
      {
        icon: "ribbon",
        color: "accent",
        text: "Trên ảnh: thuộc hoàn toàn — loại khỏi bộ trộn và quiz.",
      },
      {
        icon: "reload-circle",
        color: "accent",
        text: "Học hết bộ sẽ hiện \"Tuyệt vời!\" — chạm icon reload để học lại từ đầu.",
      },
    ],
    body: "",
  },
  {
    id: "tools",
    icons: [
      { name: "shuffle", color: "iconTeal" },
      { name: "school", color: "iconTeal" },
      { name: "document-text-outline", color: "iconTeal" },
    ],
    title: "Ôn tập & luyện thêm",
    bullets: [
      {
        icon: "shuffle",
        color: "iconTeal",
        text: "Trộn: luyện ngẫu nhiên theo bộ, chủ đề hoặc toàn bộ đã mở khóa.",
      },
      {
        icon: "school",
        color: "iconTeal",
        text: "Quiz SRS: trắc nghiệm các từ đến hạn ôn theo lịch lặp lại ngắt quãng.",
      },
      {
        icon: "document-text-outline",
        color: "iconTeal",
        text: "Đoạn văn: dán văn bản tiếng Anh, app tìm từ trong kho và bốc 10 từ để học.",
      },
    ],
    body: "",
  },
  {
    id: "settings",
    icons: [{ name: "settings-outline", color: "iconTeal" }],
    title: "Cài đặt & sao lưu",
    bullets: [
      {
        icon: "moon-outline",
        color: "iconTeal",
        text: "Chọn chế độ màu Tối / Sáng cho toàn app.",
      },
      {
        icon: "swap-horizontal-outline",
        color: "iconTeal",
        text: "Tùy chỉnh vị trí icon nghĩa & ví dụ trên thẻ (Trái / Giữa / Phải).",
      },
      {
        icon: "share-outline",
        color: "iconTeal",
        text: "Xuất / nhập file JSON hoặc sao lưu Google Drive để giữ tiến độ.",
      },
      {
        icon: "albums-outline",
        color: "success",
        text: "Import deck Anki (.apkg) để thêm bộ từ riêng.",
      },
      {
        icon: "book-outline",
        color: "iconTeal",
        text: "Xem lại hướng dẫn này bất cứ lúc nào trong Cài đặt.",
      },
    ],
    body: "",
  },
];

export function resolveGuideIconColor(
  colorKey: AppGuideThemeColor | undefined,
  theme: {
    accent: string;
    success: string;
    iconTeal: string;
    iconMuted: string;
  }
): string {
  switch (colorKey) {
    case "accent":
      return theme.accent;
    case "success":
      return theme.success;
    case "iconMuted":
      return theme.iconMuted;
    case "iconTeal":
    default:
      return theme.iconTeal;
  }
}
