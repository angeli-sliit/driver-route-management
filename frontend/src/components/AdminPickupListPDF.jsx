import React from 'react';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 20 },
  header: { fontSize: 18, marginBottom: 10 },
  table: { display: 'table', width: '100%', borderStyle: 'solid', borderWidth: 1 },
  tableRow: { flexDirection: 'row' },
  tableCell: { 
    width: '25%', 
    borderStyle: 'solid', 
    borderWidth: 1, 
    padding: 5 
  }
});

const PickupListPDF = ({ pickups, drivers, fuelPrice }) => (
  <Document>
    <Page style={styles.page}>
      <Text style={styles.header}>Daily Pickup Report</Text>
      <Text>Current Fuel Price: LKR {fuelPrice.toFixed(2)}</Text>

      {/* System Overview Table */}
      <View style={[styles.table, { marginTop: 15 }]}>
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>Driver</Text>
          <Text style={styles.tableCell}>Pickups</Text>
          <Text style={styles.tableCell}>Total Load</Text>
          <Text style={styles.tableCell}>Fuel Cost</Text>
        </View>
        {drivers.map(driver => {
          const driverPickups = pickups.filter(p => p.driver === driver._id);
          const totalLoad = driverPickups.reduce((sum, p) => sum + (p.estimatedAmount || 0), 0);
          const totalFuel = driverPickups.reduce((sum, p) => sum + (p.fuelCost || 0), 0);

          return (
            <View style={styles.tableRow} key={driver._id}>
              <Text style={styles.tableCell}>{driver.firstName} {driver.lastName}</Text>
              <Text style={styles.tableCell}>{driverPickups.length}</Text>
              <Text style={styles.tableCell}>{totalLoad.toFixed(2)} kg</Text>
              <Text style={styles.tableCell}>LKR {totalFuel.toFixed(2)}</Text>
            </View>
          );
        })}
      </View>

      {/* Driver Attendance */}
      <Text style={[styles.header, { marginTop: 15 }]}>Driver Availability</Text>
      <View style={styles.table}>
        <View style={styles.tableRow}>
          <Text style={styles.tableCell}>Driver</Text>
          <Text style={styles.tableCell}>Status</Text>
        </View>
        {drivers.map(driver => (
          <View style={styles.tableRow} key={driver._id}>
            <Text style={styles.tableCell}>{driver.firstName} {driver.lastName}</Text>
            <Text style={styles.tableCell}>{driver.status}</Text>
          </View>
        ))}
      </View>
    </Page>
  </Document>
);

export default PickupListPDF;