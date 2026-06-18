import { NativeStackNavigationProp } from '@react-navigation/native-stack';

/**
 * Định nghĩa toàn bộ các màn hình và params của app.
 * Thêm screen mới vào đây để TypeScript kiểm tra đầy đủ.
 */
export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Tasks: undefined;
  TaskDetail: undefined;
  Profile: undefined;
  Notifications: undefined;
  // ProjectDetail: { projectId: string };
};

/**
 * Hook type-safe cho navigation, dùng trong mọi screen.
 * @example
 *   const navigation = useNavigation<RootStackNavProp>();
 *   navigation.navigate('Tasks');
 */
export type RootStackNavProp = NativeStackNavigationProp<RootStackParamList>;
