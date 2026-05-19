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
  Award,
  Pause,
  Settings,
  SkipBack,
  SkipForward,
  Maximize2,
  Minimize2,
  ChevronDown,
  Subtitles,
  Tv
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
                  <TouchableOpacity onPress={() => navigation.goBack()} style={styles.topBackBtn}>
                    <ChevronDown color="#fff" size={26} />
                  </TouchableOpacity>

                  <View style={styles.ytTopRight}>
                    <TouchableOpacity 
                      style={[styles.ytAutoplayToggle, autoPlay && styles.ytAutoplayToggleActive]} 
                      onPress={() => {
                        setAutoPlay(!autoPlay);
                        resetControlsTimeout();
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={[
                        styles.ytAutoplayDot, 
                        autoPlay && styles.ytAutoplayDotActive,
                        { alignSelf: autoPlay ? 'flex-end' : 'flex-start' }
                      ]} />
                    </TouchableOpacity>

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
                </View>

                {/* Center Controls (Prev, Play/Pause, Next) */}
                <View style={styles.ytCenterRow} pointerEvents="box-none">
                  <TouchableOpacity 
                    style={[styles.centerCtrlCircle, !hasPrev && styles.disabledCtrl]} 
                    disabled={!hasPrev}
                    onPress={() => {
                      playPrevVideo();
                      resetControlsTimeout();
                    }}
                  >
                    <SkipBack color="#fff" size={22} fill={hasPrev ? "#fff" : "none"} />
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
                    style={[styles.centerCtrlCircle, !hasNext && styles.disabledCtrl]} 
                    disabled={!hasNext}
                    onPress={() => {
                      playNextVideo();
                      resetControlsTimeout();
                    }}
                  >
                    <SkipForward color="#fff" size={22} fill={hasNext ? "#fff" : "none"} />
                  </TouchableOpacity>
                </View>

                {/* Bottom Controls Row (Time label pill, Fullscreen button) */}
                <View style={styles.ytBottomRow} pointerEvents="box-none">
                  <View style={styles.ytTimePill}>
                    <Text style={styles.ytTimeText}>
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </Text>
                  </View>

                  <TouchableOpacity 
                    style={styles.ytFullscreenBtn} 
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
                      <Minimize2 color="#fff" size={20} />
                    ) : (
                      <Maximize2 color="#fff" size={20} />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Scrubber Seekbar slightly up from bottom in fullscreen */}
                <View 
                  style={[
                    styles.progressBarContainer,
                    isFullscreen && { bottom: 16, left: 16, right: 16 }
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
        {/* YouTube-style Video Info */}
        <View style={styles.videoInfoSection}>
          <Text style={styles.videoTitle} numberOfLines={2}>{activeVideo?.title || course.title}</Text>
          <Text style={styles.videoMeta}>
            {course.instructor} • {t('coursePlayer.courseMeta', { instructor: '', count: videoList.length }).trim()}
          </Text>
        </View>

        {/* Progress Bar (thin red line like YouTube) */}
        <View style={styles.ytProgressTrack}>
          <View style={[styles.ytProgressIndicator, { width: `${overallPct}%` }]} />
        </View>



        {/* Completion Banner */}
        {overallPct === 100 && (
          <View style={styles.completionBanner}>
            <Award size={20} color="#fff" />
            <Text style={styles.completionText}>{t('coursePlayer.courseCompleted')} — {overallPct}%</Text>
          </View>
        )}

        {/* Tab Switcher */}
        <View style={styles.tabBar}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'lessons' && styles.activeTab]}
            onPress={() => setActiveTab('lessons')}
          >
            <BookOpen size={16} color={activeTab === 'lessons' ? '#FF0000' : '#606060'} />
            <Text style={[styles.tabText, activeTab === 'lessons' && styles.activeTabText]}>{t('coursePlayer.lessonsTab')}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'about' && styles.activeTab]}
            onPress={() => setActiveTab('about')}
          >
            <Info size={16} color={activeTab === 'about' ? '#FF0000' : '#606060'} />
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
                    {/* Icon */}
                    <View style={[
                      styles.lessonIcon, 
                      isCompleted ? styles.completedIcon : isActive ? styles.activeIcon : styles.inactiveIcon
                    ]}>
                      {isCompleted ? (
                        <CheckCircle2 size={16} color="#fff" />
                      ) : isActive ? (
                        <Pause size={12} color="#fff" fill="#fff" />
                      ) : (
                        <Play size={12} color="#606060" fill="#606060" />
                      )}
                    </View>
                    {/* Info */}
                    <View style={styles.lessonInfo}>
                      <Text style={[styles.lessonTitle, isActive && styles.activeLessonTitle]} numberOfLines={2}>
                        {video.title}
                      </Text>
                      <View style={styles.lessonMeta}>
                        {video.duration ? <Text style={styles.lessonDuration}>{Math.floor(video.duration/60)}:{String(video.duration%60).padStart(2, '0')}</Text> : null}
                        {vidPct > 0 && !isCompleted && <Text style={styles.lessonPct}>{vidPct}%</Text>}
                      </View>
                      {/* Red progress bar like YouTube */}
                      <View style={styles.lessonProgressTrack}>
                        <View style={[styles.lessonProgressFill, { width: `${isCompleted ? 100 : vidPct}%`, backgroundColor: isCompleted ? '#4caf50' : '#FF0000' }]} />
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
  topBackBtn: {
    padding: 4,
  },
  ytTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  ytAutoplayToggle: {
    width: 38,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  ytAutoplayToggleActive: {
    backgroundColor: '#fff',
  },
  ytAutoplayDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#aaa',
  },
  ytAutoplayDotActive: {
    backgroundColor: '#0f0f0f',
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
  centerCtrlCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerPlayCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ytTimePill: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  ytTimeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  ytFullscreenBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarContainer: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    height: 36,
    justifyContent: 'center',
    zIndex: 10,
  },
  progressTrack: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.24)',
    width: '100%',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF0000',
    position: 'absolute',
    left: 0,
    top: 0,
  },
  progressThumb: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF0000',
    position: 'absolute',
    top: -4.5,
    marginLeft: -6,
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
  videoInfoSection: {
    padding: SPACING.md,
    backgroundColor: '#fff',
  },
  videoTitle: {
    ...TYPOGRAPHY.headline,
    fontSize: 20,
    color: '#0f0f0f',
    lineHeight: 26,
    marginBottom: 6,
  },
  videoMeta: {
    ...TYPOGRAPHY.label,
    color: '#606060',
    fontSize: 13,
  },
  ytProgressTrack: {
    height: 2,
    backgroundColor: '#e0e0e0',
    width: '100%',
  },
  ytProgressIndicator: {
    height: '100%',
    backgroundColor: '#FF0000',
  },
  upNextBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
  },
  upNextLeft: {
    flex: 1,
    paddingRight: 16,
  },
  upNextLabel: {
    ...TYPOGRAPHY.label,
    color: '#606060',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  upNextTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: '#0f0f0f',
  },
  upNextRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playNextBtn: {
    backgroundColor: '#0f0f0f',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  playNextBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  autoPlayToggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#00000010',
    padding: 2,
    justifyContent: 'center',
  },
  autoPlayToggleActive: {
    backgroundColor: '#CC0000',
  },
  autoPlayDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  autoPlayDotActive: {
    alignSelf: 'flex-end',
  },
  completionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4caf50',
    padding: 12,
    justifyContent: 'center',
    gap: 8,
  },
  completionText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  lessonCounterBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  lessonCounterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
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
  lessonNumber: {
    ...TYPOGRAPHY.label,
    color: '#606060',
    width: 24,
    textAlign: 'center',
    marginRight: 8,
  },
  activeLessonNumber: {
    color: '#FF0000',
    fontWeight: '800',
  },
  lessonProgressTrack: {
    height: 2,
    backgroundColor: '#e0e0e0',
    marginTop: 6,
    width: '100%',
  },
  lessonProgressFill: {
    height: '100%',
    backgroundColor: '#FF0000',
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
