import re
import os

file_path = r'e:\react-native\Serf\assets\vocs2.ts'

# Category patterns based on Vietnamese keywords
categories = [
    ("Feelings & Emotions", r'\b(lo|buồn|vui|sợ|giận|ghét|yêu|thích|muốn|ước|khát khao|cảm xúc|tâm trạng|tình cảm|hài lòng|vừa lòng|thỏa mãn|hăng hái|nhiệt tình|say mê|xấu hổ|hổ thẹn|ngượng|tự tin|tự hào|tin tưởng|nghi ngờ|hy vọng|thất vọng|bình tĩnh|lo lắng|mệt mỏi|kinh hãi|khiếp sợ|đe doạ|hăm dọa|gan dạ|can đảm|dũng cảm|định|ý định|ý muốn|tin|tin cậy|tín nhiệm|trông cậy|an ủi|đau khổ|đau đớn|hối hận|hưng phấn|kích thích|phấn chấn|rộn ràng|run lên)\b'),
    ("Nature & Landscape", r'\b(thiên nhiên|phong cảnh|trời|mây|mưa|nắng|gió|tuyết|bão|sấm|sét|trăng|sao|không khí|ánh sáng|tỏa sáng|chiếu sáng|cây|hoa|cỏ|lá|rừng|núi|đồi|biển|sông|hồ|suối|ngòi|cá|chim|thú|động vật|thực vật|côn trùng|sâu|giun|thông|lúa mì|giác quan|ngửi|nếm|nhìn|nghe|thấy|chân trời|vịnh|cao nguyên|hoang mạc|sa mạc|ốc đảo|hang động|bố|thác|đảo|bán đảo|đất|đá|sỏi|cát|bùn|phù sa|mỏ|sắt|đồng|vàng|bạc|kim loại|than đá|dầu mỏ|khí đốt|năng lượng|môi trường|sinh thái|bảo tồn|ô nhiễm)\b'),
    ("Human Body & Health", r'\b(người|nhân|dân|bác sĩ|y tá|bệnh|đau|ốm|khỏe|mạnh|cơ thể|thân thể|tay|chân|đầu|mắt|mũi|miệng|tai|tóc|răng|lưỡi|cổ|ngực|bụng|lưng|vai|khuỷu tay|đầu gối|gót chân|ngón|mạch|xung|hắt hơi|máu|xương|sọ|đầu lâu|phổi|tim|gan|thận|dạ dày|ruột|não|thần kinh|giác quan|thị giác|thính giác|khứu giác|vị giác|xúc giác|gia đình|cha|mẹ|bố|mẹ|ông|bà|anh|chị|em|vợ|chồng|con|cháu|họ hàng|ân nhân|bảo mẫu|điều dưỡng|người trông nom|thợ|nghệ sĩ|ca sĩ|diễn viên|giáo viên|sinh viên|học sinh|bạn|thù|địch|thủ lĩnh|lãnh tụ|trưởng|thị trưởng|thượng nghị sĩ|người cư trú|dân cư|loài người|nhân loại|thanh niên|thiếu niên|trẻ em|nhà trẻ|trường học|lớp học|công đồng|xã hội|văn hóa|lịch sử|ngôn ngữ|tiếng|nói|cười|khóc)\b'),
    ("Places & Directions", r'\b(hướng|phương|phía|địa điểm|nơi|chốn|vị trí|khoảng cách|xa|gần|trong|ngoài|trên|dưới|trước|sau|giữa|cạnh|bên|quận|huyện|tỉnh|thành phố|nông thôn|làng|xóm|phố|đường|ngõ|hẻm|lối đi|cổng|cửa|lối vào|lối thoát|quốc gia|nước|vùng|miền|lãnh thổ|biên giới|trạm|bến|sân bay|cảng|ga|chợ|siêu thị|công viên|vườn|rừng|biển|sông|hồ|núi|đồi|thung lũng|đồng bằng|sa mạc|ốc đảo|nghĩa trang|đền thờ|miếu|chùa|nhà thờ|thánh thất|thánh đường|lâu đài|cung điện|thị trấn|xã|phường|thượng|hạ|đông|tây|nam|bắc)\b'),
    ("Household & Objects", r'\b(gia đình|nhà|bếp|phòng|kho|cửa|cửa sổ|tường|mái|trần|sàn|cầu thang|thang|ống khói|tủ|bàn|ghế|giường|chăn|mền|gối|đệm|chiếu|rèm|màn|vải|len|lông|sợi|chỉ|kim|may|khâu|vá|thêu|dệt|thảm|tranh|ảnh|tượng|đèn|pin|nến|lửa|khói|than|củi|bếp|nồi|xoong|chảo|bát|đĩa|ly|cốc|thìa|muỗng|đũa|dao|kéo|rìu|cuốc|xẻng|công cụ|dụng cụ|thiết bị|máy|xe|tàu|thuyền|máy bay|đồ dùng|vật dụng|quần|áo|mũ|giày|dép|tất|găng|kính|đồng hồ|đồng xu|tiền|vàng|bạc|đá quý|châu báu|trang sức|vật kỷ niệm|quà|đồ chơi|búp bê|bóng|vợt|nhạc cụ|đàn|sáo|kèn|trống|chuông|còi|sách|vở|giấy|bút|mực|thước|tẩy|cặp|bao|túi|ví|hộp|thùng|giỏ|làn|chùm|bó|cụm|buồng|gia vị|thức ăn|uống|nước|rượu|bia|sữa|trà|cà phê|bánh|kẹo|trái cây|rau|thịt|cá|trứng|gạo|ngũ cốc|bột|đường|muối|mắm|dầu|mỡ|bơ|pho mát|mật ong|đồ tráng miệng|gia dụng)\b'),
    ("Common Actions", r'\b(chạy|nhảy|đi|đứng|nằm|ngồi|ăn|uống|ngủ|thức|dậy|hành động|cư xử|làm|thực hiện|xảy ra|xuất hiện|nảy sinh|bắt gặp|chạm trán|tìm|kiếm|thấy|mất|lấy|cầm|nắm|giữ|buông|thả|đưa|mang|đem|gửi|nhận|cho|biếu|tặng|mua|bán|trả|mượn|thuê|mướn|giúp|nhờ|hỏi|đáp|nói|kể|viết|đọc|xem|nhìn|nghe|ngửi|nếm|chạm|sờ|cảm thấy|suy nghĩ|tưởng tượng|nhớ|quên|biết|hiểu|học|dạy|sửa|chữa|xây|phá|đập|bẻ|cắt|xé|dán|bịt|đậy|mở|đóng|tắt|bật|quăng|ném|đá|đấm|tát|vỗ|ôm|hôn|quét|dọn|rửa|lau|chùi|tưới|thăm|chơi|đùa|hét|kêu|gào|khóc|cười|thở|hắt hơi|ho|ngáp|nhai|nuốt|tiêu hóa|bò|trườn|trèo|leo|bay|bơi|lặn|lái|chèo|đốn|chặt|chẻ|bổ|đền bù|bồi thường|tử hình|thi hành|thuyết giáo|thuyết pháp|khuyên răn|làm quen|nguyền rủa|cải trang|dọa|làm sợ hãi|khuấy|quấy|từ bỏ|bỏ rơi|sủa|quát tháo|xoa bóp|chà xát|chịu đựng|cam chịu|khuấy|quấy)\b'),
    ("Abstract & Qualities", r'\b(thông minh|tài giỏi|sáng chói|rực rỡ|đẹp|xấu|hay|dở|tốt|xấu|đúng|sai|nhanh|chậm|to|nhỏ|dài|ngắn|cao|thấp|nặng|nhẹ|mới|cũ|mạnh|yếu|cứng|mềm|dẻo|dai|giòn|nóng|lạnh|ấm|mát|khô|ướt|sạch|bẩn|đắt|rẻ|rộng|hẹp|sâu|nông|đầy|vơi|vững|chắc|bình tĩnh|điềm tĩnh|hăng hái|nhiệt tình|say mê|lòng|đức|phẩm chất|tính cách|khiêm tốn|nhún nhường|nhũn nhặn|thuỳ mị|nhu mì|trung thành|thanh lịch|tao nhã|sang trọng|lộng lẫy|huy hoàng|thành công|thắng lợi|thất bại|thịnh vượng|phồn vinh|nghèo khổ|đói rách|cơ cực|khó khăn|vất vả|dễ dàng|thuận lợi|bất lợi|thiệt hại|tổn thất|hậu quả|kết quả|ý nghĩa|tầm quan trọng|sự thật|giả dối|bí mật|lời khuyên|ý kiến|nhận xét|quan điểm|lý do|nguyên nhân|điều kiện|khả năng|cơ hội|nguy cơ|thách thức|phát triển|tiến bộ|nhân hậu|tử tế|nhân đức|khoan dung|độ lượng|vượt quá|trội hơn|vừa lòng|thỏa mãn|số học|kỷ niệm|lễ)\b'),
]

def get_category(meaning):
    for cat, pattern in categories:
        if re.search(pattern, meaning, re.IGNORECASE):
            return cat
    return "General"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
current_meaning = ""

for line in lines:
    meaning_match = re.search(r'meaning:\s+"(.*?)"', line)
    if meaning_match:
        current_meaning = meaning_match.group(1)
    
    # Check if category is empty
    if 'category: "",' in line:
        cat = get_category(current_meaning)
        line = line.replace('category: "",', f'category: "{cat}",')
    
    new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Categorization complete.")
