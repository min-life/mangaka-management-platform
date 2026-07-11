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
chuyển đổi chế độ xem
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

---

sửa câu thông báo - notification -> theo đông

Report : Tên project

Member

đưa lọc lên trên header phải

-Task: - thêm decription short trong card
-Task Detail: -Thay x frame -> nhảy sang discussion để xem comment

---

-Material: thêm filter task
-Project detail: 3 chấm hiển thị 3 cái edit, delete project if(project owner), else leave project
-Contribute: đổi sọt rác thành dấu 3 chấm để thêm tính năng thay đổi role

Sửa các thông báo thành tiếng anh
Inbox : - Unread sẽ nằm ngoài
Sửa navigate
Task -> Task detail chưa cùng trang với file.
Up avatar thiếu env
Đưa filter xuống dưới ô search - Projects
Project -> Application -> bỏ thống kê
Application -> tách 2 filter
-> type application chỉ còn 2 cái CREATE_ARC và CREATE_CHAPTER
-Discussion : - Task không cho lướt lên

Member bỏ sao
cho edit role
thêm join ngày nào
bỏ role tag
Contribute -> thêm edit
---

-Profile: Link account gg **\_\_**CHưa được đang chờ BE

Editor Boards -> thêm các thông tin ở card
-> out đang call api bị sai
-> đang không lấy được avatar

Application -> nếu là lead thì cho xem được bao nhiêu lượt vote

Profile-> mangaka workspace

Project Detail -> sửa ảnh thành giữ nguyên kích thước khung đổi ảnh cho thành display content 

File ->
->Overview -> bỏ thống kê 
->Task -> bỏ frame
-> Material _> xóa  selected material
+ 1 combo box để filter theo task

editor board detail -> chưa handle được đâu là owner
+ thêm check owner để thêm tính năng edit + xóa


aplication detail -> material : đang sai dữ liệu