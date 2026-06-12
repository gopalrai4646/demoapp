import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Landing: undefined;
  Login: undefined;
  CreateAccount: undefined;
  ResetPassword: undefined;
};

export type AdminCourseStackParamList = {
  AdminCourseList: undefined;
  AdminCourseDetails: { courseId?: string };
};

export type AdminTrainingPlanStackParamList = {
  AdminTrainingPlanList: undefined;
  AdminTrainingPlanDetails: { planId?: string };
};

export type UserCourseStackParamList = {
  UserCourses: undefined;
  CoursePlayer: { courseId: string; initialVideoId?: string };
};

export type UserTrainingPlanStackParamList = {
  UserTrainingPlanList: undefined;
  UserTrainingPlanDetails: { planId: string };
};

export type TeacherCourseStackParamList = {
  TeacherCourseList: undefined;
  TeacherCourseDetails: { courseId?: string };
};

export type TeacherTrainingPlanStackParamList = {
  TeacherTrainingPlanList: undefined;
  TeacherTrainingPlanDetails: { planId?: string };
};

export type TeacherUserStackParamList = {
  TeacherUserList: undefined;
  TeacherUserDetails: { userId: string };
};

export type MenuStackParamList = {
  MenuScreen: undefined;
  Teachers: undefined;
  StaffRoles: undefined;
  AssignedCourses: NavigatorScreenParams<UserCourseStackParamList> | undefined;
  AssignedPlans: NavigatorScreenParams<UserTrainingPlanStackParamList> | undefined;
  Account: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Landing: undefined;
  Courses: NavigatorScreenParams<AdminCourseStackParamList & UserCourseStackParamList & TeacherCourseStackParamList> | undefined;
  Plans: NavigatorScreenParams<AdminTrainingPlanStackParamList & UserTrainingPlanStackParamList & TeacherTrainingPlanStackParamList> | undefined;
  Users: NavigatorScreenParams<TeacherUserStackParamList> | undefined;
  Menu: NavigatorScreenParams<MenuStackParamList> | undefined;
  Account: undefined; // Students still use this directly in main tabs
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};
