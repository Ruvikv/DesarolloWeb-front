import { Stack } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '../../services/authService';

const { width, height } = Dimensions.get('window');

export default function RegisterRevendedor() {
  const [formData, setFormData] = useState({
    nombreNegocio: '',
    nombre: '',
    apellido: '',
    condicionFiscal: '',
    email: '',
    telefono: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.nombreNegocio.trim()) {
      Alert.alert('Error', 'El nombre del negocio es obligatorio');
      return false;
    }
    if (!formData.nombre.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return false;
    }
    if (!formData.apellido.trim()) {
      Alert.alert('Error', 'El apellido es obligatorio');
      return false;
    }
    if (!formData.condicionFiscal.trim()) {
      Alert.alert('Error', 'La condición fiscal es obligatoria');
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert('Error', 'El email es obligatorio');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      Alert.alert('Error', 'El formato del email no es válido');
      return false;
    }
    if (!formData.telefono.trim()) {
      Alert.alert('Error', 'El teléfono es obligatorio');
      return false;
    }
    if (!formData.password) {
      Alert.alert('Error', 'La contraseña es obligatoria');
      return false;
    }
    if (formData.password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return false;
    }
    if (!formData.acceptTerms) {
      Alert.alert('Error', 'Debes aceptar los términos y condiciones');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const response = await authService.createProfileRevendedor(
        formData.nombreNegocio,
        formData.nombre,
        formData.apellido,
        formData.condicionFiscal,
        formData.email,
        formData.telefono,
        formData.password
      );
      Alert.alert(
        "Registro Exitoso",
        "¡Tu cuenta ha sido creada correctamente!",
        [
        {
          text: "OK",
          onPress: () => {
            setFormData({
            nombreNegocio: '',
            nombre: '',
            apellido: '',
            condicionFiscal: '',
            email: '',
            telefono: '',
            password: '',
            confirmPassword: '',
            acceptTerms: false,
          });
          },
        },
      ]
    );
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo completar el registro");
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "Registro" }} />
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <Text style={styles.title}>Crear Cuenta</Text>
              <Text style={styles.subtitle}>Únete como revendedor</Text>
            </View>

            <View style={styles.formContainer} role="form">
              {/* Nombre Negocio */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Nombre del Negocio *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.nombreNegocio}
                  onChangeText={(value) => handleInputChange('nombreNegocio', value)}
                  placeholder="Ej: Tienda López"
                  placeholderTextColor="#999"
                />
              </View>

              {/* Nombre y Apellido */}
              <View style={styles.nameRow}>
                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <Text style={styles.label}>Nombre *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.nombre}
                    onChangeText={(value) => handleInputChange('nombre', value)}
                    placeholder="Tu nombre"
                    placeholderTextColor="#999"
                  />
                </View>
                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <Text style={styles.label}>Apellido *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.apellido}
                    onChangeText={(value) => handleInputChange('apellido', value)}
                    placeholder="Tu apellido"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>

              {/* Condición Fiscal */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Condición Fiscal *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.condicionFiscal}
                  onChangeText={(value) => handleInputChange('condicionFiscal', value)}
                  placeholder="Monotributista, Responsable Inscripto..."
                  placeholderTextColor="#999"
                />
              </View>

              {/* Email */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(value) => handleInputChange('email', value)}
                  placeholder="tu@email.com"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Teléfono */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Teléfono *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.telefono}
                  onChangeText={(value) => handleInputChange('telefono', value)}
                  placeholder="+54 9 11 1234-5678"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                />
              </View>

              {/* Password */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Contraseña *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.password}
                  onChangeText={(value) => handleInputChange('password', value)}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor="#999"
                  secureTextEntry={!showPassword}
                />
              </View>

              {/* Confirmar Password */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirmar Contraseña *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.confirmPassword}
                  onChangeText={(value) => handleInputChange('confirmPassword', value)}
                  placeholder="Repite tu contraseña"
                  placeholderTextColor="#999"
                  secureTextEntry={!showConfirmPassword}
                />
              </View>

              {/* Terms */}
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => handleInputChange('acceptTerms', !formData.acceptTerms)}
              >
                <View style={[styles.checkbox, formData.acceptTerms && styles.checkboxChecked]}>
                  {formData.acceptTerms && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxText}>
                  Acepto los <Text style={styles.linkText}>términos y condiciones</Text>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.submitButtonText}>Crear Cuenta</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  // 👇 mantenemos los mismos estilos de tu versión
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  keyboardAvoidingView: { flex: 1 },
  scrollContainer: { paddingBottom: 20 },
  header: {
    backgroundColor: '#fff',
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#212529', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#6c757d', textAlign: 'center' },
  formContainer: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  inputContainer: { marginBottom: 16 },
  halfWidth: { flex: 1 },
  label: { fontSize: 14, fontWeight: '600', color: '#495057', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#212529',
    backgroundColor: '#fff',
  },
  checkboxContainer: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#dee2e6',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: '#007bff', borderColor: '#007bff' },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  checkboxText: { flex: 1, fontSize: 14, color: '#495057' },
  linkText: { color: '#007bff', fontWeight: '600' },
  submitButton: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
