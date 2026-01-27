/**
 * ModernBannerFooter - React Native banner footer component
 */
import React from 'react';
import { View, Text, StyleSheet, Linking } from 'react-native';

export interface ModernBannerFooterProps {
  footerText: string;
  orgName: string;
}

function convertMarkdownLinks(text: string): React.ReactNode[] {
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = markdownLinkRegex.exec(text)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    // Add the link
    const linkText = match[1];
    let url = match[2].trim();
    if (!url.match(/^[a-zA-Z]+:\/\//)) {
      url = `https://${url}`;
    }

    parts.push(
      <Text
        key={match.index}
        style={styles.link}
        onPress={() => Linking.openURL(url)}
      >
        {linkText}
      </Text>
    );

    lastIndex = markdownLinkRegex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

export default function ModernBannerFooter({ footerText, orgName }: ModernBannerFooterProps) {
  const processedText = (footerText || '').replace(/\[Organization Name\]/g, orgName);
  const content = convertMarkdownLinks(processedText);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{content}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  text: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  link: {
    color: '#9333ea',
    textDecorationLine: 'underline',
  },
});

