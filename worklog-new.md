
---
Task ID: 1
Agent: main
Task: Add unsaved changes warning popup on Data Nilai and improve login page font

Work Log:
- Added state variables `showUnsavedWarning` and `pendingNavAction` to track unsaved changes warning
- Created `checkUnsavedAndNavigate` helper function that checks for unsaved `nilaiEdits` before navigating
- Modified all sidebar navigation buttons to use `checkUnsavedAndNavigate`
- Modified semester tab onClick handler to show warning when switching tabs with unsaved edits
- Added `renderUnsavedWarning` modal component with AlertTriangle icon, change table, warning text, Cancel/Continue buttons
- Improved login page font: text-3xl font-extrabold, labels font-bold uppercase, input font-semibold text-base
- Added AlertTriangle import, custom .w-18/.h-18 CSS
- All lint checks passed

Stage Summary:
- Warning popup shows when user tries to navigate away from Data Nilai with unsaved edits
- Warning popup displays all changed values in a table (student, subject, old/new values)
- User can choose Cancel or Continue (discard changes and proceed)
- Login page fonts are now bolder, larger, and more readable
