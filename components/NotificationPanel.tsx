import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { InAppNotification, useNotification } from '../contexts/NotificationsContext';

interface NotificationPanelProps {
    visible: boolean;
    onClose: () => void;
}

export default function NotificationPanel({ visible, onClose }: NotificationPanelProps) {
    const router = useRouter();
    const {
        inAppNotifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
    } = useNotification();

    const getIcon = (type: InAppNotification['type']) => {
        switch (type) {
            case 'order':
                return { name: 'cart' as const, color: '#4caf50' };
            case 'stock':
                return { name: 'warning' as const, color: '#ff9800' };
            case 'reminder':
                return { name: 'time' as const, color: '#2196f3' };
            default:
                return { name: 'information-circle' as const, color: '#9e9e9e' };
        }
    };

    const handleNotificationPress = (notif: InAppNotification) => {
        markAsRead(notif.id);
        if (notif.route) {
            onClose();
            router.push(notif.route as any);
        }
    };

    const formatTime = (timestamp: number) => {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Ahora';
        if (minutes < 60) return `Hace ${minutes}m`;
        if (hours < 24) return `Hace ${hours}h`;
        return `Hace ${days}d`;
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.panel}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <Ionicons name="notifications" size={24} color="#7b1fa2" />
                            <Text style={styles.headerTitle}>Notificaciones</Text>
                            {unreadCount > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{unreadCount}</Text>
                                </View>
                            )}
                        </View>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>

                    {/* Actions */}
                    {inAppNotifications.length > 0 && (
                        <View style={styles.actions}>
                            {unreadCount > 0 && (
                                <TouchableOpacity onPress={markAllAsRead} style={styles.actionButton}>
                                    <Ionicons name="checkmark-done" size={16} color="#7b1fa2" />
                                    <Text style={styles.actionText}>Marcar todas como leídas</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity onPress={clearAll} style={styles.actionButton}>
                                <Ionicons name="trash-outline" size={16} color="#d32f2f" />
                                <Text style={[styles.actionText, { color: '#d32f2f' }]}>Limpiar todo</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Notifications List */}
                    <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
                        {inAppNotifications.length === 0 ? (
                            <View style={styles.empty}>
                                <Ionicons name="notifications-off-outline" size={64} color="#ccc" />
                                <Text style={styles.emptyText}>No tienes notificaciones</Text>
                            </View>
                        ) : (
                            inAppNotifications.map((notif) => {
                                const icon = getIcon(notif.type);
                                return (
                                    <TouchableOpacity
                                        key={notif.id}
                                        style={[styles.notifCard, !notif.read && styles.unread]}
                                        onPress={() => handleNotificationPress(notif)}
                                    >
                                        <View style={[styles.iconContainer, { backgroundColor: icon.color + '20' }]}>
                                            <Ionicons name={icon.name} size={24} color={icon.color} />
                                        </View>
                                        <View style={styles.notifContent}>
                                            <Text style={styles.notifTitle}>{notif.title}</Text>
                                            <Text style={styles.notifMessage} numberOfLines={2}>
                                                {notif.message}
                                            </Text>
                                            <Text style={styles.notifTime}>{formatTime(notif.timestamp)}</Text>
                                        </View>
                                        <View style={styles.notifActions}>
                                            {!notif.read && <View style={styles.unreadDot} />}
                                            <TouchableOpacity
                                                onPress={(e) => {
                                                    e.stopPropagation();
                                                    deleteNotification(notif.id);
                                                }}
                                                style={styles.deleteButton}
                                            >
                                                <Ionicons name="trash-outline" size={18} color="#999" />
                                            </TouchableOpacity>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    panel: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
    },
    badge: {
        backgroundColor: '#d32f2f',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
        minWidth: 24,
        alignItems: 'center',
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        backgroundColor: '#f5f5f5',
    },
    actionText: {
        fontSize: 12,
        color: '#7b1fa2',
        fontWeight: '600',
    },
    list: {
        flex: 1,
    },
    listContent: {
        padding: 16,
    },
    empty: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#999',
    },
    notifCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#f0f0f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    unread: {
        backgroundColor: '#f3e5f5',
        borderColor: '#7b1fa2',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    notifContent: {
        flex: 1,
    },
    notifTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#333',
        marginBottom: 4,
    },
    notifMessage: {
        fontSize: 13,
        color: '#666',
        lineHeight: 18,
        marginBottom: 4,
    },
    notifTime: {
        fontSize: 11,
        color: '#999',
    },
    notifActions: {
        alignItems: 'center',
        gap: 8,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#7b1fa2',
    },
    deleteButton: {
        padding: 4,
    },
});
