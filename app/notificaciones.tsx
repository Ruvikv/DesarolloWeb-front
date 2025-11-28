import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationsContext';
import { registerManualToken, sendTestNotification } from '../services/notificationsService';

export default function NotificacionesScreen() {
    const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
    const [manualToken, setManualToken] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useAuth();
    const { expoPushToken, requestPermission } = useNotification();

    useEffect(() => {
        checkPermissions();
    }, []);

    const checkPermissions = async () => {
        const { status } = await Notifications.getPermissionsAsync();
        setPermissionStatus(status);
    };

    const handleEnableNotifications = async () => {
        setIsLoading(true);
        try {
            const granted = await requestPermission();
            if (granted) {
                await checkPermissions();
                Alert.alert('✅ Éxito', 'Notificaciones activadas correctamente');
            } else {
                Alert.alert('❌ Error', 'No se pudieron activar las notificaciones');
            }
        } catch (error) {
            Alert.alert('❌ Error', 'Ocurrió un error al activar las notificaciones');
        } finally {
            setIsLoading(false);
        }
    };

    const handleTestNotification = async () => {
        if (!user?.id) {
            Alert.alert('⚠️ Error', 'No se pudo obtener el ID del usuario');
            return;
        }

        setIsLoading(true);
        try {
            await sendTestNotification(user.id);
            Alert.alert('📤 Enviado', 'Revisa tu dispositivo en unos segundos');
        } catch (error) {
            console.error('Error enviando notificación:', error);
            Alert.alert('❌ Error', 'No se pudo enviar la notificación de prueba');
        } finally {
            setIsLoading(false);
        }
    };

    const handleManualRegister = async () => {
        if (!user?.id || !manualToken) return;

        setIsLoading(true);
        try {
            const success = await registerManualToken(user.id, manualToken);
            if (success) {
                Alert.alert('✅ Vinculado', 'El token manual se ha registrado. Ahora al enviar prueba, debería llegar a ese dispositivo.');
                setManualToken(''); // Limpiar
            } else {
                Alert.alert('❌ Error', 'No se pudo registrar el token manual.');
            }
        } catch (error) {
            Alert.alert('❌ Error', 'Ocurrió un error al registrar.');
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = () => {
        switch (permissionStatus) {
            case 'granted':
                return '#4caf50';
            case 'denied':
                return '#f44336';
            default:
                return '#ff9800';
        }
    };

    const getStatusText = () => {
        switch (permissionStatus) {
            case 'granted':
                return '✅ Concedidos';
            case 'denied':
                return '❌ Denegados';
            default:
                return '⚠️ Desconocido';
        }
    };

    return (
        <ScrollView style={styles.container}>
            <LinearGradient
                colors={['#7b1fa2', '#9c27b0', '#ba68c8']}
                style={styles.header}
            >
                <Ionicons name="notifications" size={64} color="#fff" />
                <Text style={styles.headerTitle}>Notificaciones Push</Text>
                <Text style={styles.headerSubtitle}>
                    Configura y prueba las notificaciones de tu tienda
                </Text>
            </LinearGradient>

            <View style={styles.content}>
                {/* Estado de Permisos */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="shield-checkmark" size={24} color="#7b1fa2" />
                        <Text style={styles.cardTitle}>Estado de Permisos</Text>
                    </View>
                    <View style={styles.statusContainer}>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
                            <Text style={styles.statusText}>{getStatusText()}</Text>
                        </View>
                    </View>
                </View>

                {/* Token de Push */}
                {expoPushToken && (
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="key" size={24} color="#7b1fa2" />
                            <Text style={styles.cardTitle}>Token de Push</Text>
                        </View>
                        <View style={styles.tokenContainer}>
                            <Text style={styles.tokenText} numberOfLines={2} selectable>
                                {expoPushToken}
                            </Text>
                        </View>
                        <Text style={styles.tokenHint}>
                            Este token identifica tu dispositivo para recibir notificaciones
                        </Text>
                    </View>
                )}

                {/* Información del Dispositivo */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="phone-portrait" size={24} color="#7b1fa2" />
                        <Text style={styles.cardTitle}>Información</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Plataforma:</Text>
                        <Text style={styles.infoValue}>{Platform.OS === 'ios' ? 'iOS' : 'Android'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Usuario ID:</Text>
                        <Text style={styles.infoValue}>{user?.id || 'No disponible'}</Text>
                    </View>
                </View>

                {/* Botones de Acción */}
                <View style={styles.actionsContainer}>
                    {permissionStatus !== 'granted' && (
                        <TouchableOpacity
                            style={[styles.button, styles.primaryButton]}
                            onPress={handleEnableNotifications}
                            disabled={isLoading}
                        >
                            <LinearGradient
                                colors={['#7b1fa2', '#9c27b0']}
                                style={styles.buttonGradient}
                            >
                                <Ionicons name="notifications-outline" size={24} color="#fff" />
                                <Text style={styles.buttonText}>
                                    {isLoading ? 'Activando...' : 'Activar Notificaciones'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    )}

                    {expoPushToken && (
                        <TouchableOpacity
                            style={[styles.button, styles.secondaryButton]}
                            onPress={handleTestNotification}
                            disabled={isLoading}
                        >
                            <Ionicons name="send" size={24} color="#7b1fa2" />
                            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                                {isLoading ? 'Enviando...' : 'Enviar Notificación de Prueba'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Registro Manual de Token */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="construct" size={24} color="#7b1fa2" />
                        <Text style={styles.cardTitle}>Vincular Dispositivo Manual</Text>
                    </View>
                    <Text style={styles.tokenHint}>
                        Si tienes un token de otro dispositivo (ej: de un compañero), ingrésalo aquí para enviarle pruebas.
                    </Text>
                    <TextInput
                        style={styles.input}
                        placeholder="ExponentPushToken[...]"
                        value={manualToken}
                        onChangeText={setManualToken}
                        autoCapitalize="none"
                    />
                    <TouchableOpacity
                        style={[styles.button, styles.secondaryButton, { marginTop: 12 }]}
                        onPress={handleManualRegister}
                        disabled={isLoading || !manualToken}
                    >
                        <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                            Vincular Token Manual
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Información Adicional */}
                <View style={[styles.infoCard, { backgroundColor: '#e8f5e9' }]}>
                    <Ionicons name="information-circle" size={24} color="#2e7d32" />
                    <Text style={styles.infoCardText}>
                        Modo Demo Activo: Las notificaciones se simularán localmente en Web y Emuladores para propósitos de prueba.
                    </Text>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        padding: 32,
        alignItems: 'center',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 16,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#fff',
        marginTop: 8,
        textAlign: 'center',
        opacity: 0.9,
    },
    content: {
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginLeft: 12,
        color: '#333',
    },
    statusContainer: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    statusBadge: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    statusText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    tokenContainer: {
        backgroundColor: '#f5f5f5',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    tokenText: {
        fontSize: 12,
        color: '#666',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    tokenHint: {
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic',
        marginTop: 4,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    infoLabel: {
        fontSize: 14,
        color: '#666',
        fontWeight: '600',
    },
    infoValue: {
        fontSize: 14,
        color: '#333',
    },
    actionsContainer: {
        gap: 12,
        marginBottom: 16,
    },
    button: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    primaryButton: {
        shadowColor: '#7b1fa2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        gap: 12,
    },
    secondaryButton: {
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#7b1fa2',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        gap: 12,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    secondaryButtonText: {
        color: '#7b1fa2',
    },
    infoCard: {
        backgroundColor: '#e3f2fd',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 16,
    },
    infoCardText: {
        flex: 1,
        fontSize: 14,
        color: '#555',
        lineHeight: 20,
    },
    input: {
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        padding: 16,
        fontSize: 14,
        color: '#333',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        marginTop: 8,
    },
});
