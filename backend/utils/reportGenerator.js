import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';

export const generateAssignmentReport = async (routeDetails, summary, date) => {
    const doc = new PDFDocument({ margin: 50 });
    const filename = `route_assignments_${format(new Date(date), 'yyyy-MM-dd')}.pdf`;
    const filePath = path.join('uploads', 'reports', filename);

    // Ensure directory exists
    fs.mkdirSync(path.join('uploads', 'reports'), { recursive: true });

    // Pipe PDF to file
    doc.pipe(fs.createWriteStream(filePath));

    // Add header
    doc.fontSize(20)
        .text('Route Assignment Report', { align: 'center' })
        .moveDown();

    doc.fontSize(12)
        .text(`Date: ${format(new Date(date), 'MMMM dd, yyyy')}`, { align: 'center' })
        .moveDown();

    // Add summary section
    doc.fontSize(16)
        .text('Summary', { underline: true })
        .moveDown();

    doc.fontSize(12)
        .text(`Total Pickups: ${summary.totalPickups}`)
        .text(`Assigned Pickups: ${summary.assignedPickups}`)
        .text(`Unassigned Pickups: ${summary.unassignedPickups}`)
        .text(`Total Drivers Used: ${summary.usedDrivers}/${summary.totalDrivers}`)
        .moveDown();

    // Add metrics section
    doc.fontSize(14)
        .text('Overall Metrics', { underline: true })
        .moveDown();

    doc.fontSize(12)
        .text(`Total Distance: ${Math.round(summary.overallMetrics.totalDistance)} km`)
        .text(`Total Duration: ${Math.round(summary.overallMetrics.totalDuration / 3600)} hours`)
        .text(`Total Fuel Cost: $${summary.overallMetrics.totalFuelCost.toFixed(2)}`)
        .text(`Total Load: ${summary.overallMetrics.totalLoad} kg`)
        .moveDown();

    // Add route details
    doc.fontSize(16)
        .text('Route Details', { underline: true })
        .moveDown();

    routeDetails.forEach((route, index) => {
        doc.fontSize(14)
            .text(`Route ${index + 1}: ${route.driver.name}`, { underline: true })
            .moveDown();

        doc.fontSize(12)
            .text('Driver Information:')
            .text(`Phone: ${route.driver.phone}`)
            .text(`Vehicle: ${route.driver.vehicle.type} (${route.driver.vehicle.plateNumber})`)
            .text(`Capacity: ${route.driver.vehicle.capacity} kg`)
            .moveDown();

        doc.text('Route Metrics:')
            .text(`Duration: ${Math.round(route.metrics.totalDuration / 60)} minutes`)
            .text(`Distance: ${Math.round(route.metrics.totalDistance)} km`)
            .text(`Fuel Cost: $${route.metrics.fuelCost.toFixed(2)}`)
            .text(`Total Load: ${route.metrics.totalLoad} kg`)
            .moveDown();

        doc.text('Pickup Sequence:')
            .moveDown();

        route.steps.forEach((step, stepIndex) => {
            doc.text(`${stepIndex + 1}. ${step.address}`)
                .text(`   Customer: ${step.customerName} (${step.customerPhone})`)
                .text(`   Amount: ${step.estimatedAmount} kg`)
                .text(`   Arrival: ${format(new Date(step.arrivalTime), 'HH:mm')}`)
                .moveDown();
        });

        if (index < routeDetails.length - 1) {
            doc.addPage();
        }
    });

    // Finalize PDF
    doc.end();

    return {
        filename,
        filePath,
        url: `/reports/${filename}`
    };
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

export default {
    generateAssignmentReport,
    generateSystemOverview
}; 