import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { Star, X } from 'lucide-react-native';
import { COLORS, SPACING, TYPOGRAPHY, ROUNDNESS } from '../constants/Theme';
import { useTranslation } from 'react-i18next';

interface CourseRatingModalProps {
  isVisible: boolean;
  courseName: string;
  onClose: () => void;
  onSubmit: (rating: number) => void;
}

const CourseRatingModal: React.FC<CourseRatingModalProps> = ({
  isVisible,
  courseName,
  onClose,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);

  const handleStarPress = (index: number) => {
    setRating(index + 1);
  };

  const handleSubmit = () => {
    if (rating > 0) {
      onSubmit(rating);
    }
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <X size={20} color={COLORS.outline} />
              </TouchableOpacity>

              <View style={styles.content}>
                <View style={styles.iconWrapper}>
                  <View style={styles.iconOuterBox}>
                    <View style={styles.iconInnerBox}>
                      <Star size={32} color="#4F46E5" fill="#4F46E5" />
                    </View>
                  </View>
                </View>

                <Text style={styles.title}>{t('rating.title')}</Text>
                
                <Text style={styles.subtitle}>
                  {t('rating.subtitle', { courseName: courseName })}
                </Text>

                <View style={styles.starsRow}>
                  {[0, 1, 2, 3, 4].map((index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleStarPress(index)}
                      style={styles.starWrapper}
                    >
                      <Star
                        size={44}
                        color={index < rating ? '#FFB800' : '#E2E8F0'}
                        fill={index < rating ? '#FFB800' : 'transparent'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    rating > 0 && styles.submitButtonActive
                  ]}
                  onPress={handleSubmit}
                  disabled={rating === 0}
                >
                  <Text style={[
                    styles.submitButtonText,
                    rating > 0 && styles.submitButtonTextActive
                  ]}>
                    {t('rating.submit')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.laterButton} onPress={onClose}>
                  <Text style={styles.laterButtonText}>{t('rating.later')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: SPACING.lg,
    position: 'relative',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  closeButton: {
    position: 'absolute',
    right: SPACING.md,
    top: SPACING.md,
    zIndex: 1,
  },
  content: {
    alignItems: 'center',
    paddingTop: SPACING.md,
  },
  iconWrapper: {
    marginBottom: SPACING.lg,
  },
  iconOuterBox: {
    width: 80,
    height: 80,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  iconInnerBox: {
    width: 60,
    height: 60,
    backgroundColor: '#E0E7FF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.sm,
  },
  starsRow: {
    flexDirection: 'row',
    marginBottom: SPACING.xl,
  },
  starWrapper: {
    marginHorizontal: 4,
  },
  submitButton: {
    width: '100%',
    backgroundColor: '#F1F5F9',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  submitButtonActive: {
    backgroundColor: '#4F46E5',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94A3B8',
  },
  submitButtonTextActive: {
    color: '#FFFFFF',
  },
  laterButton: {
    paddingVertical: SPACING.sm,
  },
  laterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
});

export default CourseRatingModal;
