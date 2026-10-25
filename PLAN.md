# HeartSync Dating App - Implementation Plan

## 1. Mục tiêu

Xây dựng ứng dụng dating HeartSync theo bộ mockup trong thư mục này, bao gồm:

- Onboarding và đăng nhập.
- Tạo, chỉnh sửa và xem hồ sơ.
- Discovery, bộ lọc và swipe.
- Match và thông báo match.
- Inbox và chat realtime.
- Video call 1-1.
- Subscription Free/Premium.
- Performance, khả năng scale, monitoring và vận hành production.

MVP chưa triển khai thuật toán recommendation bằng machine learning. MVP sử dụng rule-based ranking, nhưng hệ thống sẽ tracking đủ dữ liệu để có thể nâng cấp sau này.

---

## 2. Phạm vi màn hình từ mockup

| Nhóm | Màn hình/chức năng |
|---|---|
| Auth | Getting Started, Apple/Facebook/Phone sign-in |
| Profile | Create profile, edit profile, upload ảnh, profile completion |
| Discovery | Swipe card, swipe confirmation, filters |
| Profile detail | Gallery, about me, details, interests, languages, report/block |
| Match | Match confirmation, matched profiles |
| Chat | Inbox, chat detail, conversation starter, media actions |
| Calling | Video call với matched profile |
| Monetization | Subscription plans, Free/Premium comparison |
| Navigation | Profile, discovery/likes, saved, inbox |

Mỗi màn hình phải có loading state, empty state, error state và network failure state phù hợp; không chỉ triển khai trạng thái thành công trong mockup.

---

## 3. Stack kỹ thuật được chọn

### Mobile

- Expo + React Native + TypeScript.
- Expo Development Build/EAS Build.
- Expo Router hoặc React Navigation.
- TanStack Query cho server state, cache và request lifecycle.
- Zustand cho local UI state và session state nhẹ.
- React Hook Form + Zod cho form validation.
- FlashList cho list lớn.
- Expo Image Picker và image compression.
- Expo SecureStore cho token/session data.
- Expo Notifications cho push notification.
- `react-native-webrtc` cho video call; dùng Development Build, không phụ thuộc hoàn toàn vào Expo Go.

### Backend

- NestJS + TypeScript.
- REST API cho CRUD và các thao tác nghiệp vụ.
- WebSocket Gateway cho chat, presence và WebRTC signaling.
- PostgreSQL cho dữ liệu nghiệp vụ.
- Redis cho cache, rate limit, presence, Pub/Sub và distributed lock.
- BullMQ hoặc queue tương đương cho background jobs.
- S3-compatible object storage cho ảnh/media.
- CDN cho avatar, profile image và gallery.

### Observability và hạ tầng

- Docker.
- Load balancer.
- Stateless API instances để scale ngang.
- Prometheus + Grafana cho metrics/dashboard.
- Loki cho log tập trung.
- OpenTelemetry + Tempo hoặc Jaeger cho tracing.
- Sentry cho mobile crash và JavaScript errors.
- STUN/TURN cho WebRTC.

### Lý do chọn Expo + NestJS

Expo giúp rút ngắn thời gian phát triển mobile, hỗ trợ EAS build, notification, image và OTA update. NestJS phù hợp MVP vì dùng TypeScript xuyên suốt với React Native, triển khai REST/WebSocket nhanh và có module structure rõ ràng cho auth, profile, match và chat.

Spring Boot vẫn là lựa chọn tốt nếu team đã có nền tảng Java mạnh, cần tích hợp sâu với hệ thống Java/enterprise hoặc có yêu cầu compliance lớn ngay từ đầu. Với MVP hiện tại, NestJS có tốc độ phát triển và độ đồng nhất tốt hơn.

---

## 4. Kiến trúc tổng thể

```text
Mobile App
    |
    +--> CDN/WAF
    |       |
    |       +--> Load Balancer
    |                 |
    |                 +--> NestJS API Instance 1..N
    |                 |       |
    |                 |       +--> PostgreSQL
    |                 |       +--> Redis
    |                 |       +--> Queue/Workers
    |                 |
    |                 +--> WebSocket Gateway 1..N
    |                         |
    |                         +--> Redis Pub/Sub
    |
    +--> Media CDN --> Object Storage
    |
    +--> WebRTC media path
            |
            +--> P2P khi có thể
            +--> TURN fallback
            +--> SFU ở giai đoạn scale
```

WebRTC media không đi qua NestJS API. NestJS chỉ xử lý signaling, authorization, room lifecycle và call metadata.

---

## 5. Phase triển khai

## Phase 0 - Phân tích và chuẩn hóa yêu cầu

### Mục tiêu

Chuyển mockup thành specification, user flow, component list và API contract có thể triển khai.

### Công việc

- Xây dựng user flow:
  - Onboarding -> sign in -> create profile.
  - Discovery -> swipe -> match.
  - Match -> chat -> video call.
  - Profile -> subscription.
- Tạo screen inventory và navigation map.
- Tách component dùng chung:
  - Button, input, avatar, chip, badge.
  - Card, modal, bottom sheet.
  - Progress bar, skeleton, empty state.
- Chốt loading, empty, error, offline state cho từng màn hình.
- Xác định behavior chưa thể hiện trong mockup:
  - Undo swipe.
  - Block/report.
  - Unmatch.
  - Account deletion.
  - Photo moderation.
  - Subscription restore.
- Chuẩn hóa color, typography, spacing, radius và icon style.
- Thiết kế API contract và data model draft.
- Chốt analytics events cho auth, swipe, match, message, call và subscription.

### Deliverable

- Product flow.
- Screen inventory.
- Navigation map.
- Component inventory.
- API/data model draft.
- Danh sách quyết định nghiệp vụ cần xác nhận.

---

## Phase 1 - Project foundation và design system

### Công việc

- Khởi tạo Expo project với TypeScript strict mode.
- Thiết lập ESLint, Prettier và import conventions.
- Thiết lập EAS cho development, preview và production build.
- Tạo theme và design tokens.
- Xây dựng reusable UI components.
- Thiết lập navigation:
  - Auth stack.
  - Onboarding stack.
  - Main tabs.
  - Profile stack.
  - Chat stack.
  - Call stack.
- Thiết lập environment cho development, staging và production.
- Tạo API client, error mapping và global toast.
- Tạo Error Boundary.
- Thiết lập CI chạy type-check, lint, unit test và build validation.

### Performance

- Dùng `StyleSheet`/theme thay vì tạo object style lớn trong mỗi render.
- Memoize các component card/list item có render thường xuyên.
- Lazy load module video call và subscription.
- Chuẩn hóa image size và thumbnail policy ngay từ đầu.

### Definition of Done

- App chạy được trên iOS/Android development build.
- Navigation skeleton hoạt động.
- Design tokens và reusable components có test cơ bản.
- CI kiểm tra được lint, type-check và test.

---

## Phase 2 - Authentication và profile

### Công việc

- Sign in bằng Apple.
- Sign in bằng Facebook.
- Phone number OTP.
- Access token/refresh token và secure storage.
- Logout, token refresh và session expiration.
- Onboarding profile.
- Create/edit profile.
- Upload, reorder và delete ảnh.
- Profile completion percentage.
- Các field:
  - Gender/pronouns.
  - Occupation.
  - Education.
  - Location.
  - Height.
  - Smoking/drinking.
  - Pets/children.
  - Zodiac/religion.
  - Interests.
  - Languages.
  - Linked accounts.
- Account verification.
- Privacy và visibility settings.

### Performance

- Nén ảnh trên thiết bị trước khi upload.
- Upload thumbnail và original theo nhu cầu.
- Upload ảnh theo queue có retry.
- Cache profile hiện tại bằng TanStack Query.
- Optimistic update cho field nhỏ.
- Chỉ tải gallery đầy đủ khi mở profile detail.

### Backend modules

- `AuthModule`.
- `UsersModule`.
- `ProfilesModule`.
- `MediaModule`.
- `VerificationModule`.

---

## Phase 3 - Discovery, filters và swipe

### Công việc

- Swipe right/left.
- Undo swipe cho entitlement phù hợp.
- Card loading và preload card tiếp theo.
- No more profiles state.
- Filter:
  - Preferred gender.
  - Age range.
  - Distance.
  - Languages.
  - Fallback distance.
- View profile detail.
- Hide, report và block profile.
- Lưu swipe history.
- Exclude profile đã swipe, blocked, reported hoặc không còn active.

### Performance và caching

- Preload 2-3 profile kế tiếp.
- Chỉ dùng thumbnail cho swipe card.
- Dùng cursor pagination.
- Không gửi profile trùng trong cùng một recommendation session.
- Debounce filter thay đổi.
- Cache recommendation result trong Redis thời gian ngắn.
- Invalidate cache khi filter hoặc location thay đổi.
- Database index cho location/filter/status và swipe history.

### Backend modules

- `DiscoveryModule`.
- `SwipeModule`.
- `FiltersModule`.
- `ReportsModule`.

---

## Phase 4 - Matching, inbox và chat realtime

### Công việc

- Tạo match khi hai bên swipe right.
- Match confirmation screen.
- Match list.
- Inbox và chat list.
- Text message.
- Typing indicator.
- Online/offline presence.
- Read receipt.
- Push notification khi có match/message.
- Conversation starter.
- Unmatch, block và report.
- Đồng bộ message khi online lại.
- Media message nếu được đưa vào MVP.

### Realtime architecture

- WebSocket Gateway trong NestJS.
- Redis Pub/Sub hoặc Redis adapter cho nhiều WebSocket instance.
- Authorization khi connect và khi join conversation.
- Presence có TTL trong Redis.
- Idempotency key cho message.

### Reliability và performance

- Optimistic UI với trạng thái `sending`, `sent`, `delivered`, `failed`.
- Local message cache.
- Cursor pagination cho message cũ.
- Load message cũ khi scroll lên.
- Offline queue.
- Retry với exponential backoff.
- Không tải toàn bộ conversation history lúc mở màn hình.
- Background worker cho push notification.

### Backend modules

- `MatchesModule`.
- `ConversationsModule`.
- `MessagesModule`.
- `NotificationsModule`.
- `PresenceModule`.

---

## Phase 5 - Video call bằng WebRTC

### MVP WebRTC v1

- 1-to-1 video call.
- Camera/microphone permissions.
- Start, accept, decline, cancel call.
- Calling, connecting, connected, reconnecting và ended state.
- Mute/unmute microphone.
- Bật/tắt camera.
- Switch front/back camera.
- Kết thúc cuộc gọi.
- STUN server.
- TURN fallback.
- Lưu call metadata tối thiểu.
- Không lưu nội dung video/audio trong MVP.

### Signaling flow

1. Client tạo call request.
2. Backend xác thực hai user đã match và có quyền gọi.
3. Signaling trao đổi offer/answer và ICE candidate qua WebSocket.
4. Client thiết lập media connection qua WebRTC.
5. Backend cập nhật call state và metadata.
6. Client reconnect hoặc kết thúc call theo lifecycle.

### Sau MVP

- Theo dõi packet loss, jitter và RTT.
- Adaptive bitrate.
- Quality indicator.
- Call history.
- Report/block trong call.
- Reconnect policy nâng cao.

### Khi áp dụng SFU

Chuyển từ P2P/TURN sang SFU như LiveKit hoặc mediasoup khi:

- Tỷ lệ P2P call fail tăng.
- Người dùng thường ở mạng mobile hoặc NAT khó.
- Cần group call.
- Cần recording hoặc moderation realtime.
- TURN bandwidth và chi phí trở nên lớn.
- Số lượng cuộc gọi đồng thời cần scale rõ rệt.

---

## Phase 6 - Subscription và monetization

### Công việc

- Free/Premium plan.
- Unlimited swipes.
- Advanced filters.
- Remove ads.
- Undo accidental left swipe.
- Profile boost.
- Apple App Store subscription.
- Google Play subscription.
- Restore purchase.
- Subscription status.
- Grace period, expired và cancelled state.
- Backend receipt validation.
- Payment webhook.
- Feature entitlement middleware.

### Reliability

- Backend là nguồn xác thực entitlement cuối cùng.
- Không unlock premium chỉ dựa vào client flag.
- Webhook xử lý idempotent.
- Retry payment event qua worker.
- Audit log thay đổi subscription.

---

## Phase 7 - Backend scaling, load balancing và security

### Hạ tầng

- Đóng gói API và worker bằng Docker.
- Load balancer trước API.
- API stateless để scale ngang.
- Health check và readiness check.
- Graceful shutdown.
- Connection pooling cho PostgreSQL.
- Redis cho cache, Pub/Sub, presence và rate limit.
- Object storage + CDN cho media.
- Backup và migration strategy cho PostgreSQL.
- Read replica khi workload đọc tăng.

### Load balancing

- Round-robin hoặc least-connections cho API.
- Sticky session không bắt buộc cho API stateless.
- WebSocket gateway cần Redis adapter để event đi qua nhiều instance.
- Timeout, retry và circuit breaker ở gateway phù hợp.
- Autoscaling theo CPU, request rate, P95 latency và WebSocket connections.

### Security

- Request validation bằng DTO và schema.
- Rate limit cho OTP, login, swipe, message, upload và call.
- Payload size limit.
- TLS, security headers và CORS policy.
- Secrets không lưu trong source code.
- Access control ở từng resource.
- Media type/size validation.
- Audit log.
- Account deletion và data retention policy.
- Chống spam, fake account, mass swipe và suspicious login.

---

## Phase 8 - Recommendation roadmap

MVP không triển khai machine learning. Recommendation được thiết kế theo các giai đoạn sau.

### Giai đoạn A - MVP: rule-based ranking

Đặt trong `DiscoveryModule` của NestJS, không tách service riêng.

Candidate score có thể gồm:

```text
score =
  filter compatibility
  + distance score
  + recent activity
  + profile completeness
  + language/interests overlap
  - already seen
  - blocked/reported
```

### Dữ liệu cần tracking từ MVP

- Profile impression.
- Profile open.
- Swipe left/right.
- Undo swipe.
- Match.
- First message.
- Reply.
- Conversation length.
- Call started/completed.
- Report/block.
- Subscription conversion.
- Retention theo ngày/tuần.

Các event phải có version, timestamp, anonymous/user identifier phù hợp và không chứa dữ liệu nhạy cảm không cần thiết.

### Giai đoạn B - Weighted ranking

Áp dụng khi:

- Có lượng swipe/match ổn định.
- Có event tracking đáng tin cậy.
- Rule-based ranking bắt đầu lặp profile hoặc tạo kết quả kém.
- Có đủ dữ liệu để so sánh A/B.

Công việc:

- Điều chỉnh trọng số theo cohort.
- Thêm time decay.
- Dùng interest/language similarity.
- Diversity constraint để tránh danh sách quá đồng nhất.
- A/B test ranking.
- Theo dõi match rate, first-message rate và retention.

### Giai đoạn C - Recommendation service

Áp dụng khi:

- Traffic và dữ liệu đủ lớn.
- Ranking logic làm API chính phức tạp hoặc chậm.
- Cần candidate generation riêng.
- Cần batch recommendation hoặc feature pipeline.

Kiến trúc:

```text
Event tracking
    -> Data warehouse
    -> Feature pipeline
    -> Candidate generation
    -> Ranking service
    -> Redis/API cache
    -> Mobile app
```

Có thể tách Python recommendation service, vector similarity hoặc collaborative filtering sau khi có dữ liệu thực tế. Không nên xây dựng ML service ngay từ MVP.

### Giai đoạn D - ML và model monitoring

Chỉ áp dụng khi có:

- Dataset đủ lớn và chất lượng.
- Baseline rule-based đã được đo lường.
- Quy trình A/B test.
- Xác định được metric thành công.
- Kiểm soát fairness, bias và privacy.

Metrics:

- Click/profile open rate.
- Right swipe rate.
- Match rate.
- First-message rate.
- Reply rate.
- Conversation retention.
- User retention.
- Report/block rate.
- Fairness và exposure distribution.

---

## Phase 9 - Monitoring với Grafana và observability

### Metrics API

- Request rate.
- P50/P95/P99 latency.
- 4xx/5xx rate.
- Timeout.
- Rate limit hit.
- Database query duration.
- Queue processing duration.

### Metrics database/Redis

- CPU, memory, storage.
- PostgreSQL connection pool.
- Slow query.
- Lock/wait time.
- Replication lag.
- Redis hit/miss ratio.
- Redis evictions.
- Pub/Sub lag.
- Queue length.

### Metrics mobile

- Crash-free users.
- App startup time.
- Screen render time.
- JS thread blocking.
- Image loading time.
- API failure rate.
- Offline queue size.

### Metrics chat/WebSocket

- Active connections.
- Connect/disconnect rate.
- Message delivery latency.
- Failed messages.
- Presence update latency.
- WebSocket error rate.

### Metrics WebRTC

- Call setup time.
- Connection success rate.
- Reconnect rate.
- Packet loss.
- Jitter.
- RTT.
- Call drop rate.

### Business metrics

- Sign-up conversion.
- Profile completion.
- Swipe rate.
- Match rate.
- First-message rate.
- Video call success rate.
- Subscription conversion.
- Churn/cancel rate.
- Report/block rate.

### Dashboard Grafana

1. API Overview.
2. PostgreSQL và Redis.
3. Chat và WebSocket.
4. WebRTC quality.
5. Mobile reliability.
6. Business KPI.
7. Recommendation performance khi bắt đầu triển khai ranking.

### Alert ban đầu

- API 5xx vượt ngưỡng.
- P95 latency tăng cao.
- Database pool gần đầy.
- Redis memory/eviction tăng.
- WebSocket disconnect bất thường.
- Message delivery failure tăng.
- Video call success rate giảm.
- Crash-free session giảm.
- Queue backlog kéo dài.
- Storage gần đầy.

---

## Phase 10 - Testing và release

### Testing

- Unit test:
  - Filter logic.
  - Swipe/match logic.
  - Entitlement.
  - Message state.
  - Recommendation rule-based score.
- Component test:
  - Button, form, card, modal, chat bubble.
- Integration test:
  - Auth.
  - Profile update.
  - Swipe/match.
  - Chat.
  - Subscription.
- E2E test:
  - Onboarding.
  - Create profile.
  - Swipe right -> match.
  - Open chat -> send message.
  - Start/end video call.
- Load test:
  - API traffic.
  - Concurrent swipe.
  - Concurrent chat.
  - WebSocket connections.
  - Media upload.
- Security test:
  - Authentication/authorization.
  - Rate limiting.
  - Input validation.
  - File upload.
- Accessibility:
  - Contrast.
  - Screen reader.
  - Font scaling.
  - Touch target.

### Release flow

- Development.
- Staging.
- Internal testing.
- Beta rollout.
- Feature flags cho tính năng rủi ro cao.
- Production rollout từng phần.
- Theo dõi Grafana/Sentry sau release.
- Rollback plan.

---

## 6. MVP scope ưu tiên

### Bắt buộc trong MVP

1. Expo app foundation.
2. Authentication.
3. Create/edit profile.
4. Upload profile images.
5. Discovery và swipe.
6. Filters.
7. View profile.
8. Match.
9. Inbox và text chat.
10. Push notification.
11. Block/report.
12. Rule-based ranking.
13. Basic WebRTC 1-1 hoặc feature flag để triển khai sau MVP.
14. Basic monitoring.
15. CI/CD và staging.

### Có thể đưa sau MVP

- Advanced WebRTC quality.
- SFU.
- Subscription đầy đủ.
- Voice message.
- Profile boost.
- Mini-game trong chat.
- Advanced moderation.
- Read replica.
- Autoscaling nâng cao.
- ML recommendation.
- A/B testing recommendation.

---

## 7. Thứ tự triển khai đề xuất

```text
Phase 0: Requirement + design system specification
    ->
Phase 1: Expo foundation + navigation + shared UI
    ->
Phase 2: Auth + profile
    ->
Phase 3: Discovery + filters + swipe
    ->
Phase 4: Match + chat + notification
    ->
Phase 5: WebRTC video call
    ->
Phase 6: Subscription
    ->
Phase 7: Scaling + security hardening
    ->
Phase 8: Recommendation roadmap implementation
    ->
Phase 9: Grafana observability
    ->
Phase 10: Load test + release
```

---

## 8. Definition of Done

Một tính năng chỉ hoàn tất khi:

- UI phù hợp mockup trên iOS và Android.
- Có loading, empty, error và offline state.
- Có API validation và authorization.
- Có unit/integration test phù hợp.
- Có logging và metric cần thiết.
- Không block UI bởi tác vụ nặng.
- Có retry/timeout cho network operation.
- Có accessibility cơ bản.
- Có migration/index nếu thay đổi database.
- Có feature flag hoặc rollback plan nếu rủi ro cao.
- Được kiểm tra trên staging trước khi release production.

