import React from 'react';

function resolveStyle(style: any): React.CSSProperties {
  if (!style) return {};
  if (Array.isArray(style)) return Object.assign({}, ...style);
  return style as React.CSSProperties;
}

export const View: React.FC<any> = ({ children, style, ...rest }) => (
  <div style={resolveStyle(style)} {...rest}>
    {children}
  </div>
);

export const Text: React.FC<any> = ({ children, style, numberOfLines, ...rest }) => {
  const css = resolveStyle(style);
  if (numberOfLines) {
    css.display = '-webkit-box';
  (css as any).WebkitLineClamp = numberOfLines as any;
  (css as any).WebkitBoxOrient = 'vertical' as any;
    css.overflow = 'hidden';
  }
  return (
    <span style={css as React.CSSProperties} {...rest}>
      {children}
    </span>
  );
};

export const TextInput: React.FC<any> = (props) => <input {...props} />;

export const TouchableOpacity: React.FC<any> = ({ children, style, onPress, ...rest }) => (
  <button style={resolveStyle(style)} onClick={onPress} {...rest}>{children}</button>
);

export const FlatList: React.FC<any> = ({ data, renderItem }) => (
  <div>
    {Array.isArray(data) ? data.map((item: any, i: number) => <div key={i}>{renderItem({ item, index: i })}</div>) : null}
  </div>
);

export const ActivityIndicator: React.FC<any> = () => <div>Loading...</div>;

export const StyleSheet = {
  create: (styles: any) => styles,
};

export const Animated: any = {
  View: View,
  Text: Text,
};

export const Alert = {
  alert: (a: string, b?: string) => {
    if (b) window.alert(a + '\n\n' + b);
    else window.alert(a);
  },
};

export const SafeAreaView: React.FC<any> = ({ children, style, ...rest }) => (
  <div style={resolveStyle(style)} {...rest}>{children}</div>
);

export const KeyboardAvoidingView: React.FC<any> = ({ children, style, ...rest }) => (
  <div style={resolveStyle(style)} {...rest}>{children}</div>
);

export const Platform = { OS: 'web' };

export const Pressable = TouchableOpacity;

export const Keyboard = {
  dismiss: () => {
    // nothing to do on web
  }
};

export type GestureResponderEvent = React.MouseEvent;
export type ViewStyle = React.CSSProperties;

export default {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Alert,
};
