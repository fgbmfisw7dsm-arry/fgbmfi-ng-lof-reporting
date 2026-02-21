
import React, { useState } from 'react';
import Icon from '../ui/Icon';
import { jsPDF } from 'jspdf';

const UserManualPage: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
        const doc = new jsPDF();
        let y = 20;
        const margin = 14;
        const contentWidth = 180;

        // Title
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.setTextColor(0, 51, 102); // FGBMFI Blue
        doc.text("FGBMFI Nigeria LOF Reporting App - User Manual", margin, y);
        y += 15;

        // Helper function for adding text
        const addSectionTitle = (title: string) => {
            if (y > 270) { doc.addPage(); y = 20; }
            doc.setFont("helvetica", "bold");
            doc.setFontSize(14);
            doc.setTextColor(183, 28, 28); // FGBMFI Red
            doc.text(title, margin, y);
            y += 8;
        };

        const addSubTitle = (title: string) => {
             if (y > 270) { doc.addPage(); y = 20; }
             doc.setFont("helvetica", "bold");
             doc.setFontSize(12);
             doc.setTextColor(0, 0, 0);
             doc.text(title, margin, y);
             y += 6;
        };

        const addParagraph = (text: string) => {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(50, 50, 50);
            const lines = doc.splitTextToSize(text, contentWidth);
            if (y + (lines.length * 5) > 280) { doc.addPage(); y = 20; }
            doc.text(lines, margin, y);
            y += (lines.length * 5) + 4;
        };

        const addBullet = (text: string) => {
             doc.setFont("helvetica", "normal");
             doc.setFontSize(10);
             doc.setTextColor(50, 50, 50);
             const lines = doc.splitTextToSize(`• ${text}`, contentWidth);
             if (y + (lines.length * 5) > 280) { doc.addPage(); y = 20; }
             doc.text(lines, margin, y);
             y += (lines.length * 5) + 2;
        };

        // CONTENT GENERATION
        addSectionTitle("1. Getting Started");
        addSubTitle("Login");
        addBullet("Launch the application.");
        addBullet("Enter your assigned Username and Password.");
        addBullet("Click Sign In.");
        
        addSubTitle("Change Password");
        addBullet("Click your Name/Profile Icon in the top-right corner.");
        addBullet("Select Change Password.");
        addBullet("Enter your current password, your new password, and confirm.");
        addBullet("Click Save Changes.");
        y += 5;

        addSectionTitle("2. Dashboard");
        addParagraph("Upon logging in, you will see the Dashboard. This gives you a real-time snapshot of performance based on your role.");
        addBullet("Stat Cards: View totals for Membership, Attendance, First Timers, Salvations, Baptisms, and Offerings.");
        addBullet("Growth Trends: A line chart showing performance over the months.");
        addBullet("Contribution Breakdown: A pie chart showing data contributions by your subordinate units. Click on a slice to drill down.");
        y += 5;

        addSectionTitle("3. Submitting Reports (My Forms)");
        addParagraph("Navigate to the 'My Forms' tab in the sidebar to submit data.");
        
        addSubTitle("For Chapter Presidents (CP)");
        addBullet("Form: Chapter President Monthly Input Form.");
        addBullet("Action: Select the Month and Year. Fill in data for Membership Count, Attendance, First Timers, Salvations, Holy Ghost Baptism, Membership Intention, and Offering.");
        addBullet("Submit: Click Submit Report. Numeric fields auto-select when clicked.");

        addSubTitle("For Other Officers (FR, ND, DC, RVP, NP)");
        addBullet("Form: Event Data Form.");
        addBullet("Action: Select the Date of Event and Event Type (e.g., Seminar, Rally). Fill in the outcome figures.");
        addBullet("Submit: Click Submit Event Report.");
        y += 5;

        addSectionTitle("4. Viewing Reports (My Reports)");
        addParagraph("Navigate to the 'My Reports' tab to analyze data.");

        addSubTitle("Aggregated Summary");
        addBullet("This table shows a roll-up of data for all units under your supervision.");
        addBullet("Scope Rows: Specific row for your own office's events combined with totals from subordinate units.");
        addBullet("Totals: A highlighted TOTAL row at the bottom sums up all columns.");

        addSubTitle("Filtering Data");
        addBullet("Date Range: Use the Start Date and End Date inputs to view reports within a specific period.");
        addBullet("Unit Filters: Use the dropdowns (Region, District, Zone, etc.) to drill down.");

        addSubTitle("Exporting");
        addBullet("Export PDF: Click to generate a formatted PDF document of the current view.");
        addBullet("Export Excel: Click to download the current data table as a .csv file.");
        y += 5;

        addSectionTitle("5. Administration (Admins Only)");
        addSubTitle("User Management");
        addBullet("Add User: Click + Add User, fill in details, assign a Role, and link to an Organizational Unit.");
        addBullet("Edit/Delete: Use the pencil or trash icon next to a user.");
        addBullet("Reset Password: Click the key icon to reset a user's password to default (123456).");
        
        addSubTitle("Organizational Setup");
        addBullet("Add/Edit Units: Create new Chapters, Areas, Zones, etc.");
        addBullet("Linking: Ensure you link units to the correct Parent (e.g., Link an Area to a Zone).");

        addSubTitle("Maintenance & Archiving");
        addBullet("Archive Data: Select a year and click Archive to move old data out of view.");
        addBullet("Clear All Data: Use with caution during setup to wipe all data.");
        y += 5;

        addSectionTitle("6. Career Path: Promotions & Archiving");
        addSubTitle("Officer Promotions");
        addParagraph("When an officer is promoted (e.g., from Chapter President to Field Representative), their account remains the same.");
        addBullet("Edit the officer in User Management.");
        addBullet("Change their 'Designated Office' and 'Assigned Unit'.");
        addBullet("The officer's dashboard and forms will update instantly without requiring a logout.");

        addSubTitle("Archiving & Deactivation");
        addParagraph("To remove an officer from active service while preserving their historical reports:");
        addBullet("Click 'Delete' on the officer's profile in the Registry.");
        addBullet("This archives their profile and revokes their access immediately.");

        addSubTitle("Reactivation");
        addParagraph("If a former officer returns to service:");
        addBullet("Click 'Show Archived' in the Officer Registry.");
        addBullet("Locate the officer and click 'Reactivate'.");
        addBullet("Restore their real email and assign their new role/unit.");
        addBullet("The system will automatically switch you back to the active registry upon saving.");
        y += 5;

        addSectionTitle("Troubleshooting");
        addBullet("Fictitious Data? Admin should use 'Clear All Data' to remove system defaults.");
        addBullet("Empty Dashboard? Ensure you are viewing the current year.");

        doc.save('LOF_User_Manual.pdf');
        setIsExporting(false);

    } catch (e) {
        console.error("PDF Export failed", e);
        alert("Failed to export PDF.");
        setIsExporting(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-800">User Manual</h1>
        <button 
            type="button"
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center px-4 py-2 bg-fgbmfi-red text-white rounded-md hover:bg-red-800 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
        >
            <Icon name="book-open" className="w-5 h-5 mr-2" />
            {isExporting ? 'Generating PDF...' : 'Export to PDF'}
        </button>
      </div>
      
      <div id="manual-content" className="prose max-w-none text-gray-700">
        <h1 style={{color: '#003366', fontSize: '24px', fontWeight: 'bold', marginBottom: '16px'}}>FGBMFI Nigeria LOF Reporting App – User Manual</h1>
        
        <h2 style={{color: '#B71C1C', fontSize: '20px', marginTop: '24px', marginBottom: '12px', fontWeight: 'bold'}}>1. Getting Started</h2>
        <h3 style={{fontSize: '18px', fontWeight: 'bold', marginTop: '16px', marginBottom: '8px'}}>Login</h3>
        <ol style={{marginLeft: '20px', listStyleType: 'decimal'}}>
            <li>Launch the application.</li>
            <li>Enter your assigned <strong>Username</strong> and <strong>Password</strong>.</li>
            <li>Click <strong>Sign In</strong>.</li>
        </ol>

        <h3 style={{fontSize: '18px', fontWeight: 'bold', marginTop: '16px', marginBottom: '8px'}}>Change Password</h3>
        <ol style={{marginLeft: '20px', listStyleType: 'decimal'}}>
            <li>Click your <strong>Name/Profile Icon</strong> in the top-right corner.</li>
            <li>Select <strong>Change Password</strong>.</li>
            <li>Enter your current password, your new password, and confirm the new password.</li>
            <li>Click <strong>Save Changes</strong>.</li>
        </ol>

        <h2 style={{color: '#B71C1C', fontSize: '20px', marginTop: '24px', marginBottom: '12px', fontWeight: 'bold'}}>2. Dashboard</h2>
        <p>Upon logging in, you will see the Dashboard. This gives you a real-time snapshot of performance based on your role.</p>
        <ul style={{marginLeft: '20px', listStyleType: 'disc'}}>
            <li><strong>Stat Cards:</strong> View totals for Membership, Attendance, First Timers, Salvations, Baptisms, and Offerings.</li>
            <li><strong>Growth Trends:</strong> A line chart showing performance over the months.</li>
            <li><strong>Contribution Breakdown:</strong> A pie chart showing data contributions by your subordinate units. <strong>Click on a slice</strong> to drill down into that specific unit's data.</li>
        </ul>

        <h2 style={{color: '#B71C1C', fontSize: '20px', marginTop: '24px', marginBottom: '12px', fontWeight: 'bold'}}>3. Submitting Reports (My Forms)</h2>
        <p>Navigate to the <strong>My Forms</strong> tab in the sidebar to submit data.</p>

        <h3 style={{fontSize: '18px', fontWeight: 'bold', marginTop: '16px', marginBottom: '8px'}}>For Chapter Presidents (CP)</h3>
        <ul style={{marginLeft: '20px', listStyleType: 'disc'}}>
            <li><strong>Form:</strong> Chapter President Monthly Input Form.</li>
            <li><strong>Action:</strong> Select the <strong>Month</strong> and <strong>Year</strong>. Fill in data for Membership Count, Attendance, First Timers, Salvations, Holy Ghost Baptism, Membership Intention, and Offering.</li>
            <li><strong>Submit:</strong> Click <strong>Submit Report</strong>.</li>
            <li><em>Note: Numeric fields auto-select when clicked for easier typing.</em></li>
        </ul>

        <h3 style={{fontSize: '18px', fontWeight: 'bold', marginTop: '16px', marginBottom: '8px'}}>For Other Officers (FR, ND, DC, RVP, NP)</h3>
        <ul style={{marginLeft: '20px', listStyleType: 'disc'}}>
            <li><strong>Form:</strong> Event Data Form.</li>
            <li><strong>Action:</strong> Select the <strong>Date of Event</strong> and <strong>Event Type</strong> (e.g., Seminar, Rally). Fill in the outcome figures.</li>
            <li><strong>Submit:</strong> Click <strong>Submit Event Report</strong>.</li>
        </ul>

        <h2 style={{color: '#B71C1C', fontSize: '20px', marginTop: '24px', marginBottom: '12px', fontWeight: 'bold'}}>4. Viewing Reports (My Reports)</h2>
        <p>Navigate to the <strong>My Reports</strong> tab to analyze data.</p>

        <h3 style={{fontSize: '18px', fontWeight: 'bold', marginTop: '16px', marginBottom: '8px'}}>Aggregated Summary</h3>
        <ul style={{marginLeft: '20px', listStyleType: 'disc'}}>
            <li>This table shows a roll-up of data for all units under your supervision.</li>
            <li><strong>Scope Rows:</strong> You will see a specific row for your own office's events (e.g., "Area Events" or "District Events") combined with the totals from your subordinate units.</li>
            <li><strong>Totals:</strong> A highlighted <strong>TOTAL</strong> row at the bottom sums up all columns.</li>
        </ul>

        <h3 style={{fontSize: '18px', fontWeight: 'bold', marginTop: '16px', marginBottom: '8px'}}>Filtering Data</h3>
        <ul style={{marginLeft: '20px', listStyleType: 'disc'}}>
            <li><strong>Date Range:</strong> Use the <strong>Start Date</strong> and <strong>End Date</strong> inputs to view reports within a specific period.</li>
            <li><strong>Unit Filters:</strong> Use the dropdowns (Region, District, Zone, etc.) to drill down to specific locations.</li>
        </ul>

        <h3 style={{fontSize: '18px', fontWeight: 'bold', marginTop: '16px', marginBottom: '8px'}}>Exporting</h3>
        <ul style={{marginLeft: '20px', listStyleType: 'disc'}}>
            <li><strong>Export PDF:</strong> Click to generate a formatted PDF document of the current view.</li>
            <li><strong>Export Excel:</strong> Click to download the current data table as a <code>.csv</code> file compatible with Excel.</li>
        </ul>

        <h2 style={{color: '#B71C1C', fontSize: '20px', marginTop: '24px', marginBottom: '12px', fontWeight: 'bold'}}>5. Administration (Admins Only)</h2>
        <p>Navigate to the <strong>Admin</strong> tab.</p>

        <h3 style={{fontSize: '18px', fontWeight: 'bold', marginTop: '16px', marginBottom: '8px'}}>User Management</h3>
        <ul style={{marginLeft: '20px', listStyleType: 'disc'}}>
            <li><strong>Add User:</strong> Click <strong>+ Add User</strong>, fill in details, assign a Role, and link to an Organizational Unit.</li>
            <li><strong>Edit/Delete:</strong> Use the pencil or trash icon next to a user.</li>
            <li><strong>Reset Password:</strong> Click the key icon to reset a user's password to the default (<code>123456</code>).</li>
        </ul>

        <h3 style={{fontSize: '18px', fontWeight: 'bold', marginTop: '16px', marginBottom: '8px'}}>Organizational Setup</h3>
        <ul style={{marginLeft: '20px', listStyleType: 'disc'}}>
            <li>Manage the hierarchy of the fellowship.</li>
            <li><strong>Add/Edit Units:</strong> Create new Chapters, Areas, Zones, etc.</li>
            <li><strong>Linking:</strong> When creating a unit, ensure you link it to the correct <strong>Parent</strong> (e.g., Link an Area to a Zone).</li>
        </ul>

        <h3 style={{fontSize: '18px', fontWeight: 'bold', marginTop: '16px', marginBottom: '8px'}}>Maintenance & Archiving</h3>
        <ul style={{marginLeft: '20px', listStyleType: 'disc'}}>
            <li><strong>Archive Data:</strong> Select a year and click <strong>Archive</strong> to move old data out of the active view to improve performance.</li>
            <li><strong>Clear All Data (Danger):</strong> Use this only during initial setup to wipe all reporting data and start fresh. <strong>This cannot be undone.</strong></li>
        </ul>

        <h2 style={{color: '#B71C1C', fontSize: '20px', marginTop: '24px', marginBottom: '12px', fontWeight: 'bold'}}>6. Career Path: Promotions & Archiving</h2>
        <p>The system supports the natural evolution of an officer's service within the Fellowship.</p>

        <h3 style={{fontSize: '18px', fontWeight: 'bold', marginTop: '16px', marginBottom: '8px'}}>Officer Promotions</h3>
        <ul style={{marginLeft: '20px', listStyleType: 'disc'}}>
            <li>When an officer is promoted (e.g., from Chapter President to Field Representative), their account remains the same.</li>
            <li><strong>Action:</strong> Edit the officer in User Management, change their "Designated Office" and "Assigned Unit," and save.</li>
            <li>The officer's dashboard and forms will update instantly without requiring a logout.</li>
        </ul>

        <h3 style={{fontSize: '18px', fontWeight: 'bold', marginTop: '16px', marginBottom: '8px'}}>Archiving & Deactivation</h3>
        <ul style={{marginLeft: '20px', listStyleType: 'disc'}}>
            <li>To remove an officer from active service while preserving their historical reports:</li>
            <li><strong>Action:</strong> Click <strong>Delete</strong> on the officer's profile in the Registry.</li>
            <li>This archives their profile and revokes their access immediately.</li>
        </ul>

        <h3 style={{fontSize: '18px', fontWeight: 'bold', marginTop: '16px', marginBottom: '8px'}}>Reactivation</h3>
        <ul style={{marginLeft: '20px', listStyleType: 'disc'}}>
            <li>If a former officer returns to service:</li>
            <li><strong>Action:</strong> Click <strong>Show Archived</strong> in the Officer Registry, locate the officer, and click <strong>Reactivate</strong>.</li>
            <li>Restore their real email and assign their new role/unit. The system will automatically switch you back to the active registry upon saving.</li>
        </ul>

        <h2 style={{color: '#B71C1C', fontSize: '20px', marginTop: '24px', marginBottom: '12px', fontWeight: 'bold'}}>Troubleshooting</h2>
        <ul style={{marginLeft: '20px', listStyleType: 'disc'}}>
            <li><strong>Fictitious Data?</strong> If you see sample data after a system reset, an Admin may need to use "Clear All Data" to remove the system defaults.</li>
            <li><strong>Empty Dashboard?</strong> Ensure you are viewing the current year, as the dashboard filters for the current year by default. Check "My Reports" for historical data.</li>
        </ul>
      </div>
    </div>
  );
};

export default UserManualPage;
