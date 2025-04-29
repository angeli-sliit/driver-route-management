import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import logoGreen from '../assets/logoGreen.png';

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 12,
    fontFamily: 'Helvetica',
    position: 'relative',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logo: {
    width: 40,
    height: 20,
    marginRight: 10,
  },
  companyName: {
    fontSize: 16,
    color: '#0f5132',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subHeader: {
    fontSize: 10,
    color: '#198754',
    textAlign: 'center',
    marginBottom: 10,
  },
  line: {
    borderBottomWidth: 1,
    borderBottomColor: '#198754',
    marginVertical: 6,
    width: '100%',
  },
  title: {
    fontSize: 18,
    color: '#0f5132',
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 8,
    textTransform: 'uppercase',
  },
  sectionHeader: {
    fontSize: 13,
    color: '#0f5132',
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 4,
  },
  table: {
    display: 'table',
    width: '100%',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#000',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  tableHeader: {
    backgroundColor: '#f2f2f2',
    fontWeight: 'bold',
  },
  tableCell: {
    flex: 1,
    padding: 6,
    fontSize: 10,
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#000',
    wordBreak: 'break-word',
  },
  tableCellLast: {
    flex: 1,
    padding: 6,
    fontSize: 10,
    textAlign: 'center',
    wordBreak: 'break-word',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    textAlign: 'center',
    fontSize: 9,
    color: '#888',
  },
});

const AssignmentReportPDF = ({ performance = [], date, fuelPrice }) => (
  <Document>
    <Page style={styles.page}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Image src={logoGreen} style={styles.logo} />
        <Text style={styles.companyName}>YAKADABADU.LK</Text>
      </View>
      <Text style={styles.subHeader}>Waste Management Solutions</Text>
      <View style={styles.line} />
      <Text style={styles.title}>Driver Performance Report for {date}</Text>
      <Text style={{ fontSize: 11, textAlign: 'center', marginBottom: 8 }}>Fuel Price: LKR {fuelPrice}</Text>

      {/* Grouped by driver */}
      {performance.map((stat, idx) => (
        <View key={stat.driverId || idx} wrap={false}>
          <Text style={styles.sectionHeader}>
            Driver: {stat.driverName || stat.name} | Vehicle: {stat.vehicleModel || stat.vehicleType} ({stat.vehicleNumber})
          </Text>
          <Text style={{ fontSize: 10, marginBottom: 2 }}>
            Total Weight: {stat.totalWeight || 0} kg | Total Fuel: {stat.totalFuel ? stat.totalFuel.toFixed(2) : '0.00'} L | Total Cost: LKR {stat.totalCost ? stat.totalCost.toFixed(2) : '0.00'}
          </Text>
          {/* Table */}
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableCell}>Address</Text>
              <Text style={styles.tableCell}>Amount (kg)</Text>
              <Text style={styles.tableCell}>Distance (km)</Text>
              <Text style={styles.tableCell}>Fuel (L)</Text>
              <Text style={styles.tableCellLast}>Cost (LKR)</Text>
            </View>
            {(stat.pickups || []).map((pickup, pidx) => (
              <View style={styles.tableRow} key={pidx}>
                <Text style={styles.tableCell}>{pickup.address}</Text>
                <Text style={styles.tableCell}>{pickup.estimatedAmount || pickup.amount || '0'}</Text>
                <Text style={styles.tableCell}>{pickup.distance ? pickup.distance.toFixed(2) : '0.00'}</Text>
                <Text style={styles.tableCell}>{pickup.fuel ? pickup.fuel.toFixed(2) : '0.00'}</Text>
                <Text style={styles.tableCellLast}>{pickup.cost ? pickup.cost.toFixed(2) : '0.00'}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}

      {/* Footer */}
      <Text style={styles.footer}>
        Generated on: {new Date().toLocaleString()} | Yakadabadu.lk © 2024 All rights reserved
      </Text>
    </Page>
  </Document>
);

export default AssignmentReportPDF; 