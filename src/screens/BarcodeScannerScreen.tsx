import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Camera, CameraView, BarcodeScanningResult } from 'expo-camera';

export function BarcodeScannerScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const onScan = route.params?.onScan;
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualISBN, setManualISBN] = useState('');
  const [flashOn, setFlashOn] = useState(false);

  useEffect(() => {
    const getPermission = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };
    getPermission();
  }, []);

  const handleBarCodeScanned = (result: BarcodeScanningResult) => {
    if (scanned) return;
    setScanned(true);
    
    if (onScan) {
      onScan(result.data);
    }
    navigation.goBack();
  };

  const handleManualSubmit = () => {
    if (!manualISBN.trim()) {
      Alert.alert('Error', 'Please enter an ISBN');
      return;
    }
    
    if (onScan) {
      onScan(manualISBN.trim());
    }
    navigation.goBack();
  };

  if (hasPermission === null) {
    return (
      <View style={styles.centered}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.centered}>
          <Ionicons name="camera-outline" size={64} color="#888" />
          <Text style={styles.permissionText}>Camera permission is required</Text>
          <Text style={styles.permissionSubtext}>
            Please enable camera access in your device settings
          </Text>
          
          <TouchableOpacity
            style={styles.manualButton}
            onPress={() => setShowManualInput(true)}
          >
            <Text style={styles.manualButtonText}>Enter ISBN Manually</Text>
          </TouchableOpacity>
        </View>

        {showManualInput && (
          <View style={styles.manualInputOverlay}>
            <View style={styles.manualInputCard}>
              <Text style={styles.manualInputTitle}>Enter ISBN</Text>
              <TextInput
                style={styles.manualInput}
                value={manualISBN}
                onChangeText={setManualISBN}
                placeholder="ISBN (10 or 13 digits)"
                keyboardType="number-pad"
                autoFocus
              />
              <View style={styles.manualInputButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowManualInput(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleManualSubmit}
                >
                  <Text style={styles.submitButtonText}>Search</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    );
  }

  // Web fallback
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="close" size={28} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan Barcode</Text>
          <View style={{ width: 28 }} />
        </View>
        
        <View style={styles.webContainer}>
          <Ionicons name="barcode-outline" size={80} color="#888" />
          <Text style={styles.webTitle}>Barcode scanning is not available on web</Text>
          <Text style={styles.webSubtitle}>Please enter the ISBN manually</Text>
          
          <View style={styles.webInputContainer}>
            <TextInput
              style={styles.webInput}
              value={manualISBN}
              onChangeText={setManualISBN}
              placeholder="Enter ISBN (10 or 13 digits)"
              keyboardType="number-pad"
            />
            <TouchableOpacity
              style={styles.webSubmitButton}
              onPress={handleManualSubmit}
            >
              <Text style={styles.webSubmitText}>Search</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'],
        }}
      />
      
      <View style={styles.overlay}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitleLight}>Scan Barcode</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.scanArea}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <Text style={styles.scanHint}>Position barcode within frame</Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setFlashOn(!flashOn)}
          >
            <Ionicons
              name={flashOn ? 'flash' : 'flash-off'}
              size={24}
              color="#fff"
            />
            <Text style={styles.controlLabel}>Flash</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setShowManualInput(true)}
          >
            <Ionicons name="keypad" size={24} color="#fff" />
            <Text style={styles.controlLabel}>Manual</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showManualInput && (
        <View style={styles.manualInputOverlay}>
          <View style={styles.manualInputCard}>
            <Text style={styles.manualInputTitle}>Enter ISBN</Text>
            <TextInput
              style={styles.manualInput}
              value={manualISBN}
              onChangeText={setManualISBN}
              placeholder="ISBN (10 or 13 digits)"
              keyboardType="number-pad"
              autoFocus
            />
            <View style={styles.manualInputButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowManualInput(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleManualSubmit}
              >
                <Text style={styles.submitButtonText}>Search</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  overlay: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  headerTitleLight: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 280,
    height: 120,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#fff',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  scanHint: {
    color: '#fff',
    fontSize: 14,
    marginTop: 24,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 48,
    paddingBottom: 60,
  },
  controlButton: {
    alignItems: 'center',
  },
  controlLabel: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
  permissionText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    color: '#fff',
  },
  permissionSubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
  },
  manualButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 12,
  },
  manualButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  manualInputOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  manualInputCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
  },
  manualInputTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  manualInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    textAlign: 'center',
  },
  manualInputButtons: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  webContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f8f8f8',
  },
  webTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 24,
    textAlign: 'center',
  },
  webSubtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
  },
  webInputContainer: {
    width: '100%',
    maxWidth: 320,
    marginTop: 32,
  },
  webInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  webSubmitButton: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  webSubmitText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
