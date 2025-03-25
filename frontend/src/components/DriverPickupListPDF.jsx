import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 12,
    fontFamily: 'Helvetica',
  },
  header: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  table: {
    display: 'table',
    width: '100%',
    borderWidth: 1,
    borderColor: '#000',
    marginTop: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    backgroundColor: '#fff',
  },
  tableCell: {
    flex: 1,
    padding: 8,
    textAlign: 'center',
    borderRightWidth: 1,
    borderRightColor: '#000',
    fontSize: 10,
    wordBreak: 'break-word',
  },
  tableCellLast: {
    flex: 1,
    padding: 8,
    textAlign: 'center',
    fontSize: 10,
    wordBreak: 'break-word',
  },
  tableHeader: {
    backgroundColor: '#f2f2f2',
    fontWeight: 'bold',
    paddingVertical: 10,
  },
});

const DriverPickupListPDF = ({ pickups }) => (
  <Document>
    <Page style={styles.page}>
      <Text style={styles.header}>Today's Pickup List</Text>
      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={[styles.tableCell, { flex: 2 }]}>Pickup ID</Text>
          <Text style={[styles.tableCell, { flex: 1.5 }]}>Contact Number</Text>
          <Text style={styles.tableCell}>Name</Text>
          <Text style={styles.tableCell}>Address</Text>
          <Text style={styles.tableCell}>Estimated Amount (kg)</Text>
          <Text style={styles.tableCellLast}>Selected Item</Text>
        </View>

        {pickups.map((pickup) => (
          <View style={styles.tableRow} key={pickup._id}>
            <Text style={[styles.tableCell, { flex: 2 }]}>{pickup._id}</Text>
            <Text style={[styles.tableCell, { flex: 1.5 }]}>{pickup.contactNumber}</Text>
            <Text style={styles.tableCell}>{pickup.user?.name || 'Customer'}</Text>
            <Text style={styles.tableCell}>{pickup.address}</Text>
            <Text style={styles.tableCell}>{pickup.estimatedAmount.toFixed(2)}</Text>
            <Text style={styles.tableCellLast}>{pickup.chooseItem}</Text>
          </View>
        ))}
      </View>
    </Page>
  </Document>
);

export default DriverPickupListPDF;