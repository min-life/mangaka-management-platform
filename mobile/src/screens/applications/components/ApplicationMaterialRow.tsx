import React from 'react';
import { Image, Linking, Text, TouchableOpacity, View } from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';
import { ApplicationMaterialPage } from '@/src/types/applications';

interface ApplicationMaterialRowProps {
  material: ApplicationMaterialPage;
}

function formatFileSize(size?: number) {
  if (size === undefined) return 'Unknown size';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function materialTypeLabel(material: ApplicationMaterialPage) {
  if (material.type) return material.type;
  if (material.mimeType?.startsWith('image/')) return 'IMAGE';
  if (material.mimeType?.startsWith('text/')) return 'TEXT';
  return 'FILE';
}

function materialIconName(material: ApplicationMaterialPage) {
  const type = materialTypeLabel(material);
  if (type === 'IMAGE') return 'image';
  if (type === 'TEXT') return 'article';
  if (type === 'SOURCE') return 'code';
  return 'insert_drive_file';
}

function materialTypeColor(material: ApplicationMaterialPage) {
  const type = materialTypeLabel(material);
  if (type === 'IMAGE') return Colors.statusProgress;
  if (type === 'TEXT') return Colors.statusReview;
  if (type === 'SOURCE') return Colors.accent;
  return Colors.textMuted;
}

function dimensionsLabel(material: ApplicationMaterialPage) {
  if (!material.width || !material.height) return null;
  return `${material.width}x${material.height}`;
}

export default function ApplicationMaterialRow({ material }: ApplicationMaterialRowProps) {
  const typeColor = materialTypeColor(material);
  const typeLabel = materialTypeLabel(material);
  const dimensions = dimensionsLabel(material);
  const isImage = typeLabel === 'IMAGE' || material.mimeType?.startsWith('image/');
  const canOpen = Boolean(material.url);
  const chipBg = typeLabel === 'FILE' ? Colors.overlayLight : `${typeColor}22`;

  const handleOpen = () => {
    if (!material.url) return;
    void Linking.openURL(material.url);
  };

  return (
    <TouchableOpacity
      activeOpacity={canOpen ? 0.78 : 1}
      accessibilityRole={canOpen ? 'button' : undefined}
      className="flex-row items-center gap-3 rounded-xl p-3"
      disabled={!canOpen}
      onPress={handleOpen}
      style={{
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.borderSubtle,
      }}
    >
      <View
        className="h-14 w-14 items-center justify-center overflow-hidden rounded-xl"
        style={{ backgroundColor: Colors.overlayLight }}
      >
        {isImage && material.url ? (
          <Image source={{ uri: material.url }} className="h-full w-full" resizeMode="cover" />
        ) : (
          <MaterialIcon name={materialIconName(material)} color={typeColor} size={24} />
        )}
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-[14px] font-bold" style={{ color: Colors.text }} numberOfLines={1}>
          {material.title}
        </Text>
        <Text className="mt-0.5 text-[12px]" style={{ color: Colors.textMuted }} numberOfLines={1}>
          {material.originalName}
        </Text>
        <View className="mt-2 flex-row flex-wrap items-center gap-2">
          <View className="rounded-full px-2 py-1" style={{ backgroundColor: chipBg }}>
            <Text className="text-[10px] font-bold" style={{ color: typeColor }}>
              {typeLabel}
            </Text>
          </View>
          <Text className="text-[11px]" style={{ color: Colors.textFaint }}>
            {formatFileSize(material.size)}
          </Text>
          {dimensions ? (
            <Text className="text-[11px]" style={{ color: Colors.textFaint }}>
              {dimensions}
            </Text>
          ) : null}
        </View>
      </View>
      <View
        className="h-9 w-9 items-center justify-center rounded-full"
        style={{ backgroundColor: Colors.overlayLight, opacity: canOpen ? 1 : 0.4 }}
      >
        <MaterialIcon name="visibility" color={Colors.textMuted} size={18} />
      </View>
    </TouchableOpacity>
  );
}

