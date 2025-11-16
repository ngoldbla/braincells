# macOS Code Signing and Notarization Setup

This guide explains how to set up code signing and notarization for the Brain Cells macOS application.

## Why Code Signing is Required

macOS apps must be code-signed and notarized to run on user machines without showing "damaged" or "unidentified developer" warnings. Without proper signing:
- Users will see: "Brain Cells.app is damaged and can't be opened"
- The app will be blocked by macOS Gatekeeper

## Prerequisites

1. **Apple Developer Account** ($99/year)
   - Sign up at https://developer.apple.com

2. **Xcode Command Line Tools** (on your Mac)
   ```bash
   xcode-select --install
   ```

## Step 1: Create Certificates in Apple Developer Portal

1. Log in to https://developer.apple.com/account
2. Go to **Certificates, Identifiers & Profiles**
3. Click **Certificates** → **+** (Create a new certificate)
4. Select **Developer ID Application** (for distribution outside the Mac App Store)
5. Follow the prompts to create a Certificate Signing Request (CSR)
6. Download the certificate (Developer ID Application.cer)

## Step 2: Export Certificate as .p12

On your Mac:

1. Open **Keychain Access**
2. Find your "Developer ID Application" certificate
3. Right-click → **Export**
4. Choose file format: **Personal Information Exchange (.p12)**
5. Set a strong password (you'll need this later)
6. Save the file as `certificate.p12`

## Step 3: Create App-Specific Password

1. Go to https://appleid.apple.com
2. Sign in with your Apple ID
3. In **Security** section, click **App-Specific Passwords**
4. Click **+** to generate a new password
5. Name it "Tauri Build" or similar
6. Copy the generated password (you'll need this later)

## Step 4: Get Your Team ID

1. Go to https://developer.apple.com/account
2. Click on **Membership** in the sidebar
3. Your **Team ID** is shown (10 characters, e.g., `ABCD123456`)

## Step 5: Get Your Signing Identity

On your Mac, run:
```bash
security find-identity -v -p codesigning
```

Look for a line like:
```
1) ABCDEF1234567890... "Developer ID Application: Your Name (TEAM_ID)"
```

Copy the full identity string (including quotes):
```
Developer ID Application: Your Name (TEAM_ID)
```

## Step 6: Set Up GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add each of these:

### Required Secrets:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `APPLE_CERTIFICATE` | Base64 encoded .p12 file | See below for encoding instructions |
| `APPLE_CERTIFICATE_PASSWORD` | Your .p12 password | Password you set when exporting |
| `APPLE_SIGNING_IDENTITY` | Full signing identity string | From Step 5 (with quotes) |
| `APPLE_ID` | Your Apple ID email | The email you use for Apple Developer |
| `APPLE_PASSWORD` | App-specific password | From Step 3 |
| `APPLE_TEAM_ID` | Your Team ID | From Step 4 (10 characters) |

### Encoding the Certificate:

On macOS/Linux:
```bash
base64 -i certificate.p12 | pbcopy
```

On Windows (PowerShell):
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("certificate.p12")) | Set-Clipboard
```

Paste the base64 string as the value for `APPLE_CERTIFICATE`.

## Step 7: Test the Build

1. Create a new tag to trigger the release workflow:
   ```bash
   git tag v0.1.1
   git push origin v0.1.1
   ```

2. Go to **Actions** tab in GitHub to monitor the build

3. If successful, the DMG will be:
   - Code-signed with your Developer ID
   - Notarized by Apple
   - Ready for distribution

## Troubleshooting

### "The specified item could not be found in the keychain"
- Make sure `APPLE_SIGNING_IDENTITY` matches exactly what's in your keychain
- Include the full string with quotes

### "Invalid credentials"
- Verify `APPLE_ID` is correct
- Make sure you're using an app-specific password, not your regular Apple ID password
- Check that `APPLE_TEAM_ID` is correct

### "Certificate has expired"
- Developer ID certificates are valid for 5 years
- You'll need to create a new certificate and update the secrets

### Build succeeds but app still shows "damaged" error
- Check if notarization completed (look for "notarization successful" in build logs)
- Make sure all environment variables are set correctly
- Try: `xattr -cr "/path/to/Brain Cells.app"` to clear quarantine on your local test

## Alternative: Self-Signed for Development

If you don't have an Apple Developer account, you can use ad-hoc signing for local development only:

1. Remove the `APPLE_*` environment variables from the workflow
2. Build locally with: `npm run tauri build`
3. Users will need to right-click → Open (and accept the warning)

Note: This is not suitable for public distribution.

## References

- [Tauri Code Signing Guide](https://tauri.app/v1/guides/distribution/sign-macos)
- [Apple Notarization Overview](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
