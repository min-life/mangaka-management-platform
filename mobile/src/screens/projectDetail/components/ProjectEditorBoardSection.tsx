import React from 'react';
import { Image, Text, View } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import { ApiEditorBoard } from '@/src/services/apiTypes';
import { absoluteDate } from '@/src/services/formatters';

interface ProjectEditorBoardSectionProps {
  board?: ApiEditorBoard | null;
}

function DatePill({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <View
      className="flex-1 rounded-xl px-3 py-2"
      style={{
        backgroundColor: Colors.surfaceContainer,
        borderColor: Colors.borderFaint,
        borderWidth: 1,
      }}
    >
      <Text className="text-[10px] font-bold uppercase" style={{ color: Colors.textFaint }}>
        {label}
      </Text>
      <Text className="mt-1 text-[12px] font-semibold" numberOfLines={1} style={{ color: Colors.text }}>
        {value || '-'}
      </Text>
    </View>
  );
}

export default function ProjectEditorBoardSection({ board }: ProjectEditorBoardSectionProps) {
  return (
    <View
      className="mx-4 mt-4 rounded-[18px] p-4"
      style={{
        backgroundColor: Colors.surface,
        borderColor: Colors.borderSubtle,
        borderWidth: 1,
      }}
    >
      <Text
        className="text-[11px] font-bold uppercase tracking-widest"
        style={{ color: Colors.textMuted, letterSpacing: 1.2 }}
      >
        Editor Board
      </Text>

      {board ? (
        <View
          className="mt-4 rounded-2xl p-3"
          style={{ backgroundColor: Colors.surfaceContainer }}
        >
          <View className="flex-row gap-3">
            <View
              className="h-24 w-24 overflow-hidden rounded-2xl"
              style={{ backgroundColor: Colors.iconBg }}
            >
              {board.imageUrl ? (
                <Image source={{ uri: board.imageUrl }} className="h-full w-full" resizeMode="cover" />
              ) : (
                <View className="h-full w-full items-center justify-center">
                  <MaterialIcon name="groups" color={Colors.accent} size={32} />
                </View>
              )}
            </View>

            <View className="min-w-0 flex-1">
              <Text className="text-[17px] font-bold" numberOfLines={2} style={{ color: Colors.text }}>
                {board.name}
              </Text>
              <Text
                className="mt-2 text-[13px] leading-5"
                numberOfLines={3}
                style={{ color: Colors.textMuted }}
              >
                {board.description || 'No description'}
              </Text>
            </View>
          </View>

          <View className="mt-3 flex-row gap-2">
            <DatePill label="Created" value={absoluteDate(board.createdAt)} />
            <DatePill label="Updated" value={absoluteDate(board.updatedAt)} />
          </View>
        </View>
      ) : (
        <View
          className="mt-4 flex-row items-center rounded-2xl p-3"
          style={{
            backgroundColor: Colors.surfaceContainer,
            borderColor: Colors.borderFaint,
            borderWidth: 1,
          }}
        >
          <View
            className="h-12 w-12 items-center justify-center rounded-xl"
            style={{ backgroundColor: Colors.iconBg }}
          >
            <MaterialIcon name="groups" color={Colors.textMuted} size={24} />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-[15px] font-bold" style={{ color: Colors.text }}>
              No editor board assigned
            </Text>
            <Text className="mt-1 text-[13px]" style={{ color: Colors.textMuted }}>
              This project is not linked to an editor board yet.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
