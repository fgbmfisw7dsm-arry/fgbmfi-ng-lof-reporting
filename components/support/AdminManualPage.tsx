
import React, { useState } from 'react';
import Icon from '../ui/Icon';
import { jsPDF } from 'jspdf';

const AdminManualPage: React.FC = () => {
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
        doc.text("FGBMFI Nigeria LOF Reporting App - Admin Manual", margin, y);
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
        addSectionTitle("1. Administration");
        addSubTitle("User Management");
        addBullet("Add User: Click + Add User, fill in details, assign a Role, and link to an Organizational Unit.");
        addBullet("Edit/Delete: Use the pencil or trash icon next to a user.");
        addBullet("Reset Password: Click 'RESET' next to a user to reset their password to the default (123456).");
        
        addSubTitle("Organizational Setup");
        addBullet("Add/Edit Units: Create new Chapters, Areas, Zones, etc.");
        addBullet("Linking: Ensure you link units to the correct Parent (e.g., Link an Area to a Zone).");

        addSubTitle("Maintenance & Archiving");
        addBullet("Scoped Maintenance Console: Perform targeted data cleanup for specific Regions, Districts, or National scope.");
        addBullet("Archive Step: Select a scope and year range, then click 'Archive Data'. This confirms the selection and prepares it for removal.");
        addBullet("Wipe Step: After archival, the 'Wipe Original Data' button becomes active. Click it to permanently delete the selected records.");
        addBullet("Global System Wipe: Use with extreme caution. This wipes ALL reporting data across the entire organization while preserving users and setup.");
        y += 5;

        addSectionTitle("2. Career Path: Promotions & Archiving");
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

        addSectionTitle("Troubleshooting for Admins");
        addBullet("Fictitious Data? Admin should use 'Clear All Data' to remove system defaults.");
        addBullet("Empty Dashboard? Ensure you are viewing the current year.");
        y += 5;

        addSectionTitle("3. Mobile Administration");
        addParagraph("The Admin Panel is optimized for mobile. Tabs and tables can be scrolled horizontally to access all management features and action buttons.");
        y += 5;

        doc.save('LOF_Admin_Manual.pdf');
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
        <h1 className="text-3xl font-bold text-gray-800">Admin Manual</h1>
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
        <h1 style={{color: '#003366', fontSize: '24px', fontWeight: 'bold', marginBottom: '16px'}}>FGBMFI Nigeria LOF Reporting App – Admin Manual</h1>
        
        <h2 style={{color: '#B71C1C', fontSize: '20px', marginTop: '24px', marginBottom: '12px', fontWeight: 'bold'}}>1. Administration</h2>
        <p>Navigate to the <strong>Admin</strong> tab.</p>

        <h3 style={{fontSize: '18px', fontWeight: 'bold', marginTop: '16px', marginBottom: '8px'}}>User Management</h3>
        <ul style={{marginLeft: '20px', listStyleType: 'disc'}}>
            <li><strong>Add User:</strong> Click <strong>+ Add User</strong>, fill in details, assign a Role, and link to an Organizational Unit.</li>
            <li><strong>Edit/Delete:</strong> Use the pencil or trash icon next to a user.</li>
            <li><strong>Reset Password:</strong> Click <strong>RESET</strong> next to a user to reset their password to the default (<code>123456</code>).</li>
        </ul>

        <h3 style={{fontSize: '18px', fontWeight: 'bold', marginTop: '16px', marginBottom: '8px'}}>Organizational Setup</h3>
        <ul style={{marginLeft: '20px', listStyleType: 'disc'}}>
            <li>Manage the hierarchy of the fellowship.</li>
            <li><strong>Add/Edit Units:</strong> Create new Chapters, Areas, Zones, etc.</li>
            <li><strong>Linking:</strong> When creating a unit, ensure you link it to the correct <strong>Parent</strong> (e.g., Link an Area to a Zone).</li>
        </ul>

        <h3 style={{fontSize: '18px', fontWeight: 'bold', marginTop: '16px', marginBottom: '8px'}}>Maintenance & Archiving</h3>
        <ul style={{marginLeft: '20px', listStyleType: 'disc'}}>
            <li><strong>Scoped Maintenance Console:</strong> Allows for targeted deletion of reporting data for specific scopes (National, Region, District) and year ranges.</li>
            <li><strong>Archive Step:</strong> Select your target scope and year range, then click <strong>Archive Data</strong>. This confirms your selection and prepares the system for deletion.</li>
            <li><strong>Wipe Step:</strong> Once archival is confirmed, the <strong>Wipe Original Data</strong> button will activate. Clicking this permanently removes the selected records from the cloud registry.</li>
            <li><strong>Global System Wipe (Danger):</strong> Use this only for a full system reset. It wipes ALL reporting data across the entire organization but preserves user accounts and organizational structure. <strong>This cannot be undone.</strong></li>
        </ul>

        <h2 style={{color: '#B71C1C', fontSize: '20px', marginTop: '24px', marginBottom: '12px', fontWeight: 'bold'}}>2. Career Path: Promotions & Archiving</h2>
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

        <h2 style={{color: '#B71C1C', fontSize: '20px', marginTop: '24px', marginBottom: '12px', fontWeight: 'bold'}}>3. Mobile Administration</h2>
        <p>The Admin Panel is optimized for mobile management:</p>
        <ul style={{marginLeft: '20px', listStyleType: 'disc'}}>
            <li><strong>Horizontal Scrolling:</strong> The Admin Panel tabs (User Management, Org Setup, etc.) can be scrolled <strong>horizontally</strong> if they do not fit on your screen.</li>
            <li><strong>Table Scrolling:</strong> The Officer Registry and Organizational Registry tables support horizontal scrolling to ensure all details and action buttons (Edit/Delete) are accessible.</li>
            <li><strong>Responsive Grids:</strong> The Organizational Setup grid stacks vertically on smaller screens for easier navigation.</li>
        </ul>

        <h2 style={{color: '#B71C1C', fontSize: '20px', marginTop: '24px', marginBottom: '12px', fontWeight: 'bold'}}>Troubleshooting for Admins</h2>
        <ul style={{marginLeft: '20px', listStyleType: 'disc'}}>
            <li><strong>Fictitious Data?</strong> If you see sample data after a system reset, an Admin may need to use "Clear All Data" to remove the system defaults.</li>
            <li><strong>Removing Individual Records:</strong> To delete specific incorrect or zero-entry reports, use the <strong>My Submissions</strong> view in the Reports tab and click the <strong>red trash icon</strong> next to the record.</li>
            <li><strong>Empty Dashboard?</strong> Ensure you are viewing the current year, as the dashboard filters for the current year by default. Check "My Reports" for historical data.</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminManualPage;
