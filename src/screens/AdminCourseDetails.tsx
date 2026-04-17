import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Switch, Image } from 'react-native';
import { COLORS, SPACING, ROUNDNESS, TYPOGRAPHY } from '../constants/Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

const AdminCourseDetails = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user } = useSelector((state: RootState) => state.auth);

  const [title, setTitle] = useState('Modern Architecture: Spatial Logic');
  const [description, setDescription] = useState('This comprehensive module explores the intersection of brutalist geometry and contemporary sustainable materials. Students will analyze structural integrity through the lens of...');
  const [instructor, setInstructor] = useState('Dr. Elena Van');
  const [price, setPrice] = useState('149.99');
  const [isPublic, setIsPublic] = useState(true);

  const [lessons, setLessons] = useState([
    { id: '1', title: '01. Foundations of Geometry', duration: '12:45', status: 'Ready' },
    { id: '2', title: '02. Materiality in Design', duration: 'Uploading 68%', status: 'Uploading' },
    { id: '3', title: '03. Lighting and Ambient', duration: 'Duration: Pending', status: 'Pending' },
  ]);

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top || SPACING.md }]}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
        <Text style={styles.closeIcon}>✕</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Course Manager</Text>
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

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.modeOverline}>EDITING MODE</Text>
        <Text style={TYPOGRAPHY.headline}>Course Details</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Course Title</Text>
          <TextInput 
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter title"
            placeholderTextColor={COLORS.outline}
          />
        </View>

        <TouchableOpacity style={styles.thumbnailUpload} activeOpacity={0.8}>
          <View style={styles.thumbnailPlaceholder}>
            <View style={styles.camIconWrapper}>
              <Text style={styles.camIcon}>📸</Text>
            </View>
            <Text style={styles.thumbUploadText}>Change Thumbnail</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Course Description</Text>
          <TextInput 
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter description"
            placeholderTextColor={COLORS.outline}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.formGroup, { flex: 1, marginRight: SPACING.md }]}>
            <Text style={styles.label}>Instructor</Text>
            <TouchableOpacity style={styles.inputDropdown}>
              <Text style={styles.dropdownText}>{instructor}</Text>
              <Text style={styles.dropdownIcon}>↕</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.formGroup, { flex: 1 }]}>
            <Text style={styles.label}>Price</Text>
            <View style={styles.priceInputWrapper}>
              <Text style={styles.currencyIcon}>$</Text>
              <TextInput 
                style={styles.priceInput}
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        <View style={styles.visibilityCard}>
          <View style={styles.visibilityInfo}>
            <Text style={styles.eyeIcon}>👁️</Text>
            <View>
              <Text style={styles.visibilityTitle}>Public Visibility</Text>
              <Text style={styles.visibilityDesc}>Make this course discoverable in catalog</Text>
            </View>
          </View>
          <Switch 
            value={isPublic}
            onValueChange={setIsPublic}
            trackColor={{ false: COLORS.outlineVariant, true: COLORS.primary }}
            thumbColor={'#fff'}
          />
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Course Content</Text>
          <TouchableOpacity style={styles.addLessonBtn}>
            <Text style={styles.addLessonText}>+ Add Lesson</Text>
          </TouchableOpacity>
        </View>

        {lessons.map((lesson, idx) => (
          <View key={lesson.id} style={styles.lessonCard}>
            <View style={styles.dragHandles}>
              <Text style={styles.handleIcon}>▴</Text>
              <Text style={styles.handleIcon}>▾</Text>
            </View>
            <View style={styles.lessonIconWrapper}>
              <Text style={styles.lessonIcon}>🎬</Text>
            </View>
            <View style={styles.lessonInfo}>
              <Text style={styles.lessonTitle}>{lesson.title}</Text>
              <View style={styles.lessonMeta}>
                <Text style={lesson.status === 'Ready' ? styles.metaReady : styles.metaPending}>
                  {lesson.duration}
                </Text>
                {lesson.status === 'Ready' && <Text style={styles.metaStatusReady}> • ✔ Ready</Text>}
              </View>
              {lesson.status === 'Uploading' && (
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: '68%' }]} />
                </View>
              )}
            </View>
            {lesson.status !== 'Pending' && (
              <TouchableOpacity style={styles.deleteLessonBtn}>
                <Text style={styles.deleteLessonIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveCourseBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.saveCourseText}>Save Course</Text>
        </TouchableOpacity>
      </View>
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
    paddingBottom: SPACING.md,
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
    padding: SPACING.md,
  },
  modeOverline: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: COLORS.primary,
    marginBottom: 4,
  },
  formGroup: {
    marginTop: SPACING.lg,
  },
  label: {
    fontSize: 12,
    color: COLORS.secondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#eceef0', // surfaceContainer
    borderRadius: ROUNDNESS.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.onSurface,
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },
  thumbnailUpload: {
    marginTop: SPACING.lg,
    height: 180,
    backgroundColor: '#6c7185', // subtle placeholder tone mimicking design
    borderRadius: ROUNDNESS.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailPlaceholder: {
    alignItems: 'center',
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
  row: {
    flexDirection: 'row',
  },
  inputDropdown: {
    flexDirection: 'row',
    backgroundColor: '#eceef0',
    borderRadius: ROUNDNESS.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontSize: 15,
    color: COLORS.onSurface,
  },
  dropdownIcon: {
    fontSize: 16,
    color: COLORS.outline,
  },
  priceInputWrapper: {
    flexDirection: 'row',
    backgroundColor: '#eceef0',
    borderRadius: ROUNDNESS.lg,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  currencyIcon: {
    fontSize: 16,
    color: COLORS.primary,
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.onSurface,
  },
  visibilityCard: {
    backgroundColor: '#ffffff',
    borderRadius: ROUNDNESS.xl,
    padding: SPACING.md,
    marginTop: SPACING.xl,
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
    marginTop: SPACING.xxl,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.onSurface,
  },
  addLessonBtn: {
    backgroundColor: COLORS.secondaryContainer,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: ROUNDNESS.full,
  },
  addLessonText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  lessonCard: {
    backgroundColor: '#ffffff',
    borderRadius: ROUNDNESS.xl,
    padding: 16,
    marginBottom: 12,
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
    fontSize: 11,
    color: COLORS.outline,
  },
  metaPending: {
    fontSize: 11,
    color: COLORS.outline,
  },
  metaStatusReady: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '500',
  },
  progressBarBg: {
    height: 4,
    backgroundColor: COLORS.surfaceContainerHigh,
    borderRadius: 2,
    marginTop: 6,
    width: '80%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    paddingBottom: SPACING.xxl,
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
});

export default AdminCourseDetails;
