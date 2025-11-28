// Función helper para agregar notificaciones de prueba
// Puedes llamar esto desde la consola del navegador para probar

import { useNotification } from '../contexts/NotificationsContext';

export function useTestNotifications() {
    const { addNotification } = useNotification();

    const addOrderNotification = () => {
        addNotification({
            type: 'order',
            title: '🛍️ Nueva Compra',
            message: 'Juan Pérez realizó un pedido por $1,250.00',
            route: '/pedidos/admin',
        });
    };

    const addStockNotification = () => {
        addNotification({
            type: 'stock',
            title: '⚠️ Stock Bajo',
            message: 'El producto "Tornillos 1/4" tiene solo 5 unidades disponibles',
            route: '/productos',
        });
    };

    const addReminderNotification = () => {
        addNotification({
            type: 'reminder',
            title: '📊 Recordatorio',
            message: 'No olvides revisar las ventas del día',
            route: '/estadisticas',
        });
    };

    const addInfoNotification = () => {
        addNotification({
            type: 'info',
            title: 'ℹ️ Información',
            message: 'El sistema se actualizará esta noche a las 2:00 AM',
        });
    };

    return {
        addOrderNotification,
        addStockNotification,
        addReminderNotification,
        addInfoNotification,
    };
}
