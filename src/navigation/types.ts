import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
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

export type MainTabParamList = {
  Dashboard: undefined;
  Courses: NavigatorScreenParams<AdminCourseStackParamList> | undefined;
  Plans: NavigatorScreenParams<AdminTrainingPlanStackParamList> | undefined;
  Account: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};
