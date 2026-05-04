import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Platform,
  TouchableWithoutFeedback,
  Animated,
} from 'react-native';
import Video, { OnProgressData, ResizeMode } from 'react-native-video';
import Slider from '@react-native-community/slider';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { COLORS, SPACING, TYPOGRAPHY, ROUNDNESS } from '../constants/Theme';
import { 
  Play, 
  CheckCircle2, 
  Lock, 
  ChevronLeft, 
  Info, 
  BookOpen,
  Award,
  Pause,
  Maximize,
  Minimize
} from 'lucide-react-native';
import { fetchProgressRequest, updateProgressRequest } from '../store/slices/progressSlice';
import { fetchCoursesRequest } from '../store/slices/courseSlice';
import { UserCourseStackParamList } from '../navigation/types';

const { width } = Dimensions.get('window');
const YOUTUBE_URL_REGEX = /(youtube\.com|youtu\.be)/i;

const CoursePlayerScreen = () => {
  const route = useRoute<RouteProp<UserCourseStackParamList, 'CoursePlayer'>>();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { courseId, initialVideoId } = route.params;

  const { user } = useAppSelector((state) => state.auth);
  const { courses } = useAppSelector((state) => state.courses);
  const { progress } = useAppSelector((state) => state.progress);

  const [activeVideoId, setActiveVideoId] = useState(initialVideoId || 'video_0');
  const [activeTab, setActiveTab] = useState<'lessons' | 'about'>('lessons');
  const [isReady, setIsReady] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isLoadStarted, setIsLoadStarted] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);

  // Custom Player State
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Reset player state when switching to a different video
  useEffect(() => {
    setVideoError(null);
    setIsReady(false);
    setIsBuffering(false);
    setIsLoadStarted(false);
    setPaused(false);
    setCurrentTime(0);
    setDuration(0);
  }, [activeVideoId]);
  
  const videoRef = useRef<any>(null);
  const lastSyncRef = useRef<number>(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const controlsTimeoutRef = useRef<any>(null);
  const lastTapRef = useRef<number>(0);

  const hideControls = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setShowControls(false));
  }, [fadeAnim]);

  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    setShowControls(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    controlsTimeoutRef.current = setTimeout(() => {
      if (!paused && !isBuffering) hideControls();
    }, 3000);
  }, [fadeAnim, paused, isBuffering, hideControls]);

  const handleDoubleTap = (e: any) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    const { locationX } = e.nativeEvent;
    const screenWidth = Dimensions.get('window').width;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // It's a double tap
      if (locationX < screenWidth / 2) {
        // Left side - Seek back
        videoRef.current?.seek(Math.max(0, currentTime - 10));
      } else {
        // Right side - Seek forward
        videoRef.current?.seek(Math.min(duration, currentTime + 10));
      }
      resetControlsTimeout();
    } else {
      lastTapRef.current = now;
      resetControlsTimeout();
    }
  };

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [paused, isBuffering, resetControlsTimeout]);

  const course = useMemo(() => courses.find(c => c.id === courseId), [courses, courseId]);
  const isEnrolled = useMemo(() => user?.enrolledCourses?.includes(courseId), [user, courseId]);
  const courseProgress = progress[courseId];

  useEffect(() => {
    if (!course) dispatch(fetchCoursesRequest());
    if (user?.uid) dispatch(fetchProgressRequest({ userId: user.uid, courseId }));
  }, [dispatch, courseId, user?.uid]);

  const videoList = useMemo(() => {
    if (!course?.videos) return [];
    return [...course.videos].sort((a, b) => a.order - b.order);
  }, [course]);

  const activeVideoIndex = useMemo(() => {
    return parseInt(activeVideoId.replace('video_', '')) || 0;
  }, [activeVideoId]);

  const activeVideo = useMemo(() => {
    // 1. Try to get from videoList
    if (videoList && videoList.length > 0) {
      const listVideo = videoList[activeVideoIndex];
      if (listVideo?.url) return listVideo;
    }
    
    // 2. Fallback to legacy field if no videos array or first video has no URL
    if (course?.videoUrl) {
      return { title: 'Lesson', url: course.videoUrl, order: 0, duration: course.totalDuration || 0 };
    }
    
    return null;
  }, [videoList, activeVideoIndex, course]);

  const normalizedVideo = useMemo(() => {
    const rawUrl = activeVideo?.url?.trim();
    if (!rawUrl) {
      return { source: null, unsupportedReason: 'Lesson URL is missing.' };
    }

    if (YOUTUBE_URL_REGEX.test(rawUrl)) {
      return {
        source: null,
        unsupportedReason:
          'This link is a YouTube page URL. Use a direct stream/file URL (mp4 or m3u8) to play inside the app.',
      };
    }

    const fixedUrl = rawUrl.startsWith('//') ? `https:${rawUrl}` : rawUrl;
    const isNetworkUrl = /^https?:\/\//i.test(fixedUrl);
    const isLocalUrl = /^(file|content):\/\//i.test(fixedUrl);

    if (!isNetworkUrl && !isLocalUrl) {
      return {
        source: null,
        unsupportedReason: 'Unsupported video URL format.',
      };
    }

    // Detect video type and optimize Cloudinary URLs for Android
    const lowerUrl = fixedUrl.toLowerCase();
    let type: string | undefined;
    let finalUrl = fixedUrl;

    if (lowerUrl.includes('.m3u8')) {
      type = 'm3u8';
    } else if (lowerUrl.includes('.mp4') || lowerUrl.includes('/video/upload/')) {
      type = 'mp4';
      // If Cloudinary URL, force H264 codec and 720p for maximum hardware compatibility
      if (lowerUrl.includes('cloudinary.com') && lowerUrl.includes('/video/upload/')) {
        const parts = fixedUrl.split('/video/upload/');
        if (parts.length === 2 && !parts[1].includes('vc_')) { // Don't override if already has transformations
          finalUrl = `${parts[0]}/video/upload/f_mp4,vc_h264,w_1280,q_auto/${parts[1]}`;
        }
      }
    } else if (lowerUrl.includes('.mov')) {
      type = 'mov';
    } else if (lowerUrl.includes('.webm')) {
      type = 'webm';
    }

    const source: any = { uri: finalUrl };
    if (type) source.type = type;

    return { source, unsupportedReason: null };
  }, [activeVideo?.url]);

  useEffect(() => {
    console.log('[CoursePlayer] Active Video:', activeVideo?.title, activeVideo?.url);
  }, [activeVideo]);

  // Progress Calculation logic for high level stats
  const calculateOverallProgress = useCallback(() => {
    if (!courseProgress || !videoList.length) return 0;
    let totalDuration = 0;
    let totalWatched = 0;

    videoList.forEach((video, index) => {
      const vidId = `video_${index}`;
      const duration = video.duration || 100;
      const watched = courseProgress.watchedDurations?.[vidId] || 0;
      const completed = courseProgress.completedVideos?.includes(vidId);

      totalDuration += duration;
      totalWatched += completed ? duration : Math.min(watched, duration);
    });

    return Math.min(100, Math.round((totalWatched / totalDuration) * 100));
  }, [courseProgress, videoList]);

  const handleVideoProgress = (data: OnProgressData) => {
    setCurrentTime(data.currentTime);
    if (data.seekableDuration > 0) setDuration(data.seekableDuration);

    if (!user?.uid || !activeVideoId) return;

    const currentTimeSync = Math.round(data.currentTime);
    const durationSync = Math.round(data.playableDuration || data.seekableDuration);
    const now = Date.now();

    // Sync progress every 3 seconds or if near end
    if (now - lastSyncRef.current > 3000 || (durationSync > 0 && currentTimeSync >= durationSync - 2)) {
      lastSyncRef.current = now;
      const isCompleted = durationSync > 0 && currentTimeSync >= durationSync - 2;
      
      dispatch(updateProgressRequest({
        userId: user.uid,
        courseId,
        videoId: activeVideoId,
        watchedDuration: currentTimeSync,
        isCompleted
      }));
    }
  };

  const formatTime = (timeInSeconds: number) => {
    if (!timeInSeconds || isNaN(timeInSeconds)) return '0:00';
    const m = Math.floor(timeInSeconds / 60);
    const s = Math.floor(timeInSeconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleVideoLoad = (data: any) => {
    if (data?.duration) setDuration(data.duration);
    const savedTime = courseProgress?.watchedDurations?.[activeVideoId];
    if (savedTime && savedTime > 0 && !courseProgress?.completedVideos?.includes(activeVideoId)) {
      videoRef.current?.seek(savedTime);
    }
    setIsReady(true);
  };

  const overallPct = calculateOverallProgress();

  if (!course) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!isEnrolled) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ChevronLeft color={COLORS.onSurface} size={28} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Lock size={64} color={COLORS.outline} />
          <Text style={styles.errorTitle}>Enrollment Required</Text>
          <Text style={styles.errorSubtitle}>Please enroll in this course to access the lessons.</Text>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.actionButtonText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Video Player Section */}
      <TouchableWithoutFeedback onPress={handleDoubleTap}>
        <View style={[styles.playerContainer, isFullscreen && styles.fullscreenContainer]}>
          {normalizedVideo.source ? (
            <View style={styles.videoWrapper}>
              <Video
                ref={videoRef}
                source={normalizedVideo.source}
                style={StyleSheet.absoluteFill}
                resizeMode={ResizeMode.CONTAIN}
                paused={paused}
                playInBackground={false}
                playWhenInactive={false}
                ignoreSilentSwitch="ignore"
                useTextureView={false} // SurfaceView is better for custom overlays if background is transparent
                onLoadStart={() => {
                  setIsLoadStarted(true);
                  setIsBuffering(true);
                }}
                onReadyForDisplay={() => {
                  setIsBuffering(false);
                  setPaused(false);
                }}
                onBuffer={({ isBuffering: buffering }: any) => {
                  setIsBuffering(buffering);
                }}
                onProgress={handleVideoProgress}
                onLoad={(data: any) => {
                  handleVideoLoad(data);
                  setIsBuffering(false);
                }}
                onError={(e: any) => {
                  console.log('[CoursePlayer] VIDEO ERROR:', JSON.stringify(e));
                  setVideoError(`Unable to play this video.`);
                  setIsBuffering(false);
                }}
              />

              {/* YouTube-like Controls Overlay */}
              {showControls && (
                <Animated.View style={[styles.controlsOverlay, { opacity: fadeAnim }]}>
                  {/* Top Bar: Back Button */}
                  <View style={styles.topControls}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
                      <ChevronLeft color="#fff" size={28} />
                    </TouchableOpacity>
                  </View>

                  {/* Center: Play/Pause/Buffer */}
                  <View style={styles.centerControls} pointerEvents="box-none">
                    {isBuffering ? (
                      <ActivityIndicator size="large" color="#FF0000" />
                    ) : (
                      <TouchableOpacity 
                        style={styles.playPauseButton}
                        onPress={() => {
                          setPaused(!paused);
                          resetControlsTimeout();
                        }}
                      >
                        {paused ? (
                          <Play color="#fff" size={32} fill="#fff" />
                        ) : (
                          <Pause color="#fff" size={32} fill="#fff" />
                        )}
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Bottom Bar: Slider & Time */}
                  <View style={styles.bottomControls}>
                    <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                    <Slider
                      style={styles.slider}
                      minimumValue={0}
                      maximumValue={duration > 0 ? duration : 100}
                      value={currentTime}
                      minimumTrackTintColor="#FF0000"
                      maximumTrackTintColor="rgba(255,255,255,0.4)"
                      thumbTintColor="#FF0000"
                      onSlidingStart={() => {
                        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
                      }}
                      onSlidingComplete={(val) => {
                        videoRef.current?.seek(val);
                        resetControlsTimeout();
                      }}
                    />
                    <Text style={styles.timeText}>{formatTime(duration)}</Text>
                  </View>
                </Animated.View>
              )}

              {/* Error Overlay */}
              {videoError ? (
                <View style={styles.errorOverlay}>
                  <Info color="#ffb4ab" size={32} />
                  <Text style={styles.videoErrorText}>{videoError}</Text>
                </View>
              ) : null}
            </View>
          ) : (
            <View style={styles.videoPlaceholder}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.placeholderText}>
                {!course ? 'Loading Course...' : 'Lesson unavailable'}
              </Text>
              <Text style={[styles.debugText, { textAlign: 'center', marginHorizontal: 20 }]}>
                {normalizedVideo.unsupportedReason || 'No video URL found for this lesson.'}
              </Text>
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>

      <ScrollView stickyHeaderIndices={[2]} showsVerticalScrollIndicator={false}>
        {/* Course Info */}
        <View style={styles.infoSection}>
          <Text style={styles.courseTitle}>{course.title}</Text>
          <Text style={styles.courseMeta}>by {course.instructor} • {videoList.length} Lessons</Text>
        </View>

        {/* Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Course Progress</Text>
            <Text style={[styles.progressVal, overallPct === 100 && { color: '#4caf50' }]}>
              {overallPct}%
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressIndicator, { width: `${overallPct}%`, backgroundColor: overallPct === 100 ? '#4caf50' : COLORS.primary }]} />
          </View>
          {overallPct === 100 && (
            <View style={styles.completedBadge}>
              <Award size={14} color="#4caf50" />
              <Text style={styles.completedText}>COURSE COMPLETED</Text>
            </View>
          )}
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabBar}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'lessons' && styles.activeTab]}
            onPress={() => setActiveTab('lessons')}
          >
            <BookOpen size={18} color={activeTab === 'lessons' ? COLORS.primary : COLORS.secondary} />
            <Text style={[styles.tabText, activeTab === 'lessons' && styles.activeTabText]}>Lessons</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'about' && styles.activeTab]}
            onPress={() => setActiveTab('about')}
          >
            <Info size={18} color={activeTab === 'about' ? COLORS.primary : COLORS.secondary} />
            <Text style={[styles.tabText, activeTab === 'about' && styles.activeTabText]}>About</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'lessons' ? (
            <View style={styles.lessonList}>
              {videoList.map((video, index) => {
                const vidId = `video_${index}`;
                const isCompleted = courseProgress?.completedVideos?.includes(vidId);
                const isActive = activeVideoId === vidId;
                const watched = courseProgress?.watchedDurations?.[vidId] || 0;
                const vidPct = video.duration ? Math.min(100, Math.round((watched / video.duration) * 100)) : (isCompleted ? 100 : 0);

                return (
                  <TouchableOpacity 
                    key={vidId}
                    style={[styles.lessonItem, isActive && styles.activeLessonItem]}
                    onPress={() => setActiveVideoId(vidId)}
                  >
                    <View style={[
                      styles.lessonIcon, 
                      isCompleted ? styles.completedIcon : isActive ? styles.activeIcon : styles.inactiveIcon
                    ]}>
                      {isCompleted ? (
                        <CheckCircle2 size={16} color="#fff" />
                      ) : (
                        <Play size={14} color={isActive ? "#fff" : COLORS.secondary} fill={isActive ? "#fff" : "none"} />
                      )}
                    </View>
                    <View style={styles.lessonInfo}>
                      <Text style={[styles.lessonTitle, isActive && styles.activeLessonTitle]}>
                        {video.title}
                      </Text>
                      <View style={styles.lessonMeta}>
                        {video.duration ? <Text style={styles.lessonDuration}>{Math.floor(video.duration/60)}:{String(video.duration%60).padStart(2, '0')}</Text> : null}
                        {vidPct > 0 && !isCompleted && <Text style={styles.lessonPct}>{vidPct}% watched</Text>}
                      </View>
                      {vidPct > 0 && !isCompleted && (
                        <View style={styles.smallTrack}>
                          <View style={[styles.smallIndicator, { width: `${vidPct}%` }]} />
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.aboutContainer}>
              <Text style={styles.descriptionHeader}>Course Description</Text>
              <Text style={styles.descriptionText}>{course.description}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 9999,
    backgroundColor: '#000',
  },
  playerContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: 'transparent',
    minHeight: 200,
  },
  videoWrapper: {
    flex: 1,
    backgroundColor: '#000',
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'space-between',
    padding: 10,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 40 : 10,
    paddingHorizontal: 10,
  },
  centerControls: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  iconButton: {
    padding: 8,
  },
  playPauseButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    minWidth: 40,
    textAlign: 'center',
  },
  slider: {
    flex: 1,
    marginHorizontal: 10,
    height: 40,
  },
  errorOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  videoPlayer: {
    flex: 1,
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    ...TYPOGRAPHY.label,
    color: '#fff',
    marginTop: 10,
  },
  debugText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    marginTop: 4,
  },
  videoErrorOverlay: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 8,
    padding: 8,
  },
  videoErrorText: {
    color: '#ffb4ab',
    fontSize: 12,
  },
  bufferingOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  bufferingText: {
    color: '#fff',
    fontSize: 13,
    marginTop: 10,
    fontWeight: '600',
  },
  floatingBackButton: {
    position: 'absolute',
    top: 20,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoSection: {
    padding: SPACING.lg,
  },
  courseTitle: {
    ...TYPOGRAPHY.headline,
    fontSize: 24,
    color: COLORS.onSurface,
  },
  courseMeta: {
    ...TYPOGRAPHY.subHeadline,
    color: COLORS.secondary,
    marginTop: 4,
  },
  progressCard: {
    marginHorizontal: SPACING.lg,
    padding: 16,
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: 20,
    marginBottom: SPACING.lg,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  progressLabel: {
    ...TYPOGRAPHY.label,
    fontWeight: '700',
  },
  progressVal: {
    ...TYPOGRAPHY.label,
    fontWeight: '800',
    color: COLORS.primary,
  },
  progressTrack: {
    height: 8,
    backgroundColor: COLORS.outlineVariant,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressIndicator: {
    height: '100%',
    borderRadius: 4,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  completedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#4caf50',
    letterSpacing: 0.5,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
    backgroundColor: '#fff',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    marginRight: 24,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    gap: 8,
  },
  activeTab: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    ...TYPOGRAPHY.label,
    color: COLORS.secondary,
    fontWeight: '700',
  },
  activeTabText: {
    color: COLORS.primary,
  },
  tabContent: {
    paddingTop: SPACING.md,
  },
  lessonList: {
    paddingHorizontal: SPACING.md,
  },
  lessonItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 16,
    marginBottom: 4,
    alignItems: 'center',
  },
  activeLessonItem: {
    backgroundColor: COLORS.primaryContainer + '40', // 25% opacity
  },
  lessonIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  inactiveIcon: {
    backgroundColor: COLORS.outlineVariant,
  },
  activeIcon: {
    backgroundColor: COLORS.primary,
  },
  completedIcon: {
    backgroundColor: '#4caf50',
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.onSurface,
  },
  activeLessonTitle: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  lessonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  lessonDuration: {
    fontSize: 12,
    color: COLORS.secondary,
  },
  lessonPct: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  smallTrack: {
    height: 2,
    backgroundColor: COLORS.outlineVariant,
    marginTop: 6,
    borderRadius: 1,
    overflow: 'hidden',
  },
  smallIndicator: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  aboutContainer: {
    padding: SPACING.lg,
  },
  descriptionHeader: {
    ...TYPOGRAPHY.label,
    fontWeight: '800',
    marginBottom: 8,
    color: COLORS.onSurface,
  },
  descriptionText: {
    ...TYPOGRAPHY.body,
    lineHeight: 22,
    color: COLORS.onSurfaceVariant,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    ...TYPOGRAPHY.headline,
    marginTop: 20,
  },
  errorSubtitle: {
    ...TYPOGRAPHY.body,
    textAlign: 'center',
    color: COLORS.secondary,
    marginTop: 8,
    marginBottom: 24,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 16,
  },
  actionButtonText: {
    ...TYPOGRAPHY.label,
    color: '#fff',
    fontWeight: '800',
  },
  header: {
    padding: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  }
});

export default CoursePlayerScreen;
