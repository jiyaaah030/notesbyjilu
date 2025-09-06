# User Search Implementation TODO

## Backend
- [x] Add search endpoint in upload-server/routes/userRoutes.js (GET /users/search?query=username)

## Frontend API
- [x] Add searchUsers function in src/lib/api.ts

## Frontend UI
- [x] Add search bar to src/app/page.tsx (input field and search button above cards)
- [x] Implement search results display (user profiles with pics, usernames, profile links)
- [x] Handle no results case

## Testing
- [x] Test search with existing users
- [x] Test edge cases (no results, partial matches)
- [x] Test navigation to user profiles from search results
