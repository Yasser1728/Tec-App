# GitHub Actions Troubleshooting Guide

## Authentication Error with GitHub Copilot Code Review

### Problem
GitHub Actions workflow fails with the following error:
```
non-200 OK status code: 401 Unauthorized body: "{\r\n  \"message\": \"Bad credentials\",\r\n  \"documentation_url\": \"https://docs.github.com/rest\",\r\n  \"status\": \"401\"\r\n}"
```

This occurs when GitHub Copilot Code Review attempts to download artifacts from private GitHub repositories:
- `github/autovalidate-cli-binaries`
- `github/copilot-code-review-published-artifacts`

### Root Cause
The default `GITHUB_TOKEN` used in GitHub Actions does not have permission to access private repositories outside of the current repository. The Copilot Code Review action requires access to GitHub's private artifact repositories, which are not publicly accessible.

### Solution

#### Option 1: Disable Copilot Code Review (Current Implementation)
We have disabled automatic code review by creating `.github/copilot-code-review.yml` with:
```yaml
enabled: false
```

This prevents the authentication error by disabling the feature entirely.

#### Option 2: Configure Proper Authentication (For Future Use)
If you want to enable GitHub Copilot Code Review in the future:

1. **Check Organization Settings:**
   - Ensure your organization has GitHub Copilot enabled
   - Verify that the repository has access to Copilot features

2. **Configure Repository Settings:**
   - Go to repository Settings → Copilot
   - Enable Copilot Code Review for pull requests
   - Ensure proper permissions are granted

3. **Update Configuration:**
   - Edit `.github/copilot-code-review.yml`
   - Set `enabled: true`

4. **Verify Access:**
   - The repository must be part of an organization with GitHub Copilot subscription
   - The organization must have access to required artifact repositories

### Related Issues
- Authentication errors with `gh release download`
- 401 Unauthorized errors in GitHub Actions
- Issues with `ADDITIONAL_ARTIFACT_REPOSITORIES_AND_VERSIONS` environment variable

### References
- [GitHub Copilot Code Review Documentation](https://docs.github.com/en/copilot/concepts/agents/code-review)
- [Managing GitHub Actions Settings](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository)
- [GitHub Actions Authentication](https://docs.github.com/en/actions/security-guides/automatic-token-authentication)

### Prevention
To prevent similar issues in the future:
- Regularly audit enabled GitHub Actions and features
- Document all third-party integrations and their authentication requirements
- Monitor workflow runs for authentication failures
- Keep GitHub Actions and integrations up to date
