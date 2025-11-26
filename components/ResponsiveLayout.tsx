import React from 'react';
import { SafeAreaView, ScrollView, ScrollViewProps, View, ViewProps } from 'react-native';
import { useSettings, useThemeColors } from '../contexts/SettingsContext';
import { screenUtils, useResponsive } from '../utils/responsiveUtils';

interface ResponsiveContainerProps extends ViewProps {
  children: React.ReactNode;
  padding?: boolean;
  maxWidth?: number;
  center?: boolean;
}

interface ResponsiveScrollContainerProps extends ScrollViewProps {
  children: React.ReactNode;
  padding?: boolean;
  maxWidth?: number;
  center?: boolean;
}

// Container responsivo básico
export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  padding = true,
  maxWidth = 1200,
  center = true,
  style,
  ...props
}) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const { density } = useSettings();
  const colors = useThemeColors();
  
  const padFactor = density === 'compact' ? 0.5 : density === 'cozy' ? 0.75 : 1;
  const responsivePadding = padding ? screenUtils.getResponsivePadding() * padFactor : 0;
  
  const containerStyle: any = [
    {
      flex: 1,
      paddingHorizontal: responsivePadding,
      maxWidth: isDesktop ? maxWidth : undefined,
      alignSelf: center ? ('center' as const) : undefined,
      width: '100%',
      backgroundColor: colors.background,
    },
    style,
  ];

  return (
    <View style={containerStyle} {...props}>
      {children}
    </View>
  );
};

// ScrollView responsivo
export const ResponsiveScrollContainer: React.FC<ResponsiveScrollContainerProps> = ({
  children,
  padding = true,
  maxWidth = 1200,
  center = true,
  contentContainerStyle,
  ...props
}) => {
  const { isDesktop } = useResponsive();
  const { density } = useSettings();
  const colors = useThemeColors();
  
  const padFactor = density === 'compact' ? 0.5 : density === 'cozy' ? 0.75 : 1;
  const responsivePadding = padding ? screenUtils.getResponsivePadding() * padFactor : 0;
  
  const containerStyle: any = [
    {
      paddingHorizontal: responsivePadding,
      maxWidth: isDesktop ? maxWidth : undefined,
      alignSelf: center ? ('center' as const) : undefined,
      width: '100%',
    },
    contentContainerStyle,
  ];

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={containerStyle}
      showsVerticalScrollIndicator={false}
      bounces={false}
      {...props}
    >
      {children}
    </ScrollView>
  );
};

// SafeArea responsivo
export const ResponsiveSafeArea: React.FC<ResponsiveContainerProps> = ({
  children,
  padding = true,
  maxWidth = 1200,
  center = true,
  style,
  ...props
}) => {
  const colors = useThemeColors();
  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: colors.background }, style]} {...props}>
      <ResponsiveContainer
        padding={padding}
        maxWidth={maxWidth}
        center={center}
      >
        {children}
      </ResponsiveContainer>
    </SafeAreaView>
  );
};

// Grid responsivo
interface ResponsiveGridProps extends ViewProps {
  children: React.ReactNode;
  columns?: number;
  spacing?: number;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  columns,
  spacing = 16,
  style,
  ...props
}) => {
  const { isMobile, isTablet, isDesktop, deviceCategory } = useResponsive();
  
  // Calcular número de columnas automáticamente si no se especifica
  const gridColumns = columns || (isMobile ? 1 : isTablet ? 2 : 3);
  
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          flexWrap: 'wrap',
          marginHorizontal: -spacing / 2,
          marginVertical: -spacing / 2,
        },
        style,
      ] as any}
      {...props}
    >
      {React.Children.map(children, (child, index) => (
        <View
          key={index}
          style={{
            width: `${100 / gridColumns}%`,
            paddingHorizontal: spacing / 2,
            paddingVertical: spacing / 2,
          }}
        >
          {child}
        </View>
      ))}
    </View>
  );
};

// Card responsiva
interface ResponsiveCardProps extends ViewProps {
  children: React.ReactNode;
  padding?: boolean;
  shadow?: boolean;
}

export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
  children,
  padding = true,
  shadow = true,
  style,
  ...props
}) => {
  const { density } = useSettings();
  const colors = useThemeColors();
  const padFactor = density === 'compact' ? 0.5 : density === 'cozy' ? 0.75 : 1;
  const responsivePadding = padding ? screenUtils.getResponsivePadding() * 0.75 * padFactor : 0;
  
  const cardStyle: any = [
    {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: responsivePadding,
      shadowColor: shadow ? (colors.textPrimary === '#e5e7eb' ? '#000' : '#000') : undefined,
      shadowOffset: shadow ? { width: 0, height: 2 } : undefined,
      shadowOpacity: shadow ? 0.1 : undefined,
      shadowRadius: shadow ? 4 : undefined,
      elevation: shadow ? 3 : 0,
      borderWidth: 0.5,
      borderColor: colors.border,
    },
    style,
  ];

  return (
    <View style={cardStyle} {...props}>
      {children}
    </View>
  );
};

// Header responsivo
interface ResponsiveHeaderProps extends ViewProps {
  children: React.ReactNode;
  height?: number;
  backgroundColor?: string;
}

export const ResponsiveHeader: React.FC<ResponsiveHeaderProps> = ({
  children,
  height,
  backgroundColor = '#667eea',
  style,
  ...props
}) => {
  const { isMobile, isTablet } = useResponsive();
  const colors = useThemeColors();
  
  const headerHeight = height || (isMobile ? 120 : isTablet ? 140 : 160);
  
  const headerStyle: any = [
    {
      height: headerHeight,
      backgroundColor: backgroundColor || colors.accent,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: screenUtils.getResponsivePadding(),
    },
    style,
  ];

  return (
    <View style={headerStyle} {...props}>
      {children}
    </View>
  );
};

export default {
  ResponsiveContainer,
  ResponsiveScrollContainer,
  ResponsiveSafeArea,
  ResponsiveGrid,
  ResponsiveCard,
  ResponsiveHeader,
};
