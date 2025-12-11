import type React from 'react';

declare global {
  // Ensure the JSX namespace is available for dependencies that reference it directly.
  namespace JSX {
    interface IntrinsicElements extends React.JSX.IntrinsicElements {}
  }
}

export {};
