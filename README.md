# OA Correct Answers Tracker

A simple web application to track correct answers from Online Assessments (OAs) with company names and dates.

## Features

- ✅ **Add new answers** with company name, date, question, and answer
- ✅ **View in Card or Table format** - toggle between views
- ✅ **Mark favorites** - star your important answers
- ✅ **Delete answers** - remove unwanted entries
- ✅ **Download updated JSON** - export your data
- ✅ **Responsive design** - works on desktop and mobile
- ✅ **Local storage** - your data persists in browser

## How to Use

1. **Add New Answer**:
   - Fill out the form at the top
   - Enter Company Name, Date, Question, and Answer
   - Click "Add Answer"

2. **View Your Answers**:
   - **Card View**: See answers in card format (default)
   - **Table View**: See answers in structured table
   - Toggle between views using the buttons

3. **Mark Favorites**:
   - Click the star button (☆) next to any answer
   - It changes to ★ when favorited
   - Works in both card and table views

4. **Delete Answers**:
   - Click the 🗑️ Delete button next to any answer
   - Confirm deletion in the popup
   - Answer is permanently removed

5. **Download Data**:
   - Click the "Download Updated JSON" button
   - Saves your current data as `answers.json`

## Local Development

```bash
# Start local server
python3 -m http.server 8000

# Open in browser
open http://localhost:8000
```

## GitHub Pages Deployment

This site is configured to run on GitHub Pages. Simply push to the main branch and enable GitHub Pages in your repository settings.

## File Structure

```
├── index.html          # Main page
├── main.js            # JavaScript functionality
├── style.css          # Styling
├── answers.json       # Sample data
└── README.md          # This file
```

## Technologies Used

- HTML5
- CSS3
- Vanilla JavaScript
- Local Storage API
- GitHub Pages (deployment) 