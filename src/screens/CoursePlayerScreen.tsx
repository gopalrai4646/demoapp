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
  Switch,
} from 'react-native';
import Video, { OnProgressData, ResizeMode } from 'react-native-video';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Orientation from 'react-native-orientation-locker';
import SystemNavigationBar from 'react-native-system-navigation-bar';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { COLORS, SPACING, TYPOGRAPHY, ROUNDNESS } from '../constants/Theme';
import { 
  Play, 
  CheckCircle2, 
  Lock, 
  ChevronLeft, 
  Info, 
  BookOpen,
  Trophy,
  Pause,
  Settings,
  SkipBack,
  SkipForward,
  Maximize2,
  Minimize2,
  ChevronDown,
  Subtitles,
  Tv,
  ArrowLeft,
  MoreVertical,
  Check,
  RefreshCw
} from 'lucide-react-native';
import { Modal } from 'react-native';
import { fetchProgressRequest, updateProgressRequest, updateRatingRequest } from '../store/slices/progressSlice';
import { fetchCoursesRequest } from '../store/slices/courseSlice';
import CourseRatingModal from '../components/CourseRatingModal';
import { UserCourseStackParamList } from '../navigation/types';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');
const YOUTUBE_URL_REGEX = /(youtube\.com|youtu\.be)/i;

const CoursePlayerScreen = () => {
  const route = useRoute<RouteProp<UserCourseStackParamList, 'CoursePlayer'>>();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [hasDismissedRating, setHasDismissedRating] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);

  // YouTube Custom Control States
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [selectedQuality, setSelectedQuality] = useState<string>('Auto');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsMenu, setSettingsMenu] = useState<'main' | 'speed' | 'quality'>('main');
  const [progressBarWidth, setProgressBarWidth] = useState(0);
  const isSeekingRef = useRef(false);

  const controlsTimeoutRef = useRef<any>(null);

  // Reset controls hide timer
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (!paused) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3500);
    }
  }, [paused]);

  const toggleControls = () => {
    setShowControls(prev => !prev);
  };

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [paused, showControls, resetControlsTimeout]);

  // Reset player state when switching to a different video
  useEffect(() => {
    setVideoError(null);
    setIsReady(false);
    setIsBuffering(false);
    setIsLoadStarted(false);
    setPaused(false);
    setCurrentTime(0);
    setDuration(0);
    setShowControls(true);
  }, [activeVideoId]);
  
  const videoRef = useRef<any>(null);
  const lastSyncRef = useRef<number>(0);

  // Reset orientation and system navigation bar on unmount
  useEffect(() => {
    return () => {
      Orientation?.lockToPortrait?.();
      if (Platform.OS === 'android') {
        SystemNavigationBar.navigationShow();
      }
    };
  }, []);

  // Hide tab bar and disable navigation gestures completely for the course player screen
  useEffect(() => {
    const parent = navigation.getParent();
    const grandparent = parent?.getParent();

    // Lock gestures for this entire screen
    navigation.setOptions({ gestureEnabled: false } as any);
    parent?.setOptions({ swipeEnabled: false, gestureEnabled: false } as any);
    grandparent?.setOptions({ swipeEnabled: false, gestureEnabled: false } as any);

    if (isFullscreen) {
      parent?.setOptions({ tabBarStyle: { display: 'none' }, swipeEnabled: false, gestureEnabled: false } as any);
      grandparent?.setOptions({ tabBarStyle: { display: 'none' }, swipeEnabled: false, gestureEnabled: false } as any);
      if (Platform.OS === 'android') {
        SystemNavigationBar.navigationHide();
      }
    } else {
      parent?.setOptions({ tabBarStyle: undefined, swipeEnabled: false, gestureEnabled: false } as any);
      grandparent?.setOptions({ tabBarStyle: undefined, swipeEnabled: false, gestureEnabled: false } as any);
      if (Platform.OS === 'android') {
        SystemNavigationBar.navigationShow();
      }
    }

    return () => {
      // Restore gestures and swiping on exit
      navigation.setOptions({ gestureEnabled: true } as any);
      parent?.setOptions({ tabBarStyle: undefined, swipeEnabled: true, gestureEnabled: true } as any);
      grandparent?.setOptions({ tabBarStyle: undefined, swipeEnabled: true, gestureEnabled: true } as any);
      if (Platform.OS === 'android') {
        SystemNavigationBar.navigationShow();
      }
    };
  }, [isFullscreen, navigation]);

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
    if (!videoList.length || !activeVideoId) return 0;
    if (activeVideoId.startsWith('video_')) {
      const idx = parseInt(activeVideoId.replace('video_', ''));
      if (!isNaN(idx) && idx >= 0 && idx < videoList.length) return idx;
    }
    return 0;
  }, [activeVideoId, videoList]);

  const activeVideo = useMemo(() => {
    // 1. Try to get from videoList
    if (videoList && videoList.length > 0) {
      const listVideo = videoList[activeVideoIndex];
      if (listVideo?.url) return listVideo;
    }
    
    // 2. Fallback to legacy field if no videos array or first video has no URL
    if (course?.videoUrl) {
      return { title: t('coursePlayer.lesson'), url: course.videoUrl, order: 0, duration: course.totalDuration || 0 };
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

    const lowerUrl = fixedUrl.toLowerCase();
    let finalUrl = fixedUrl;

    if (lowerUrl.includes('.m3u8')) {
      return { source: { uri: finalUrl, type: 'm3u8' }, unsupportedReason: null };
    } 
    
    // For mp4, mov, webm, just pass the uri without 'type' and without Cloudinary forced transformations
    // since forced transformations like q_auto can sometimes cause codec issues on emulators
    return { source: { uri: finalUrl }, unsupportedReason: null };
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
    if (!isSeekingRef.current) {
      setCurrentTime(data.currentTime);
    }
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
    setVideoError(null);
  };

  const overallPct = calculateOverallProgress();

  useEffect(() => {
    if (overallPct === 100 && courseProgress && !courseProgress.isRated && !showRatingModal && !hasDismissedRating) {
      // Delay slightly to show completion after last video update
      const timer = setTimeout(() => {
        setShowRatingModal(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [overallPct, courseProgress?.isRated, hasDismissedRating]);

  const handleRatingSubmit = (rating: number) => {
    if (user?.uid && courseId) {
      dispatch(updateRatingRequest({
        userId: user.uid,
        courseId,
        rating
      }));
    }
    setShowRatingModal(false);
  };

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
          <Text style={styles.errorTitle}>{t('coursePlayer.enrollmentRequired')}</Text>
          <Text style={styles.errorSubtitle}>{t('coursePlayer.enrollmentSubtitle')}</Text>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.actionButtonText}>{t('coursePlayer.backToDashboard')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Auto-advance to next video
  const handleVideoEnd = useCallback(() => {
    if (!autoPlay || !videoList.length) return;
    const nextIndex = activeVideoIndex + 1;
    if (nextIndex < videoList.length) {
      setActiveVideoId(`video_${nextIndex}`);
    }
  }, [autoPlay, videoList, activeVideoIndex]);

  // Get next video info for "Up Next" display
  const nextVideo = useMemo(() => {
    if (!videoList.length) return null;
    const nextIndex = activeVideoIndex + 1;
    return nextIndex < videoList.length ? videoList[nextIndex] : null;
  }, [videoList, activeVideoIndex]);

  const hasPrev = activeVideoIndex > 0;
  const hasNext = activeVideoIndex < videoList.length - 1;

  const playPrevVideo = () => {
    if (hasPrev) {
      setActiveVideoId(`video_${activeVideoIndex - 1}`);
    }
  };

  const playNextVideo = () => {
    if (hasNext) {
      setActiveVideoId(`video_${activeVideoIndex + 1}`);
    }
  };

  const handleProgressBarGrant = (e: any) => {
    resetControlsTimeout();
    if (!duration) return;
    isSeekingRef.current = true;
    
    const screenWidth = Dimensions.get('window').width;
    const startX = isFullscreen ? 16 : 0;
    const usableWidth = isFullscreen ? (screenWidth - 32) : screenWidth;
    
    const touchX = e.nativeEvent.pageX;
    const pct = Math.max(0, Math.min(1, (touchX - startX) / usableWidth));
    const seekTime = pct * duration;
    
    setCurrentTime(seekTime);
  };

  const handleProgressBarMove = (e: any) => {
    resetControlsTimeout();
    if (!duration) return;
    
    const screenWidth = Dimensions.get('window').width;
    const startX = isFullscreen ? 16 : 0;
    const usableWidth = isFullscreen ? (screenWidth - 32) : screenWidth;
    
    const touchX = e.nativeEvent.pageX;
    const pct = Math.max(0, Math.min(1, (touchX - startX) / usableWidth));
    const seekTime = pct * duration;
    
    setCurrentTime(seekTime);
  };

  const handleProgressBarRelease = (e: any) => {
    resetControlsTimeout();
    
    if (duration) {
      const screenWidth = Dimensions.get('window').width;
      const startX = isFullscreen ? 16 : 0;
      const usableWidth = isFullscreen ? (screenWidth - 32) : screenWidth;
      
      const touchX = e.nativeEvent.pageX;
      const pct = Math.max(0, Math.min(1, (touchX - startX) / usableWidth));
      const seekTime = pct * duration;
      
      videoRef.current?.seek(seekTime);
      setCurrentTime(seekTime);
    }
    
    setTimeout(() => {
      isSeekingRef.current = false;
    }, 300);
  };

  return (
    <SafeAreaView style={[
      styles.container,
      !isFullscreen && { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0 }
    ]}>
      <StatusBar 
        barStyle={isFullscreen ? 'light-content' : 'dark-content'} 
        backgroundColor={isFullscreen ? '#000' : '#fff'} 
        hidden={isFullscreen} 
      />

      {/* Top Header Section (Standard Header) */}
      {!isFullscreen && (
        <View style={styles.topHeader}>
          <View style={styles.headerLeftContainer}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackBtn}>
              <ArrowLeft color="#1E1B4B" size={24} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('coursePlayer.title') || 'Course Player'}</Text>
          </View>
        </View>
      )}
      
      {/* Video Player Section */}
      <View style={[styles.playerContainer, isFullscreen && styles.fullscreenContainer]}>
        {normalizedVideo.source ? (
          <View style={styles.videoWrapper}>
            <Video
              ref={videoRef}
              source={normalizedVideo.source}
              style={StyleSheet.absoluteFill}
              resizeMode="contain"
              paused={paused}
              rate={playbackRate}
              useTextureView={true}
              selectedVideoTrack={
                (selectedQuality === 'Auto'
                  ? { type: 'auto' }
                  : { type: 'resolution', value: parseInt(selectedQuality) }) as any
              }
              onProgress={handleVideoProgress}
              onLoad={(data: any) => {
                handleVideoLoad(data);
                setIsBuffering(false);
              }}
              onBuffer={({ isBuffering }: { isBuffering: boolean }) => {
                setIsBuffering(isBuffering);
              }}
              onError={(e: any) => {
                console.log('[CoursePlayer] VIDEO ERROR:', JSON.stringify(e));
                setVideoError(`Unable to play this video.`);
                setIsBuffering(false);
              }}
              onEnd={handleVideoEnd}
            />

            {/* Always visible thin progress bar at the bottom of the video when controls are hidden */}
            {!showControls && (
              <View style={styles.alwaysVisibleTrack}>
                <View style={[styles.alwaysVisibleFill, { width: `${(currentTime / (duration || 1)) * 100}%` }]} />
              </View>
            )}

            {/* Tap to show controls when hidden */}
            {!showControls && (
              <TouchableWithoutFeedback onPress={toggleControls}>
                <View style={StyleSheet.absoluteFill} />
              </TouchableWithoutFeedback>
            )}

            {/* Custom YouTube Overlay Controls */}
            {showControls && (
              <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                {/* Dark Vignette Overlay - Tapping this hides the controls */}
                <TouchableWithoutFeedback onPress={toggleControls}>
                  <View style={styles.vignetteOverlay} />
                </TouchableWithoutFeedback>

                {/* Top Controls Row */}
                <View style={styles.ytTopRow}>
                  <Text style={styles.ytTimeText}>
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </Text>

                  <TouchableOpacity 
                    style={styles.ytTopIconBtn} 
                    onPress={() => {
                      setSettingsMenu('main');
                      setShowSettingsModal(true);
                    }}
                  >
                    <Settings color="#fff" size={24} />
                  </TouchableOpacity>
                </View>

                {/* Center Controls (Prev, Play/Pause, Next) */}
                <View style={styles.ytCenterRow} pointerEvents="box-none">
                  <TouchableOpacity 
                    style={[styles.centerCtrlIcon, !hasPrev && styles.disabledCtrl]} 
                    disabled={!hasPrev}
                    onPress={() => {
                      playPrevVideo();
                      resetControlsTimeout();
                    }}
                  >
                    <SkipBack color="#fff" size={28} fill={hasPrev ? "#fff" : "none"} />
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.centerPlayCircle} 
                    onPress={() => {
                      setPaused(!paused);
                      resetControlsTimeout();
                    }}
                  >
                    {paused ? (
                      <Play color="#fff" size={32} fill="#fff" style={{ marginLeft: 4 }} />
                    ) : (
                      <Pause color="#fff" size={32} fill="#fff" />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.centerCtrlIcon, !hasNext && styles.disabledCtrl]} 
                    disabled={!hasNext}
                    onPress={() => {
                      playNextVideo();
                      resetControlsTimeout();
                    }}
                  >
                    <SkipForward color="#fff" size={28} fill={hasNext ? "#fff" : "none"} />
                  </TouchableOpacity>
                </View>

                {/* Bottom Controls Row (Fullscreen button on the bottom left) */}
                <View style={styles.ytBottomRow} pointerEvents="box-none">
                  <TouchableOpacity 
                    style={styles.ytFullscreenIconBtn} 
                    onPress={() => {
                      resetControlsTimeout();
                      if (isFullscreen) {
                        Orientation?.lockToPortrait?.();
                        setIsFullscreen(false);
                      } else {
                        Orientation?.lockToLandscape?.();
                        setIsFullscreen(true);
                      }
                    }}
                  >
                    {isFullscreen ? (
                      <Minimize2 color="#fff" size={22} />
                    ) : (
                      <Maximize2 color="#fff" size={22} />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Scrubber Seekbar slightly up from bottom in fullscreen */}
                <View 
                  style={[
                    styles.progressBarContainer,
                    isFullscreen && { bottom: 6, left: 16, right: 16 }
                  ]}
                  onLayout={(e) => setProgressBarWidth(e.nativeEvent.layout.width)}
                  onStartShouldSetResponder={() => true}
                  onMoveShouldSetResponder={() => true}
                  onResponderGrant={handleProgressBarGrant}
                  onResponderMove={handleProgressBarMove}
                  onResponderRelease={handleProgressBarRelease}
                >
                  <View style={styles.progressTrack} pointerEvents="none">
                    <View style={[styles.progressFill, { width: `${(currentTime / (duration || 1)) * 100}%` }]} />
                    <View style={[styles.progressThumb, { left: `${(currentTime / (duration || 1)) * 100}%` }]} />
                  </View>
                </View>
              </View>
            )}

            {/* Error Overlay */}
            {videoError ? (
              <View style={styles.errorOverlay}>
                <Info color="#ffb4ab" size={32} />
                <Text style={styles.videoErrorText}>{videoError}</Text>
              </View>
            ) : null}

            {/* Buffering ActivityIndicator */}
            {isBuffering && (
              <View style={styles.bufferingOverlay}>
                <ActivityIndicator color="#FF0000" size="large" />
              </View>
            )}
          </View>
        ) : (
          <View style={styles.videoPlaceholder}>
            <ActivityIndicator color="#fff" />
            <Text style={styles.placeholderText}>
              {!course ? t('coursePlayer.loadingCourse') : t('coursePlayer.lessonUnavailable')}
            </Text>
            <Text style={[styles.debugText, { textAlign: 'center', marginHorizontal: 20 }]}>
              {normalizedVideo.unsupportedReason || t('coursePlayer.noVideoUrl')}
            </Text>
          </View>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {/* Title & Metadata Section */}
        <View style={styles.videoInfoSection}>
          <Text style={styles.videoTitle} numberOfLines={2}>{activeVideo?.title || course.title}</Text>
          <Text style={styles.videoMeta}>
            {course.title} • by {course.instructor ? `${course.instructor} • ` : ''}{videoList.length} {videoList.length === 1 ? 'Lesson' : 'Lessons'}
          </Text>
        </View>

        {/* Thin progress track right below video section */}
        <View style={styles.ytProgressTrack}>
          <View style={[styles.ytProgressIndicator, { width: `${overallPct}%` }]} />
        </View>

        {/* Completion Banner (Emerald Green Rounded Button Banner) */}
        {overallPct === 100 && (
          <View style={styles.completionBanner}>
            <Trophy size={18} color="#fff" />
            <Text style={styles.completionText}>
              {t('coursePlayer.courseCompleted').toUpperCase()} — {overallPct}%
            </Text>
          </View>
        )}

        {/* Tab Switcher */}
        <View style={styles.tabBar}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'lessons' && styles.activeTab]}
            onPress={() => setActiveTab('lessons')}
          >
            <BookOpen size={16} color={activeTab === 'lessons' ? COLORS.primary : '#64748B'} />
            <Text style={[styles.tabText, activeTab === 'lessons' && styles.activeTabText]}>{t('coursePlayer.lessonsTab')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'about' && styles.activeTab]}
            onPress={() => setActiveTab('about')}
          >
            <Info size={16} color={activeTab === 'about' ? COLORS.primary : '#64748B'} />
            <Text style={[styles.tabText, activeTab === 'about' && styles.activeTabText]}>{t('coursePlayer.aboutTab')}</Text>
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
                    activeOpacity={0.7}
                  >
                    {/* Lesson Number */}
                    <Text style={[styles.lessonNumber, isActive && styles.activeLessonNumber]}>
                      {index + 1}
                    </Text>
                    
                    {/* Circle Mint Green Checkbox or Active / Inactive Play Circle */}
                    <View style={styles.iconContainer}>
                      {isCompleted || isActive ? (
                        <View style={styles.completedIconContainer}>
                          <Check size={14} color="#059669" strokeWidth={3.5} />
                        </View>
                      ) : (
                        <View style={styles.inactiveIconContainer}>
                          <Play size={12} color="#64748B" fill="#64748B" style={{ marginLeft: 2 }} />
                        </View>
                      )}
                    </View>

                    {/* Lesson Info */}
                    <View style={styles.lessonInfo}>
                      <Text style={[styles.lessonTitle, isActive && styles.activeLessonTitle]} numberOfLines={2}>
                        {video.title}
                      </Text>
                      <View style={styles.lessonMeta}>
                        {video.duration ? (
                          <Text style={[styles.lessonDuration, isActive && styles.activeLessonDuration]}>
                            {Math.floor(video.duration/60)}:{String(video.duration%60).padStart(2, '0')}
                          </Text>
                        ) : null}
                        {vidPct > 0 && !isCompleted && <Text style={styles.lessonPct}>{vidPct}%</Text>}
                      </View>
                    </View>

                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.aboutContainer}>
              <Text style={styles.descriptionHeader}>{t('coursePlayer.courseDescription')}</Text>
              <Text style={styles.descriptionText}>{course.description}</Text>
            </View>
          )}
        </View>
      </ScrollView>
      
      <CourseRatingModal
        isVisible={showRatingModal}
        courseName={course?.title || ''}
        onClose={() => {
          setShowRatingModal(false);
          setHasDismissedRating(true);
        }}
        onSubmit={handleRatingSubmit}
      />

      {/* YouTube-style Settings Modal */}
      <Modal
        visible={showSettingsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowSettingsModal(false)}
        >
          <View style={styles.modalContent}>
            {/* Header Drag Bar */}
            <View style={styles.modalDragBar} />
            
            {settingsMenu === 'main' && (
              <View>
                <Text style={styles.modalTitle}>Settings</Text>

                <View style={styles.modalItem}>
                  <View style={styles.modalItemLeft}>
                    <RefreshCw color="#0f0f0f" size={20} />
                    <Text style={styles.modalItemText}>{t('coursePlayer.autoplay') || 'Autoplay'}</Text>
                  </View>
                  <Switch
                    value={autoPlay}
                    onValueChange={(val) => setAutoPlay(val)}
                    trackColor={{ false: '#d1d5db', true: '#c7d2fe' }}
                    thumbColor={autoPlay ? '#4f46e5' : '#f3f4f6'}
                    ios_backgroundColor="#d1d5db"
                  />
                </View>
                
                <TouchableOpacity 
                  style={styles.modalItem}
                  onPress={() => setSettingsMenu('quality')}
                  activeOpacity={0.7}
                >
                  <View style={styles.modalItemLeft}>
                    <Tv color="#0f0f0f" size={20} />
                    <Text style={styles.modalItemText}>Quality</Text>
                  </View>
                  <Text style={styles.modalItemValue}>{selectedQuality}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.modalItem}
                  onPress={() => setSettingsMenu('speed')}
                  activeOpacity={0.7}
                >
                  <View style={styles.modalItemLeft}>
                    <Play color="#0f0f0f" size={20} fill="#0f0f0f" />
                    <Text style={styles.modalItemText}>Playback speed</Text>
                  </View>
                  <Text style={styles.modalItemValue}>
                    {playbackRate === 1.0 ? 'Normal' : `${playbackRate}x`}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {settingsMenu === 'quality' && (
              <View>
                <Text style={styles.modalTitle}>Quality</Text>
                {['Auto', '1080p', '720p', '480p', '360p'].map((q) => (
                  <TouchableOpacity 
                    key={q}
                    style={styles.modalSubItem}
                    onPress={() => {
                      setSelectedQuality(q);
                      setShowSettingsModal(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.modalSubItemText, selectedQuality === q && styles.modalSubItemTextActive]}>
                      {q}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {settingsMenu === 'speed' && (
              <View>
                <Text style={styles.modalTitle}>Playback speed</Text>
                {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                  <TouchableOpacity 
                    key={rate}
                    style={styles.modalSubItem}
                    onPress={() => {
                      setPlaybackRate(rate);
                      setShowSettingsModal(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.modalSubItemText, playbackRate === rate && styles.modalSubItemTextActive]}>
                      {rate === 1.0 ? 'Normal' : `${rate}x`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerLeftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerBackBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E1B4B', // Navy blue
  },
  headerMoreBtn: {
    padding: 4,
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
  vignetteOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  ytTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : 12,
    alignItems: 'center',
  },
  ytTopIconBtn: {
    padding: 6,
  },
  ytCenterRow: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 28,
  },
  centerCtrlIcon: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerPlayCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledCtrl: {
    opacity: 0.25,
  },
  ytBottomRow: {
    position: 'absolute',
    bottom: 18,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  ytTimeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  ytFullscreenIconBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 16,
    justifyContent: 'flex-end',
    zIndex: 10,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.24)',
    width: '100%',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ef4444',
    position: 'absolute',
    left: 0,
    top: 0,
  },
  progressThumb: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ef4444',
    borderColor: '#ffffff',
    borderWidth: 1.5,
    position: 'absolute',
    top: -4,
    marginLeft: -6,
  },
  alwaysVisibleTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  alwaysVisibleFill: {
    height: '100%',
    backgroundColor: '#ef4444',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 8,
  },
  modalDragBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e0e0e0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f0f0f',
    marginBottom: 16,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  modalItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f0f0f',
  },
  modalItemValue: {
    fontSize: 13,
    color: '#606060',
    fontWeight: '500',
  },
  modalSubItem: {
    paddingVertical: 14,
  },
  modalSubItemText: {
    fontSize: 14,
    color: '#0f0f0f',
    fontWeight: '500',
  },
  modalSubItemTextActive: {
    color: '#FF0000',
    fontWeight: '700',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  videoInfoSection: {
    padding: SPACING.md,
    backgroundColor: '#fff',
  },
  videoTitle: {
    ...TYPOGRAPHY.headline,
    fontSize: 22,
    fontWeight: '800',
    color: '#1E1B4B', // Navy blue
    lineHeight: 28,
    marginBottom: 6,
  },
  videoMeta: {
    ...TYPOGRAPHY.label,
    color: '#64748B', // Slate gray
    fontSize: 13,
  },
  ytProgressTrack: {
    height: 2,
    backgroundColor: '#e2e8f0',
    width: '100%',
  },
  ytProgressIndicator: {
    height: '100%',
    backgroundColor: '#FF0000',
  },
  completionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00693E', // Forest Green
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 12,
    justifyContent: 'center',
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  completionText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#fff',
    marginTop: 4,
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
    borderBottomColor: COLORS.primary, // Navy active underline
  },
  tabText: {
    ...TYPOGRAPHY.label,
    color: '#64748B',
    fontWeight: '700',
  },
  activeTabText: {
    color: COLORS.primary, // Navy active text
  },
  tabContent: {
    paddingTop: SPACING.md,
  },
  lessonList: {
    paddingHorizontal: SPACING.md,
    paddingBottom: 24,
  },
  lessonItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
  },
  activeLessonItem: {
    backgroundColor: '#E0E7FF', // Lavender/light blue background
    borderLeftColor: COLORS.primary, // Solid left border
  },
  iconContainer: {
    marginRight: 12,
  },
  completedIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#D1FAE5', // Light mint green background
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inactiveIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: '#1E1B4B', // Navy blue
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
    color: '#64748B',
  },
  activeLessonDuration: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  lessonPct: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  lessonNumber: {
    ...TYPOGRAPHY.label,
    color: '#64748B',
    width: 24,
    textAlign: 'center',
    marginRight: 8,
    fontSize: 15,
  },
  activeLessonNumber: {
    color: '#ef4444', // Red for active number
    fontWeight: '800',
  },
  activeDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary, // Indigo dot
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
