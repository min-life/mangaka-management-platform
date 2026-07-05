/api/file/{id}/comments -> File Comment
/api/tasks/{id}/comments -> task comment

Version
/api/tasks/{id}/frames -> danh sách materials dưới dạng select
/api/materials/{id}/frames -> danh sách các frame
/api/frames/{id} -> show khung
/api/frames/{id}/comments -> comment để hiện

fogot pass -> navigate sang màn hình khác

sửa lại giao diện login giống stitch

Thêm login google

ấn vào comment trong notification -> target thẳng vô comment

notification
sửa lables -> combo box cho chọn
thêm noti count

profile
đưa sửa name thành icon pen
thay avatar bằng click avatar

message
tiếng anh
lấy message từ respone trả về

activity
onclick

projects
chỉ cho filter theo mình có là owner project hay không
lỗi search
icon đổi chế độ xem bỏ lên header

Project detail
check createdByUse trong /api/projects/{id} xem có trùng với danh sách member không nếu có thì gắn lable project owner
xóa more
gắn thêm activity
bên dưới activity sẽ show ra thông tin của endpoint /api/projects/{id}/editor-boards không còn nút editor board
Dấu 3 chấm cho sửa ảnh và tên của project

Task - project
gom thành combo box
xóa nút header

---

sửa câu thông báo - notification -> theo đông

Contributor
bỏ thống kê
Thêm tính năng xóa và thêm member - tìm theo email

Application
sửa 2 nút combo box

Resource
Thiếu nút chuyển đổi chế độ xem
Bỏ thống kê

Folder arc với chapter
thêm ảnh
Xóa thống kê
Ảnh không có thì sẽ là ô có nội dung ảnh đang trống
Card
xoa thống kê -> ngày tạo

File
Overview
Thêm người tạo - ngày sửa

Task
Thay đổi thành filter theo status
Detail
Hiển thị thông tin đầy đủ = Ai đang assign , ngày tạo, khi nào, decription
Bỏ frame
Thêm 1 nút view discussion = navigate discussion và fil task luôn

Discussion
Các filter nhỏ lại và nằm ngang ra
Bỏ chữ comment để các combo box không lỗi ui
Cần hiển thị thêm đường dẫn của material và tên của frame
lấy id bỏ vào filter frame
id material thì navigate đến cái file material

Editor board
sửa label thành combo box
đưa chuyển chế độ lên header
Nút 3 chấm -> Out

Report : Tên project

Member
