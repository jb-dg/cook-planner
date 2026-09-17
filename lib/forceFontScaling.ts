import React from "react";
import { Text, TextInput } from "react-native";

// React 19 removed defaultProps support for function components, so the
// classic `Text.defaultProps.allowFontScaling = false` trick no longer has
// any effect (Text/TextInput are function components in RN 0.86). Patching
// createElement is the current workaround: it forces every Text/TextInput
// to ignore the OS "larger text" accessibility setting so the app's
// typography stays fixed regardless of the phone's font-size preference,
// unless a screen explicitly passes its own `allowFontScaling`.
const originalCreateElement = React.createElement;

React.createElement = ((type: any, props: any, ...children: any[]) => {
  if ((type === Text || type === TextInput) && props?.allowFontScaling === undefined) {
    props = { ...props, allowFontScaling: false };
  }
  return (originalCreateElement as any)(type, props, ...children);
}) as typeof React.createElement;
