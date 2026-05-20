# Tài liệu Đặc Tả Yêu Cầu Phần Mềm (SRS) – Hệ thống học từ vựng tiếng Anh

## Giới thiệu
Hệ thống là một **ứng dụng web** giúp người dùng học và ôn tập từ vựng tiếng Anh. Người dùng có thể đăng ký/đăng nhập, thiết lập mục tiêu (band từ vựng) và quản lý danh sách từ vựng của mình. Khi thêm từ mới, hệ thống tự động **nhận diện loại từ** (verb, noun, v.v.), **cách đọc** (bao gồm file âm thanh phát âm) và **dịch nghĩa** sang tiếng Việt cũng như đưa ra ví dụ minh hoạ tiếng Anh. Công nghệ chính gồm **ASP.NET Core (C#)** cho phần backend tổng quát và **FastAPI (Python)** cho các tác vụ AI/ML (xử lý ngôn ngữ tự nhiên, tạo âm thanh)【8†L52-L56】【10†L72-L76】. Ví dụ, ASP.NET Core được triển khai trong nhiều hệ thống doanh nghiệp, trong khi FastAPI thường dùng cho các nền tảng yêu cầu xử lý AI chuyên sâu【8†L52-L56】【10†L72-L76】. Tài liệu này trình bày phạm vi, yêu cầu chức năng và phi chức năng, use-case, API endpoints, cũng như kiến trúc tổng thể của hệ thống.

## Tổng quan hệ thống
- **Mục tiêu chính:** Xây dựng nền tảng học từ vựng cá nhân hóa cho từng người dùng, cho phép thêm từ mới và ôn tập hiệu quả theo band hoặc chủ đề học tập. Hệ thống giúp tự động hóa xử lý từ mới bằng công nghệ NLP và cung cấp giao diện thân thiện.  
- **Đối tượng sử dụng:** Người học tiếng Anh mọi cấp độ (sinh viên, nhân viên, v.v.) muốn cải thiện vốn từ. Hệ thống đáp ứng nhu cầu cá nhân hóa (user setting band, theo dõi tiến độ), đồng thời hỗ trợ giáo viên/quản trị hệ thống nếu cần.  
- **Ngữ cảnh hoạt động:** Ứng dụng triển khai trên nền web, có thể chạy trên bất kỳ trình duyệt hiện đại nào. Hệ thống backend được tổ chức dưới dạng **microservices**: dịch vụ chính và dịch vụ AI. Các dịch vụ tương tác qua REST API. Cơ sở dữ liệu sử dụng hệ quản trị quan hệ (ví dụ SQL Server hoặc PostgreSQL). Dự kiến sử dụng Docker để đóng gói và có thể triển khai trên đám mây (Azure/AWS).

## Yêu cầu chức năng (Functional Requirements)
- **Đăng ký và xác thực:** Người dùng phải có thể **đăng ký** tài khoản (email/mật khẩu), **đăng nhập** và **đăng xuất** an toàn. Hệ thống lưu mật khẩu đã mã hóa và sử dụng cơ chế token (JWT) để xác thực phiên.  
- **Quản lý hồ sơ người dùng:** Người dùng có thể cập nhật thông tin cá nhân, đặt **mục tiêu band** học tập (ví dụ band 5-6, 7-8), và xem **thống kê tiến độ** (band hiện tại, số từ đã học).  
- **Quản lý từ vựng:**  
  - Người dùng được phép **thêm từ/cụm từ mới** vào hệ thống. Khi thêm, hệ thống sẽ gọi dịch vụ AI để **tự động nhận diện loại từ** (pos tagging), **đọc phiên âm** và **lấy âm thanh phát âm** (ví dụ qua Text-to-Speech hoặc API như Forvo【21†L22-L24】), **dịch nghĩa sang tiếng Việt** và cung cấp **ví dụ minh họa** tiếng Anh. Tất cả thông tin này được lưu cho từ vựng.  
  - Người dùng có thể **xem danh sách từ vựng** hiện có, sắp xếp hoặc lọc theo band (ví dụ 4-5, 5-6, 7-8) và chủ đề. Có thể chỉnh sửa hoặc xóa từ đã nhập.  
  - Hệ thống phân loại từ vựng theo **band học tập** do người dùng lựa chọn (band là nhóm độ khó từ vựng), hoặc theo các **chủ đề** do người dùng tạo (như du lịch, khoa học, vv).  
- **Chức năng ôn tập (Quiz):** Người dùng chọn chế độ ôn tập theo band hoặc theo chủ đề. Hệ thống sẽ hiển thị lần lượt các từ/cụm từ tiếng Anh và yêu cầu người dùng **nhập nghĩa tiếng Việt**, hoặc ngược lại. Hệ thống kiểm tra kết quả và đưa ra phản hồi đúng/sai. (Trong tương lai có thể bổ sung tính năng **đọc phát âm bằng giọng nói** hoặc nhận diện giọng người dùng).  
- **Thiết lập mục tiêu:** Người dùng có thể cài đặt band mục tiêu (ví dụ hướng đến band 7-8) và xem hệ thống đã học được bao nhiêu band. Hệ thống theo dõi tiến độ và gợi ý bài học mới.  
- **Quản lý nội dung (Admin):** (Tùy chọn) Nếu có vai trò quản trị, có thể quản lý danh sách band, chủ đề, từ vựng mặc định, và xem báo cáo tổng quan người dùng.  
- **Tương tác AI tự động:** Khi người dùng thêm từ mới, hệ thống gọi microservice **FastAPI** để thực hiện các tác vụ ML/NLP: gán tag loại từ (bằng thư viện NLP như spaCy【20†L49-L58】), truy vấn API phiên âm/amthanh (như Forvo【21†L22-L24】 hoặc gTTS), và dịch nghĩa (Google Translate API hoặc từ điển Oxford…). Kết quả trả về được lưu vào cơ sở dữ liệu.  

## Yêu cầu phi chức năng (Non-Functional Requirements)
- **Hiệu năng (Performance):** Đa số yêu cầu đến API của hệ thống phải được đáp ứng nhanh (ví dụ 90–95% yêu cầu trả về trong <2 giây)【3†L507-L513】. Hệ thống phải xử lý đồng thời được nhiều người dùng (dựa trên khả năng mở rộng của kiến trúc microservices). FastAPI được sử dụng cho các tác vụ AI vì ưu điểm **tốc độ cao**, hỗ trợ ASGI cho phép xử lý song song nhiều yêu cầu【10†L72-L76】.  
- **Bảo mật (Security):** Toàn bộ dữ liệu nhạy cảm (mật khẩu, token) phải được mã hóa hoặc hashing. Giao tiếp phải qua **HTTPS**. Chỉ người dùng đã xác thực mới có thể truy xuất tài nguyên riêng. Mọi truy cập cơ sở dữ liệu và API đều kiểm soát phân quyền.  
- **Khả năng mở rộng (Scalability):** Thiết kế theo microservices để dễ dàng mở rộng ngang. Ví dụ, dịch vụ FastAPI có thể nhân bản nhiều instance để xử lý cao độ (đa dụng **container/Docker**). Sử dụng API Gateway (chẳng hạn Ocelot) giúp hỗ trợ môi trường đa ngôn ngữ và cân bằng tải【26†L1088-L1092】.  
- **Độ tin cậy & Khả dụng (Reliability & Availability):** Hệ thống hoạt động liên tục >99%. Có cơ chế sao lưu định kỳ cơ sở dữ liệu. Thiết kế chịu lỗi (retry, circuit breaker) cho các call giữa các dịch vụ.  
- **Tính dễ sử dụng (Usability):** Giao diện web trực quan, đơn giản. Các thao tác đăng ký, thêm từ, ôn tập được hướng dẫn rõ ràng.  
- **Khả năng bảo trì (Maintainability):** Mã nguồn tuân thủ chuẩn, có tài liệu. Dùng Swagger/OpenAPI để tự sinh document API.  
- **Tương thích (Compatibility):** Chạy tốt trên các trình duyệt hiện đại (Chrome, Edge, Firefox). Có thể mở rộng để hỗ trợ thiết bị di động.  
- **Tiếng Việt và Quốc tế hóa:** Giao diện hỗ trợ tiếng Việt. Dữ liệu từ vựng tiếng Anh có nghĩa tiếng Việt.

> **Tham khảo:** Một yêu cầu hiệu năng tiêu biểu có thể là “95% các truy vấn phải được trả về trong <2 giây”【3†L507-L513】. FastAPI được đánh giá có **tốc độ vượt trội** trong các microservice so với các framework Python truyền thống nhờ kiến trúc ASGI【10†L72-L76】, trong khi ASP.NET Core là nền tảng quen thuộc trong các hệ thống doanh nghiệp【8†L52-L56】.

## Mô hình dữ liệu và Cơ sở dữ liệu
Hệ thống dùng cơ sở dữ liệu quan hệ. Một số bảng chính dự kiến như sau:
- **User (Người dùng):** `UserID (PK)`, email, passwordHash, name, currentBand, targetBand, createdAt,...  
- **Vocabulary (Từ vựng):** `WordID (PK)`, `Text` (từ/cụm từ tiếng Anh), `POS` (loại từ), `Pronunciation` (chuỗi phiên âm), `AudioURL` (link file âm thanh), `MeaningVN` (nghĩa tiếng Việt), `MeaningEN` (định nghĩa tiếng Anh), `ExampleEN` (ví dụ Anh), `ExampleVN` (dịch ví dụ). Mỗi từ có `BandID` (FK) và có thể có nhiều `TopicID`.  
- **Band:** `BandID` (PK), `Name` (ví dụ "4-5", "5-6"), `Description`. Thông tin về level khó.  
- **Topic (Chủ đề):** `TopicID` (PK), `Name` (ví dụ "Du lịch", "Kinh tế"). Từ vựng có thể thuộc nhiều topic (bảng nối **VocabularyTopic**).  
- **StudySession / Review:** Ghi nhận mỗi lần ôn tập của người dùng: `SessionID`, `UserID`, `DateTime`, `BandID/TopicID`, kết quả (đúng/sai). Dùng để theo dõi tiến trình.  
- **UserProgress:** Có thể tóm tắt thành bảng lưu trữ số từ đã nhớ được trong mỗi band.  
Hệ thống có thể dùng SQL Server hoặc PostgreSQL. Cần thiết kế các index cho tìm kiếm nhanh (ví dụ tìm nghĩa, tìm theo band). Nếu cần cache tần suất, có thể bổ sung Redis.

## Use Cases
- **UC1 – Đăng ký / Đăng nhập:** Người dùng nhập email và mật khẩu để tạo tài khoản mới hoặc đăng nhập. Hệ thống kiểm tra hợp lệ, tạo phiên làm việc.  
- **UC2 – Thêm từ vựng mới:** Người dùng ở trang “Quản lý từ vựng” nhập một từ/cụm từ tiếng Anh mới. Hệ thống gọi dịch vụ AI để nhận diện POS, tạo phiên âm và âm thanh, dịch nghĩa. Sau khi hoàn tất, từ đó được lưu và hiển thị cho người dùng.  
- **UC3 – Quản lý từ vựng:** Người dùng xem/chỉnh sửa danh sách từ của mình. Họ có thể lọc theo band hoặc chủ đề, chỉnh sửa nghĩa hoặc xóa từ không cần thiết.  
- **UC4 – Ôn tập (Flashcard/Quiz):** Người dùng chọn chế độ ôn tập theo band hoặc theo chủ đề. Hệ thống lần lượt hiển thị từ/cụm từ tiếng Anh (hoặc tiếng Việt) và yêu cầu nhập nghĩa ngược lại. Sau mỗi câu trả lời, hệ thống cho biết đúng hay sai và hiển thị đáp án. Cuối buổi, người dùng xem kết quả tổng hợp.  
- **UC5 – Đặt mục tiêu học:** Người dùng vào cài đặt và chọn band mục tiêu. Hệ thống cập nhật thông tin và theo dõi quá trình để báo hiệu khi đạt được mục tiêu.  
- **UC6 – Tự động xử lý từ mới:** (Hệ thống) Khi một từ mới được thêm, dịch vụ AI (FastAPI) tự động phân tích từ đó: gán POS, lấy âm thanh, dịch nghĩa. Người dùng chỉ nhập từ đầu vào, mọi thứ còn lại được tự động hóa.  

## API Endpoints
Hệ thống cung cấp RESTful API cho frontend và các clients, ví dụ:

- **AuthController:**  
  - `POST /api/auth/register` – Đăng ký (body: email, password).  
  - `POST /api/auth/login` – Đăng nhập (body: email, password; trả về JWT token).  
- **UserController:**  
  - `GET /api/user/profile` – Lấy thông tin người dùng hiện tại (cần token).  
  - `PUT /api/user/profile` – Cập nhật thông tin (name, targetBand…).  
  - `GET /api/user/goal` – Xem band mục tiêu và tiến độ.  
- **VocabularyController:**  
  - `GET /api/vocabulary` – Lấy danh sách từ của user; hỗ trợ lọc theo band (`?band=5-6`) hoặc topic (`?topic=Du+lich`).  
  - `POST /api/vocabulary` – Thêm từ mới (body: { text: "word" }). Khi nhận được request, backend sẽ gọi FastAPI xử lý và trả về thông tin đầy đủ của từ sau khi thêm.  
  - `GET /api/vocabulary/{id}` – Xem chi tiết một từ (nghĩa, ví dụ, audio URL…).  
  - `PUT /api/vocabulary/{id}` – Cập nhật thông tin từ (thường admin sử dụng).  
  - `DELETE /api/vocabulary/{id}` – Xóa từ.  
- **ReviewController:**  
  - `POST /api/review/start` – Bắt đầu phiên ôn tập (body: { type: "band" or "topic", value: "5-6" hoặc "Du lich" }). Hệ thống trả về một danh sách các câu hỏi (từ gốc).  
  - `POST /api/review/answer` – Gửi câu trả lời của một từ (body: { wordId, answerVN/EN }). Trả về kết quả đúng/sai và gợi ý đáp án.  
  - `GET /api/review/result/{sessionId}` – Lấy báo cáo kết quả sau khi ôn tập.  
- **AI/ML Service (FastAPI):**  
  - `POST /api/ai/analyze` – Phân tích từ vựng (body: { text: "word" }): trả về POS, phiên âm, audio URL, nghĩa tiếng Việt, ví dụ.  
  - (Nếu cần) `GET /api/ai/pronounce?text=...` – Lấy âm thanh phát âm.  
  - (Nếu cần) `GET /api/ai/translate?text=...&lang=vi` – Dịch đơn giản.  

Tất cả các endpoints bảo mật yêu cầu token khi truy cập. Các response dùng định dạng JSON chuẩn. OpenAPI/Swagger sẽ được tạo tự động từ ASP.NET Core để dễ kiểm tra.

## Kiến trúc hệ thống
【29†embed_image】Hệ thống được thiết kế theo **kiến trúc microservices**: có Frontend web (Angular/React hoặc ASP.NET MVC) giao tiếp qua API Gateway (ví dụ Ocelot) với các dịch vụ riêng biệt. Dịch vụ chính **ASP.NET Core** (C#) đảm nhiệm nghiệp vụ quản lý người dùng, từ vựng và quản lý phiên học. Dịch vụ **FastAPI** (Python) riêng biệt xử lý các tác vụ AI/ML (gọi thư viện NLP spaCy cho POS tagging【20†L49-L58】, Text-to-Speech, gọi API dịch/âm thanh như Forvo【21†L22-L24】). Mỗi dịch vụ có **cơ sở dữ liệu riêng** (ví dụ một DB SQL cho dịch vụ chính, một store cho caching hoặc NoSQL nếu cần) để tách biệt trách nhiệm. Ví dụ minh họa “AIxplorer” cũng sử dụng nhiều microservices ASP.NET Core và FastAPI để chạy các mô hình AI【24†L258-L262】. Sử dụng kiến trúc này cho phép dùng công nghệ đa ngôn ngữ (C# cho doanh nghiệp, Python cho AI)【26†L1088-L1092】【24†L258-L262】. Frontend gửi yêu cầu đến API Gateway, Gateway chuyển đến dịch vụ tương ứng. Ví dụ, khi thêm từ mới, ASP.NET gọi FastAPI qua HTTP để phân tích rồi lưu kết quả. Tất cả giao tiếp nội bộ có thể đặt trong mạng tin cậy hoặc bảo mật, nhưng giao tiếp với người dùng phải dùng HTTPS. Kiến trúc này dễ mở rộng: có thể nhân bản microservice AI khi cần tăng hiệu năng【10†L72-L76】, dùng docker để triển khai độc lập từng thành phần.  

**Các thành phần chính:** Frontend (giao diện web), ASP.NET Core backend, FastAPI microservice AI, API Gateway (Ocelot), và Cơ sở dữ liệu. Ngoài ra có thể sử dụng thêm Redis cache cho hiệu năng, và RabbitMQ (nếu cần) để xử lý bất đồng bộ (xếp hàng xử lý từ mới). SpaCy là thư viện NLP đáng tin cậy, tốc độ cao và độ chính xác được kiểm chứng【20†L49-L58】, sẽ dùng cho phân tích cú pháp. Đối với phát âm, có thể tích hợp API Forvo【21†L22-L24】 hoặc dịch vụ Google Text-to-Speech. Mô hình dữ liệu được quản lý tập trung trong DB, nhưng việc xử lý AI được tách ra thành dịch vụ bên ngoài để linh hoạt thay đổi độc lập (ví dụ cập nhật mô hình NLP). Tổng thể, kiến trúc microservices giúp hệ thống **linh hoạt, có thể mở rộng và dễ tích hợp công nghệ mới**【26†L1088-L1092】.

**Lược đồ kiến trúc:** (Hình minh họa trên) cho thấy các microservice (ví dụ Customer Service, Account Service, Transaction Service) nối với API Gateway và cơ sở dữ liệu riêng; tương tự, hệ thống của chúng ta sẽ có API Gateway điều phối đến Vocabulary Service (ASP.NET) và AI Service (FastAPI), kết nối với các DB riêng biệt【26†L1088-L1092】【24†L258-L262】. 

**Tham khảo:** Ví dụ “AIxplorer” có Angular frontend và microservices ASP.NET/ FastAPI tương tác với mô hình AI【24†L258-L262】. Một bài viết kỹ thuật của NVIDIA nhấn mạnh FastAPI được dùng phổ biến cho microservices ML nhờ hiệu năng cao và dễ triển khai model trong API【10†L72-L76】. Microservices cũng hỗ trợ **đa dạng công nghệ** trong hệ thống【26†L1088-L1092】.

