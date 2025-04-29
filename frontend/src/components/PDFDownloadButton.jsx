import React, { useState } from 'react';
import { Button, Spinner } from 'react-bootstrap';
import { jsPDF } from 'jspdf';
import logo from '../assets/logoGreen.png';
import { toast } from 'react-hot-toast';

function addCustomHeaderFooter(doc) {
  // Header
  doc.addImage(logo, 'PNG', 20, 10, 30, 15);
  doc.setFontSize(16);
  doc.setTextColor(0, 128, 0);
  doc.text('YAKADABADU.LK', 105, 15, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Waste Management Solutions', 105, 22, { align: 'center' });

  doc.setDrawColor(0, 128, 0);
  doc.setLineWidth(0.5);
  doc.line(20, 35, 190, 35);

  // Footer
  doc.setDrawColor(0, 128, 0);
  doc.line(20, 250, 190, 250);

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 260);
  doc.text('Yakadabadu.lk', 190, 260, { align: 'right' });
  doc.text('All rights reserved © 2024', 190, 265, { align: 'right' });
}

const PDFDownloadButton = ({ pickups, drivers, fuelPrice }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const handleDownload = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const doc = new jsPDF();
      addCustomHeaderFooter(doc);

      let y = 50;

      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Pickup Report', 105, y, { align: 'center' });
      y += 10;

      // Table Headers
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text('No.', 20, y);
      doc.text('Address', 40, y);
      doc.text('Status', 120, y);
      doc.text('Weight (kg)', 160, y);
      y += 8;

      doc.setFont(undefined, 'normal');

      pickups.forEach((pickup, idx) => {
        doc.text(`${idx + 1}`, 20, y);
        doc.text(`${pickup.address}`, 40, y);
        doc.text(`${pickup.status}`, 120, y);
        doc.text(`${pickup.estimatedAmount}`, 160, y);
        y += 8;

        if (y > 240) {
          doc.addPage();
          addCustomHeaderFooter(doc);

          y = 50;
          doc.setFont(undefined, 'bold');
          doc.text('No.', 20, y);
          doc.text('Address', 40, y);
          doc.text('Status', 120, y);
          doc.text('Weight (kg)', 160, y);
          y += 8;
          doc.setFont(undefined, 'normal');
        }
      });

      doc.save('pickup-report.pdf');
      toast.success('PDF report downloaded successfully!');
    } catch (err) {
      setError('Failed to generate PDF report');
      toast.error('Failed to generate PDF report');
    } finally {
      setIsGenerating(false);
    }
  };

  if (error) {
    return (
      <Button variant="outline-danger" disabled>
        Error generating PDF
      </Button>
    );
  }

  return (
    <Button
      variant="outline-success"
      onClick={handleDownload}
      disabled={isGenerating}
    >
      {isGenerating ? (
        <>
          <Spinner
            as="span"
            animation="border"
            size="sm"
            role="status"
            aria-hidden="true"
            className="me-2"
          />
          Generating Report...
        </>
      ) : (
        <>
          <i className="bi bi-file-earmark-pdf me-2"></i>
          Download PDF Report
        </>
      )}
    </Button>
  );
};

export default PDFDownloadButton;
