Design a modern, clean, and responsive web application UI for a system called:

"College Alumni Networking and Interaction System"

This is a role-based platform connecting students and alumni through profiles, job postings, and a chat-based query system.

---

🎨 DESIGN STYLE

* Minimal and modern UI
* Soft colors (primary: blue, secondary: light gray/white)
* Clean typography (sans-serif, like Inter or Poppins)
* Subtle shadows and rounded corners
* Consistent spacing and grid layout
* Professional dashboard-style interface

---

🧱 LAYOUT STRUCTURE

Global Layout:

* Left Sidebar Navigation
* Top Header (with title + logout button + user info)
* Main Content Area

Sidebar:

* Icons + labels
* Highlight active page
* Collapsible (optional)

Header:

* Page title
* User profile (name + role)
* Logout button

---

🔐 AUTH PAGE

Login Page:

* Centered card layout
* Email input
* Password input
* Login button
* Error message display
* Clean and simple design

---

🎓 STUDENT INTERFACE

1. Dashboard:

* Cards showing:

  * Total Queries
  * Answered Queries
* Recent queries list (table or cards)

2. Search Alumni:

* Filter dropdown (Department)
* Search bar
* Alumni cards:

  * Name
  * Department
  * Graduation Year
  * "View Profile" button
* Show only verified alumni

3. Alumni Profile:

* Profile header (name, department, batch)
* Contact info section
* Career history (timeline or list)
* Job postings (cards)
* "Send Query" button

4. Send Query Modal:

* Textarea input
* Submit button

5. My Queries:

* Table or list:

  * Alumni name
  * Status (Pending / Answered)
  * Date
* Click → open chat

6. Chat Page:

* Chat UI similar to messaging apps:

  * Messages aligned left/right
  * Sender name + timestamp
  * Input box at bottom
  * Send button

---

🎓 ALUMNI INTERFACE

1. Dashboard:

* Cards:

  * Total Queries Received
  * Jobs Posted

2. Query Management:

* List of queries
* Click → open chat

3. Chat Page:

* Same chat UI as student
* Ability to reply

4. Career Management:

* Table of career entries
* Add/Edit/Delete buttons
* Form modal:

  * Company
  * Role
  * Start Year
  * End Year

5. Job Posting Page:

* Job list (cards or table)
* Add/Edit/Delete job
* Form modal:

  * Title
  * Description

---

🛠 ADMIN INTERFACE

1. Dashboard:

* Stats:

  * Total Users
  * Total Queries
  * Pending Verifications

2. Verify Alumni:

* Table:

  * Name
  * Department
  * Status
  * Verify button

3. Users Page:

* Table of all users
* Role badges (Student / Alumni / Admin)

4. Query Monitor:

* Table of all queries
* Status indicator

---

💬 CHAT UI DETAILS (IMPORTANT)

* Conversation bubbles:

  * Sent messages (right, blue)
  * Received messages (left, gray)
* Timestamp below each message
* Scrollable chat area
* Sticky input box at bottom

---

📋 COMPONENTS REQUIRED

* Buttons (primary, secondary)
* Input fields
* Dropdown filters
* Cards
* Tables
* Modals
* Status badges (Pending / Answered)
* Notification/toast messages

---

📱 RESPONSIVENESS

* Desktop-first design
* Tablet and mobile friendly
* Sidebar collapses on small screens

---

🎯 UX GOALS

* Simple navigation
* Clear role-based separation
* Easy-to-use chat system
* Clean data presentation

---

OUTPUT:

* Full design system (colors, typography, components)
* Separate screens for:

  * Login
  * Student UI
  * Alumni UI
  * Admin UI
* Consistent reusable components
