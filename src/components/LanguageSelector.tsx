import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  Animated,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, SPACING, ROUNDNESS } from '../constants/Theme';
import { LANGUAGES } from '../i18n';
import { ChevronDown, Check } from 'lucide-react-native';

interface LanguageSelectorProps {
  topOffset: number;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ topOffset }) => {
  const { i18n } = useTranslation();
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  const handleLanguageChange = useCallback((langCode: string) => {
    i18n.changeLanguage(langCode);
    setDropdownVisible(false);
  }, [i18n]);

  const toggleDropdown = () => setDropdownVisible(!dropdownVisible);

  return (
    <>
      <TouchableOpacity
        style={styles.selectorButton}
        onPress={toggleDropdown}
        activeOpacity={0.7}
      >
        <Text style={styles.flagText}>{currentLang.flag}</Text>
        <ChevronDown
          size={12}
          color={COLORS.onSurfaceVariant}
          style={dropdownVisible ? styles.chevronUp : undefined}
        />
      </TouchableOpacity>

      <Modal
        visible={dropdownVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={toggleDropdown}
      >
        <Pressable style={styles.modalOverlay} onPress={toggleDropdown}>
          <View style={[styles.dropdownContainer, { top: topOffset }]}>
            {/* Small arrow indicator at top */}
            <View style={styles.dropdownArrow} />

            {LANGUAGES.map((lang, index) => {
              const isSelected = lang.code === i18n.language;
              const isLast = index === LANGUAGES.length - 1;

              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageOption,
                    isSelected && styles.languageOptionSelected,
                    !isLast && styles.languageOptionBorder,
                  ]}
                  onPress={() => handleLanguageChange(lang.code)}
                  activeOpacity={0.6}
                >
                  <View style={styles.languageOptionLeft}>
                    <Text style={styles.langLabel}>{lang.label}</Text>
                    <Text style={styles.langFlag}>{lang.flag}</Text>
                  </View>
                  {isSelected && (
                    <Check size={16} color={COLORS.primary} strokeWidth={3} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLow,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: ROUNDNESS.full,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    gap: 4,
  },
  flagText: {
    fontSize: 18,
  },
  chevronUp: {
    transform: [{ rotate: '180deg' }],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  dropdownContainer: {
    position: 'absolute',
    right: 56,
    backgroundColor: '#fff',
    width: 140,
    borderRadius: ROUNDNESS.lg,
    paddingVertical: 4,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  dropdownArrow: {
    position: 'absolute',
    top: -6,
    right: 20,
    width: 12,
    height: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: COLORS.outlineVariant,
    transform: [{ rotate: '45deg' }],
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  languageOptionSelected: {
    backgroundColor: `${COLORS.primaryContainer}10`,
  },
  languageOptionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceContainer,
  },
  languageOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  langLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onSurface,
    letterSpacing: 0.5,
  },
  langFlag: {
    fontSize: 20,
  },
});
