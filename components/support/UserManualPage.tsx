
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
        addBullet("Click Login.");
        
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
        addParagraph("Navigate to the 'My Forms' tab in the sidebar to submit data. All data entry is now event-based to ensure accuracy.");
        
        addSubTitle("Event Outcome Entry (All Officers)");
        addBullet("Action: Select the Date of Event and Event Type (e.g., Seminar, Rally, Chapter Meeting).");
        addBullet("Outcome Data: Fill in figures for Attendance, First Timers, Salvations, Holy Ghost Baptism, and Offering.");
        addBullet("Chapter Presidents: You will see an additional 'Membership Count' field. Enter your current total chapter membership here.");
        addBullet("Submit: Click Submit Event Report. Numeric fields auto-select when clicked for easier entry.");
        y += 5;

        addSectionTitle("4. Viewing Reports (My Reports)");
        addParagraph("Navigate to the 'My Reports' tab to analyze data. The system uses a 'Latest Snapshot' logic for membership counts.");

        addSubTitle("Aggregated Summary");
        addBullet("This table shows a roll-up of data for all units under your supervision.");
        addBullet("Membership Logic: The 'Membership' column shows the sum of the LATEST reported count from each chapter in your scope.");
        addBullet("Scope Rows: Specific row for your own office's events combined with totals from subordinate units.");

        addSubTitle("Summary Events Matrix");
        addBullet("View a heatmap of activity types (Seminars, Rallies, etc.) across your entire jurisdiction.");
        addBullet("This view helps identify which event types are driving the most engagement.");
        y += 5;
        addBullet("Date Range: Use the Start Date and End Date inputs to view reports within a specific period.");
        addBullet("Unit Filters: Use the dropdowns (Region, District, Zone, etc.) to drill down.");

        addSubTitle("Exporting");
        addBullet("Export PDF: Click to generate a formatted PDF document of the current view.");
        addBullet("Export Excel: Click to download the current data table as a .csv file.");
        y += 5;

        addSubTitle("My Submissions & Correcting Data");
        addBullet("Navigate to 'My Reports' and select the 'My Submissions' view tab.");
        addBullet("This shows a list of all individual event reports you have submitted.");
        addBullet("Edit: Click the pencil icon to correct data in a report.");
        addBullet("Delete: Click the red trash icon to permanently remove an incorrect or zero-entry report.");
        y += 5;

        addSectionTitle("5. Mobile Usage & Responsiveness");
        addParagraph("The application is fully responsive. On mobile devices, the sidebar menu collapses into a hamburger icon. Wide tables and dashboards can be scrolled horizontally to view all columns.");
        y += 5;

        addSectionTitle("Troubleshooting");
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
            <li>Click <strong>Login</strong>.</li>
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
        <p>Navigate to the <strong>My Forms</strong> tab in the sidebar to submit data. All data entry is now event-based to ensure accuracy.</p>

        <h3 style={{fontSize: '18px', fontWeight: 'bold', marginTop: '16px', marginBottom: '8px'}}>Event Outcome Entry (All Officers)</h3>
        <ul style={{marginLeft: '20px', listStyleType: 'disc'}}>
            <li><strong>Action:</strong> Select the <strong>Date of Event</strong> and <strong>Event Type</strong> (e.g., Seminar, Rally, Chapter Meeting). Fill in the outcome figures.</li>
            <li><strong>Chapter Presidents:</strong> You will see an additional <strong>Membership Count</strong> field. Enter your current total chapter membership here.</li>
            <li><strong>Submit:</strong> Click <strong>Submit Event Report</strong>.</li>
            <li><em>Note: Numeric fields auto-select when clicked for easier typing.</em></li>
        </ul>

        <h2 style={{color: '#B71C1C', fontSize: '20px', marginTop: '24px', marginBottom: '12px', fontWeight: 'bold'}}>4. Viewing Reports (My Reports)</h2>
        <p>Navigate to the <strong>My Reports</strong> tab to analyze data. The system uses a "Latest Snapshot" logic for membership counts to ensure you always see the most current figures.</p>

        <h3 style={{fontSize: '18px', fontWeight: 'bold', marginTop: '16px', marginBottom: '8px'}}>Aggregated Summary</h3>
        <ul style={{marginLeft: '20px', listStyleType: 'disc'}}>
            <li>This table shows a roll-up of data for all units under your supervision.</li>
            <li><strong>Membership Logic:</strong> The "Membership" column displays the sum of the <strong>LATEST</strong> reported count from each chapter within your scope.</li>
            <li><strong>Scope Rows:</strong> You will see a specific row for your own office's events (e.g., "Area Events" or "District Events") combined with the totals from your subordinate units.</li>
            <li><strong>Totals:</strong> A highlighted <strong>TOTAL</strong> row at the bottom sums up all columns.</li>
        </ul>

        <h3 style={{fontSize: '18px', fontWeight: 'bold', marginTop: '16px', marginBottom: '8px'}}>Summary Events Matrix</h3>
        <ul style={{marginLeft: '20px', listStyleType: 'disc'}}>
            <li>View a heatmap of activity types (Seminars, Rallies, etc.) across your entire jurisdiction.</li>
            <li>This view helps identify which event types are driving the most engagement and where activity is concentrated.</li>
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

        <h3 style={{fontSize: '18px', fontWeight: 'bold', marginTop: '16px', marginBottom: '8px'}}>My Submissions & Correcting Data</h3>
        <p>In the <strong>My Reports</strong> tab, use the <strong>My Submissions</strong> view to manage your data:</p>
        <ul style={{marginLeft: '20px', listStyleType: 'disc'}}>
            <li><strong>Edit:</strong> Use the <strong>pencil icon</strong> to update figures for an existing report.</li>
            <li><strong>Delete:</strong> Use the <strong>red trash icon</strong> to permanently delete reports that were entered in error (e.g., duplicated entries or entries that have been cleared to zero).</li>
        </ul>

        <h2 style={{color: '#B71C1C', fontSize: '20px', marginTop: '24px', marginBottom: '12px', fontWeight: 'bold'}}>5. Mobile Usage & Responsiveness</h2>
        <p>The application is designed to be fully responsive. On mobile devices:</p>
        <ul style={{marginLeft: '20px', listStyleType: 'disc'}}>
            <li><strong>Navigation:</strong> The sidebar menu collapses into a "hamburger" menu icon in the top-left corner.</li>
            <li><strong>Scrolling:</strong> Wide tables and dashboards can be scrolled <strong>horizontally</strong> (left to right) to view all columns.</li>
            <li><strong>Forms:</strong> Input fields are optimized for touch, with numeric fields automatically triggering the numeric keypad on most devices.</li>
        </ul>

        <h2 style={{color: '#B71C1C', fontSize: '20px', marginTop: '24px', marginBottom: '12px', fontWeight: 'bold'}}>Troubleshooting</h2>
        <ul style={{marginLeft: '20px', listStyleType: 'disc'}}>
            <li><strong>Empty Dashboard?</strong> Ensure you are viewing the current year, as the dashboard filters for the current year by default. Check "My Reports" for historical data.</li>
        </ul>
      </div>
    </div>
  );
};

export default UserManualPage;
