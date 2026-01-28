import React, { Component, ErrorInfo, ReactNode } from 'react';
import { FullScreenError } from './FeedbackUI';
import ErrorLogService from '../../services/ErrorLogService';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * 에러 바운더리 컴포넌트
 * React 컴포넌트 트리에서 발생하는 JavaScript 오류를 잡아서
 * FullScreenError UI를 표시합니다.
 * ErrorLogService를 통해 에러를 기록합니다.
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // ErrorLogService로 에러 기록 (UI 에러는 critical)
    ErrorLogService.logUIError(error, errorInfo.componentStack || undefined);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // 커스텀 fallback이 제공되면 사용
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 기본 FullScreenError 표시
      return (
        <FullScreenError
          title="오류가 발생했습니다"
          message="앱에서 예기치 않은 오류가 발생했습니다. 다시 시도해주세요."
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
