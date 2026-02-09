
import React, { useState } from 'react';
import Icon from '../ui/Icon';
import { jsPDF } from 'jspdf';

const DesignDocumentPage: React.FC = () => {
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
        doc.setTextColor(0, 51, 102);
        doc.text("FGBMFI Nigeria LOF Reporting App - System Design", margin, y);
        y += 15;

        const addSectionTitle = (title: string) => {
            if (y > 270) { doc.addPage(); y = 20; }
            doc.setFont("helvetica", "bold");
            doc.setFontSize(14);
            doc.setTextColor(183, 28, 28);
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
        
        const addCodeBlock = (text: string) => {
             doc.setFont("courier", "normal");
             doc.setFontSize(9);
             doc.setTextColor(0, 0, 0);
             const lines = doc.splitTextToSize(text, contentWidth - 10);
             if (y + (lines.length * 4) > 280) { doc.addPage(); y = 20; }
             doc.text(lines, margin + 5, y);
             y += (lines.length * 4) + 4;
        };

        // --- CONTENT ---
        addSectionTitle("1. Executive Summary");
        addParagraph("The FGBMFI Nigeria LOF Reporting App is a progressive web application designed to digitize, automate, and aggregate reporting data across the organizational hierarchy of the Ladies of the Fellowship. It replaces manual paper/spreadsheet reporting with a centralized, role-based system tracking key performance indicators (KPIs).");

        addSectionTitle("2. System Architecture");
        addSubTitle("2.1 Technology Stack");
        addParagraph("Frontend: React 19 (TypeScript), Tailwind CSS. State: React Context API. Persistence: Browser LocalStorage. Reporting: jsPDF & AutoTable.");
        
        addSubTitle("2.2 Data Flow");
        addParagraph("1. Input: Users submit data via Forms.\n2. State: Data persists to LocalStorage.\n3. Aggregation: apiService fetches/filters data.\n4. Presentation: Dashboards re-render.");

        addSectionTitle("3. Organizational Hierarchy & Access Control");
        addSubTitle("3.1 Hierarchy Tree");
        addParagraph("National > Region > District > Zone > Area > Chapter");
        
        addSubTitle("3.2 User Roles");
        addParagraph("National Admin (NA), National President (NP), Regional Admin (RA), Regional Vice President (RVP), District Admin (DA), District Coordinator (DC), National Director (ND), Field Representative (FR), Chapter President (CP).");

        addSectionTitle("4. Functional Modules");
        addSubTitle("4.1 Auth");
        addParagraph("Login, Password Mgmt, Session Persistence.");
        
        addSubTitle("4.2 Dashboard");
        addParagraph("KPI Cards, Growth Trends (Line Chart), Contribution Breakdown (Pie Chart).");
        
        addSubTitle("4.3 Reporting Engine");
        addParagraph("Roll-up Logic: Sums Subordinate Reports + Direct Office Events.\nExports: PDF and CSV.");

        addSectionTitle("5. Data Schema Definition");
        addSubTitle("5.1 User Model");
        addCodeBlock("interface User { id: string; name: string; username: string; role: Role; unitId: string; ... }");
        
        addSubTitle("5.2 Chapter Report");
        addCodeBlock("interface ChapterReport { chapterId: string; month: string; membershipCount: number; attendance: number; ... }");

        doc.save('LOF_System_Design.pdf');
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
        <h1 className="text-3xl font-bold text-gray-800">System Design Document</h1>
        <button 
            type="button"
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center px-4 py-2 bg-fgbmfi-red text-white rounded-md hover:bg-red-800 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
        >
            <Icon name="clipboard" className="w-5 h-5 mr-2" />
            {isExporting ? 'Generating PDF...' : 'Export to PDF'}
        </button>
      </div>
      
      <div className="prose max-w-none text-gray-700 space-y-6">
        <section>
            <h2 className="text-xl font-bold text-fgbmfi-blue">1. Executive Summary</h2>
            <p>The FGBMFI Nigeria LOF Reporting App is a progressive web application designed to digitize, automate, and aggregate reporting data across the organizational hierarchy of the Ladies of the Fellowship. It replaces manual paper/spreadsheet reporting with a centralized, role-based system that tracks key performance indicators (KPIs) such as membership, attendance, salvations, and financials.</p>
        </section>

        <section>
            <h2 className="text-xl font-bold text-fgbmfi-blue">2. System Architecture</h2>
            <h3 className="text-lg font-semibold text-gray-800 mt-2">2.1 Technology Stack</h3>
            <ul className="list-disc ml-5">
                <li><strong>Frontend Framework:</strong> React 19 (TypeScript)</li>
                <li><strong>Styling:</strong> Tailwind CSS</li>
                <li><strong>State Management:</strong> React Context API</li>
                <li><strong>Persistence:</strong> Browser LocalStorage</li>
                <li><strong>Reporting:</strong> jsPDF & AutoTable</li>
            </ul>
        </section>

        <section>
            <h2 className="text-xl font-bold text-fgbmfi-blue">3. Organizational Hierarchy</h2>
            <p>The system enforces a strict hierarchical data visibility model. Users can only view data from their own level and the units below them.</p>
            <div className="bg-gray-100 p-3 rounded mt-2 font-mono text-sm">
                National &gt; Region &gt; District &gt; Zone &gt; Area &gt; Chapter
            </div>
        </section>

        <section>
            <h2 className="text-xl font-bold text-fgbmfi-blue">4. Data Schema Definition</h2>
            <h3 className="text-lg font-semibold text-gray-800 mt-2">5.1 User Model</h3>
            <pre className="bg-gray-800 text-white p-3 rounded overflow-x-auto text-sm">
{`interface User {
  id: string;          // Unique User ID
  name: string;        // Full Name
  username: string;    // Login ID
  role: Role;          // Enum (e.g., NATIONAL_DIRECTOR)
  unitId: string;      // ID of the Org Unit
  phone: string;
  email: string;
}`}
            </pre>
        </section>
      </div>
    </div>
  );
};

export default DesignDocumentPage;
