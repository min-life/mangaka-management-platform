import { NativeStackNavigationProp } from '@react-navigation/native-stack';

/**
 * Định nghĩa toàn bộ các màn hình và params của app.
 * Thêm screen mới vào đây để TypeScript kiểm tra đầy đủ.
 */
export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Tasks: { projectId?: string } | undefined;
  Projects: undefined;
  ProjectDetail: { projectId: string };
  ProjectReport: { projectId: string };
  Applications: { projectId?: string } | undefined;
  ApplicationDetail: { projectId: string; applicationId: string };
  ApplicationCreate: { projectId: string };
  EditorBoards: undefined;
  EditorBoardDetail: { boardId: string };
  EditorBoardCreate: undefined;
  EditorBoardAttachProject: { boardId: string };
  Resources: { projectId: string };
  ResourceFolderDetail: { projectId: string; folderId: string };
  ResourceFile: { projectId: string; fileId: string; parentFolderId: string };
  TaskDetail: undefined;
  Profile: undefined;
  Notifications: undefined;
};

/**
 * Hook type-safe cho navigation, dùng trong mọi screen.
 * @example
 *   const navigation = useNavigation<RootStackNavProp>();
 *   navigation.navigate('Tasks');
 */
export type RootStackNavProp = NativeStackNavigationProp<RootStackParamList>;
