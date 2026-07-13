import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';

import MaterialIcon from '@/src/components/shared/MaterialIcon';
import { Colors } from '@/src/constants/colors';

export interface ProfileFormField {
  autoCapitalize?: TextInputProps['autoCapitalize'];
  editable?: boolean;
  id: string;
  keyboardType?: TextInputProps['keyboardType'];
  label: string;
  placeholder?: string;
  secureTextEntry?: boolean;
  textContentType?: TextInputProps['textContentType'];
  value: string;
}

interface ProfileFormModalProps {
  errorMessage?: string;
  fields: ProfileFormField[];
  isSubmitting?: boolean;
  onChangeField: (id: string, value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  submitLabel: string;
  subtitle?: string;
  title: string;
  visible: boolean;
}

export default function ProfileFormModal({
  errorMessage,
  fields,
  isSubmitting,
  onChangeField,
  onClose,
  onSubmit,
  submitLabel,
  subtitle,
  title,
  visible,
}: ProfileFormModalProps) {
  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end"
      >
        <TouchableOpacity
          activeOpacity={1}
          className="flex-1"
          onPress={isSubmitting ? undefined : onClose}
          style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
        />

        <View
          className="rounded-t-[24px] px-5 pb-8 pt-5"
          style={{
            backgroundColor: Colors.bg,
            borderColor: Colors.borderFaint,
            borderTopWidth: 1,
          }}
        >
          <View className="flex-row items-start justify-between gap-4">
            <View className="flex-1">
              <Text className="text-[22px] font-black" style={{ color: Colors.text }}>
                {title}
              </Text>
              {subtitle ? (
                <Text className="mt-1 text-[13px] leading-5" style={{ color: Colors.textMuted }}>
                  {subtitle}
                </Text>
              ) : null}
            </View>

            <TouchableOpacity
              activeOpacity={0.75}
              className="h-10 w-10 items-center justify-center rounded-full"
              disabled={isSubmitting}
              onPress={onClose}
              style={{ backgroundColor: Colors.surfaceContainer }}
            >
              <MaterialIcon name="close" color={Colors.text} size={20} />
            </TouchableOpacity>
          </View>

          <View className="mt-5 gap-4">
            {fields.map((field) => {
              const isEditable = field.editable ?? true;

              return (
                <View key={field.id} className="gap-2">
                  <Text
                    className="text-[12px] font-bold uppercase"
                    style={{ color: Colors.textMuted }}
                  >
                    {field.label}
                  </Text>
                  <TextInput
                    autoCapitalize={field.autoCapitalize}
                    className="rounded-xl px-4 py-3 text-[15px]"
                    editable={isEditable && !isSubmitting}
                    keyboardType={field.keyboardType}
                    onChangeText={(value) => onChangeField(field.id, value)}
                    placeholder={field.placeholder}
                    placeholderTextColor={Colors.textPlaceholder}
                    secureTextEntry={field.secureTextEntry}
                    style={{
                      backgroundColor: isEditable ? Colors.surface : Colors.surfaceContainer,
                      borderColor: Colors.borderFaint,
                      borderWidth: 1,
                      color: isEditable ? Colors.text : Colors.textMuted,
                    }}
                    textContentType={field.textContentType}
                    value={field.value}
                  />
                </View>
              );
            })}
          </View>

          {errorMessage ? (
            <Text className="mt-4 text-[13px] font-semibold" style={{ color: '#EF4444' }}>
              {errorMessage}
            </Text>
          ) : null}

          <View className="mt-6 flex-row gap-3">
            <TouchableOpacity
              activeOpacity={0.75}
              className="h-12 flex-1 items-center justify-center rounded-xl"
              disabled={isSubmitting}
              onPress={onClose}
              style={{ backgroundColor: Colors.surfaceContainer }}
            >
              <Text className="text-[15px] font-bold" style={{ color: Colors.text }}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.75}
              className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-xl"
              disabled={isSubmitting}
              onPress={onSubmit}
              style={{ backgroundColor: Colors.accent }}
            >
              {isSubmitting ? <ActivityIndicator color={Colors.bg} size="small" /> : null}
              <Text className="text-[15px] font-black" style={{ color: Colors.bg }}>
                {submitLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
