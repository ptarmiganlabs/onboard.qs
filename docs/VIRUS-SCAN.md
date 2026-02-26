# VirusTotal Scanning

This document describes how release artifacts for **Onboard.qs** are scanned for malware using [VirusTotal](https://www.virustotal.com/).

## Why two scans?

Each GitHub release publishes a single zip file (`onboard-qs-v{VERSION}.zip`) as a release asset. This outer zip contains:

| File | Description |
|------|-------------|
| `onboard-qs.zip` | The Qlik Sense extension — uploaded directly to Qlik Sense (Cloud or client-managed) |
| `readme.txt` | Release notes with version info |
| `LICENSE` | License file |

VirusTotal does not guarantee recursive scanning of archives. To ensure both the distribution package **and** the actual extension zip are individually scanned, the workflow submits both files separately to VirusTotal.

## How it works

The virus scan workflow (`.github/workflows/virus-scan.yaml`) is triggered automatically when a GitHub release is **published**.

### Steps

1. **Download release assets** — All `.zip` assets attached to the release are downloaded.
2. **Extract inner zip** — The outer `onboard-qs-v{VERSION}.zip` is unzipped to retrieve the inner `onboard-qs.zip`.
3. **Scan outer zip** — The release asset (`onboard-qs-v{VERSION}.zip`) is submitted to VirusTotal for analysis using the [`crazy-max/ghaction-virustotal`](https://github.com/crazy-max/ghaction-virustotal) GitHub Action.
4. **Scan inner zip** — The extracted `onboard-qs.zip` is submitted to VirusTotal using a direct API call (`curl` with the VirusTotal v3 API). This is necessary because the GitHub Action forces release-asset scanning mode when triggered by a release event, and cannot scan local files in that context.
5. **Update release notes** — Both scan results are combined into a single Markdown table and appended to the GitHub release body using `actions/github-script`.

### Result format

After scanning, the release body will contain a section like:

```markdown
## VirusTotal scan results

| File | Description | VirusTotal Analysis URL |
|------|-------------|------------------------|
| onboard-qs-v1.2.3.zip | Release download from GitHub | [View analysis](https://www.virustotal.com/gui/...) |
| onboard-qs.zip | Qlik Sense extension (inside the release zip) | [View analysis](https://www.virustotal.com/gui/...) |
```

Each link points to the full VirusTotal analysis report for that file.

## Configuration

| Item | Details |
|------|---------|
| **Workflow file** | `.github/workflows/virus-scan.yaml` |
| **GitHub Action** | [`crazy-max/ghaction-virustotal`](https://github.com/crazy-max/ghaction-virustotal) v4.2.0 |
| **API key secret** | `VIRUSTOTAL_API_KEY` (configured in repository secrets) |
| **Rate limit** | 4 requests/minute (standard free API tier) |
| **Trigger** | `release: published` event |
| **Required permission** | `contents: write` (to update the release body) |

## Notes

- The workflow only runs for the `ptarmiganlabs` organization (skipped for forks).
- If the inner `onboard-qs.zip` is not found inside the outer zip, the workflow logs a warning but does not fail.
- VirusTotal analysis may take a few minutes to complete. The links in the release notes will show full results once analysis is finished.
