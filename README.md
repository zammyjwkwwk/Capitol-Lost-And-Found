# Capitol Campus Lost & Found

A beginner-friendly campus lost and found website made with HTML, CSS, and vanilla JavaScript. The active pages do not require student accounts, a framework, or a backend.

## Run locally

Serve this folder with VS Code Live Server, or run `python3 -m http.server 8000` from the project folder and open `http://localhost:8000`.

## Features

- Post lost and found item reports with optional photos.
- Search reports and filter by type, claim status, and category.
- Read and post comments without signing in.
- Mark a report claimed with the creator code shown after the original poster submits it.
- Review report counts and delete invalid reports from the admin dashboard.
- View and enlarge the supplied Capitol University campus photo.

Reports, comments, and statuses are stored in the current browser's `localStorage`. They are not shared between different browsers or devices, and clearing browser data removes them. This is a classroom demo, not a production service.

## Demo admin

- Username: `admin@capitol.edu`
- Password: `cuadmin2026`

The demo credentials and admin session are stored in client-side JavaScript and `localStorage`, so this is not secure authentication. Do not use real personal information.

The original `/api` files and account pages remain in the repository but are not used by the current public pages. Add individual student developer names to the About page before submitting if your course requires them; only the team/course information was provided for this project.