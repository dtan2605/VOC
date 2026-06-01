# TODO - Fix AI auto-fill (vocabulary/ai/suggest) 502

## Plan (approved via investigation)
1. Reproduce/confirm failing call: POST /api/vocabulary/ai/suggest returns 502.
2. Verify Authorization header presence on frontend request and forwarding through api-gateway.
3. Fix JWT refresh / retry logic in `frontend/src/api/axiosInstance.ts` so that when 401 occurs, retry request always uses `axiosInstance` with correct Authorization header.
4. Ensure no direct `axios.post` is used for refresh endpoint (use axiosInstance or explicitly attach Authorization if required).
5. Re-run quick manual tests:
   - Login (obtain token)
   - Click “Auto-fill with AI”
   - Ensure request succeeds and form fields populate.

## Progress
- [x] Locate endpoint and confirm it is `[Authorize]`.
- [x] Verify axiosInstance interceptor exists and attaches Authorization from localStorage.
- [ ] Patch axiosInstance refresh/retry flow.
- [ ] Validate UI auto-fill works.

