import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { compartirProducto, compartirProductos, copiarProductosAlPortapapeles } from '../services/compartirService';

interface BotonCompartirProps {
    productosIds: string[];
    variant?: 'primary' | 'secondary' | 'icon';
    onCompartido?: () => void;
}

export default function BotonCompartir({
    productosIds,
    variant = 'primary',
    onCompartido
}: BotonCompartirProps) {
    const [cargando, setCargando] = useState(false);

    const handleCompartir = async () => {
        if (productosIds.length === 0) {
            Alert.alert('Error', 'No hay productos seleccionados para compartir');
            return;
        }

        setCargando(true);
        try {
            const resultado = productosIds.length === 1
                ? await compartirProducto(productosIds[0])
                : await compartirProductos(productosIds);

            if (resultado.success) {
                Alert.alert('✅ Éxito', resultado.message);
                onCompartido?.();
            } else {
                Alert.alert('⚠️ Aviso', resultado.message);
            }
        } catch (error) {
            Alert.alert('❌ Error', 'No se pudo compartir los productos');
        } finally {
            setCargando(false);
        }
    };

    const handleCopiar = async () => {
        setCargando(true);
        try {
            const resultado = await copiarProductosAlPortapapeles(productosIds);
            Alert.alert(
                resultado.success ? '✅ Copiado' : '❌ Error',
                resultado.message
            );
        } catch (error) {
            Alert.alert('❌ Error', 'No se pudo copiar al portapapeles');
        } finally {
            setCargando(false);
        }
    };

    const mostrarOpciones = () => {
        // En web algunos entornos no muestran correctamente Alert; ejecutar compartir directamente
        if ((typeof navigator !== 'undefined') && (Platform.OS === 'web')) {
            handleCompartir();
            return;
        }
        Alert.alert(
            '📤 Compartir Productos',
            `${productosIds.length} producto(s) seleccionado(s)`,
            [
                {
                    text: '📱 Compartir (Móvil/Web)',
                    onPress: handleCompartir,
                },
                {
                    text: '📋 Copiar al portapapeles',
                    onPress: handleCopiar,
                },
                {
                    text: 'Cancelar',
                    style: 'cancel',
                },
            ]
        );
    };

    if (variant === 'icon') {
        return (
            <TouchableOpacity
                onPress={mostrarOpciones}
                style={styles.iconButton}
                disabled={cargando}
            >
                {cargando ? (
                    <ActivityIndicator size="small" color="#007AFF" />
                ) : (
                    <Ionicons name="share-social" size={24} color="#007AFF" />
                )}
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            style={[
                styles.button,
                variant === 'secondary' && styles.buttonSecondary,
                cargando && styles.buttonDisabled,
            ]}
            onPress={mostrarOpciones}
            disabled={cargando}
        >
            {cargando ? (
                <ActivityIndicator size="small" color="#FFF" />
            ) : (
                <View style={styles.buttonContent}>
                    <Ionicons
                        name="share-social"
                        size={20}
                        color={variant === 'secondary' ? '#007AFF' : '#FFF'}
                    />
                    <Text
                        style={[
                            styles.buttonText,
                            variant === 'secondary' && styles.buttonTextSecondary,
                        ]}
                    >
                        Compartir ({productosIds.length})
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#007AFF',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonSecondary: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    buttonTextSecondary: {
        color: '#007AFF',
    },
    iconButton: {
        padding: 8,
    },
});
