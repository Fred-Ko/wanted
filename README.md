# 프로젝트 시작

## 인프라 실행

```bash
docker compose -f docker/docker-compose.yaml --env-file .env up -d
```

## 패키지 설치

```bash
npm run preinstall
npm install
```

## 마이그레이션 적용

```bash
npx prisma migrate deploy
```

## 빌드

```bash
npm run build
```

## 테스트

```bash
npm run test
```

## 서버 실행(개발)

```bash
npm run start:dev
http://localhost:8888/graphql
```

## 기술스택

- NestJS
- Prisma
- GraphQL
- Kafka
- Docker
- Mysql
- MeCab ( 한글 단어 추출 )
- Wink Tokenizer ( 영어 단어 추출 )

---

## 구현 상태

✅ DB 스키마 생성 스크립트
✅ 게시글 목록 API (페이지네이션 포함)
✅ 게시글 작성 API
✅ 게시글 수정 API
✅ 게시글 삭제 API
✅ 댓글 목록 API (페이지네이션 포함)
✅ 댓글 작성 API
✅ 게시물 또는 댓글 등록 시 알림 기능 - Kafka 토픽 생성 및 메시지 발행/구독 기능

## 테스트 결과

PostService
findPaginatedPosts
성공 케이스
✓ 기본 페이지네이션 입력값으로 첫 번째 페이지의 게시물을 가져온다 (31 ms)
✓ 두 번째 페이지의 게시물을 가져온다 (12 ms)
✓ 마지막 페이지의 게시물을 가져온다 (8 ms)
✓ 작성자 검색 조건으로 게시물을 필터링하여 가져온다 (3 ms)
✓ 제목 검색 조건으로 게시물을 필터링하여 가져온다 (3 ms)
오류 케이스
✓ 페이지 번호를 음수로 설정하여 요청한다 (14 ms)
findById
성공 케이스
✓ 유효한 ID로 게시물을 성공적으로 조회한다 (2 ms)
오류 케이스
✓ 존재하지 않는 ID로 게시물을 조회하려고 시도하여 POST_NOT_FOUND 오류를 발생시킨다 (2 ms)
✓ ID 값에 null, undefined 또는 빈 문자열을 제공하여 조회를 시도한다 (2 ms)
✓ ID에 숫자가 아닌 값을 제공하여 조회를 시도한다 (2 ms)
findManyPostDetailByIds
성공 케이스
✓ 여러 유효한 ID로 게시물 상세 정보를 성공적으로 조회한다 (6 ms)
✓ ID 배열에 중복된 ID를 포함하여 요청한다 (3 ms)
✓ ID 배열이 비어 있을 때 빈 배열을 반환한다 (1 ms)
✓ ID 배열에 숫자가 아닌 값을 포함하여 요청한다 (2 ms)
✓ ID 배열에 null 또는 undefined 값을 포함하여 요청한다 (1 ms)
오류 케이스
✓ 존재하지 않는 ID를 포함하여 요청한다(존재하는 게시물만 반환해야 함) (4 ms)
createPost
성공 케이스
✓ 모든 필수 필드를 제공하여 게시물을 성공적으로 생성한다 (2 ms)
✓ 최대 길이의 문자열을 필드에 입력하여 게시물을 생성한다 (2 ms)
오류 케이스
✓ 필수 필드 중 하나 이상이 누락된 상태로 게시물을 생성하려고 시도한다 (2 ms)
✓ 제목이나 내용에 유효하지 않은 값을 제공한다(예: 너무 긴 문자열) (4 ms)
updatePost
성공 케이스
✓ 유효한 ID와 비밀번호로 게시물을 성공적으로 업데이트한다 (2 ms)
✓ 일부 필드만 업데이트한다(예: 제목만 변경) (1 ms)
✓ 게시물 상세 내용(updatePostDetailCommand)을 함께 업데이트한다 (2 ms)
오류 케이스
✓ 존재하지 않는 ID로 게시물을 업데이트하려고 시도하여 POST_NOT_FOUND 오류를 발생시킨다 (2 ms)
✓ 잘못된 비밀번호로 업데이트를 시도하여 UNAUTHORIZED 오류를 발생시킨다 (4 ms)
✓ ID나 비밀번호에 null 또는 undefined를 제공한다 (1 ms)
✓ 업데이트할 데이터에 유효하지 않은 값을 제공한다 (2 ms)
deletePost
성공 케이스
✓ 유효한 ID와 비밀번호로 게시물을 성공적으로 삭제한다 (2 ms)
오류 케이스
✓ 존재하지 않는 ID로 게시물을 삭제하려고 시도하여 POST_NOT_FOUND 오류를 발생시킨다 (3 ms)
✓ 잘못된 비밀번호로 삭제를 시도하여 UNAUTHORIZED 오류를 발생시킨다 (2 ms)
✓ ID나 비밀번호에 null 또는 undefined를 제공한다 (2 ms)
addComment
성공 케이스
✓ 유효한 입력으로 댓글을 성공적으로 생성한다 (2 ms)
✓ 부모 댓글 ID가 제공된 경우 대댓글을 성공적으로 생성한다 (3 ms)
✓ 최대 길이의 댓글 내용으로 댓글을 성공적으로 생성한다 (4 ms)
오류 케이스
✓ 존재하지 않는 게시물에 댓글을 추가하려고 시도하여 오류를 발생시킨다 (1 ms)
✓ 유효하지 않은 입력으로 댓글 생성을 시도하여 INVALID_INPUT 오류를 발생시킨다 (2 ms)
✓ 댓글 내용이 없는 경우 INVALID_INPUT 오류를 발생시킨다 (1 ms)
✓ 작성자 이름이 없는 경우 INVALID_INPUT 오류를 발생시킨다 (3 ms)
✓ 댓글 내용이 최대 길이를 초과하는 경우 INVALID_INPUT 오류를 발생시킨다 (4 ms)
✓ 존재하지 않는 부모 댓글 ID로 대댓글을 생성하려고 시도하여 오류를 발생시킨다 (2 ms)
findPaginatedCommentsByPostId
성공 케이스
✓ 유효한 게시물 ID로 페이지네이션된 댓글 목록을 가져온다 (2 ms)
✓ 빈 댓글 목록을 가진 게시물에 대해 빈 결과를 반환한다 (4 ms)
✓ 첫 번째 페이지의 댓글을 성공적으로 가져온다 (3 ms)
✓ 두 번째 페이지의 댓글을 성공적으로 가져온다 (4 ms)
✓ 마지막 페이지의 댓글을 성공적으로 가져온다 (5 ms)
✓ 대댓글을 포함한 댓글 목록을 올바르게 가져온다 (2 ms)
오류 케이스
✓ 존재하지 않는 게시물 ID로 댓글을 조회하려고 시도하여 오류를 발생시킨다 (1 ms)
✓ 유효하지 않은 페이지네이션 입력으로 조회를 시도하여 INVALID_INPUT 오류를 발생시킨다 (2 ms)
✓ 음수 값의 first 파라미터로 조회를 시도하여 INVALID_INPUT 오류를 발생시킨다 (3 ms)
✓ 유효하지 않은 커서 값으로 조회를 시도 빈배열을 반환한다 (2 ms)

Test Suites: 1 passed, 1 total
Tests: 50 passed, 50 total
Snapshots: 0 total
Time: 1.72 s, estimated 2 s

## 테스트 결과 E2E

PostResolver (e2e)
게시물 조작
✓ 게시물을 생성하고, 조회하고, 수정하고, 삭제할 수 있어야 한다 (139 ms)
✓ 잘못된 비밀번호로 게시물을 수정하려고 하면 실패해야 한다 (105 ms)
댓글 조작
✓ 댓글을 생성하고 조회할 수 있어야 한다 (77 ms)
✓ 대댓글을 생성하고 조회할 수 있어야 한다 (76 ms)
게시물 검색
✓ 제목으로 게시물을 검색할 수 있어야 한다 (72 ms)
✓ 작성자로 게시물을 검색할 수 있어야 한다 (71 ms)
✓ 페이지네이션을 사용하여 게시물을 검색할 수 있어야 한다 (348 ms)

Test Suites: 1 passed, 1 total
Tests: 7 passed, 7 total
Snapshots: 0 total
Time: 2.975 s, estimated 3 s
