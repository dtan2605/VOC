# User-Scoped Vocabulary System Architecture

## Overview

Hệ thống đã được cập nhật để hỗ trợ **personalization per user**. Mỗi người dùng có:
- Một bộ **vocabulary mặc định từ admin** (không thể xóa)
- Có thể **thêm từ mới** (vocabulary thêm này là private, chỉ hiển thị cho user đó)
- Có thể **thêm/xóa bands và topics** cá nhân

---

## 1. Data Model

### Schema Changes

**Bands, Topics, Vocabularies** tables thêm column `UserId`:

```sql
ALTER TABLE bands ADD COLUMN UserId INT NULL;
ALTER TABLE topics ADD COLUMN UserId INT NULL;
ALTER TABLE vocabularies ADD COLUMN UserId INT NULL;
```

**Unique Constraints** được cập nhật:
- `bands`: `(UserId, Name)` - mỗi user có band name riêng
- `topics`: `(UserId, Name)` - mỗi user có topic name riêng  
- `vocabularies`: `(UserId, TopicId, Word)` - mỗi user không có từ duplicate trong topic

### Data Categories

#### 1. Global Default Data (Admin-Provided)
```
UserId IS NULL
```
- Được admin tạo và cấp sẵn cho tất cả user
- Không thể xóa bởi user (nhưng có thể hiệu chỉnh locally)
- Ví dụ: IELTS 5.0, 6.0, 7.0 bands; Education, Environment topics

#### 2. User-Personal Data
```
UserId = <specific_user_id>
```
- Được user tạo sau khi đăng nhập
- Chỉ hiển thị cho user đó
- Có thể thêm/xóa tự do

---

## 2. Initialization Flow

### Khi User Đăng Nhập Lần Đầu

```
1. User login → Auth-Service tạo JWT
2. Frontend nhận JWT
3. Frontend gọi POST /api/vocabulary/initialize (mới)
4. VocabularyService gọi CALL sp_initialize_user_vocabulary(userId)
5. Database procedure:
   - Clone tất cả global bands → (UserId=userId, Name)
   - Clone tất cả global topics → (UserId=userId, Name)
   - Clone tất cả global vocabularies → (UserId=userId, ...)
   - Ánh xạ lại foreign keys (BandId, TopicId)
```

### Stored Procedure: `sp_initialize_user_vocabulary`

**Vị trí**: `database/procedures/sp_initialize_user_vocabulary.sql`

**Tính năng**:
- Transactional - nếu lỗi thì rollback
- Idempotent - gọi nhiều lần không sao (dùng `INSERT IGNORE`)
- Ánh xạ ID mapping để giữ relationship

**Ví dụ**:
```sql
CALL sp_initialize_user_vocabulary(42);
-- Kết quả:
-- - 3 bands được clone vào (UserId=42)
-- - 3 topics được clone vào (UserId=42)
-- - Tất cả vocabularies được clone với foreign keys đã được ánh xạ
```

---

## 3. API Endpoints

### Vocabulary Controller

#### `POST /api/vocabulary/initialize`
**Mô tả**: Khởi tạo default vocabulary cho user hiện tại

**Request**:
```bash
curl -X POST http://localhost:5063/api/vocabulary/initialize \
  -H "Authorization: Bearer <JWT>"
```

**Response (200 OK)**:
```json
{
  "message": "User vocabulary initialized successfully"
}
```

**Response (401 Unauthorized)**:
```json
{
  "error": "Unauthorized"
}
```

#### `GET /api/vocabulary`
**Mô tả**: Lấy danh sách vocabulary của user (bao gồm global + personal)

**Response**:
```json
{
  "items": [
    {
      "id": 1,
      "word": "curriculum",
      "meaning": "chuong trinh hoc",
      "bandName": "IELTS 6.0",
      "topicName": "Education"
    }
  ],
  "page": 1,
  "pageSize": 12,
  "totalItems": 42,
  "totalPages": 4
}
```

#### `POST /api/vocabulary`
**Mô tả**: Tạo từ mới cho user

**Request**:
```json
{
  "word": "ambiguous",
  "meaning": "nhập nhoạn, không rõ ràng",
  "partOfSpeech": "adjective",
  "pronunciation": "/æmˈbɪɡ.ju.əs/",
  "bandId": 2,
  "topicId": 1,
  "examples": [
    {
      "englishText": "The instructions were ambiguous.",
      "vietnameseMeaning": "Các hướng dẫn không rõ ràng.",
      "displayOrder": 1
    }
  ]
}
```

---

## 4. Data Flow: Query User Vocabulary

### Trên Database Level

```sql
-- VocabularyController.GetVocabulary
SELECT * FROM vocabularies v
WHERE (v.UserId IS NULL OR v.UserId = @userId)
AND (...search filters...)
```

**Kết quả**: User thấy cả global + personal vocabularies

### Trên Application Level

**Service**: `VocabularyService.API.Services.UserVocabularyInitializationService`

```csharp
public async Task InitializeUserVocabularyAsync(int userId, CancellationToken cancellationToken)
{
    await _dbContext.Database.ExecuteSqlInterpolatedAsync(
        $"CALL sp_initialize_user_vocabulary({userId})",
        cancellationToken);
}
```

---

## 5. Editing & Deletion Rules

### User Can Delete/Edit

**Điều kiện**: `UserId == current_user_id`

```csharp
// VocabularyController.DeleteVocabulary
var vocabulary = await _dbContext.Vocabularies
    .FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId);
if (vocabulary is null)
    return NotFound();

_dbContext.Vocabularies.Remove(vocabulary);
await _dbContext.SaveChangesAsync();
```

### User Cannot Delete Global Data

**Vì**: Global data có `UserId IS NULL`, user's `UserId` không match

```sql
-- Query trả về NULL
SELECT * FROM vocabularies 
WHERE Id = 1 AND UserId = 42;  -- Global có UserId=NULL
-- Kết quả: 0 rows
```

---

## 6. Frontend Integration

### Hook to Check Initialization

**Tệp**: `frontend/src/hooks/useVocabularyInitialization.ts` (tạo mới)

```typescript
import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { vocabApi } from '@/api/vocabApi';

export function useVocabularyInitialization() {
  const { isAuthenticated, user } = useAuth();
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const initVocab = async () => {
      setLoading(true);
      try {
        await vocabApi.post('/vocabulary/initialize');
        setInitialized(true);
      } catch (err) {
        // Nếu lỗi 409 (duplicate), coi là đã khởi tạo
        if ((err as any).response?.status === 409) {
          setInitialized(true);
        } else {
          setError((err as any).message);
        }
      } finally {
        setLoading(false);
      }
    };

    initVocab();
  }, [isAuthenticated, user?.id]);

  return { initialized, loading, error };
}
```

### Usage in Layout

**Tệp**: `frontend/src/layouts/MainLayout.tsx`

```typescript
import { useVocabularyInitialization } from '@/hooks/useVocabularyInitialization';

export function MainLayout() {
  const { initialized, loading } = useVocabularyInitialization();

  if (loading) return <div>Initializing vocabulary...</div>;

  return (
    <div>
      {/* Main content */}
    </div>
  );
}
```

---

## 7. Testing

### 1. Manual API Test

```bash
# 1. Login để lấy JWT
curl -X POST http://localhost:5058/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"TestPassword123!"}'

# Response
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "...",
  "expiresIn": 900
}

# 2. Khởi tạo vocabulary
curl -X POST http://localhost:5063/api/vocabulary/initialize \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."

# Response
{
  "message": "User vocabulary initialized successfully"
}

# 3. Lấy danh sách vocabulary
curl -X GET http://localhost:5063/api/vocabulary \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."

# Response
{
  "items": [
    {"id": 1, "word": "curriculum", ...},
    ...
  ],
  "totalItems": 42
}
```

### 2. Database Verification

```sql
USE voc_vocabulary;

-- Check user 42 có bands, topics, vocabularies chưa
SELECT COUNT(*) FROM bands WHERE UserId = 42;
SELECT COUNT(*) FROM topics WHERE UserId = 42;
SELECT COUNT(*) FROM vocabularies WHERE UserId = 42;

-- Xem chi tiết
SELECT Id, Name, UserId FROM bands WHERE UserId = 42;
SELECT Id, Name, UserId FROM topics WHERE UserId = 42;
SELECT Id, Word, UserId FROM vocabularies WHERE UserId = 42 LIMIT 10;
```

---

## 8. Edge Cases

### Case 1: User calls initialize multiple times
✅ **Safe** - `INSERT IGNORE` trong procedure ngăn duplicate

### Case 2: User deletes personal vocab
✅ **Allowed** - Procedure chỉ clone, không enforced read-only

### Case 3: User tries to delete global vocab
❌ **Prevented** - Query filter `UserId == current_user` không match global data

### Case 4: New global vocab added by admin
⚠️ **Existing users not affected** - Procedure chỉ gọi khi user initialize

**Solution**: 
- Admin cần run manual script để sync:
```sql
CALL sp_initialize_user_vocabulary(userId) 
FOR EACH user_id IN (SELECT DISTINCT UserId FROM vocabularies WHERE UserId IS NOT NULL)
```

---

## 9. Architecture Diagram

```
┌─────────────┐
│   Frontend  │
│  (React)    │
└──────┬──────┘
       │ POST /initialize
       │ GET /vocabulary
       │
       ▼
┌─────────────────┐
│  API Gateway    │
│  (Auth: JWT)    │
└──────┬──────────┘
       │
       ▼
┌──────────────────────────────┐
│  VocabularyService           │
├──────────────────────────────┤
│ • VocabularyController       │
│ • BandController             │
│ • TopicController            │
├──────────────────────────────┤
│ UserVocabularyInitialization │
│        Service               │
└──────────┬───────────────────┘
           │ CALL sp_initialize
           │
           ▼
┌──────────────────────────────┐
│       MySQL 8.4              │
├──────────────────────────────┤
│ • bands (UserId nullable)    │
│ • topics (UserId nullable)   │
│ • vocabularies (UserId NULL) │
├──────────────────────────────┤
│ • sp_initialize_user_vocab   │
│ • __EFMigrationsHistory      │
└──────────────────────────────┘
```

---

## 10. Future Enhancements

1. **Batch Initialization**: Chạy procedure cho tất cả new users
2. **Sync Global Updates**: Auto-sync khi admin thêm global vocab mới
3. **User-Defined Default Bands**: User chọn bands mặc định cho họ
4. **Sharing**: User có thể share vocabulary với bạn bè
5. **Bulk Operations**: Import vocab từ CSV/Excel

---

## 11. Files Modified/Created

| File | Action | Purpose |
|------|--------|---------|
| `database/migrations/V3__add_user_ownership_to_vocabulary.sql` | Create | SQL migration script |
| `database/procedures/sp_initialize_user_vocabulary.sql` | Create | Stored procedure |
| `backend/.../Entities/BandEntity.cs` | Update | Add UserId property |
| `backend/.../Entities/TopicEntity.cs` | Update | Add UserId property |
| `backend/.../Entities/VocabularyEntity.cs` | Update | Add UserId property |
| `backend/.../Controllers/VocabularyController.cs` | Update | Add initialize endpoint |
| `backend/.../Services/UserVocabularyInitializationService.cs` | Create | Service layer |
| `backend/.../Program.cs` | Update | Register DI service |

---

## 12. Connection String

**Environment Variable**:
```
ConnectionStrings__VocabularyDatabase=Server=mysql;Port=3306;Database=voc_vocabulary;User=voc_user;Password=ChangeMe123!;
```

---

## 13. Related Services

- **AuthService**: Tạo JWT và xác thực user
- **UserService**: Quản lý user profile
- **LearningService**: Sử dụng vocabularies để tạo learning sessions

---

## Troubleshooting

### Problem: `Unknown column 'v.UserId' in 'where clause'`
**Solution**: Database schema chưa được update. Run migration scripts.

### Problem: Migration history mismatch
**Solution**: 
```sql
INSERT INTO __EFMigrationsHistory VALUES ('20250526123000_AddUserOwnershipToVocabularySchema', '10.0.0');
```

### Problem: Stored procedure not found
**Solution**: 
```bash
docker compose exec mysql mysql -u root -p"password" < database/procedures/sp_initialize_user_vocabulary.sql
```

---

**Last Updated**: 2026-05-26  
**Version**: 1.0.0
