import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const TRUCK_SPECS = {
  'Toyota Dyna': { capacity: 3000 },
  'Isuzu Elf': { capacity: 4000 },
  'Mitsubishi Canter': { capacity: 3500 },
  'Tata LPT 709/1109': { capacity: 5000 }
};



const AdminPickupListPDF = ({ pickups = [], drivers = [], fuelPrice = 0 }) => {
  // Ensure fuelPrice is treated as number
  const formattedFuelPrice = typeof fuelPrice === 'number' 
    ? fuelPrice.toFixed(2)
    : '0.00';

  return (  // Added return statement here
    <Document>
      <Page style={styles.page}>
        <Text style={styles.header}>Optimized Pickup Schedule</Text>
        
        <Text style={styles.subHeader}>Fuel Price: LKR {formattedFuelPrice}</Text>
        
        {drivers.map((driver) => (
          <View key={driver._id} style={styles.driverSection}>
            <Text style={styles.driverName}>
              Driver: {driver.firstName} {driver.lastName}
            </Text>
            <Text style={styles.driverInfo}>
              Truck: {driver.vehicleType} | Capacity: {TRUCK_SPECS[driver.vehicleType]?.capacity} kg
            </Text>
            
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={styles.tableCell}>Pickup ID</Text>
                <Text style={styles.tableCell}>Weight (kg)</Text>
                <Text style={styles.tableCell}>Distance (km)</Text>
                <Text style={styles.tableCell}>Fuel Cost</Text>
              </View>

              {pickups
                .filter(p => p.driver?._id === driver._id)
                .map((pickup) => (
                  <View style={styles.tableRow} key={pickup._id}>
                    <Text style={styles.tableCell}>{pickup._id.slice(-6)}</Text>
                    <Text style={styles.tableCell}>{pickup.estimatedAmount}</Text>
                    <Text style={styles.tableCell}>{pickup.distance?.toFixed(2)}</Text>
                    <Text style={styles.tableCell}>LKR {(pickup.fuelCost || 0).toFixed(2)}</Text>
                  </View>
                ))}
            </View>
            
            <Text style={styles.totalCost}>
              Total Fuel Cost: LKR {pickups
                .filter(p => p.driver?._id === driver._id)
                .reduce((sum, p) => sum + (p.fuelCost || 0), 0).toFixed(2)}
            </Text>
          </View>
        ))}
      </Page>
    </Document>
  );  // Added closing parenthesis for return
};

// Add new styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
  },
  header: {
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  driverSection: {
    marginBottom: 20,
  },
  driverName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  driverInfo: {
    fontSize: 10,
    marginBottom: 10,
  },
  table: {
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    fontWeight: 'bold',
  },
  tableCell: {
    padding: 5,
    borderStyle: 'solid',
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    width: '25%',
    fontSize: 10,
  },
  totalCost: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 5,
    textAlign: 'right',
  },
  subHeader: {
    fontSize: 10,
    marginBottom: 10,
    textAlign: 'center',
  }
});

export default AdminPickupListPDF;