// DailySummaryPDF.js
import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 30 },
  header: { fontSize: 18, marginBottom: 20 },
  table: { display: "table", width: "100%", borderStyle: "solid" },
  row: { flexDirection: "row" },
  cell: { 
    width: "20%", 
    borderStyle: "solid", 
    borderWidth: 1, 
    padding: 5 
  }
});

const DailySummaryPDF = ({ pickups, date }) => (
  <Document>
    <Page style={styles.page}>
      <Text style={styles.header}>Daily Pickup Summary - {new Date(date).toLocaleDateString()}</Text>
      
      <Text style={styles.sectionHeader}>Completed Pickups</Text>
      <View style={styles.table}>
        <View style={styles.row}>
          <Text style={styles.cell}>User Phone</Text>
          <Text style={styles.cell}>Address</Text>
          <Text style={styles.cell}>Driver</Text>
          <Text style={styles.cell}>Weight</Text>
        </View>
        
        {pickups.filter(p => p.status === 'completed').map(pickup => (
          <View style={styles.row} key={pickup._id}>
            <Text style={styles.cell}>{pickup.user?.phone || 'N/A'}</Text>
            <Text style={styles.cell}>{pickup.address}</Text>
            <Text style={styles.cell}>{pickup.driver?.firstName || 'Unassigned'}</Text>
            <Text style={styles.cell}>{pickup.weight} kg</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionHeader}>Cancelled Pickups</Text>
      <View style={styles.table}>
        <View style={styles.row}>
          <Text style={styles.cell}>User Phone</Text>
          <Text style={styles.cell}>Address</Text>
          <Text style={styles.cell}>Reason</Text>
        </View>
        
        {pickups.filter(p => p.status === 'cancelled').map(pickup => (
          <View style={styles.row} key={pickup._id}>
            <Text style={styles.cell}>{pickup.user?.phone || 'N/A'}</Text>
            <Text style={styles.cell}>{pickup.address}</Text>
            <Text style={styles.cell}>{pickup.cancellationReason}</Text>
          </View>
        ))}
      </View>
    </Page>
  </Document>
);

export default DailySummaryPDF;