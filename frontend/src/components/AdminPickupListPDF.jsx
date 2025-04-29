import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 20, fontSize: 12, fontFamily: 'Helvetica' },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  subHeader: { fontSize: 14, marginBottom: 10, textAlign: 'center', fontStyle: 'italic' },
  table: { display: 'table', width: '100%', marginVertical: 10, borderWidth: 1, borderColor: '#000' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', backgroundColor: '#f2f2f2' },
  tableCell: { flex: 1, padding: 8, textAlign: 'center', borderRightWidth: 1, borderRightColor: '#000' },
  tableCellLast: { flex: 1, padding: 8, textAlign: 'center' },
  boldText: { fontWeight: 'bold' },
  section: { marginTop: 15 }
});

const PickupListPDF = ({ pickups, drivers, fuelPrice }) => (
  <Document>
    <Page style={styles.page}>
      <Text style={styles.header}>Daily Pickup Report</Text>
      <Text style={styles.subHeader}>Fuel Price: LKR {fuelPrice.toFixed(2)}</Text>

      {/* Driver Attendance */}
      <View style={styles.section}>
        <Text style={styles.boldText}>Driver Availability</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Driver</Text>
            <Text style={styles.tableCellLast}>Status</Text>
          </View>
          {drivers.filter(driver => driver.status === 'available').map((driver, index) => (
            <View style={styles.tableRow} key={`driver-${driver._id || index}`}>
              <Text style={styles.tableCell}>{driver.firstName} {driver.lastName}</Text>
              <Text style={styles.tableCellLast}>{driver.status}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* System Overview Table */}
      <View style={styles.section}>
        <Text style={styles.boldText}>System Overview</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Driver</Text>
            <Text style={styles.tableCell}>Pickups</Text>
            <Text style={styles.tableCell}>Total Load (kg)</Text>
            <Text style={styles.tableCellLast}>Fuel Cost (LKR)</Text>
          </View>
          {drivers.map((driver, index) => {
            const driverPickups = pickups.filter(p => p.driver === driver._id);
            const totalLoad = driverPickups.reduce((sum, p) => sum + (p.estimatedAmount || 0), 0);
            const totalFuel = driverPickups.reduce((sum, p) => sum + (p.fuelCost || 0), 0);
            return (
              <View style={styles.tableRow} key={`overview-${driver._id || index}`}>
                <Text style={styles.tableCell}>{driver.firstName} {driver.lastName}</Text>
                <Text style={styles.tableCell}>{driverPickups.length}</Text>
                <Text style={styles.tableCell}>{totalLoad.toFixed(2)}</Text>
                <Text style={styles.tableCellLast}>{totalFuel.toFixed(2)}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </Page>
  </Document>
);

export default PickupListPDF;
