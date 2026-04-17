import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Switch, Image, ActivityIndicator, Alert } from 'react-native';
import { COLORS, SPACING, ROUNDNESS, TYPOGRAPHY } from '../constants/Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { createCourseRequest, updateCourseRequest, Course, VideoItem } from '../store/slices/courseSlice';
import { launchImageLibrary } from 'react-native-image-picker';
import { uploadToCloudinary } from '../utils/cloudinary';

type AdminCourseDetailsRouteProp = RouteProp<AdminCourseStackParamList, 'AdminCourseDetails'>;

const AdminCourseDetails = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<AdminCourseDetailsRouteProp>();
  const dispatch = useDispatch();
  
  const { courseId } = route.params || {};
  const isEditing = !!courseId;

  const { courses, createLoading, updateLoading } = useSelector((state: RootState) => state.courses);
  const { user } = useSelector((state: RootState) => state.auth);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructor, setInstructor] = useState(user?.displayName || '');
  const [price, setPrice] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [thumbnail, setThumbnail] = useState('');
  const [videos, setVideos] = useState<VideoItem[]>([]);
  
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingVideos, setUploadingVideos] = useState<number[]>([]); // Array of indices currently uploading

  useEffect(() => {
    if (isEditing) {
      const course = courses.find(c => c.id === courseId);
      if (course) {
        setTitle(course.title);
        setDescription(course.description);
        setInstructor(course.instructor);
        setPrice(course.price.toString());
        setIsPublic(course.visibility !== 'private');
        setThumbnail(course.thumbnail || '');
        setVideos(course.videos || []);
      }
    } else {
        // Reset fields for new course
        setTitle('');
        setDescription('');
        setInstructor(user?.displayName || '');
        setPrice('');
        setIsPublic(true);
        setThumbnail('');
        setVideos([]);
    }
  }, [courseId, courses, isEditing, user]);

  const handleThumbnailPick = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
    });

    if (result.assets && result.assets[0].uri) {
      setUploadingThumbnail(true);
      try {
        const url = await uploadToCloudinary(result.assets[0].uri, 'image');
        setThumbnail(url);
      } catch (error: any) {
        Alert.alert('Upload Error', error.message);
      } finally {
        setUploadingThumbnail(false);
      }
    }
  };

  const handleVideoPick = async (index: number) => {
    const result = await launchImageLibrary({
      mediaType: 'video',
    });

    if (result.assets && result.assets[0].uri) {
      setUploadingVideos(prev => [...prev, index]);
      try {
        const url = await uploadToCloudinary(result.assets[0].uri, 'video');
        const duration = result.assets[0].duration || 0;
        
        const newVids = [...videos];
        newVids[index] = { ...newVids[index], url, duration };
        setVideos(newVids);
      } catch (error: any) {
        Alert.alert('Upload Error', error.message);
      } finally {
        setUploadingVideos(prev => prev.filter(i => i !== index));
      }
    }
  };

  const handleSave = () => {
    if (!title || !description || !instructor || !price) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (uploadingThumbnail || uploadingVideos.length > 0) {
      Alert.alert('Please Wait', 'Media is still uploading...');
      return;
    }

    const payload = {
      title,
      description,
      instructor,
      price: parseFloat(price),
      visibility: isPublic ? ('public' as const) : ('private' as const),
      videos,
      thumbnail: thumbnail,
    };

    if (isEditing) {
      dispatch(updateCourseRequest({ id: courseId, ...payload }));
      Alert.alert('Success', 'Course updated successfully', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } else {
      dispatch(createCourseRequest(payload));
      Alert.alert('Success', 'Course created successfully', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    }
  };

  const handleAddLesson = () => {
    const newLesson: VideoItem = {
      title: 'New Lesson',
      url: '',
      order: videos.length + 1,
      duration: 0,
    };
    setVideos([...videos, newLesson]);
  };

  const handleDeleteLesson = (index: number) => {
    const updatedVideos = videos.filter((_, i) => i !== index);
    setVideos(updatedVideos);
  };

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
        {isEditing && <Text style={styles.modeOverline}>EDITING MODE</Text>}
        <Text style={TYPOGRAPHY.headline}>{isEditing ? 'Course Details' : 'Create New Course'}</Text>

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

        <TouchableOpacity 
          style={[styles.thumbnailUpload, thumbnail ? { backgroundColor: '#000' } : null]} 
          activeOpacity={0.8}
          onPress={handleThumbnailPick}
          disabled={uploadingThumbnail}
        >
          {uploadingThumbnail ? (
            <ActivityIndicator color="#fff" />
          ) : thumbnail ? (
            <Image source={{ uri: thumbnail }} style={styles.thumbnailPreview} />
          ) : (
            <View style={styles.thumbnailPlaceholder}>
              <View style={styles.camIconWrapper}>
                <Text style={styles.camIcon}>📸</Text>
              </View>
              <Text style={styles.thumbUploadText}>{isEditing ? 'Change Thumbnail' : 'Upload Thumbnail'}</Text>
            </View>
          )}
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
            <View style={styles.inputDropdown}>
               <TextInput 
                style={[styles.dropdownText, { flex: 1, height: 20, padding: 0 }]}
                value={instructor}
                onChangeText={setInstructor}
                placeholder="Instructor Name"
                placeholderTextColor={COLORS.outline}
              />
            </View>
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
                placeholder="0.00"
                placeholderTextColor={COLORS.outline}
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
          <TouchableOpacity style={styles.addLessonBtn} onPress={handleAddLesson}>
            <Text style={styles.addLessonText}>+ Add Lesson</Text>
          </TouchableOpacity>
        </View>

        {videos.map((lesson, idx) => {
          const isUploading = uploadingVideos.includes(idx);
          const hasUrl = !!lesson.url;

          return (
            <View key={idx.toString()} style={styles.lessonCard}>
              <View style={styles.dragHandles}>
                <Text style={styles.handleIcon}>▴</Text>
                <Text style={styles.handleIcon}>▾</Text>
              </View>
              <TouchableOpacity 
                style={[styles.lessonIconWrapper, hasUrl && { backgroundColor: COLORS.primaryContainer }]}
                onPress={() => handleVideoPick(idx)}
                disabled={isUploading}
              >
                {isUploading ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <Text style={styles.lessonIcon}>{hasUrl ? '✅' : '🎬'}</Text>
                )}
              </TouchableOpacity>
              <View style={styles.lessonInfo}>
                 <TextInput 
                  style={styles.lessonTitle}
                  value={lesson.title}
                  onChangeText={(val) => {
                      const newVids = [...videos];
                      newVids[idx] = { ...newVids[idx], title: val };
                      setVideos(newVids);
                  }}
                  placeholder="Lesson Title"
                />
                <View style={styles.lessonMeta}>
                  <Text style={styles.metaReady}>
                    {isUploading ? 'Uploading...' : hasUrl ? (lesson.duration ? `${Math.floor(lesson.duration / 60)}:${(lesson.duration % 60).toString().padStart(2, '0')}` : 'Ready') : 'No video uploaded'}
                  </Text>
                  {!hasUrl && !isUploading && (
                    <TouchableOpacity onPress={() => handleVideoPick(idx)}>
                      <Text style={[styles.metaStatusReady, { color: COLORS.primary, marginLeft: 8 }]}>Upload Video</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              <TouchableOpacity style={styles.deleteLessonBtn} onPress={() => handleDeleteLesson(idx)}>
                <Text style={styles.deleteLessonIcon}>✕</Text>
              </TouchableOpacity>
            </View>
          );
        })}


        <View style={{ height: 90 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
            style={[styles.saveCourseBtn, (createLoading || updateLoading) && { opacity: 0.7 }]} 
            onPress={handleSave}
            disabled={createLoading || updateLoading}
        >
          {createLoading || updateLoading ? (
            <ActivityIndicator color={COLORS.onPrimary} />
          ) : (
            <Text style={styles.saveCourseText}>{isEditing ? 'Update Course' : 'Create Course'}</Text>
          )}
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
  row: {
    flexDirection: 'row',
  },
  inputDropdown: {
    flexDirection: 'row',
    backgroundColor: '#eceef0',
    borderRadius: ROUNDNESS.lg,
    paddingHorizontal: 16,
    paddingVertical: 10,
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
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.onSurface,
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
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    paddingBottom: 10,
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
