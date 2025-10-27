import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { geolocationService } from '../services/apiService';

interface AddressSuggestion {
  display_name: string;
  lat: number;
  lng: number;
}

interface AddressAutocompleteProps {
  value: string;
  onAddressSelect: (address: string) => void;
  placeholder?: string;
  style?: any;
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onAddressSelect,
  placeholder = "Ingresa tu dirección...",
  style
}) => {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (inputValue.trim().length >= 3) {
      setIsLoading(true);
      debounceRef.current = setTimeout(async () => {
        try {
          const results = await geolocationService.getAddressSuggestions(inputValue);
          if (isMountedRef.current) {
            setSuggestions(results);
            setShowSuggestions(results.length > 0);
          }
        } catch (error) {
          console.warn('Error obteniendo sugerencias:', error);
          if (isMountedRef.current) {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        } finally {
          if (isMountedRef.current) {
            setIsLoading(false);
          }
        }
      }, 300);
    } else {
      if (isMountedRef.current) {
        setSuggestions([]);
        setShowSuggestions(false);
        setIsLoading(false);
      }
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [inputValue]);

  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    if (isMountedRef.current) {
      setInputValue(suggestion.display_name);
      onAddressSelect(suggestion.display_name);
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  const handleTextChange = (text: string) => {
    if (isMountedRef.current) {
      setInputValue(text);
      if (text.trim().length < 3) {
        setShowSuggestions(false);
        setSuggestions([]);
      }
    }
  };

  const renderSuggestion = ({ item }: { item: AddressSuggestion }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSelectSuggestion(item)}
    >
      <Text style={styles.suggestionText} numberOfLines={2}>
        {item.display_name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, style]}>
      <TextInput
        value={inputValue}
        onChangeText={handleTextChange}
        placeholder={placeholder}
        style={styles.textInput}
        autoCapitalize="words"
        autoCorrect={false}
      />
      
      {isLoading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Buscando direcciones...</Text>
        </View>
      )}
      
      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            renderItem={renderSuggestion}
            keyExtractor={(item, index) => `${item.lat}-${item.lng}-${index}`}
            style={styles.suggestionsList}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#6c757d',
    fontStyle: 'italic',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 18,
  },
});

export default AddressAutocomplete;