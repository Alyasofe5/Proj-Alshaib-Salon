# GitHub Actions Deployment Setup

Set these repository secrets before using the workflow:

- `FTP_HOST`
- `FTP_USERNAME`
- `FTP_PASSWORD`
- `FTP_SERVER_DIR`

Recommended values for this project:

- `FTP_HOST`: your FTP host or server IP
- `FTP_USERNAME`: your FTP username
- `FTP_PASSWORD`: your FTP password
- `FTP_SERVER_DIR`: `/public_html/`

Recommended repository settings:

1. Push this project to GitHub.
2. Open `Settings -> Secrets and variables -> Actions`.
3. Add the four secrets above.
4. Open `Actions` and run `Build And Deploy`.
5. For manual runs, you can disable upload by setting `deploy=false` and just inspect the artifact.

What this workflow does:

1. Builds the frontend inside GitHub Actions.
2. Verifies that `frontend/out/_next/static` exists.
3. Packages the frontend export with `backend/api`, `backend/config`, `backend/middleware`, and `backend/.htaccess`.
4. Publishes `deploy_combined` as an artifact.
5. Uploads the package to your production FTP root.

Important:

- Remove any real passwords from `deploy.config.json` after moving to secrets.
- The workflow uploads the contents of `deploy_combined` directly to the FTP target.
- The workflow does not delete `uploads` or `backups`.
