# Security Specification: MCQ Quiz Platform

## 1. Data Invariants
1. **User Identity Invariant**: A user profile document `/users/{userId}` can only be created or modified by the authenticated user whose `request.auth.uid == userId`.
2. **Quiz Authorship Invariant**: A quiz `/quizzes/{quizId}` must have `creatorId == request.auth.uid`. Only the creator can modify or delete their own quiz.
3. **Attempt Ownership Invariant**: A quiz attempt `/attempts/{attemptId}` can only be recorded by the authenticated participant (`userId == request.auth.uid`).
4. **Leaderboard Integrity Invariant**: A leaderboard entry at `/quizzes/{quizId}/leaderboard/{userId}` must correspond to the signed-in user (`request.auth.uid == userId`).
5. **No Negative Scores or Length Explosions**: All score counters, timers, question counts, and string lengths must conform to bounded schema limits (e.g. title <= 256 chars, IDs <= 128 chars).

## 2. The "Dirty Dozen" Threat Payloads
1. **P1 (Impersonate Profile Creator)**: Authenticated user `attacker_123` attempts to write to `/users/victim_999`. -> Expected: PERMISSION_DENIED.
2. **P2 (Ghost Admin Role Injection)**: User attempts to write `{ "isAdmin": true, "role": "admin" }` to their user document. -> Expected: PERMISSION_DENIED.
3. **P3 (Hijack Quiz Ownership)**: Attacker attempts to update `/quizzes/quiz_123` changing `creatorId` to `attacker_123`. -> Expected: PERMISSION_DENIED.
4. **P4 (Delete Another User's Quiz)**: User B attempts to delete `/quizzes/quiz_A` owned by User A. -> Expected: PERMISSION_DENIED.
5. **P5 (Unauthenticated Quiz Attempt Write)**: Unauthenticated visitor attempts to create a document in `/attempts/attempt_1`. -> Expected: PERMISSION_DENIED.
6. **P6 (Forged Quiz Score for Another User)**: User A attempts to write an attempt to `/attempts/attempt_2` setting `userId: "user_B"`. -> Expected: PERMISSION_DENIED.
7. **P7 (Leaderboard Spoofing)**: User A attempts to set User B's leaderboard entry in `/quizzes/quiz_1/leaderboard/user_B`. -> Expected: PERMISSION_DENIED.
8. **P8 (ID Overflow Poisoning)**: Write attempt with a 500-character document ID with illegal characters `!!!$$$`. -> Expected: PERMISSION_DENIED.
9. **P9 (Negative Score Exploitation)**: User attempts to write an attempt with `score: -100` or `totalQuestions: -5`. -> Expected: PERMISSION_DENIED.
10. **P10 (Huge Payload DOS Attack)**: Quiz payload with title length > 5000 characters. -> Expected: PERMISSION_DENIED.
11. **P11 (Attempt List Tampering)**: User A queries attempts belonging to User B without owning the quiz. -> Expected: PERMISSION_DENIED.
12. **P12 (Time Manipulation Invariant)**: User attempts to backdate or forge timestamps with non-timestamp objects. -> Expected: PERMISSION_DENIED.
