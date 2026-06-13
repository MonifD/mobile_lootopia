/**
 * Mock web de react-native-maps.
 * react-native-maps est une lib native uniquement — ce stub évite
 * les erreurs de build quand Metro compile pour le web.
 */
import React from 'react';
import { View } from 'react-native';

const Stub = ({ children, style }) =>
  React.createElement(View, { style }, children);

export default Stub;
export const Marker = Stub;
export const Circle = Stub;
export const Polyline = Stub;
export const Polygon = Stub;
export const Callout = Stub;
export const Overlay = Stub;
export const Heatmap = Stub;
export const PROVIDER_GOOGLE = 'google';
export const PROVIDER_DEFAULT = null;
