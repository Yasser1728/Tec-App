# Troubleshooting Guide

## GitHub Actions Issues

### Copilot Code Review 401 Authentication Errors

**Problem:**
GitHub Actions fails with 401 Unauthorized errors when trying to download artifacts:
```
HTTP 401: Bad credentials
non-200 OK status code: 401 Unauthorized
```

**Root Cause:**
GitHub's Copilot Code Review service attempts to download tools from private repositories:
- `github/copilot-code-review-published-artifacts`
- `github/autovalidate-cli-binaries`

These private repositories require special authentication that the standard `GITHUB_TOKEN` doesn't provide.

**Solution:**
Copilot Code Review has been disabled via `.github/copilot-code-review.yml`:
```yaml
enabled: false
```

This prevents the service from running and eliminates the 401 authentication errors.

**Re-enabling Copilot Code Review:**
If you need to enable this feature in the future:
1. Change `enabled: true` in `.github/copilot-code-review.yml`
2. Contact GitHub support to configure proper repository permissions
3. Ensure your organization has access to the required private artifacts

---

## Build and Test Issues

### Running Tests
```bash
# Install dependencies first
npm install

# Run tests without coverage
npx jest --no-coverage

# Run tests with coverage
npm run test:coverage
```

### Building Frontend
```bash
cd tec-frontend
npm ci
npm run build
```

### Environment Variables
For Mainnet Pi Network deployment, ensure:
- `NEXT_PUBLIC_PI_SANDBOX` is set to `"false"` or omitted (defaults to false for Mainnet)
- `PI_API_KEY` is configured in Vercel environment variables
