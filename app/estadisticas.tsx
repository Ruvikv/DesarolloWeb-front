import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    Text,
    useWindowDimensions,
    View
} from 'react-native';
import styled from 'styled-components/native';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';
import { EstadisticasDashboard, resumenEconomicoService } from '../services/resumenEconomicoService';

// ============================================
// COLORS
// ============================================

const COLORS = {
    primary: '#667eea',
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    info: '#2196f3',
    text: '#333',
    subtext: '#666',
    border: '#ddd',
    bg: '#fff',
    cardBg: '#f9f9f9',
};

// ============================================
// STYLED COMPONENTS
// ============================================

const Container = styled.View`
    flex: 1;
    background-color: #f5f5f5;
`;

const Header = styled.View`
    background-color: ${COLORS.primary};
    padding: 16px;
    padding-top: 40px;
    padding-bottom: 24px;
`;

const Title = styled.Text`
    font-size: 24px;
    font-weight: 700;
    color: #ffffff;
    margin-bottom: 4px;
`;

const Subtitle = styled.Text`
    font-size: 14px;
    color: #e0e7ff;
`;

const Badge = styled.View<{ connected: boolean }>`
    flex-direction: row;
    align-items: center;
    padding: 6px 10px;
    border-radius: 999px;
    border-width: 1px;
    background-color: ${(props) => (props.connected ? '#e8f5e9' : '#ffebee')};
    border-color: ${(props) => (props.connected ? '#c8e6c9' : '#ffcdd2')};
    align-self: flex-start;
    margin-top: 8px;
`;

const BadgeText = styled.Text<{ connected: boolean }>`
    margin-left: 6px;
    font-weight: 600;
    color: ${(props) => (props.connected ? COLORS.success : COLORS.error)};
`;

const GridContainer = styled.View`
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-between;
    padding: 16px;
`;

const MetricCard = styled.View<{ bgColor: string; isMobile: boolean }>`
    width: ${(props) => (props.isMobile ? '100%' : '48%')};
    padding: 16px;
    border-radius: 12px;
    margin-bottom: 12px;
    align-items: center;
    background-color: ${(props) => props.bgColor};
`;

const MetricLabel = styled.Text`
    font-size: 12px;
    color: ${COLORS.subtext};
    margin-top: 8px;
    text-align: center;
`;

const MetricValue = styled.Text<{ color: string }>`
    font-size: 20px;
    font-weight: 700;
    margin-top: 4px;
    color: ${(props) => props.color};
`;

const Card = styled.View`
    background-color: ${COLORS.bg};
    border-radius: 12px;
    padding: 16px;
    border-width: 1px;
    border-color: ${COLORS.border};
    margin: 0 16px 12px 16px;
`;

const CardHeader = styled.View`
    flex-direction: row;
    align-items: center;
    margin-bottom: 12px;
`;

const CardTitle = styled.Text`
    font-size: 16px;
    font-weight: 700;
    margin-left: 8px;
`;

const DetalleRow = styled.View`
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom-width: 0.5px;
    border-bottom-color: #eee;
`;

const DetalleLabel = styled.Text`
    font-size: 14px;
    color: ${COLORS.text};
`;

const DetalleValue = styled.Text`
    font-size: 14px;
    font-weight: 600;
    color: ${COLORS.primary};
`;

const RefreshButton = styled.TouchableOpacity<{ disabled: boolean }>`
    background-color: ${COLORS.primary};
    padding: 12px 16px;
    border-radius: 8px;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    margin: 8px 16px 16px 16px;
    opacity: ${(props) => (props.disabled ? 0.6 : 1)};
`;

const RefreshButtonText = styled.Text`
    color: #fff;
    font-weight: 700;
    font-size: 16px;
`;

const EmptyState = styled.View`
    align-items: center;
    margin-top: 60px;
`;

const EmptyText = styled.Text`
    color: ${COLORS.subtext};
    margin-top: 16px;
    font-size: 16px;
`;

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatMoney(n: number): string {
    return `$ ${Number(n || 0).toLocaleString('es-ES', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

function EstadisticasScreen() {
    const router = useRouter();
    const { logout } = useAuth();
    const { width } = useWindowDimensions();
    const isMobile = width < 640;

    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [connected, setConnected] = useState(false);
    const [estadisticas, setEstadisticas] = useState<EstadisticasDashboard | null>(null);

    useEffect(() => {
        cargarEstadisticas();
    }, []);

    const cargarEstadisticas = async () => {
        try {
            setLoading(true);
            const datos = await resumenEconomicoService.obtenerEstadisticasDashboard();
            setEstadisticas(datos);
            setConnected(true);
        } catch (e: any) {
            console.warn('Error al cargar estadísticas:', e);
            setConnected(false);

            const status = e?.response?.status;
            if (status === 401) {
                Alert.alert('Sesión expirada', 'Vuelve a iniciar sesión para continuar.', [
                    {
                        text: 'Aceptar',
                        onPress: async () => {
                            try {
                                await logout();
                            } catch { }
                            router.replace('/auth/login');
                        },
                    },
                ]);
            } else {
                Alert.alert('Error', e?.message || 'No se pudieron cargar las estadísticas');
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await cargarEstadisticas();
    };

    return (
        <ProtectedRoute>
            <Container>
                <ScrollView
                    contentContainerStyle={{ paddingBottom: 40 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                >
                    {/* Header */}
                    <Header>
                        <Title>📊 Estadísticas Económicas</Title>
                        <Subtitle>Resumen general de tu negocio</Subtitle>

                        <Badge connected={connected}>
                            <Ionicons
                                name={connected ? 'checkmark-circle' : 'close-circle'}
                                size={16}
                                color={connected ? COLORS.success : COLORS.error}
                            />
                            <BadgeText connected={connected}>
                                {connected ? 'Conectado' : 'Sin Conexión'}
                            </BadgeText>
                        </Badge>
                    </Header>

                    {/* Loading State */}
                    {loading && !estadisticas && (
                        <View style={{ padding: 40, alignItems: 'center' }}>
                            <ActivityIndicator size="large" color={COLORS.primary} />
                            <Text style={{ marginTop: 12, color: COLORS.subtext }}>Cargando estadísticas...</Text>
                        </View>
                    )}

                    {/* Métricas Principales */}
                    {estadisticas && (
                        <>
                            <GridContainer>
                                {/* Ingresos Totales */}
                                <MetricCard bgColor="#e8f5e9" isMobile={isMobile}>
                                    <Ionicons name="cash-outline" size={32} color={COLORS.success} />
                                    <MetricLabel>Ingresos Totales</MetricLabel>
                                    <MetricValue color={COLORS.success}>
                                        {formatMoney(estadisticas.ingresos_totales)}
                                    </MetricValue>
                                </MetricCard>

                                {/* Ganancia Total */}
                                <MetricCard bgColor="#f3e5f5" isMobile={isMobile}>
                                    <Ionicons name="trending-up-outline" size={32} color="#9c27b0" />
                                    <MetricLabel>Ganancia Total</MetricLabel>
                                    <MetricValue color="#9c27b0">
                                        {formatMoney(estadisticas.ganancia_total)}
                                    </MetricValue>
                                </MetricCard>

                                {/* Productos Activos */}
                                <MetricCard bgColor="#e3f2fd" isMobile={isMobile}>
                                    <Ionicons name="cube-outline" size={32} color={COLORS.info} />
                                    <MetricLabel>Productos Activos</MetricLabel>
                                    <MetricValue color={COLORS.info}>{estadisticas.productos_activos}</MetricValue>
                                </MetricCard>

                                {/* Alertas de Stock */}
                                <MetricCard bgColor="#fff3e0" isMobile={isMobile}>
                                    <Ionicons name="warning-outline" size={32} color={COLORS.warning} />
                                    <MetricLabel>Alertas de Stock</MetricLabel>
                                    <MetricValue color={COLORS.warning}>{estadisticas.alertas_stock}</MetricValue>
                                </MetricCard>
                            </GridContainer>

                            {/* Desglose de Ventas */}
                            <Card>
                                <CardHeader>
                                    <Ionicons name="analytics-outline" size={20} color={COLORS.primary} />
                                    <CardTitle>Desglose de Ventas</CardTitle>
                                </CardHeader>

                                <DetalleRow>
                                    <DetalleLabel>💵 Ventas Manuales</DetalleLabel>
                                    <DetalleValue>
                                        {formatMoney(estadisticas.desglose_ventas.ventas_manuales)}
                                    </DetalleValue>
                                </DetalleRow>

                                <DetalleRow>
                                    <DetalleLabel>🛒 Ventas Minoristas</DetalleLabel>
                                    <DetalleValue>
                                        {formatMoney(estadisticas.desglose_ventas.ventas_minoristas)}
                                    </DetalleValue>
                                </DetalleRow>

                                <DetalleRow>
                                    <DetalleLabel>📦 Ventas Mayoristas</DetalleLabel>
                                    <DetalleValue>
                                        {formatMoney(estadisticas.desglose_ventas.ventas_mayoristas)}
                                    </DetalleValue>
                                </DetalleRow>
                            </Card>

                            {/* Total de Compras */}
                            <Card>
                                <CardHeader>
                                    <Ionicons name="cart-outline" size={20} color="#f57c00" />
                                    <CardTitle>Inversión en Compras</CardTitle>
                                </CardHeader>

                                <MetricValue color="#f57c00" style={{ marginTop: 8 }}>
                                    {formatMoney(estadisticas.total_compras)}
                                </MetricValue>
                            </Card>

                            {/* Botón Actualizar */}
                            <RefreshButton onPress={cargarEstadisticas} disabled={loading}>
                                <Ionicons name="refresh-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                                <RefreshButtonText>
                                    {loading ? 'Actualizando...' : 'Actualizar Datos'}
                                </RefreshButtonText>
                            </RefreshButton>
                        </>
                    )}

                    {/* Empty State */}
                    {!estadisticas && !loading && (
                        <EmptyState>
                            <Ionicons name="bar-chart-outline" size={64} color="#ccc" />
                            <EmptyText>No hay datos disponibles</EmptyText>
                        </EmptyState>
                    )}
                </ScrollView>
            </Container>
        </ProtectedRoute>
    );
}

export default EstadisticasScreen;
