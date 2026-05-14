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

export type MainTabParamList = {
  Dashboard: undefined;
  Courses: NavigatorScreenParams<AdminCourseStackParamList & UserCourseStackParamList> | undefined;
  Plans: NavigatorScreenParams<AdminTrainingPlanStackParamList & UserTrainingPlanStackParamList> | undefined;
  Users: undefined;
  StaffRoles: undefined;
  Account: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};
