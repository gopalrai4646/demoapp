import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Image, Modal, FlatList, Switch, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { createTrainingPlanRequest, updateTrainingPlanRequest } from '../store/slices/trainingPlanSlice';
import { fetchCoursesRequest } from '../store/slices/courseSlice';
import { AdminTrainingPlanStackParamList } from '../navigation/types';
import { COLORS, SPACING, ROUNDNESS, TYPOGRAPHY } from '../constants/Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import { uploadToCloudinary } from '../utils/cloudinary';
import { useTranslation } from 'react-i18next';
import { VALIDATION_LIMITS } from '../constants/validation';

type NavigationProp = NativeStackNavigationProp<AdminTrainingPlanStackParamList, 'AdminTrainingPlanDetails'>;

export const AdminTrainingPlanDetails = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<any>();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  
  const planId = route.params?.planId;
  const isEditing = !!planId;

  const { trainingPlans, createLoading, updateLoading } = useSelector((state: RootState) => state.trainingPlans);
  const { courses } = useSelector((state: RootState) => state.courses);
  const { user } = useSelector((state: RootState) => state.auth);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [publicAccess, setPublicAccess] = useState(true);
  
  const [isUploading, setIsUploading] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courseSearch, setCourseSearch] = useState('');
  const [formErrors, setFormErrors] = useState<{name?: string; description?: string; image?: string; courses?: string}>({});

  const loading = createLoading || updateLoading;

  useEffect(() => {
    dispatch(fetchCoursesRequest());
    
    if (isEditing) {
      const plan = trainingPlans.find((p) => p.id === planId);
      if (plan) {
        setName(plan.name);
        setDescription(plan.description);
        setImageUri(plan.image);
        setSelectedCourseIds(plan.courseIds || []);
      }
    }
  }, [dispatch, isEditing, planId, trainingPlans]);

  const handlePickImage = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
    if (result.didCancel || !result.assets || result.assets.length === 0) return;
    
    const uri = result.assets[0].uri;
    if (!uri) return;

    if (result.assets[0].fileSize && result.assets[0].fileSize > VALIDATION_LIMITS.IMAGE.MAX_SIZE_BYTES) {
      Alert.alert(t('adminTrainingPlanDetails.uploadError'), `Image must be under ${VALIDATION_LIMITS.IMAGE.MAX_SIZE_MB}MB`);
      return;
    }

    setIsUploading(true);
    try {
      const url = await uploadToCloudinary(uri, 'image');
      setImageUri(url);
      setFormErrors(prev => ({ ...prev, image: undefined }));
    } catch (error: any) {
      console.error('Image upload failed', error);
      Alert.alert(t('adminTrainingPlanDetails.uploadFailed'), error.message || t('adminTrainingPlanDetails.uploadError'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    let hasError = false;
    const errors: {name?: string; description?: string; image?: string; courses?: string} = {};

    if (!name.trim()) {
      errors.name = t('adminTrainingPlanDetails.nameRequired', "Training plan name is required.");
      hasError = true;
    } else if (name.length < VALIDATION_LIMITS.TRAINING_PLAN.NAME_MIN_LENGTH) {
      errors.name = t('adminTrainingPlanDetails.nameMinLength', `Name must be at least ${VALIDATION_LIMITS.TRAINING_PLAN.NAME_MIN_LENGTH} characters.`);
      hasError = true;
    }

    if (!description.trim()) {
      errors.description = t('adminTrainingPlanDetails.descRequired', "Description is required.");
      hasError = true;
    } else if (description.length < VALIDATION_LIMITS.TRAINING_PLAN.DESCRIPTION_MIN_LENGTH) {
      errors.description = t('adminTrainingPlanDetails.descMinLength', `Description must be at least ${VALIDATION_LIMITS.TRAINING_PLAN.DESCRIPTION_MIN_LENGTH} characters.`);
      hasError = true;
    }

    if (!imageUri) {
      errors.image = t('adminTrainingPlanDetails.imageRequired', "Please upload a training plan image.");
      hasError = true;
    }

    if (selectedCourseIds.length === 0) {
      errors.courses = t('adminTrainingPlanDetails.coursesRequired', "Please select at least one course.");
      hasError = true;
    }

    setFormErrors(errors);

    if (hasError) {
      return;
    }

    if (isUploading) {
      Alert.alert(t('adminTrainingPlanDetails.pleaseWait'), t('adminTrainingPlanDetails.uploading'));
      return;
    }

    const payload = {
      name,
      description,
      image: imageUri || '',
      courseIds: selectedCourseIds,
    };

    if (isEditing) {
      dispatch(updateTrainingPlanRequest({ ...payload, id: planId }));
    } else {
      dispatch(createTrainingPlanRequest(payload));
    }
    
    navigation.goBack();
  };

  const availableCourses = courses.filter(c => 
    !selectedCourseIds.includes(c.id) &&
    (c.title.toLowerCase().includes(courseSearch.toLowerCase()) || 
     c.instructor?.toLowerCase().includes(courseSearch.toLowerCase()))
  );

  const curriculumCourses = selectedCourseIds.map(id => courses.find(c => c.id === id)).filter(Boolean) as any[];

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top || SPACING.md }]}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
        <Text style={styles.closeIcon}>✕</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{t('adminTrainingPlanDetails.planManager')}</Text>
      <View style={styles.profileContainer}>
        {user?.photoURL ? (
          <Image source={{ uri: user.photoURL }} style={styles.profileImage} />
        ) : (
          <Text style={styles.profileInitial}>{user?.displayName?.charAt(0)?.toUpperCase() || 'A'}</Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {isEditing && <Text style={styles.modeOverline}>{t('adminTrainingPlanDetails.editingMode')}</Text>}
        <Text style={TYPOGRAPHY.headline}>{isEditing ? t('adminTrainingPlanDetails.planDetails') : t('adminTrainingPlanDetails.createNewPlan')}</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>{t('adminTrainingPlanDetails.planName')}</Text>
          <TextInput
            style={[styles.input, formErrors.name ? styles.inputError : null]}
            placeholder={t('adminTrainingPlanDetails.enterPlanName')}
            placeholderTextColor={COLORS.outline}
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (formErrors.name) setFormErrors(prev => ({ ...prev, name: undefined }));
            }}
            maxLength={VALIDATION_LIMITS.TRAINING_PLAN.NAME_MAX_LENGTH}
          />
          <View style={styles.inputFooter}>
            <Text style={styles.errorText}>{formErrors.name || ''}</Text>
            <Text style={styles.charCount}>{name.length}/{VALIDATION_LIMITS.TRAINING_PLAN.NAME_MAX_LENGTH}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.thumbnailUpload, imageUri ? { backgroundColor: '#000' } : null]} 
          activeOpacity={0.8}
          onPress={handlePickImage}
          disabled={isUploading}
        >
          {isUploading ? (
            <ActivityIndicator color="#fff" />
          ) : imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.thumbnailPreview} />
          ) : (
            <View style={styles.thumbnailPlaceholder}>
              <View style={styles.camIconWrapper}>
                <Text style={styles.camIcon}>📸</Text>
              </View>
              <Text style={styles.thumbUploadText}>{isEditing ? t('adminTrainingPlanDetails.changeCover') : t('adminTrainingPlanDetails.uploadCover')}</Text>
            </View>
          )}
        </TouchableOpacity>
        {formErrors.image && <Text style={[styles.errorText, { marginTop: 4, marginLeft: 4 }]}>{formErrors.image}</Text>}

        <View style={styles.formGroup}>
          <Text style={styles.label}>{t('adminTrainingPlanDetails.description')}</Text>
          <TextInput
            style={[styles.input, styles.textArea, formErrors.description ? styles.inputError : null]}
            placeholder={t('adminTrainingPlanDetails.enterDescription')}
            placeholderTextColor={COLORS.outline}
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={(text) => {
              setDescription(text);
              if (formErrors.description) setFormErrors(prev => ({ ...prev, description: undefined }));
            }}
            maxLength={VALIDATION_LIMITS.TRAINING_PLAN.DESCRIPTION_MAX_LENGTH}
            textAlignVertical="top"
          />
          <View style={styles.inputFooter}>
            <Text style={styles.errorText}>{formErrors.description || ''}</Text>
            <Text style={styles.charCount}>{description.length}/{VALIDATION_LIMITS.TRAINING_PLAN.DESCRIPTION_MAX_LENGTH}</Text>
          </View>
        </View>

        <View style={styles.visibilityCard}>
          <View style={styles.visibilityInfo}>
            <Text style={styles.eyeIcon}>👁️</Text>
            <View>
              <Text style={styles.visibilityTitle}>{t('adminTrainingPlanDetails.publicVisibility')}</Text>
              <Text style={styles.visibilityDesc}>{t('adminTrainingPlanDetails.publicVisibilityDesc')}</Text>
            </View>
          </View>
          <Switch 
            value={publicAccess}
            onValueChange={setPublicAccess}
            trackColor={{ false: COLORS.outlineVariant, true: COLORS.primary }}
            thumbColor={'#fff'}
          />
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>{t('adminTrainingPlanDetails.curriculum')}</Text>
          <TouchableOpacity style={styles.addCourseBtn} onPress={() => setShowCourseModal(true)}>
            <Text style={styles.addCourseText}>{t('adminTrainingPlanDetails.addCourse')}</Text>
          </TouchableOpacity>
        </View>
        {formErrors.courses && <Text style={[styles.errorText, { marginLeft: 4, marginBottom: 8 }]}>{formErrors.courses}</Text>}

        {curriculumCourses.map((course, index) => (
          <View key={course.id} style={styles.lessonCard}>
            <View style={styles.dragHandles}>
              <Text style={styles.handleIcon}>▴</Text>
              <Text style={styles.handleIcon}>▾</Text>
            </View>
            <View style={styles.lessonIconWrapper}>
                <Text style={styles.lessonIcon}>📚</Text>
            </View>
            <View style={styles.lessonInfo}>
               <Text style={styles.lessonTitle}>{course.title}</Text>
              <View style={styles.lessonMeta}>
                <Text style={styles.metaReady}>{course.instructor}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.deleteLessonBtn} onPress={() => {
                const newIds = [...selectedCourseIds];
                newIds.splice(index, 1);
                setSelectedCourseIds(newIds);
                if (formErrors.courses && newIds.length === 0) {
                  // Maintain error if emptied
                } else if (formErrors.courses) {
                   setFormErrors(prev => ({ ...prev, courses: undefined }));
                }
            }}>
              <Text style={styles.deleteLessonIcon}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}

        {curriculumCourses.length === 0 && (
          <View style={{ alignItems: 'center', marginVertical: SPACING.xl }}>
             <Text style={{ color: COLORS.outline }}>{t('adminTrainingPlanDetails.noCoursesAdded')}</Text>
          </View>
        )}

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingVertical: 10, paddingBottom: 10 }]}>
        <TouchableOpacity 
            style={[styles.saveCourseBtn, loading && { opacity: 0.7 }]} 
            onPress={handleSave}
            disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.onPrimary} />
          ) : (
            <Text style={styles.saveCourseText}>{isEditing ? t('adminTrainingPlanDetails.updatePlan') : t('adminTrainingPlanDetails.createPlan')}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Course Selection Modal */}
      <Modal visible={showCourseModal} animationType="slide" presentationStyle="formSheet">
        <View style={styles.modalBg}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowCourseModal(false)} style={styles.closeBtn}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{t('adminTrainingPlanDetails.selectCourses')}</Text>
              <View style={{ width: 32 }} />
            </View>
            
            <View style={styles.modalSearch}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder={t('adminTrainingPlanDetails.searchCourses')}
                placeholderTextColor={COLORS.outline}
                value={courseSearch}
                onChangeText={setCourseSearch}
              />
            </View>

            <FlatList
              data={availableCourses}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.modalListContent}
              renderItem={({ item }) => (
                <View style={styles.modalLessonCard}>
                  <View style={styles.lessonIconWrapper}>
                    <Text style={styles.lessonIcon}>📚</Text>
                  </View>
                  <View style={styles.modalLessonInfo}>
                    <Text style={styles.lessonTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.metaReady}>{item.instructor}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.modalAddBtn}
                    onPress={() => {
                      setSelectedCourseIds([...selectedCourseIds, item.id]);
                      if (formErrors.courses) setFormErrors(prev => ({ ...prev, courses: undefined }));
                    }}
                  >
                    <Text style={styles.actionIconPrimary}>{t('adminTrainingPlanDetails.add')}</Text>
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={
                 <View style={{ alignItems: 'center', marginTop: 40 }}>
                    <Text style={{ color: COLORS.outline }}>{t('adminTrainingPlanDetails.noMatchingCourses')}</Text>
                 </View>
              }
            />
            
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, SPACING.md) }]}>
               <TouchableOpacity style={styles.saveCourseBtn} onPress={() => setShowCourseModal(false)}>
                 <Text style={styles.saveCourseText}>{t('adminTrainingPlanDetails.done')}</Text>
               </TouchableOpacity>
            </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceContainer,
  },
  closeBtn: {
    padding: 4,
  },
  closeIcon: {
    fontSize: 20,
    color: COLORS.primary,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  profileContainer: {
    width: 32,
    height: 32,
    borderRadius: ROUNDNESS.full,
    backgroundColor: COLORS.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileInitial: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.outline,
  },
  scrollContent: {
    paddingBottom: SPACING.xxl,
  },
  modeOverline: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: COLORS.primary,
    marginBottom: 4,
  },
  formGroup: {
    marginTop: SPACING.md,
  },
  label: {
    fontSize: 12,
    color: COLORS.secondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#eceef0', // surfaceContainer
    borderRadius: ROUNDNESS.lg,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.onSurface,
  },
  inputError: {
    borderColor: COLORS.error,
    borderWidth: 1,
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    flex: 1,
  },
  charCount: {
    color: COLORS.outline,
    fontSize: 12,
    marginLeft: 16,
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },
  thumbnailUpload: {
    marginTop: SPACING.md,
    height: 140,
    backgroundColor: '#6c7185', // subtle placeholder tone mimicking design
    borderRadius: ROUNDNESS.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailPlaceholder: {
    alignItems: 'center',
  },
  thumbnailPreview: {
    width: '100%',
    height: '100%',
    borderRadius: ROUNDNESS.xl,
    resizeMode: 'cover',
  },
  camIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: ROUNDNESS.full,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  camIcon: {
    fontSize: 20,
  },
  thumbUploadText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  visibilityCard: {
    backgroundColor: '#ffffff',
    borderRadius: ROUNDNESS.xl,
    padding: 12,
    marginTop: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  visibilityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  eyeIcon: {
    fontSize: 20,
    color: COLORS.primary,
    marginRight: 12,
  },
  visibilityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  visibilityDesc: {
    fontSize: 12,
    color: COLORS.outline,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  addCourseBtn: {
    backgroundColor: COLORS.secondaryContainer,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: ROUNDNESS.full,
  },
  addCourseText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  lessonCard: {
    backgroundColor: '#ffffff',
    borderRadius: ROUNDNESS.xl,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  dragHandles: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  handleIcon: {
    fontSize: 10,
    color: COLORS.outlineVariant,
  },
  lessonIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: ROUNDNESS.full,
    backgroundColor: COLORS.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  lessonIcon: {
    fontSize: 18,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.onSurface,
    marginBottom: 4,
  },
  lessonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaReady: {
    fontSize: 12,
    color: COLORS.outline,
  },
  deleteLessonBtn: {
    padding: 8,
    marginLeft: 8,
  },
  deleteLessonIcon: {
    color: '#ef4444',
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceContainer,
  },
  saveCourseBtn: {
    backgroundColor: COLORS.primaryContainer,
    borderRadius: ROUNDNESS.full,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveCourseText: {
    color: COLORS.onPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  modalBg: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
    paddingTop: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceContainer,
  },
  modalSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerHighest,
    marginHorizontal: SPACING.md,
    borderRadius: ROUNDNESS.xl,
    paddingHorizontal: SPACING.md,
    height: 44,
    marginVertical: SPACING.sm,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
    opacity: 0.6,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.onSurface,
    fontFamily: 'Inter-Regular',
  },
  modalListContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  modalLessonCard: {
    backgroundColor: '#ffffff',
    borderRadius: ROUNDNESS.xl,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  modalLessonInfo: {
    flex: 1,
    marginRight: 10,
  },
  modalAddBtn: {
    padding: 8,
  },
  actionIconPrimary: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
});

