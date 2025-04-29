import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import logoGreen from '../assets/logoGreen.png';

// Styles
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
  receiptNumber: {
    fontSize: 10,
    color: '#888',
    textAlign: 'right',
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

// Component
const DriverPickupListPDF = ({ pickups }) => (
  <Document>
    <Page style={styles.page}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Image src={logoGreen} style={styles.logo} />
        <Text style={styles.companyName}>YAKADABADU.LK</Text>
      </View>
      <Text style={styles.subHeader}>Waste Management Solutions</Text>
      <View style={styles.line} />
      <Text style={styles.title}>Today's Pickup List</Text>

      {/* Receipt Number */}
      {pickups?.length > 0 && (
        <Text style={styles.receiptNumber}>Receipt #: {pickups[0]._id}</Text>
      )}

      {/* Table */}
      <View style={styles.table}>
        {/* Table Header */}
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={[styles.tableCell, { flex: 2 }]}>Pickup ID</Text>
          <Text style={[styles.tableCell, { flex: 1.5 }]}>Contact Number</Text>
          <Text style={styles.tableCell}>Name</Text>
          <Text style={styles.tableCell}>Address</Text>
          <Text style={styles.tableCell}>Est. Amount (kg)</Text>
          <Text style={styles.tableCellLast}>Selected Item</Text>
        </View>

        {/* Table Rows */}
        {pickups?.map((pickup) => (
          <View style={styles.tableRow} key={pickup._id}>
            <Text style={[styles.tableCell, { flex: 2 }]}>{pickup._id}</Text>
            <Text style={[styles.tableCell, { flex: 1.5 }]}>{pickup.contactNumber}</Text>
            <Text style={styles.tableCell}>{pickup.user?.name || 'Customer'}</Text>
            <Text style={styles.tableCell}>{pickup.address}</Text>
            <Text style={styles.tableCell}>
              {pickup.estimatedAmount?.toFixed(2) || '0.00'}
            </Text>
            <Text style={styles.tableCellLast}>{pickup.chooseItem}</Text>
          </View>
        ))}
      </View>

      {/* Footer */}
      <Text style={styles.footer}>
        Generated on: {new Date().toLocaleString()} | Yakadabadu.lk © 2024 All rights reserved
      </Text>
    </Page>
  </Document>
);

export default DriverPickupListPDF;
