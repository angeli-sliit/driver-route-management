import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';

export const generateAssignmentReport = async (routeDetails, summary, date) => {
    const doc = new PDFDocument({ margin: 50 });
    const filename = `route_assignments_${format(new Date(date), 'yyyy-MM-dd')}.pdf`;
    const filePath = path.join(process.cwd(), 'uploads', filename);
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    // Add header
    doc.fontSize(20).text('Route Assignments Report', { align: 'center' });
    doc.moveDown();

    // Add content
    doc.fontSize(14).text(`Date: ${format(new Date(date), 'dd/MM/yyyy')}`);
    doc.moveDown();

    // Add summary
    doc.fontSize(14).text('Summary:', { underline: true });
    doc.fontSize(12).text(`Total Routes: ${summary.totalRoutes}`);
    doc.fontSize(12).text(`Total Drivers: ${summary.totalDrivers}`);
    doc.fontSize(12).text(`Total Students: ${summary.totalStudents}`);
    doc.moveDown();

    // Add route details
    doc.fontSize(14).text('Route Details:', { underline: true });
    routeDetails.forEach((route, index) => {
        doc.fontSize(12).text(`Route ${index + 1}: ${route.name}`);
        doc.fontSize(12).text(`Driver: ${route.driver}`);
        doc.fontSize(12).text(`Students: ${route.students.join(', ')}`);
        doc.moveDown();
    });

    // Add footer
    doc.fontSize(10).text('Generated on: ' + format(new Date(), 'dd/MM/yyyy HH:mm:ss'), { align: 'center' });

    doc.end();

    return filename;
};

export const generateSystemOverview = async (metrics) => {
    const doc = new PDFDocument({ margin: 50 });
    const filename = `system_overview_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`;
    const filePath = path.join('uploads', 'reports', filename);

    // Ensure directory exists
    fs.mkdirSync(path.join('uploads', 'reports'), { recursive: true });

    // Pipe PDF to file
    doc.pipe(fs.createWriteStream(filePath));

    // Add header
    doc.fontSize(20)
        .text('System Overview Report', { align: 'center' })
        .moveDown();

    doc.fontSize(12)
        .text(`Generated on: ${format(new Date(), 'MMMM dd, yyyy HH:mm')}`, { align: 'center' })
        .moveDown();

    // Add metrics sections
    Object.entries(metrics).forEach(([section, data]) => {
        doc.fontSize(16)
            .text(section, { underline: true })
            .moveDown();

        doc.fontSize(12);
        Object.entries(data).forEach(([key, value]) => {
            doc.text(`${key}: ${value}`)
        });
        doc.moveDown();
    });

    // Finalize PDF
    doc.end();

    return {
        filename,
        filePath,
        url: `/reports/${filename}`
    };
};

export const generateAttendanceReport = async (attendanceData, date) => {
    const doc = new PDFDocument({ margin: 50 });
    const filename = `attendance_report_${format(new Date(date), 'yyyy-MM-dd')}.pdf`;
    const filePath = path.join(process.cwd(), 'uploads', filename);
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    // Add header
    doc.fontSize(20).text('Attendance Report', { align: 'center' });
    doc.moveDown();

    // Add content
    doc.fontSize(14).text(`Date: ${format(new Date(date), 'dd/MM/yyyy')}`);
    doc.moveDown();

    // Add attendance details
    doc.fontSize(14).text('Attendance Details:', { underline: true });
    attendanceData.forEach((record, index) => {
        doc.fontSize(12).text(`Driver: ${record.driver}`);
        doc.fontSize(12).text(`Status: ${record.status}`);
        doc.fontSize(12).text(`Time: ${format(new Date(record.time), 'HH:mm:ss')}`);
        doc.moveDown();
    });

    // Add footer
    doc.fontSize(10).text('Generated on: ' + format(new Date(), 'dd/MM/yyyy HH:mm:ss'), { align: 'center' });

    doc.end();

    return filename;
};

export const generateLeaveReport = async (leaveData, date) => {
    const doc = new PDFDocument({ margin: 50 });
    const filename = `leave_report_${format(new Date(date), 'yyyy-MM-dd')}.pdf`;
    const filePath = path.join(process.cwd(), 'uploads', filename);
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    // Add header
    doc.fontSize(20).text('Leave Report', { align: 'center' });
    doc.moveDown();

    // Add content
    doc.fontSize(14).text(`Date: ${format(new Date(date), 'dd/MM/yyyy')}`);
    doc.moveDown();

    // Add leave details
    doc.fontSize(14).text('Leave Details:', { underline: true });
    leaveData.forEach((record, index) => {
        doc.fontSize(12).text(`Driver: ${record.driver}`);
        doc.fontSize(12).text(`Start Date: ${format(new Date(record.startDate), 'dd/MM/yyyy')}`);
        doc.fontSize(12).text(`End Date: ${format(new Date(record.endDate), 'dd/MM/yyyy')}`);
        doc.fontSize(12).text(`Status: ${record.status}`);
        doc.moveDown();
    });

    // Add footer
    doc.fontSize(10).text('Generated on: ' + format(new Date(), 'dd/MM/yyyy HH:mm:ss'), { align: 'center' });

    doc.end();

    return filename;
};

export default {
    generateAssignmentReport,
    generateSystemOverview,
    generateAttendanceReport,
    generateLeaveReport
}; 